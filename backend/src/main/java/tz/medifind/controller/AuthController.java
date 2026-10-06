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
import tz.medifind.repository.PharmacyRepository;
import tz.medifind.security.JwtService;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PharmacyRepository pharmacies;

    public AuthController(
        UserRepository users,
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        PharmacyRepository pharmacies
    ) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.pharmacies = pharmacies;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {

        User user = users.findByEmailIgnoreCase(request.email())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Invalid email or password."
            ));

        boolean pharmacyActive = user.getRole() != UserRole.PHARMACY_STAFF ||
            pharmacies.findById(user.getPharmacyId())
                .map(pharmacy -> pharmacy.isOperational())
                .orElse(false);

        if (!user.isActive() || !pharmacyActive ||
            !passwordEncoder.matches(request.password(), user.getPassword())) {
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

        User user = new User(
            UUID.randomUUID().toString(),
            request.fullName().trim(),
            email,
            request.phone().trim(),
            passwordEncoder.encode(request.password()),
            UserRole.PATIENT,
            null
        );

        users.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(
            Map.of(
                "token", jwtService.generateToken(user),
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
            regexp = "PATIENT",
            message = "Public registration is for patients only."
        )
        String role
    ) {
    }
}