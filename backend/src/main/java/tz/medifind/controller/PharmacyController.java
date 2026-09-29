package tz.medifind.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tz.medifind.model.Pharmacy;
import tz.medifind.repository.InventoryRepository;
import tz.medifind.repository.PharmacyRepository;
import tz.medifind.security.PharmacyAccess;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/pharmacies")
public class PharmacyController {

    private final PharmacyRepository pharmacies;
    private final InventoryRepository inventory;

    public PharmacyController(
        PharmacyRepository pharmacies,
        InventoryRepository inventory
    ) {
        this.pharmacies = pharmacies;
        this.inventory = inventory;
    }

    @GetMapping
    public Object list() {
        return pharmacies.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable String id) {
        return pharmacies.findById(id)
            .map(pharmacy ->
                ResponseEntity.ok(
                    Map.of(
                        "pharmacy", pharmacy,
                        "inventory", inventory.findByPharmacyId(id)
                    )
                )
            )
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/close")
    public Pharmacy close(
        @PathVariable String id,
        @Valid @RequestBody ClosureRequest request,
        Authentication authentication
    ) {
        PharmacyAccess.requireAccess(authentication, id);

        Pharmacy pharmacy = pharmacies.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Pharmacy not found."
            ));

        pharmacy.closeTemporarily(
            request.reason().trim(),
            request.expectedReopenAt()
        );

        return pharmacies.save(pharmacy);
    }

    @PostMapping("/{id}/reopen")
    public Pharmacy reopen(
        @PathVariable String id,
        Authentication authentication
    ) {
        PharmacyAccess.requireAccess(authentication, id);

        Pharmacy pharmacy = pharmacies.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Pharmacy not found."
            ));

        pharmacy.reopen();

        return pharmacies.save(pharmacy);
    }

    public record ClosureRequest(
        @NotBlank String reason,
        Instant expectedReopenAt
    ) {}
}
