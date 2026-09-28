package tz.medifind.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tz.medifind.model.Pharmacy;
import tz.medifind.repository.InventoryRepository;
import tz.medifind.repository.PharmacyRepository;
import java.util.Map;

@RestController
@RequestMapping("/api/pharmacies")
public class PharmacyController {
    private final PharmacyRepository pharmacies;
    private final InventoryRepository inventory;

    public PharmacyController(PharmacyRepository pharmacies, InventoryRepository inventory) { this.pharmacies = pharmacies; this.inventory = inventory; }

    @GetMapping
    public Object list() { return pharmacies.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable String id) {
        return pharmacies.findById(id).map(pharmacy -> ResponseEntity.ok(Map.of("pharmacy", pharmacy, "inventory", inventory.findByPharmacyId(id)))).orElseGet(() -> ResponseEntity.notFound().build());
    }
}
