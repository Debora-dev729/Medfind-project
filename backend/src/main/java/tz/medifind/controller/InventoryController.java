package tz.medifind.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import tz.medifind.model.InventoryItem;
import tz.medifind.repository.InventoryRepository;
import tz.medifind.security.PharmacyAccess;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/pharmacies/{pharmacyId}/inventory")
public class InventoryController {

    private final InventoryRepository inventory;

    public InventoryController(InventoryRepository inventory) {
        this.inventory = inventory;
    }

    @GetMapping
    public List<InventoryItem> list(
        @PathVariable String pharmacyId,
        Authentication authentication
    ) {
        PharmacyAccess.requireAccess(authentication, pharmacyId);

        return inventory.findByPharmacyId(pharmacyId);
    }

    @PutMapping("/{medicineId}")
    @Transactional
    public ResponseEntity<InventoryItem> update(
        @PathVariable String pharmacyId,
        @PathVariable String medicineId,
        @Valid @RequestBody InventoryUpdate request,
        Authentication authentication
    ) {
        PharmacyAccess.requireAccess(authentication, pharmacyId);

        InventoryItem item =
            inventory.findForUpdate(
                pharmacyId,
                medicineId
            ).orElseGet(() ->
                new InventoryItem(
                    UUID.randomUUID().toString(),
                    pharmacyId,
                    medicineId,
                    0,
                    null
                )
            );

        item.update(request.quantity(), request.price());

        return ResponseEntity.ok(inventory.save(item));
    }

    public record InventoryUpdate(
        @Min(0) int quantity,
        @Min(0) Integer price
    ) {
    }
}
