package tz.medifind.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tz.medifind.model.InventoryItem;
import java.util.List;
import java.util.Optional;

public interface InventoryRepository extends JpaRepository<InventoryItem, String> {
    List<InventoryItem> findByPharmacyId(String pharmacyId);
    List<InventoryItem> findByMedicineId(String medicineId);
    Optional<InventoryItem> findByPharmacyIdAndMedicineId(String pharmacyId, String medicineId);
}
