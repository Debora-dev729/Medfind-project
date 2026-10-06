package tz.medifind.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/staff")
public class AdminController {

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
    public ResponseEntity<StaffResponse> create(
        @Valid @RequestBody CreateStaffRequest request
    ) {
        String email = normalizeEmail(request.email());
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "An account with this email already exists."
            );
        }

        requireActivePharmacy(request.pharmacyId());
        User staff = new User(
            UUID.randomUUID().toString(),
            request.fullName().trim(),
            email,
            normalizePhone(request.phone()),
            passwordEncoder.encode(request.password()),
            UserRole.PHARMACY_STAFF,
            request.pharmacyId()
        );

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(toResponse(users.save(staff)));
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

        requireActivePharmacy(request.pharmacyId());
        String password = request.password();
        if (password != null && !password.isBlank()) {
            if (password.length() < 8) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Password must contain at least 8 characters."
                );
            }
            password = passwordEncoder.encode(password);
        } else {
            password = null;
        }

        staff.updateStaffDetails(
            request.fullName().trim(),
            email,
            normalizePhone(request.phone()),
            password,
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

    private Pharmacy requireActivePharmacy(String pharmacyId) {
        Pharmacy pharmacy = pharmacies.findById(pharmacyId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Choose an existing pharmacy."
            ));
        if (!pharmacy.isOperational()) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Staff accounts can only be assigned to an active pharmacy."
            );
        }
        return pharmacy;
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
        @NotBlank @Size(min = 8) String password,
        @NotBlank String pharmacyId
    ) {}

    public record UpdateStaffRequest(
        @NotBlank String fullName,
        @NotBlank @Email String email,
        String phone,
        String password,
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
}