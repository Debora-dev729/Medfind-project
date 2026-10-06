package tz.medifind.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tz.medifind.model.Pharmacy;
import tz.medifind.model.PharmacyStatus;

import java.util.List;

public interface PharmacyRepository extends JpaRepository<Pharmacy, String> {
	List<Pharmacy> findByStatusOrderByNameAsc(PharmacyStatus status);

	boolean existsByRegistrationNumberIgnoreCase(String registrationNumber);
}
