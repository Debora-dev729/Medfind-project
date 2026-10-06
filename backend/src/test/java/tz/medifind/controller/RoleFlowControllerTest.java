package tz.medifind.controller;

import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import jakarta.servlet.FilterChain;
import org.springframework.web.server.ResponseStatusException;
import tz.medifind.model.AvailabilityStatus;
import tz.medifind.model.InventoryItem;
import tz.medifind.model.Medicine;
import tz.medifind.model.Pharmacy;
import tz.medifind.model.PharmacyApplicationStatus;
import tz.medifind.model.PharmacyPaymentStatus;
import tz.medifind.model.PharmacyStatus;
import tz.medifind.model.SubscriptionPlan;
import tz.medifind.model.User;
import tz.medifind.model.UserRole;
import tz.medifind.repository.InventoryRepository;
import tz.medifind.repository.MedicineRepository;
import tz.medifind.repository.PharmacyRepository;
import tz.medifind.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;

class RoleFlowControllerTest {

    @Test
    void publicRegistrationRejectsPharmacyStaffRole() {
        var validator = Validation.buildDefaultValidatorFactory().getValidator();
        var request = new AuthController.RegisterRequest(
            "Staff Member", "staff@example.tz", "255700000000", "password123",
            "PHARMACY_STAFF"
        );

        assertTrue(validator.validate(request).stream()
            .anyMatch(violation -> violation.getPropertyPath().toString().equals("role")));
    }

    @Test
    void adminStaffCreationAlwaysAssignsPharmacyStaffRole() {
        UserRepository users = mock(UserRepository.class);
        PharmacyRepository pharmacies = mock(PharmacyRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        Pharmacy pharmacy = new Pharmacy(
            "pharmacy-1", "Care Pharmacy", "Dar es Salaam", "Main Road",
            "255700000001", "8am-8pm", -6.8, 39.2
        );
        when(users.existsByEmailIgnoreCase("staff@example.tz")).thenReturn(false);
        when(pharmacies.findById("pharmacy-1")).thenReturn(Optional.of(pharmacy));
        when(encoder.encode(any(String.class))).thenAnswer(invocation -> "encoded:" + invocation.getArgument(0));
        when(users.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = new AdminController(users, pharmacies, encoder).create(
            new AdminController.CreateStaffRequest(
                " Staff Member ", "Staff@Example.Tz", null, "pharmacy-1"
            )
        );

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals("staff@example.tz", response.getBody().staff().email());
        assertEquals("pharmacy-1", response.getBody().staff().pharmacyId());
        assertTrue(response.getBody().staff().active());
        assertTrue(response.getBody().temporaryPassword().matches("MDF-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}"));
        verify(users).save(org.mockito.ArgumentMatchers.argThat(user ->
            user.isMustChangePassword() && user.getPassword().startsWith("encoded:MDF-")
        ));
    }

    @Test
    void adminCanResetStaffPasswordAndResponseContainsOnlyNewTemporaryPassword() {
        UserRepository users = mock(UserRepository.class);
        PharmacyRepository pharmacies = mock(PharmacyRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        User staff = new User("staff-1", "Staff", "staff@example.tz", "", "old-hash", UserRole.PHARMACY_STAFF, "pharmacy-1");
        when(users.findById("staff-1")).thenReturn(Optional.of(staff));
        when(encoder.encode(any(String.class))).thenAnswer(invocation -> "encoded:" + invocation.getArgument(0));
        when(users.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = new AdminController(users, pharmacies, encoder).resetPassword("staff-1");

        assertTrue(response.temporaryPassword().matches("MDF-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}"));
        assertTrue(staff.getPassword().startsWith("encoded:MDF-"));
        assertTrue(staff.isMustChangePassword());
        assertTrue(!response.temporaryPassword().equals("old-hash"));
    }

    @Test
    void passwordChangeVerifiesCurrentPasswordAndClearsFirstLoginFlag() {
        UserRepository users = mock(UserRepository.class);
        PharmacyRepository pharmacies = mock(PharmacyRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        User staff = new User("staff-1", "Staff", "staff@example.tz", "", "old-hash", UserRole.PHARMACY_STAFF, "pharmacy-1");
        staff.setTemporaryPasswordHash("old-hash");
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("staff-1");
        when(users.findById("staff-1")).thenReturn(Optional.of(staff));
        when(encoder.matches("temporary-password", "old-hash")).thenReturn(true);
        when(encoder.encode("new-password-123")).thenReturn("new-hash");
        when(users.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = new AuthController(users, encoder, mock(tz.medifind.security.JwtService.class), pharmacies)
            .changePassword(authentication, new AuthController.ChangePasswordRequest("temporary-password", "new-password-123"));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("new-hash", staff.getPassword());
        assertTrue(!staff.isMustChangePassword());
    }

    @Test
    void passwordChangeRejectsIncorrectCurrentPassword() {
        UserRepository users = mock(UserRepository.class);
        PharmacyRepository pharmacies = mock(PharmacyRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        User staff = new User("staff-1", "Staff", "staff@example.tz", "", "old-hash", UserRole.PHARMACY_STAFF, "pharmacy-1");
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("staff-1");
        when(users.findById("staff-1")).thenReturn(Optional.of(staff));
        when(encoder.matches("wrong-password", "old-hash")).thenReturn(false);

        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> new AuthController(users, encoder, mock(tz.medifind.security.JwtService.class), pharmacies)
                .changePassword(authentication, new AuthController.ChangePasswordRequest("wrong-password", "new-password-123"))
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        assertEquals("old-hash", staff.getPassword());
        assertTrue(!staff.isMustChangePassword());
    }

    @Test
    void temporaryPasswordUserIsAuthenticatedOnlyForPasswordChangeEndpoint() throws Exception {
        UserRepository users = mock(UserRepository.class);
        PharmacyRepository pharmacies = mock(PharmacyRepository.class);
        tz.medifind.security.JwtService jwtService = mock(tz.medifind.security.JwtService.class);
        io.jsonwebtoken.Claims claims = mock(io.jsonwebtoken.Claims.class);
        User staff = new User("staff-1", "Staff", "staff@example.tz", "", "hash", UserRole.PHARMACY_STAFF, "pharmacy-1");
        staff.setTemporaryPasswordHash("hash");
        Pharmacy pharmacy = new Pharmacy("pharmacy-1", "Care", "Dar", "Road", "", "", 0, 0);
        when(jwtService.extractClaims("valid-token")).thenReturn(claims);
        when(claims.getSubject()).thenReturn("staff-1");
        when(users.findById("staff-1")).thenReturn(Optional.of(staff));
        when(pharmacies.findById("pharmacy-1")).thenReturn(Optional.of(pharmacy));
        var filter = new tz.medifind.security.JwtAuthenticationFilter(jwtService, users, pharmacies);

        for (String path : List.of("/api/pharmacies", "/api/reservations/patient/staff-1")) {
            MockHttpServletRequest request = new MockHttpServletRequest("GET", path);
            request.setServletPath(path);
            request.addHeader("Authorization", "Bearer valid-token");
            Authentication[] observed = new Authentication[1];
            FilterChain chain = (servletRequest, servletResponse) ->
                observed[0] = SecurityContextHolder.getContext().getAuthentication();

            filter.doFilter(request, new MockHttpServletResponse(), chain);
            assertEquals(null, observed[0]);
            SecurityContextHolder.clearContext();
        }

        MockHttpServletRequest changeRequest = new MockHttpServletRequest("POST", "/api/auth/change-password");
        changeRequest.setServletPath("/api/auth/change-password");
        changeRequest.addHeader("Authorization", "Bearer valid-token");
        Authentication[] observed = new Authentication[1];
        FilterChain changeChain = (servletRequest, servletResponse) ->
            observed[0] = SecurityContextHolder.getContext().getAuthentication();

        filter.doFilter(changeRequest, new MockHttpServletResponse(), changeChain);

        assertEquals("staff-1", observed[0].getName());
        SecurityContextHolder.clearContext();
    }

    @Test
    void loginResponseMarksStaffWhoMustChangeTheirPassword() {
        UserRepository users = mock(UserRepository.class);
        PharmacyRepository pharmacies = mock(PharmacyRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        tz.medifind.security.JwtService jwtService = mock(tz.medifind.security.JwtService.class);
        User staff = new User("staff-1", "Staff", "staff@example.tz", "", "hash", UserRole.PHARMACY_STAFF, "pharmacy-1");
        staff.setTemporaryPasswordHash("hash");
        Pharmacy pharmacy = new Pharmacy("pharmacy-1", "Care", "Dar", "Road", "", "", 0, 0);
        when(users.findByEmailIgnoreCase("staff@example.tz")).thenReturn(Optional.of(staff));
        when(pharmacies.findById("pharmacy-1")).thenReturn(Optional.of(pharmacy));
        when(encoder.matches("temporary-password", "hash")).thenReturn(true);
        when(jwtService.generateToken(staff)).thenReturn("jwt");

        var response = new AuthController(users, encoder, jwtService, pharmacies)
            .login(new AuthController.LoginRequest("staff@example.tz", "temporary-password"));

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        @SuppressWarnings("unchecked")
        Map<String, Object> user = (Map<String, Object>) body.get("user");
        assertEquals(true, user.get("mustChangePassword"));
        assertTrue(!user.containsKey("password"));
    }

    @Test
    void pharmacyStaffSearchOnlyReturnsAssignedInStockAvailability() {
        MedicineRepository medicines = mock(MedicineRepository.class);
        InventoryRepository inventory = mock(InventoryRepository.class);
        PharmacyRepository pharmacies = mock(PharmacyRepository.class);
        Authentication authentication = mock(Authentication.class);
        Medicine medicine = new Medicine("medicine-1", "Paracetamol", "500mg", "Tablets", "");
        Pharmacy assignedPharmacy = new Pharmacy("pharmacy-1", "Care A", "Dar", "Road", "", "", 0, 0);
        Pharmacy otherPharmacy = new Pharmacy("pharmacy-2", "Care B", "Dar", "Road", "", "", 0, 0);
        InventoryItem assigned = new InventoryItem("assigned", "pharmacy-1", "medicine-1", 5, 500);
        InventoryItem other = new InventoryItem("other", "pharmacy-2", "medicine-1", 5, 600);
        InventoryItem outOfStock = new InventoryItem("empty", "pharmacy-1", "medicine-1", 0, 500);
        outOfStock.status = AvailabilityStatus.OUT_OF_STOCK;
        when(medicines.findAll()).thenReturn(List.of(medicine));
        when(inventory.findByMedicineId("medicine-1"))
            .thenReturn(List.of(assigned, other, outOfStock));
        when(pharmacies.findByStatusOrderByNameAsc(tz.medifind.model.PharmacyStatus.ACTIVE))
            .thenReturn(List.of(assignedPharmacy, otherPharmacy));
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_PHARMACY_STAFF")))
            .when(authentication).getAuthorities();
        when(authentication.getDetails()).thenReturn("pharmacy-1");

        List<Map<String, Object>> results = new MedicineController(medicines, inventory, pharmacies)
            .search("", authentication);

        @SuppressWarnings("unchecked")
        List<InventoryItem> availability = (List<InventoryItem>) results.get(0).get("availability");
        assertEquals(1, availability.size());
        assertEquals("assigned", availability.get(0).id);
    }

    @Test
    void patientMedicineSearchExcludesNonActivePharmacies() {
        MedicineRepository medicines = mock(MedicineRepository.class);
        InventoryRepository inventory = mock(InventoryRepository.class);
        PharmacyRepository pharmacies = mock(PharmacyRepository.class);
        Authentication authentication = mock(Authentication.class);
        Medicine medicine = new Medicine("medicine-1", "Paracetamol", "500mg", "Tablets", "");
        InventoryItem activeStock = new InventoryItem("active-stock", "active-pharmacy", "medicine-1", 4, 500);
        InventoryItem pendingStock = new InventoryItem("pending-stock", "pending-pharmacy", "medicine-1", 8, 450);
        Pharmacy active = new Pharmacy("active-pharmacy", "Active", "Dar", "Road", "", "", 0, 0);
        Pharmacy pending = Pharmacy.application("pending-pharmacy", "Pending", "Owner", null, "owner@example.tz", "", "Road", "Dar", null, null, null, SubscriptionPlan.BASIC);
        when(medicines.findAll()).thenReturn(List.of(medicine));
        when(inventory.findByMedicineId("medicine-1")).thenReturn(List.of(activeStock, pendingStock));
        when(pharmacies.findByStatusOrderByNameAsc(PharmacyStatus.ACTIVE)).thenReturn(List.of(active));
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_PATIENT")))
            .when(authentication).getAuthorities();

        List<Map<String, Object>> results = new MedicineController(medicines, inventory, pharmacies)
            .search("", authentication);

        @SuppressWarnings("unchecked")
        List<InventoryItem> availability = (List<InventoryItem>) results.get(0).get("availability");
        assertEquals(1, availability.size());
        assertEquals("active-pharmacy", availability.get(0).pharmacyId);
        assertEquals(PharmacyStatus.PENDING_APPROVAL, pending.status);
    }

    @Test
    void publicPharmacyListReturnsOnlyOperationalPharmacies() {
        PharmacyRepository pharmacies = mock(PharmacyRepository.class);
        Pharmacy active = new Pharmacy("active", "Active", "Dar", "Road", "", "", 0, 0);
        when(pharmacies.findByStatusOrderByNameAsc(PharmacyStatus.ACTIVE))
            .thenReturn(List.of(active));

        Object result = new PharmacyController(pharmacies, mock(InventoryRepository.class)).list(null);

        assertEquals(List.of(active), result);
    }

    @Test
    void adminCannotManagePatientThroughStaffEndpoint() {
        UserRepository users = mock(UserRepository.class);
        PharmacyRepository pharmacies = mock(PharmacyRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        User patient = new User("patient", "Patient", "patient@example.tz", "", "hash", UserRole.PATIENT, null);
        when(users.findById("patient")).thenReturn(Optional.of(patient));

        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> new AdminController(users, pharmacies, encoder).setActive(
                "patient", new AdminController.ActiveUpdate(false)
            )
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
    }

    @Test
    void adminCreatedPharmacyIsApprovedButRequiresPaymentBeforeActivation() {
        PharmacyRepository pharmacies = mock(PharmacyRepository.class);
        when(pharmacies.existsByRegistrationNumberIgnoreCase("LIC-123")).thenReturn(false);
        when(pharmacies.save(any(Pharmacy.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = new PharmacyAdminController(pharmacies, mock(UserRepository.class)).create(
            new PharmacyAdminController.PharmacyRequest(
                "Afya Pharmacy", "John Michael", "LIC-123", "owner@example.tz",
                "255700000000", "Market Road", "Dar es Salaam", "8am-8pm",
                -6.8, 39.2, SubscriptionPlan.STANDARD
            )
        );

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals("Afya Pharmacy", response.getBody().name);
        assertEquals(PharmacyApplicationStatus.APPROVED, response.getBody().applicationStatus);
        assertEquals(PharmacyPaymentStatus.PAYMENT_PENDING, response.getBody().paymentStatus);
        assertEquals(PharmacyStatus.PAYMENT_PENDING, response.getBody().status);
        assertTrue(!response.getBody().isOperational());
    }

    @Test
    void pharmacyActivatesOnlyAfterApprovalAndVerifiedSubmittedPayment() {
        PharmacyRepository pharmacies = mock(PharmacyRepository.class);
        UserRepository users = mock(UserRepository.class);
        Pharmacy pharmacy = Pharmacy.application(
            "pharmacy-1", "Afya Pharmacy", "John Michael", "LIC-123",
            "owner@example.tz", "255700000000", "Market Road", "Dar es Salaam",
            "8am-8pm", -6.8, 39.2, SubscriptionPlan.BASIC
        );
        when(pharmacies.findById("pharmacy-1")).thenReturn(Optional.of(pharmacy));
        when(pharmacies.save(any(Pharmacy.class))).thenAnswer(invocation -> invocation.getArgument(0));
        PharmacyAdminController admin = new PharmacyAdminController(pharmacies, users);

        admin.decideApplication("pharmacy-1", new PharmacyAdminController.ApplicationDecision("APPROVE"));
        assertEquals(PharmacyApplicationStatus.APPROVED, pharmacy.applicationStatus);
        assertEquals(PharmacyPaymentStatus.PAYMENT_PENDING, pharmacy.paymentStatus);
        assertEquals(PharmacyStatus.PAYMENT_PENDING, pharmacy.status);

        ResponseStatusException prematureVerification = assertThrows(
            ResponseStatusException.class,
            () -> admin.updatePayment("pharmacy-1", new PharmacyAdminController.PaymentUpdate("PAYMENT_VERIFIED", null))
        );
        assertEquals(HttpStatus.CONFLICT, prematureVerification.getStatusCode());

        admin.updatePayment("pharmacy-1", new PharmacyAdminController.PaymentUpdate("PAYMENT_SUBMITTED", "REF-123"));
        admin.updatePayment("pharmacy-1", new PharmacyAdminController.PaymentUpdate("PAYMENT_VERIFIED", "REF-123"));

        assertEquals(PharmacyPaymentStatus.PAYMENT_VERIFIED, pharmacy.paymentStatus);
        assertEquals(PharmacyStatus.ACTIVE, pharmacy.status);
        assertTrue(pharmacy.isOperational());
    }
}