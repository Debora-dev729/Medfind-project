package tz.medifind.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tz.medifind.model.Pharmacy;

public interface PharmacyRepository extends JpaRepository<Pharmacy, String> {}
