package tz.medifind.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tz.medifind.model.InventoryItem;
import tz.medifind.model.Medicine;
import tz.medifind.repository.InventoryRepository;
import tz.medifind.repository.MedicineRepository;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/medicines")
public class MedicineController {
    private final MedicineRepository medicines;
    private final InventoryRepository inventory;

    public MedicineController(MedicineRepository medicines, InventoryRepository inventory) { this.medicines = medicines; this.inventory = inventory; }

    @GetMapping
    public List<Map<String, Object>> search(@RequestParam(defaultValue = "") String query) {
        List<Medicine> matches = query.isBlank() ? medicines.findAll() : medicines.findByNameContainingIgnoreCaseOrStrengthContainingIgnoreCaseOrFormContainingIgnoreCase(query, query, query);
        return matches.stream().map(medicine -> Map.of("medicine", medicine, "availability", inventory.findByMedicineId(medicine.id))).toList();
    }
}
