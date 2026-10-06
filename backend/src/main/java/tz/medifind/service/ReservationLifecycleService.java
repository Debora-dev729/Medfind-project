package tz.medifind.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tz.medifind.model.InventoryItem;
import tz.medifind.model.Reservation;
import tz.medifind.model.ReservationStatus;
import tz.medifind.repository.InventoryRepository;
import tz.medifind.repository.ReservationRepository;

import java.time.Instant;
import java.util.List;

@Service
public class ReservationLifecycleService {

    private final ReservationRepository reservations;
    private final InventoryRepository inventory;

    public ReservationLifecycleService(
        ReservationRepository reservations,
        InventoryRepository inventory
    ) {
        this.reservations = reservations;
        this.inventory = inventory;
    }

    @Scheduled(fixedDelay = 5_000)
    @Transactional
    public void expireDueReservations() {
        List<Reservation> due = reservations.findExpiredPendingForUpdate(
            ReservationStatus.PENDING,
            Instant.now()
        );
        expireOverdue(due);
    }

    @Transactional
    public void expireOverdue(List<Reservation> reservationList) {
        boolean changed = false;
        for (Reservation reservation : reservationList) {
            changed |= expireIfOverdue(reservation);
        }
        if (changed) reservations.saveAll(reservationList);
    }

    @Transactional
    public boolean expireIfOverdue(Reservation reservation) {
        if (!reservation.isConfirmationExpired()) return false;
        reservation.expire();
        releaseReservedStock(reservation);
        reservations.save(reservation);
        return true;
    }

    @Transactional
    public void releaseReservedStock(Reservation reservation) {
        InventoryItem item = inventory.findForUpdate(
                reservation.pharmacyId,
                reservation.medicineId
            )
            .orElse(null);
        if (item == null) return;

        item.update(item.quantity + reservation.quantity, item.price);
        inventory.save(item);
    }
}