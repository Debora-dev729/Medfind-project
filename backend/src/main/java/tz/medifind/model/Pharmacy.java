package tz.medifind.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class Pharmacy {
    @Id public String id;
    public String name;
    public String city;
    public String address;
    public String phone;
    public String hours;
    public Double latitude;
    public Double longitude;
    public boolean verified;

    protected Pharmacy() {}
    public Pharmacy(String id, String name, String city, String address, String phone, String hours, double latitude, double longitude) {
        this.id = id; this.name = name; this.city = city; this.address = address; this.phone = phone; this.hours = hours;
        this.latitude = latitude; this.longitude = longitude; this.verified = true;
    }
}
