package tz.medifind.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tz.medifind.model.Reservation;
import tz.medifind.model.ReservationStatus;
import tz.medifind.repository.ReservationRepository;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {
    private final ReservationRepository reservations;
    public ReservationController(ReservationRepository reservations) { this.reservations = reservations; }

    @PostMapping
    public Reservation create(@Valid @RequestBody CreateReservation request) {
        boolean active = reservations.existsByPatientIdAndMedicineIdAndPharmacyIdAndStatusNotIn(request.patientId(), request.medicineId(), request.pharmacyId(), List.of(ReservationStatus.CANCELLED, ReservationStatus.COLLECTED));
        if (active) throw new ResponseStatusException(HttpStatus.CONFLICT, "You already have an active reservation for this medicine at this pharmacy.");
        return reservations.save(new Reservation(UUID.randomUUID().toString(), request.patientId(), request.patientName(), request.pharmacyId(), request.medicineId(), request.price()));
    }

    @GetMapping("/patient/{patientId}")
    public List<Reservation> patientReservations(@PathVariable String patientId) { return reservations.findByPatientIdOrderByCreatedAtDesc(patientId); }

    @GetMapping("/pharmacy/{pharmacyId}")
    public List<Reservation> pharmacyReservations(@PathVariable String pharmacyId) { return reservations.findByPharmacyIdOrderByCreatedAtDesc(pharmacyId); }

    @PatchMapping("/{id}/status")
    public Reservation updateStatus(@PathVariable String id, @Valid @RequestBody StatusUpdate request) {
        Reservation reservation = reservations.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found."));
        reservation.changeStatus(request.status());
        return reservations.save(reservation);
    }

    public record CreateReservation(@NotBlank String patientId, @NotBlank String patientName, @NotBlank String pharmacyId, @NotBlank String medicineId, @Min(0) Integer price) {}
    public record StatusUpdate(ReservationStatus status) {}
}
