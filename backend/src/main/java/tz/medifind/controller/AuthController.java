package tz.medifind.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tz.medifind.model.User;
import tz.medifind.model.UserRole;
import tz.medifind.repository.UserRepository;
import tz.medifind.security.JwtService;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(
        UserRepository users,
        PasswordEncoder passwordEncoder,
        JwtService jwtService
    ) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {

        User user = users.findByEmailIgnoreCase(request.email())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Invalid email or password."
            ));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Invalid email or password."
            );
        }

        String token = jwtService.generateToken(user);

        return ResponseEntity.ok(Map.of(
            "token", token,
            "user", userResponse(user)
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(
        @Valid @RequestBody RegisterRequest request
    ) {
        String email = request.email().trim().toLowerCase();

        if (users.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "An account with this email already exists."
            );
        }

        UserRole role;

        try {
            role = UserRole.valueOf(request.role().trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Choose a valid account type."
            );
        }

        if (role == UserRole.ADMIN) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Admin accounts cannot be created through registration."
            );
        }

        String pharmacyId = null;

        if (role == UserRole.PHARMACY_STAFF) {
            pharmacyId = "afya-pharmacy";
        }

        User user = new User(
            UUID.randomUUID().toString(),
            request.fullName().trim(),
            email,
            request.phone().trim(),
            passwordEncoder.encode(request.password()),
            role,
            pharmacyId
        );

        users.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(
            Map.of(
                "user", userResponse(user)
            )
        );
    }

    private Map<String, Object> userResponse(User user) {
        return Map.of(
            "id", user.getId(),
            "fullName", user.getFullName(),
            "email", user.getEmail(),
            "phone", user.getPhone() == null ? "" : user.getPhone(),
            "role", user.getRole().name(),
            "pharmacyId", user.getPharmacyId() == null ? "" : user.getPharmacyId()
        );
    }

    public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String password
    ) {
    }

    public record RegisterRequest(
        @NotBlank String fullName,
        @NotBlank @Email String email,
        @NotBlank String phone,
        @NotBlank String password,
        @NotBlank
        @Pattern(
            regexp = "PATIENT|PHARMACY_STAFF",
            message = "Choose a valid account type."
        )
        String role
    ) {
    }
}