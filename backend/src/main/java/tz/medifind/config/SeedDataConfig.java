package tz.medifind.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tz.medifind.model.*;
import tz.medifind.repository.*;

@Configuration
public class SeedDataConfig {
    @Bean
    CommandLineRunner seed(MedicineRepository medicines, PharmacyRepository pharmacies, InventoryRepository inventory) {
        return args -> {
            if (medicines.count() > 0) return;
            medicines.save(new Medicine("paracetamol-500mg", "Paracetamol", "500mg", "Tablets", "Pain reliever and fever reducer."));
            medicines.save(new Medicine("ibuprofen-400mg", "Ibuprofen", "400mg", "Tablets", "Medicine for pain, fever and inflammation."));
            medicines.save(new Medicine("amoxicillin-250mg", "Amoxicillin", "250mg", "Capsules", "Use with advice from a qualified clinician."));
            pharmacies.save(new Pharmacy("afya-pharmacy", "Afya Pharmacy", "Dar es Salaam", "Maktaba Street, Kariakoo", "+255 754 281 640", "8:00 AM - 9:00 PM", -6.8235, 39.2695));
            pharmacies.save(new Pharmacy("zanzibar-care-pharmacy", "Zanzibar Care Pharmacy", "Zanzibar City", "Hurumzi Street, Stone Town", "+255 777 412 890", "8:00 AM - 9:00 PM", -6.1608, 39.1921));
            pharmacies.save(new Pharmacy("mwanakwerekwe-pharmacy", "Mwanakwerekwe Pharmacy", "Zanzibar City", "Mwanakwerekwe Market Road, Zanzibar", "+255 714 638 205", "7:30 AM - 8:30 PM", -6.1886, 39.2202));
            inventory.save(new InventoryItem("afya-paracetamol", "afya-pharmacy", "paracetamol-500mg", 24, 500));
            inventory.save(new InventoryItem("afya-ibuprofen", "afya-pharmacy", "ibuprofen-400mg", 4, 800));
            inventory.save(new InventoryItem("zanzibar-paracetamol", "zanzibar-care-pharmacy", "paracetamol-500mg", 20, 550));
            inventory.save(new InventoryItem("zanzibar-amoxicillin", "zanzibar-care-pharmacy", "amoxicillin-250mg", 10, 1250));
            inventory.save(new InventoryItem("mwanakwerekwe-paracetamol", "mwanakwerekwe-pharmacy", "paracetamol-500mg", 5, 500));
        };
    }
}
