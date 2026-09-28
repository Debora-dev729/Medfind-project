package tz.medifind.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class Medicine {
    @Id public String id;
    public String name;
    public String strength;
    public String form;
    public String description;

    protected Medicine() {}
    public Medicine(String id, String name, String strength, String form, String description) {
        this.id = id; this.name = name; this.strength = strength; this.form = form; this.description = description;
    }
}
