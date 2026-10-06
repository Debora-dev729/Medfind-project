package tz.medifind.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tz.medifind.model.Pharmacy;
import tz.medifind.model.InventoryItem;
import tz.medifind.model.AvailabilityStatus;
import tz.medifind.model.Reservation;
import tz.medifind.model.ReservationStatus;
import tz.medifind.model.User;
import tz.medifind.repository.InventoryRepository;
import tz.medifind.repository.MedicineRepository;
import tz.medifind.repository.PharmacyRepository;
import tz.medifind.repository.ReservationRepository;
import tz.medifind.repository.UserRepository;
import tz.medifind.security.PharmacyAccess;
import tz.medifind.service.ReservationLifecycleService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationRepository reservations;
    private final PharmacyRepository pharmacies;
    private final InventoryRepository inventory;
    private final UserRepository users;
    private final ReservationLifecycleService lifecycle;
    private final MedicineRepository medicines;

    public ReservationController(
        ReservationRepository reservations,
        PharmacyRepository pharmacies,
        InventoryRepository inventory,
        UserRepository users,
        ReservationLifecycleService lifecycle,
        MedicineRepository medicines
    ) {
        this.reservations = reservations;
        this.pharmacies = pharmacies;
        this.inventory = inventory;
        this.users = users;
        this.lifecycle = lifecycle;
        this.medicines = medicines;
    }

    @PostMapping
    @Transactional(noRollbackFor = ResponseStatusException.class)
    public Reservation create(
        @Valid @RequestBody CreateReservation request,
        Authentication authentication
    ) {
        User patient = requirePatient(authentication);
        patient = users.findForUpdate(patient.getId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Patient account not found."
            ));
        String patientId = patient.getId();
        expireOverdueReservations(patientId);

        Pharmacy pharmacy = pharmacies.findById(request.pharmacyId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Pharmacy not found."
            ));

        if (!pharmacy.isOperational() || !pharmacy.isOpen) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "This pharmacy is not currently accepting orders."
            );
        }

        medicines.findById(request.medicineId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.CONFLICT,
                "This medicine is no longer available."
            ));

        InventoryItem stock = inventory.findForUpdate(
                request.pharmacyId(),
                request.medicineId()
            )
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.CONFLICT,
                "This medicine is not listed by the selected pharmacy."
            ));
        if (stock.status == AvailabilityStatus.OUT_OF_STOCK ||
            stock.quantity < request.quantity()) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                stock.quantity == 0
                    ? "This medicine is out of stock."
                    : "The requested quantity is no longer available."
            );
        }

        boolean active =
            reservations
                .existsByPatientIdAndMedicineIdAndPharmacyIdAndStatusNotIn(
                    patientId,
                    request.medicineId(),
                    request.pharmacyId(),
                    List.of(
                        ReservationStatus.CANCELLED,
                        ReservationStatus.COLLECTED,
                        ReservationStatus.EXPIRED
                    )
                );

        if (active) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "You already have an active reservation for this medicine at this pharmacy."
            );
        }

        Reservation reservation = new Reservation(
                UUID.randomUUID().toString(),
                patientId,
                patient.getFullName(),
                request.pharmacyId(),
                request.medicineId(),
                stock.price,
                request.quantity()
            );
        stock.update(stock.quantity - request.quantity(), stock.price);
        inventory.save(stock);
        return reservations.save(reservation);
    }

    @GetMapping("/patient/{patientId}")
    @Transactional
    public List<Reservation> patientReservations(
        @PathVariable String patientId,
        Authentication authentication
    ) {
        requirePatient(authentication);

        String authenticatedPatientId = authentication.getName();

        if (!authenticatedPatientId.equals(patientId)) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You can only access your own reservations."
            );
        }

        List<Reservation> result =
            reservations.findPatientReservationsForUpdate(patientId);

        expireOverdueReservations(result);

        return result;
    }

    @GetMapping("/pharmacy/{pharmacyId}")
    @Transactional
    public List<Reservation> pharmacyReservations(
        @PathVariable String pharmacyId,
        Authentication authentication
    ) {
        PharmacyAccess.requireAccess(authentication, pharmacyId);

        List<Reservation> result =
            reservations.findPharmacyReservationsForUpdate(pharmacyId);

        expireOverdueReservations(result);

        return result;
    }

    @PatchMapping("/{id}/cancel")
    @Transactional(noRollbackFor = ResponseStatusException.class)
    public Reservation cancelByPatient(
        @PathVariable String id,
        Authentication authentication
    ) {
        User patient = requirePatient(authentication);
        Reservation reservation = reservations.findForUpdate(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Order not found."
            ));

        if (!reservation.patientId.equals(patient.getId())) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You can only cancel your own orders."
            );
        }

        if (lifecycle.expireIfOverdue(reservation)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "This order expired because the pharmacy did not confirm it within 15 minutes."
            );
        }
        if (reservation.status != ReservationStatus.PENDING) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Only pending orders can be cancelled."
            );
        }

        lifecycle.releaseReservedStock(reservation);
        reservation.changeStatus(ReservationStatus.CANCELLED);
        return reservations.save(reservation);
    }

    @PatchMapping("/{id}/status")
    @Transactional(noRollbackFor = ResponseStatusException.class)
    public Reservation updateStatus(
        @PathVariable String id,
        @Valid @RequestBody StatusUpdate request,
        Authentication authentication
    ) {
        requireStaffOrAdmin(authentication);

        Reservation reservation = reservations.findForUpdate(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Reservation not found."
            ));

        PharmacyAccess.requireAccess(
            authentication,
            reservation.pharmacyId
        );

        boolean confirming = request.status() == ReservationStatus.CONFIRMED;
        if (confirming && lifecycle.expireIfOverdue(reservation)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "This order has expired and can no longer be confirmed."
            );
        }
        if (!confirming) expireIfOverdue(reservation);

        if (reservation.status == ReservationStatus.EXPIRED) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "This reservation has expired."
            );
        }

        validateStatusTransition(
            reservation.status,
            request.status()
        );

        if (confirming) {
            medicines.findById(reservation.medicineId)
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "The medicine for this order is no longer available."
                ));
            InventoryItem reservedInventory = inventory.findForUpdate(
                    reservation.pharmacyId,
                    reservation.medicineId
                )
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "The reserved inventory for this order no longer exists."
                ));
            if (reservation.quantity < 1 || reservedInventory.quantity < 0) {
                throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "The reserved inventory for this order is invalid."
                );
            }
        }

        if (request.status() == ReservationStatus.CANCELLED) {
            lifecycle.releaseReservedStock(reservation);
        }
        reservation.changeStatus(request.status());

        return reservations.save(reservation);
    }

    private User requirePatient(Authentication authentication) {
        if (authentication == null ||
            !authentication.isAuthenticated()) {

            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Authentication required."
            );
        }

        boolean patient = authentication.getAuthorities().stream()
            .anyMatch(authority ->
                authority.equals(
                    new SimpleGrantedAuthority("ROLE_PATIENT")
                )
            );

        if (!patient) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Only patient accounts can perform this action."
            );
        }

        return users.findById(authentication.getName())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Patient account not found."
            ));
    }

    private void requireStaffOrAdmin(Authentication authentication) {
        if (authentication == null ||
            !authentication.isAuthenticated()) {

            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Authentication required."
            );
        }

        boolean allowed = authentication.getAuthorities().stream()
            .anyMatch(authority ->
                authority.equals(
                    new SimpleGrantedAuthority("ROLE_PHARMACY_STAFF")
                ) ||
                authority.equals(
                    new SimpleGrantedAuthority("ROLE_ADMIN")
                )
            );

        if (!allowed) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Only pharmacy staff or admin accounts can update reservation status."
            );
        }
    }

    private void expireOverdueReservations(String patientId) {
        List<Reservation> reservationsForPatient =
            reservations.findPatientReservationsForUpdate(patientId);

        expireOverdueReservations(reservationsForPatient);
    }

    private void expireOverdueReservations(List<Reservation> reservationList) {
        lifecycle.expireOverdue(reservationList);
    }

    private void expireIfOverdue(Reservation reservation) {
        lifecycle.expireIfOverdue(reservation);
    }

    private void validateStatusTransition(
        ReservationStatus current,
        ReservationStatus requested
    ) {
        boolean valid = switch (current) {
            case PENDING ->
                requested == ReservationStatus.CONFIRMED ||
                requested == ReservationStatus.CANCELLED;

            case CONFIRMED ->
                requested == ReservationStatus.READY_FOR_COLLECTION ||
                requested == ReservationStatus.CANCELLED;

            case READY_FOR_COLLECTION ->
                requested == ReservationStatus.COLLECTED;

            case COLLECTED, CANCELLED, EXPIRED ->
                false;
        };

        if (!valid) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Invalid reservation status transition."
            );
        }
    }

    public record CreateReservation(
        @NotBlank String pharmacyId,
        @NotBlank String medicineId,
        @Min(1) int quantity
    ) {}

    public record StatusUpdate(
        @NotNull
        ReservationStatus status
    ) {}
}
