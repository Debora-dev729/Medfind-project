package tz.medifind.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import tz.medifind.model.AvailabilityStatus;
import org.springframework.web.server.ResponseStatusException;
import tz.medifind.model.InventoryItem;
import tz.medifind.model.Medicine;
import tz.medifind.model.Pharmacy;
import tz.medifind.model.Reservation;
import tz.medifind.model.ReservationStatus;
import tz.medifind.model.User;
import tz.medifind.model.UserRole;
import tz.medifind.repository.InventoryRepository;
import tz.medifind.repository.MedicineRepository;
import tz.medifind.repository.PharmacyRepository;
import tz.medifind.repository.ReservationRepository;
import tz.medifind.repository.UserRepository;
import tz.medifind.service.ReservationLifecycleService;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReservationControllerTest {

    @Mock private ReservationRepository reservations;
    @Mock private PharmacyRepository pharmacies;
    @Mock private InventoryRepository inventory;
    @Mock private MedicineRepository medicines;
    @Mock private UserRepository users;
    @Mock private Authentication authentication;

    private ReservationController controller;

    private User patient;
    private Pharmacy pharmacy;
    private InventoryItem stock;

    @BeforeEach
    void setUp() {
        patient = new User(
            "patient-1", "Patient Name", "patient@example.tz", "255700000000",
            "encoded", UserRole.PATIENT, null
        );
        pharmacy = new Pharmacy(
            "pharmacy-1", "Care Pharmacy", "Dar es Salaam", "Main Road",
            "255700000001", "8am-8pm", -6.8, 39.2
        );
        stock = new InventoryItem("stock-1", "pharmacy-1", "medicine-1", 5, 500);
        controller = new ReservationController(
            reservations,
            pharmacies,
            inventory,
            users,
            new ReservationLifecycleService(reservations, inventory),
            medicines
        );

    }

    @Test
    void createUsesAuthenticatedPatientAndCurrentStockPrice() {
        mockPatient();
        mockMedicine();
        when(inventory.findForUpdate("pharmacy-1", "medicine-1"))
            .thenReturn(Optional.of(stock));
        when(reservations.findPatientReservationsForUpdate("patient-1"))
            .thenReturn(List.of());
        when(reservations.existsByPatientIdAndMedicineIdAndPharmacyIdAndStatusNotIn(
            eq("patient-1"), eq("medicine-1"), eq("pharmacy-1"), anyList()
        )).thenReturn(false);
        when(reservations.save(any(Reservation.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        Reservation created = controller.create(
            new ReservationController.CreateReservation("pharmacy-1", "medicine-1", 2),
            authentication
        );

        assertEquals("patient-1", created.patientId);
        assertEquals("Patient Name", created.patientName);
        assertEquals(500, created.price);
        assertEquals(2, created.quantity);
        assertEquals(1000L, created.totalPrice);
        assertEquals(3, stock.quantity);
        verify(inventory).save(stock);
    }

    @Test
    void createRejectsUnavailableQuantityWithoutSavingReservation() {
        mockPatient();
        mockMedicine();
        stock.update(1, 500);
        when(inventory.findForUpdate("pharmacy-1", "medicine-1"))
            .thenReturn(Optional.of(stock));

        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> controller.create(
                new ReservationController.CreateReservation("pharmacy-1", "medicine-1", 2),
                authentication
            )
        );

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        verify(reservations, never()).save(any(Reservation.class));
    }

    @Test
    void createRejectsInventoryMarkedOutOfStock() {
        mockPatient();
        mockMedicine();
        stock.status = AvailabilityStatus.OUT_OF_STOCK;
        when(inventory.findForUpdate("pharmacy-1", "medicine-1"))
            .thenReturn(Optional.of(stock));

        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> controller.create(
                new ReservationController.CreateReservation("pharmacy-1", "medicine-1", 1),
                authentication
            )
        );

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        verify(reservations, never()).save(any(Reservation.class));
    }

    @Test
    void createRejectsUnknownMedicineBeforeLockingStock() {
        mockPatient();
        when(medicines.findById("medicine-1")).thenReturn(Optional.empty());

        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> controller.create(
                new ReservationController.CreateReservation("pharmacy-1", "medicine-1", 1),
                authentication
            )
        );

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        verify(inventory, never()).findForUpdate("pharmacy-1", "medicine-1");
    }

    @Test
    void cancellationRestoresReservedQuantityOnlyOnce() {
        when(authentication.isAuthenticated()).thenReturn(true);
        stock.update(10, 500);
        Reservation reservation = new Reservation(
            "reservation-1", "patient-1", "Patient Name", "pharmacy-1",
            "medicine-1", 500, 3
        );
        reservation.changeStatus(tz.medifind.model.ReservationStatus.CONFIRMED);
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_PHARMACY_STAFF")))
            .when(authentication).getAuthorities();
        when(authentication.getDetails()).thenReturn("pharmacy-1");
        when(reservations.findForUpdate("reservation-1"))
            .thenReturn(Optional.of(reservation));
        when(inventory.findForUpdate("pharmacy-1", "medicine-1"))
            .thenReturn(Optional.of(stock));
        when(reservations.save(any(Reservation.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        controller.updateStatus(
            "reservation-1",
            new ReservationController.StatusUpdate(tz.medifind.model.ReservationStatus.CANCELLED),
            authentication
        );
        assertEquals(13, stock.quantity);

        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> controller.updateStatus(
                "reservation-1",
                new ReservationController.StatusUpdate(tz.medifind.model.ReservationStatus.CANCELLED),
                authentication
            )
        );

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        assertEquals(13, stock.quantity);
        verify(inventory, times(1)).save(stock);
    }

    @Test
    void pendingDeadlineIsExactlyFifteenMinutesAndConfirmedOrdersDoNotExpire() {
        Reservation reservation = new Reservation(
            "reservation-1", "patient-1", "Patient Name", "pharmacy-1",
            "medicine-1", 500, 1
        );

        assertEquals(15 * 60, Duration.between(reservation.createdAt, reservation.expiresAt).getSeconds());
        assertFalse(reservation.isConfirmationExpired(reservation.expiresAt.minusNanos(1)));
        assertTrue(reservation.isConfirmationExpired(reservation.expiresAt));

        reservation.expiresAt = null;
        assertTrue(reservation.isConfirmationExpired());

        reservation.expiresAt = reservation.createdAt.plusSeconds(15 * 60);
        reservation.changeStatus(ReservationStatus.CONFIRMED);
        assertFalse(reservation.isConfirmationExpired(reservation.expiresAt.plusSeconds(1)));
    }

    @Test
    void patientCancellationRestoresStock() {
        mockPatientIdentity();
        stock.update(8, 500);
        Reservation reservation = new Reservation(
            "reservation-1", "patient-1", "Patient Name", "pharmacy-1",
            "medicine-1", 500, 2
        );
        when(reservations.findForUpdate("reservation-1"))
            .thenReturn(Optional.of(reservation));
        when(inventory.findForUpdate("pharmacy-1", "medicine-1"))
            .thenReturn(Optional.of(stock));
        when(reservations.save(any(Reservation.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        Reservation cancelled = controller.cancelByPatient("reservation-1", authentication);

        assertEquals(ReservationStatus.CANCELLED, cancelled.status);
        assertEquals(10, stock.quantity);
        verify(inventory).save(stock);
    }

    @Test
    void patientCannotCancelAnotherPatientsOrder() {
        mockPatientIdentity();
        Reservation reservation = new Reservation(
            "reservation-1", "other-patient", "Other Patient", "pharmacy-1",
            "medicine-1", 500, 2
        );
        when(reservations.findForUpdate("reservation-1"))
            .thenReturn(Optional.of(reservation));

        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> controller.cancelByPatient("reservation-1", authentication)
        );

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verify(inventory, never()).save(any(InventoryItem.class));
    }

    @Test
    void expiredPatientCancellationExpiresAndReleasesStock() {
        mockPatientIdentity();
        stock.update(8, 500);
        Reservation reservation = new Reservation(
            "reservation-1", "patient-1", "Patient Name", "pharmacy-1",
            "medicine-1", 500, 2
        );
        reservation.expiresAt = Instant.now().minusSeconds(1);
        when(reservations.findForUpdate("reservation-1"))
            .thenReturn(Optional.of(reservation));
        when(inventory.findForUpdate("pharmacy-1", "medicine-1"))
            .thenReturn(Optional.of(stock));
        when(reservations.save(any(Reservation.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> controller.cancelByPatient("reservation-1", authentication)
        );

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        assertEquals(ReservationStatus.EXPIRED, reservation.status);
        assertEquals(10, stock.quantity);
    }

    @Test
    void staffCannotConfirmCancelledOrder() {
        Reservation reservation = new Reservation(
            "reservation-1", "patient-1", "Patient Name", "pharmacy-1",
            "medicine-1", 500, 1
        );
        reservation.changeStatus(ReservationStatus.CANCELLED);
        mockStaff("pharmacy-1");
        when(reservations.findForUpdate("reservation-1"))
            .thenReturn(Optional.of(reservation));

        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> controller.updateStatus(
                "reservation-1",
                new ReservationController.StatusUpdate(ReservationStatus.CONFIRMED),
                authentication
            )
        );

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        verify(medicines, never()).findById("medicine-1");
    }

    @Test
    void staffCannotConfirmOrderForAnotherPharmacy() {
        Reservation reservation = new Reservation(
            "reservation-1", "patient-1", "Patient Name", "pharmacy-1",
            "medicine-1", 500, 1
        );
        mockStaff("different-pharmacy");
        when(reservations.findForUpdate("reservation-1"))
            .thenReturn(Optional.of(reservation));

        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> controller.updateStatus(
                "reservation-1",
                new ReservationController.StatusUpdate(ReservationStatus.CONFIRMED),
                authentication
            )
        );

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verify(medicines, never()).findById("medicine-1");
    }

    @Test
    void staffCannotConfirmExpiredOrderAndStockIsReleased() {
        stock.update(8, 500);
        Reservation reservation = new Reservation(
            "reservation-1", "patient-1", "Patient Name", "pharmacy-1",
            "medicine-1", 500, 2
        );
        reservation.expiresAt = Instant.now().minusSeconds(1);
        mockStaff("pharmacy-1");
        when(reservations.findForUpdate("reservation-1"))
            .thenReturn(Optional.of(reservation));
        when(inventory.findForUpdate("pharmacy-1", "medicine-1"))
            .thenReturn(Optional.of(stock));
        when(reservations.save(any(Reservation.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> controller.updateStatus(
                "reservation-1",
                new ReservationController.StatusUpdate(ReservationStatus.CONFIRMED),
                authentication
            )
        );

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        assertEquals(ReservationStatus.EXPIRED, reservation.status);
        assertEquals(10, stock.quantity);
    }

    @Test
    void assignedStaffCanConfirmPendingOrderBeforeDeadline() {
        Reservation reservation = new Reservation(
            "reservation-1", "patient-1", "Patient Name", "pharmacy-1",
            "medicine-1", 500, 2
        );
        mockStaff("pharmacy-1");
        when(reservations.findForUpdate("reservation-1"))
            .thenReturn(Optional.of(reservation));
        when(medicines.findById("medicine-1"))
            .thenReturn(Optional.of(new Medicine("medicine-1", "Paracetamol", "500mg", "Tablets", "")));
        when(inventory.findForUpdate("pharmacy-1", "medicine-1"))
            .thenReturn(Optional.of(stock));
        when(reservations.save(any(Reservation.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        Reservation confirmed = controller.updateStatus(
            "reservation-1",
            new ReservationController.StatusUpdate(ReservationStatus.CONFIRMED),
            authentication
        );

        assertEquals(ReservationStatus.CONFIRMED, confirmed.status);
        assertFalse(confirmed.isConfirmationExpired(confirmed.expiresAt.plusSeconds(1)));
    }

    private void mockStaff(String pharmacyId) {
        when(authentication.isAuthenticated()).thenReturn(true);
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_PHARMACY_STAFF")))
            .when(authentication).getAuthorities();
        when(authentication.getDetails()).thenReturn(pharmacyId);
    }

    private void mockPatient() {
        mockPatientIdentity();
        when(users.findForUpdate("patient-1")).thenReturn(Optional.of(patient));
        when(pharmacies.findById("pharmacy-1")).thenReturn(Optional.of(pharmacy));
    }

    private void mockMedicine() {
        when(medicines.findById("medicine-1"))
            .thenReturn(Optional.of(new Medicine("medicine-1", "Paracetamol", "500mg", "Tablets", "")));
    }

    private void mockPatientIdentity() {
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("patient-1");
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_PATIENT")))
            .when(authentication).getAuthorities();
        when(users.findById("patient-1")).thenReturn(Optional.of(patient));
    }
}