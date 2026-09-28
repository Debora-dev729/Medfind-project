package tz.medifind.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tz.medifind.model.Medicine;
import java.util.List;

public interface MedicineRepository extends JpaRepository<Medicine, String> {
    List<Medicine> findByNameContainingIgnoreCaseOrStrengthContainingIgnoreCaseOrFormContainingIgnoreCase(String name, String strength, String form);
}
