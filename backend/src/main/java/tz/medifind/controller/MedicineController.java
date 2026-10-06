package tz.medifind.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tz.medifind.model.InventoryItem;
import tz.medifind.model.AvailabilityStatus;
import tz.medifind.model.Medicine;
import tz.medifind.repository.InventoryRepository;
import tz.medifind.repository.MedicineRepository;
import tz.medifind.repository.PharmacyRepository;
import tz.medifind.model.PharmacyStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/medicines")
public class MedicineController {
    private final MedicineRepository medicines;
    private final InventoryRepository inventory;
    private final PharmacyRepository pharmacies;

    public MedicineController(
        MedicineRepository medicines,
        InventoryRepository inventory,
        PharmacyRepository pharmacies
    ) {
        this.medicines = medicines;
        this.inventory = inventory;
        this.pharmacies = pharmacies;
    }

    @GetMapping
    public List<Map<String, Object>> search(
        @RequestParam(defaultValue = "") String query,
        Authentication authentication
    ) {
        List<Medicine> matches = query.isBlank() ? medicines.findAll() : medicines.findByNameContainingIgnoreCaseOrStrengthContainingIgnoreCaseOrFormContainingIgnoreCase(query, query, query);
        boolean staff = authentication.getAuthorities().contains(
            new SimpleGrantedAuthority("ROLE_PHARMACY_STAFF")
        );
        boolean admin = authentication.getAuthorities().contains(
            new SimpleGrantedAuthority("ROLE_ADMIN")
        );
        String assignedPharmacyId = staff && authentication.getDetails() instanceof String id
            ? id
            : null;
        var activePharmacyIds = admin
            ? java.util.Set.<String>of()
            : pharmacies.findByStatusOrderByNameAsc(PharmacyStatus.ACTIVE).stream()
                .filter(pharmacy -> pharmacy.isOperational())
                .map(pharmacy -> pharmacy.id)
                .collect(java.util.stream.Collectors.toSet());

        return matches.stream().map(medicine -> {
            List<InventoryItem> available = inventory.findByMedicineId(medicine.id)
                .stream()
                .filter(item -> item.quantity > 0 &&
                    item.status != AvailabilityStatus.OUT_OF_STOCK)
                .filter(item -> admin || activePharmacyIds.contains(item.pharmacyId))
                .filter(item -> !staff || item.pharmacyId.equals(assignedPharmacyId))
                .toList();
            return Map.of("medicine", medicine, "availability", available);
        }).toList();
    }
}
