package tz.medifind.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tz.medifind.model.InventoryItem;
import tz.medifind.model.Reservation;
import tz.medifind.model.ReservationStatus;
import tz.medifind.repository.InventoryRepository;
import tz.medifind.repository.ReservationRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReservationLifecycleServiceTest {

    @Mock private ReservationRepository reservations;
    @Mock private InventoryRepository inventory;
    @InjectMocks private ReservationLifecycleService lifecycle;

    @Test
    void scheduledExpiryUpdatesPendingOrderAndReleasesStock() {
        Reservation reservation = new Reservation(
            "order-1", "patient-1", "Patient", "pharmacy-1", "medicine-1", 500, 2
        );
        reservation.expiresAt = Instant.now().minusSeconds(1);
        InventoryItem stock = new InventoryItem(
            "stock-1", "pharmacy-1", "medicine-1", 8, 500
        );
        when(reservations.findExpiredPendingForUpdate(
            eq(ReservationStatus.PENDING),
            any(Instant.class)
        )).thenReturn(List.of(reservation));
        when(inventory.findForUpdate("pharmacy-1", "medicine-1"))
            .thenReturn(Optional.of(stock));

        lifecycle.expireDueReservations();

        assertEquals(ReservationStatus.EXPIRED, reservation.status);
        assertEquals(10, stock.quantity);
        verify(reservations).saveAll(List.of(reservation));
        verify(inventory).save(stock);
    }
}