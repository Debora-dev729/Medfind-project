package tz.medifind.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Column;
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
    @Column(nullable = false, columnDefinition = "integer default 1")
    public int quantity = 1;
    public Long totalPrice;
    public ReservationStatus status;
    public Instant createdAt;
    public Instant updatedAt;
    public Instant expiresAt;

    protected Reservation() {}

    public Reservation(
        String id,
        String patientId,
        String patientName,
        String pharmacyId,
        String medicineId,
        Integer price,
        int quantity
    ) {
        this.id = id;
        this.patientId = patientId;
        this.patientName = patientName;
        this.pharmacyId = pharmacyId;
        this.medicineId = medicineId;
        this.price = price;
        this.quantity = quantity;
        this.totalPrice = price == null ? null : Math.multiplyExact((long) price, quantity);
        this.status = ReservationStatus.PENDING;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
        this.expiresAt = this.createdAt.plusSeconds(15 * 60);
    }

    public void changeStatus(ReservationStatus status) {
        this.status = status;
        this.updatedAt = Instant.now();
    }

    public boolean isConfirmationExpired() {
        return isConfirmationExpired(Instant.now());
    }

    public boolean isConfirmationExpired(Instant now) {
        return status == ReservationStatus.PENDING
            && (expiresAt == null || !now.isBefore(expiresAt));
    }

    public void expire() {
        this.status = ReservationStatus.EXPIRED;
        this.updatedAt = Instant.now();
    }
}
