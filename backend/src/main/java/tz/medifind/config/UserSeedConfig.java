package tz.medifind.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import tz.medifind.model.User;
import tz.medifind.model.UserRole;
import tz.medifind.repository.UserRepository;

@Configuration
public class UserSeedConfig {

    @Bean
    CommandLineRunner seedUsers(
        UserRepository users,
        PasswordEncoder passwordEncoder
    ) {
        return args -> {

            if (!users.existsByEmailIgnoreCase("afya.staff@medifind.tz")) {
                users.save(new User(
                    "staff-afya-001",
                    "Afya Pharmacy Staff",
                    "afya.staff@medifind.tz",
                    "",
                    passwordEncoder.encode("Staff123!"),
                    UserRole.PHARMACY_STAFF,
                    "afya-pharmacy"
                ));
            }

            if (!users.existsByEmailIgnoreCase("zanzibar.staff@medifind.tz")) {
                users.save(new User(
                    "staff-zanzibar-001",
                    "Zanzibar Care Pharmacy Staff",
                    "zanzibar.staff@medifind.tz",
                    "",
                    passwordEncoder.encode("Staff123!"),
                    UserRole.PHARMACY_STAFF,
                    "zanzibar-care-pharmacy"
                ));
            }

            if (!users.existsByEmailIgnoreCase("admin@medifind.tz")) {
                users.save(new User(
                    "admin-001",
                    "MediFind Administrator",
                    "admin@medifind.tz",
                    "",
                    passwordEncoder.encode("Admin123!"),
                    UserRole.ADMIN,
                    null
                ));
            }
        };
    }
}
