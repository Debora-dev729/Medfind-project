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

            deactivateLegacyStaff(users, "staff-afya-001", "afya.staff@medifind.tz");
            deactivateLegacyStaff(users, "staff-zanzibar-001", "zanzibar.staff@medifind.tz");
        };
    }

    private void deactivateLegacyStaff(UserRepository users, String id, String email) {
        users.findById(id)
            .filter(user -> user.getEmail().equalsIgnoreCase(email) && user.isActive())
            .ifPresent(user -> {
                user.setActive(false);
                users.save(user);
            });
    }
}
