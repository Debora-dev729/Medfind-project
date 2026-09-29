package tz.medifind.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tz.medifind.model.Pharmacy;
import tz.medifind.model.Reservation;
import tz.medifind.model.ReservationStatus;
import tz.medifind.repository.PharmacyRepository;
import tz.medifind.repository.ReservationRepository;
import tz.medifind.security.PharmacyAccess;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationRepository reservations;
    private final PharmacyRepository pharmacies;

    public ReservationController(
        ReservationRepository reservations,
        PharmacyRepository pharmacies
    ) {
        this.reservations = reservations;
        this.pharmacies = pharmacies;
    }

    @PostMapping
    public Reservation create(
        @Valid @RequestBody CreateReservation request,
        Authentication authentication
    ) {
        requirePatient(authentication);

        String patientId = authentication.getName();

        Pharmacy pharmacy = pharmacies.findById(request.pharmacyId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Pharmacy not found."
            ));

        if (!pharmacy.isOpen) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "This pharmacy is temporarily closed."
            );
        }

        expireOverdueReservations(patientId);

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

        return reservations.save(
            new Reservation(
                UUID.randomUUID().toString(),
                patientId,
                request.patientName(),
                request.pharmacyId(),
                request.medicineId(),
                request.price()
            )
        );
    }

    @GetMapping("/patient/{patientId}")
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
            reservations.findByPatientIdOrderByCreatedAtDesc(patientId);

        expireOverdueReservations(result);

        return result;
    }

    @GetMapping("/pharmacy/{pharmacyId}")
    public List<Reservation> pharmacyReservations(
        @PathVariable String pharmacyId,
        Authentication authentication
    ) {
        PharmacyAccess.requireAccess(authentication, pharmacyId);

        List<Reservation> result =
            reservations.findByPharmacyIdOrderByCreatedAtDesc(pharmacyId);

        expireOverdueReservations(result);

        return result;
    }

    @PatchMapping("/{id}/status")
    public Reservation updateStatus(
        @PathVariable String id,
        @Valid @RequestBody StatusUpdate request,
        Authentication authentication
    ) {
        requireStaffOrAdmin(authentication);

        Reservation reservation = reservations.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Reservation not found."
            ));

        PharmacyAccess.requireAccess(
            authentication,
            reservation.pharmacyId
        );

        expireIfOverdue(reservation);

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

        reservation.changeStatus(request.status());

        return reservations.save(reservation);
    }

    private void requirePatient(Authentication authentication) {
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
            reservations.findByPatientIdOrderByCreatedAtDesc(patientId);

        expireOverdueReservations(reservationsForPatient);
    }

    private void expireOverdueReservations(List<Reservation> reservationList) {
        boolean changed = false;

        for (Reservation reservation : reservationList) {
            if (reservation.isConfirmationExpired()) {
                reservation.expire();
                changed = true;
            }
        }

        if (changed) {
            reservations.saveAll(reservationList);
        }
    }

    private void expireIfOverdue(Reservation reservation) {
        if (reservation.isConfirmationExpired()) {
            reservation.expire();
            reservations.save(reservation);
        }
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
        @NotBlank String patientId,
        @NotBlank String patientName,
        @NotBlank String pharmacyId,
        @NotBlank String medicineId,
        @Min(0) Integer price
    ) {}

    public record StatusUpdate(
        ReservationStatus status
    ) {}
}
