package tz.medifind.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import tz.medifind.model.Reservation;
import java.util.List;
import java.time.Instant;
import tz.medifind.model.ReservationStatus;

public interface ReservationRepository extends JpaRepository<Reservation, String> {
    List<Reservation> findByPatientIdOrderByCreatedAtDesc(String patientId);
    List<Reservation> findByPharmacyIdOrderByCreatedAtDesc(String pharmacyId);
    boolean existsByPatientIdAndMedicineIdAndPharmacyIdAndStatusNotIn(String patientId, String medicineId, String pharmacyId, List<tz.medifind.model.ReservationStatus> statuses);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select reservation from Reservation reservation where reservation.id = :id")
    java.util.Optional<Reservation> findForUpdate(@Param("id") String id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select reservation from Reservation reservation where reservation.patientId = :patientId order by reservation.createdAt desc")
    List<Reservation> findPatientReservationsForUpdate(@Param("patientId") String patientId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select reservation from Reservation reservation where reservation.pharmacyId = :pharmacyId order by reservation.createdAt desc")
    List<Reservation> findPharmacyReservationsForUpdate(@Param("pharmacyId") String pharmacyId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select reservation from Reservation reservation where reservation.status = :status and (reservation.expiresAt is null or reservation.expiresAt <= :now) order by reservation.createdAt asc")
    List<Reservation> findExpiredPendingForUpdate(
        @Param("status") ReservationStatus status,
        @Param("now") Instant now
    );
}
