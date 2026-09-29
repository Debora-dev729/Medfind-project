package tz.medifind.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tz.medifind.model.User;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);
}

