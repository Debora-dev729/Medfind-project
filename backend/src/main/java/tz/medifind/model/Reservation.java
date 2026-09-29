package tz.medifind.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import java.time.Instant;

@Entity
public class Reservation {
    @Id
    public String id;

    public String patientId;
    public String patientName;
    public String pharmacyId;
    public String medicineId;
    public Integer price;
    public ReservationStatus status;
    public Instant createdAt;
    public Instant updatedAt;
    public Instant confirmationDeadline;

    protected Reservation() {}

    public Reservation(
        String id,
        String patientId,
        String patientName,
        String pharmacyId,
        String medicineId,
        Integer price
    ) {
        this.id = id;
        this.patientId = patientId;
        this.patientName = patientName;
        this.pharmacyId = pharmacyId;
        this.medicineId = medicineId;
        this.price = price;
        this.status = ReservationStatus.PENDING;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
        this.confirmationDeadline = this.createdAt.plusSeconds(30 * 60);
    }

    public void changeStatus(ReservationStatus status) {
        this.status = status;
        this.updatedAt = Instant.now();
    }

    public boolean isConfirmationExpired() {
        return status == ReservationStatus.PENDING
            && confirmationDeadline != null
            && Instant.now().isAfter(confirmationDeadline);
    }

    public void expire() {
        this.status = ReservationStatus.EXPIRED;
        this.updatedAt = Instant.now();
    }
}
