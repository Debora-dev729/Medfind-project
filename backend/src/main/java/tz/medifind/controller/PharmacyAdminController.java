package tz.medifind.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import tz.medifind.model.Pharmacy;
import tz.medifind.model.PharmacyApplicationStatus;
import tz.medifind.model.PharmacyPaymentStatus;
import tz.medifind.model.PharmacyStatus;
import tz.medifind.model.SubscriptionPlan;
import tz.medifind.model.User;
import tz.medifind.model.UserRole;
import tz.medifind.repository.PharmacyRepository;
import tz.medifind.repository.UserRepository;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/pharmacies")
public class PharmacyAdminController {

    private final PharmacyRepository pharmacies;
    private final UserRepository users;

    public PharmacyAdminController(PharmacyRepository pharmacies, UserRepository users) {
        this.pharmacies = pharmacies;
        this.users = users;
    }

    @PostMapping
    public ResponseEntity<Pharmacy> create(@Valid @RequestBody PharmacyRequest request) {
        String registrationNumber = normalizeOptional(request.registrationNumber());
        requireUniqueRegistrationNumber(registrationNumber, null);
        Pharmacy pharmacy = Pharmacy.application(
            UUID.randomUUID().toString(),
            request.name().trim(),
            request.ownerName().trim(),
            registrationNumber,
            request.email().trim().toLowerCase(Locale.ROOT),
            request.phone().trim(),
            request.address().trim(),
            request.city().trim(),
            normalizeOptional(request.hours()),
            request.latitude(),
            request.longitude(),
            request.subscriptionPlan()
        );
        pharmacy.approveApplication();
        return ResponseEntity.status(HttpStatus.CREATED).body(pharmacies.save(pharmacy));
    }

    @PutMapping("/{id}")
    public Pharmacy update(
        @PathVariable String id,
        @Valid @RequestBody PharmacyRequest request
    ) {
        Pharmacy pharmacy = findPharmacy(id);
        String registrationNumber = normalizeOptional(request.registrationNumber());
        requireUniqueRegistrationNumber(registrationNumber, id);
        if (pharmacy.paymentStatus == PharmacyPaymentStatus.PAYMENT_VERIFIED &&
            pharmacy.subscriptionPlan != request.subscriptionPlan()) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "The subscription plan cannot be changed after payment has been verified."
            );
        }
        pharmacy.name = request.name().trim();
        pharmacy.ownerName = request.ownerName().trim();
        pharmacy.registrationNumber = registrationNumber;
        pharmacy.email = request.email().trim().toLowerCase(Locale.ROOT);
        pharmacy.phone = request.phone().trim();
        pharmacy.address = request.address().trim();
        pharmacy.city = request.city().trim();
        pharmacy.hours = normalizeOptional(request.hours());
        pharmacy.latitude = request.latitude();
        pharmacy.longitude = request.longitude();
        pharmacy.subscriptionPlan = request.subscriptionPlan();
        pharmacy.subscriptionAmount = request.subscriptionPlan().monthlyAmount();
        return pharmacies.save(pharmacy);
    }

    @GetMapping
    public List<Pharmacy> list(@RequestParam(defaultValue = "all") String view) {
        List<Pharmacy> all = pharmacies.findAll();
        return switch (view.toLowerCase(Locale.ROOT)) {
            case "pending", "pending_applications" -> all.stream()
                .filter(pharmacy -> pharmacy.applicationStatus == PharmacyApplicationStatus.PENDING_APPROVAL ||
                    pharmacy.status == PharmacyStatus.PAYMENT_PENDING ||
                    pharmacy.paymentStatus == PharmacyPaymentStatus.PAYMENT_SUBMITTED)
                .toList();
            case "payments", "payment_review" -> all.stream()
                .filter(pharmacy -> pharmacy.paymentStatus != PharmacyPaymentStatus.PAYMENT_VERIFIED)
                .toList();
            case "active" -> all.stream()
                .filter(Pharmacy::isOperational)
                .toList();
            case "suspended" -> all.stream()
                .filter(pharmacy -> pharmacy.status == PharmacyStatus.SUSPENDED)
                .toList();
            case "rejected" -> all.stream()
                .filter(pharmacy -> pharmacy.applicationStatus == PharmacyApplicationStatus.REJECTED ||
                    pharmacy.paymentStatus == PharmacyPaymentStatus.PAYMENT_REJECTED)
                .toList();
            case "all" -> all;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown pharmacy filter.");
        };
    }

    @GetMapping("/{id}")
    public PharmacyDetails get(@PathVariable String id) {
        Pharmacy pharmacy = findPharmacy(id);
        List<User> staff = users.findByPharmacyIdAndRoleOrderByFullNameAsc(
            id,
            UserRole.PHARMACY_STAFF
        );
        return new PharmacyDetails(pharmacy, staff.stream().map(this::toStaff).toList());
    }

    @PatchMapping("/{id}/application")
    public Pharmacy decideApplication(
        @PathVariable String id,
        @Valid @RequestBody ApplicationDecision request
    ) {
        Pharmacy pharmacy = findPharmacy(id);
        if (pharmacy.applicationStatus != PharmacyApplicationStatus.PENDING_APPROVAL) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This application has already been reviewed.");
        }

        if ("APPROVE".equalsIgnoreCase(request.decision())) {
            pharmacy.approveApplication();
        } else if ("REJECT".equalsIgnoreCase(request.decision())) {
            pharmacy.rejectApplication();
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Decision must be APPROVE or REJECT.");
        }
        return pharmacies.save(pharmacy);
    }

    @PatchMapping("/{id}/payment")
    public Pharmacy updatePayment(
        @PathVariable String id,
        @Valid @RequestBody PaymentUpdate request
    ) {
        Pharmacy pharmacy = findPharmacy(id);
        String paymentStatus = request.status().toUpperCase(Locale.ROOT);
        switch (paymentStatus) {
            case "PAYMENT_SUBMITTED" -> {
                if (pharmacy.applicationStatus != PharmacyApplicationStatus.APPROVED) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Approve the application before submitting payment for verification.");
                }
                pharmacy.submitPayment(request.reference());
            }
            case "PAYMENT_VERIFIED" -> {
                if (pharmacy.applicationStatus != PharmacyApplicationStatus.APPROVED) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Approve the application before verifying payment.");
                }
                if (pharmacy.paymentStatus != PharmacyPaymentStatus.PAYMENT_SUBMITTED) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Mark payment as submitted before verifying it.");
                }
                pharmacy.verifyPayment();
            }
            case "PAYMENT_REJECTED" -> pharmacy.rejectPayment();
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported payment status.");
        }
        return pharmacies.save(pharmacy);
    }

    @PatchMapping("/{id}/status")
    public Pharmacy setStatus(
        @PathVariable String id,
        @Valid @RequestBody StatusUpdate request
    ) {
        Pharmacy pharmacy = findPharmacy(id);
        String status = request.status().toUpperCase(Locale.ROOT);
        if ("SUSPENDED".equals(status)) {
            pharmacy.suspend();
        } else if ("ACTIVE".equals(status)) {
            try {
                pharmacy.reactivate();
            } catch (IllegalStateException exception) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, exception.getMessage());
            }
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status must be ACTIVE or SUSPENDED.");
        }
        return pharmacies.save(pharmacy);
    }

    private Pharmacy findPharmacy(String id) {
        return pharmacies.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pharmacy not found."));
    }

    private void requireUniqueRegistrationNumber(String registrationNumber, String currentId) {
        if (registrationNumber == null || !pharmacies.existsByRegistrationNumberIgnoreCase(registrationNumber)) {
            return;
        }
        if (currentId != null && pharmacies.findById(currentId)
            .map(pharmacy -> registrationNumber.equalsIgnoreCase(pharmacy.registrationNumber))
            .orElse(false)) {
            return;
        }
        throw new ResponseStatusException(
            HttpStatus.CONFLICT,
            "A pharmacy with this registration number already exists."
        );
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private StaffSummary toStaff(User user) {
        return new StaffSummary(user.getId(), user.getFullName(), user.getEmail(), user.getPhone(), user.isActive());
    }

    public record ApplicationDecision(@NotBlank String decision) {}
    public record PharmacyRequest(
        @NotBlank String name,
        @NotBlank String ownerName,
        String registrationNumber,
        @NotBlank @Email String email,
        @NotBlank String phone,
        @NotBlank String address,
        @NotBlank String city,
        String hours,
        @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
        @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude,
        @NotNull SubscriptionPlan subscriptionPlan
    ) {}
    public record PaymentUpdate(@NotBlank String status, String reference) {}
    public record StatusUpdate(@NotBlank String status) {}
    public record StaffSummary(String id, String fullName, String email, String phone, boolean active) {}
    public record PharmacyDetails(Pharmacy pharmacy, List<StaffSummary> staff) {}
}