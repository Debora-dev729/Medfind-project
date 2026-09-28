package tz.medifind.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;

@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"pharmacyId", "medicineId"}))
public class InventoryItem {
    @Id public String id;
    public String pharmacyId;
    public String medicineId;
    public int quantity;
    public Integer price;
    public AvailabilityStatus status;
    public Instant updatedAt;

    protected InventoryItem() {}
    public InventoryItem(String id, String pharmacyId, String medicineId, int quantity, Integer price) {
        this.id = id; this.pharmacyId = pharmacyId; this.medicineId = medicineId; this.quantity = quantity; this.price = price; this.updatedAt = Instant.now(); recalculateStatus();
    }
    public void update(int quantity, Integer price) { this.quantity = Math.max(0, quantity); this.price = price; this.updatedAt = Instant.now(); recalculateStatus(); }
    private void recalculateStatus() { status = quantity == 0 ? AvailabilityStatus.OUT_OF_STOCK : quantity <= 5 ? AvailabilityStatus.LOW_STOCK : AvailabilityStatus.AVAILABLE; }
}
