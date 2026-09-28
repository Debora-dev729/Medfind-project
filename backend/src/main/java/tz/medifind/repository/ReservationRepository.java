package tz.medifind.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tz.medifind.model.Reservation;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, String> {
    List<Reservation> findByPatientIdOrderByCreatedAtDesc(String patientId);
    List<Reservation> findByPharmacyIdOrderByCreatedAtDesc(String pharmacyId);
    boolean existsByPatientIdAndMedicineIdAndPharmacyIdAndStatusNotIn(String patientId, String medicineId, String pharmacyId, List<tz.medifind.model.ReservationStatus> statuses);
}
