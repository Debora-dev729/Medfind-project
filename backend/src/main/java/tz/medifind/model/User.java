package tz.medifind.model;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    private String id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    private String phone;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    private String pharmacyId;

    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean active = true;

    protected User() {
    }

    public User(
        String id,
        String fullName,
        String email,
        String phone,
        String password,
        UserRole role,
        String pharmacyId
    ) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.password = password;
        this.role = role;
        this.pharmacyId = pharmacyId;
    }

    public String getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public String getPassword() {
        return password;
    }

    public UserRole getRole() {
        return role;
    }

    public String getPharmacyId() {
        return pharmacyId;
    }

    public boolean isActive() {
        return active;
    }

    public void updateStaffDetails(
        String fullName,
        String email,
        String phone,
        String password,
        String pharmacyId
    ) {
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        if (password != null) this.password = password;
        this.pharmacyId = pharmacyId;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}

