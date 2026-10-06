package tz.medifind.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import tz.medifind.model.InventoryItem;
import java.util.List;
import java.util.Optional;

public interface InventoryRepository extends JpaRepository<InventoryItem, String> {
    List<InventoryItem> findByPharmacyId(String pharmacyId);
    List<InventoryItem> findByMedicineId(String medicineId);
    Optional<InventoryItem> findByPharmacyIdAndMedicineId(String pharmacyId, String medicineId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select item from InventoryItem item where item.pharmacyId = :pharmacyId and item.medicineId = :medicineId")
    Optional<InventoryItem> findForUpdate(
        @Param("pharmacyId") String pharmacyId,
        @Param("medicineId") String medicineId
    );
}
