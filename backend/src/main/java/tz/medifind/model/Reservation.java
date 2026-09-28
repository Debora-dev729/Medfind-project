package tz.medifind.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import java.time.Instant;

@Entity
public class Reservation {
    @Id public String id;
    public String patientId;
    public String patientName;
    public String pharmacyId;
    public String medicineId;
    public Integer price;
    public ReservationStatus status;
    public Instant createdAt;
    public Instant updatedAt;

    protected Reservation() {}
    public Reservation(String id, String patientId, String patientName, String pharmacyId, String medicineId, Integer price) {
        this.id = id; this.patientId = patientId; this.patientName = patientName; this.pharmacyId = pharmacyId; this.medicineId = medicineId;
        this.price = price; this.status = ReservationStatus.PENDING; this.createdAt = Instant.now(); this.updatedAt = this.createdAt;
    }
    public void changeStatus(ReservationStatus status) { this.status = status; this.updatedAt = Instant.now(); }
}
