package tz.medifind.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tz.medifind.model.Pharmacy;
import tz.medifind.model.User;
import tz.medifind.model.UserRole;
import tz.medifind.repository.PharmacyRepository;
import tz.medifind.repository.UserRepository;

import java.util.List;
import java.security.SecureRandom;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/staff")
public class AdminController {

    private static final String PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository users;
    private final PharmacyRepository pharmacies;
    private final PasswordEncoder passwordEncoder;

    public AdminController(
        UserRepository users,
        PharmacyRepository pharmacies,
        PasswordEncoder passwordEncoder
    ) {
        this.users = users;
        this.pharmacies = pharmacies;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public List<StaffResponse> list() {
        return users.findByRoleOrderByFullNameAsc(UserRole.PHARMACY_STAFF)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @PostMapping
    public ResponseEntity<StaffCreationResponse> create(
        @Valid @RequestBody CreateStaffRequest request
    ) {
        String email = normalizeEmail(request.email());
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "An account with this email already exists."
            );
        }

        requirePharmacy(request.pharmacyId());
        String temporaryPassword = generateTemporaryPassword();
        User staff = new User(
            UUID.randomUUID().toString(),
            request.fullName().trim(),
            email,
            normalizePhone(request.phone()),
            "",
            UserRole.PHARMACY_STAFF,
            request.pharmacyId()
        );
        staff.setTemporaryPasswordHash(passwordEncoder.encode(temporaryPassword));

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(new StaffCreationResponse(toResponse(users.save(staff)), temporaryPassword));
    }

    @PutMapping("/{id}")
    public StaffResponse update(
        @PathVariable String id,
        @Valid @RequestBody UpdateStaffRequest request
    ) {
        User staff = findStaff(id);
        String email = normalizeEmail(request.email());
        if (users.existsByEmailIgnoreCaseAndIdNot(email, id)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "An account with this email already exists."
            );
        }

        requirePharmacy(request.pharmacyId());
        staff.updateStaffDetails(
            request.fullName().trim(),
            email,
            normalizePhone(request.phone()),
            null,
            request.pharmacyId()
        );
        return toResponse(users.save(staff));
    }

    @PatchMapping("/{id}/active")
    public StaffResponse setActive(
        @PathVariable String id,
        @Valid @RequestBody ActiveUpdate request
    ) {
        User staff = findStaff(id);
        staff.setActive(request.active());
        return toResponse(users.save(staff));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        users.delete(findStaff(id));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/reset-password")
    public ResetPasswordResponse resetPassword(@PathVariable String id) {
        User staff = findStaff(id);
        String temporaryPassword = generateTemporaryPassword();
        staff.setTemporaryPasswordHash(passwordEncoder.encode(temporaryPassword));
        users.save(staff);
        return new ResetPasswordResponse(temporaryPassword);
    }

    private User findStaff(String id) {
        User staff = users.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Pharmacy staff account not found."
            ));
        if (staff.getRole() != UserRole.PHARMACY_STAFF) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Only pharmacy staff accounts can be managed here."
            );
        }
        return staff;
    }

    private Pharmacy requirePharmacy(String pharmacyId) {
        Pharmacy pharmacy = pharmacies.findById(pharmacyId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Choose an existing pharmacy."
            ));
        return pharmacy;
    }

    private String generateTemporaryPassword() {
        StringBuilder password = new StringBuilder("MDF-");
        for (int index = 0; index < 12; index++) {
            if (index > 0 && index % 4 == 0) password.append('-');
            password.append(PASSWORD_ALPHABET.charAt(SECURE_RANDOM.nextInt(PASSWORD_ALPHABET.length())));
        }
        return password.toString();
    }

    private StaffResponse toResponse(User user) {
        return new StaffResponse(
            user.getId(),
            user.getFullName(),
            user.getEmail(),
            user.getPhone() == null ? "" : user.getPhone(),
            user.getPharmacyId(),
            user.isActive()
        );
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private String normalizePhone(String phone) {
        return phone == null ? "" : phone.trim();
    }

    public record CreateStaffRequest(
        @NotBlank String fullName,
        @NotBlank @Email String email,
        String phone,
        @NotBlank String pharmacyId
    ) {}

    public record UpdateStaffRequest(
        @NotBlank String fullName,
        @NotBlank @Email String email,
        String phone,
        @NotBlank String pharmacyId
    ) {}

    public record ActiveUpdate(boolean active) {}

    public record StaffResponse(
        String id,
        String fullName,
        String email,
        String phone,
        String pharmacyId,
        boolean active
    ) {}

    public record StaffCreationResponse(StaffResponse staff, String temporaryPassword) {}

    public record ResetPasswordResponse(String temporaryPassword) {}
}