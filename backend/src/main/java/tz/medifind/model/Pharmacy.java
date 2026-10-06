package tz.medifind.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

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

    public String registrationNumber;
    public String ownerName;
    public String email;
    public Instant submittedAt;

    @Enumerated(EnumType.STRING)
    public PharmacyApplicationStatus applicationStatus = PharmacyApplicationStatus.APPROVED;

    @Enumerated(EnumType.STRING)
    public PharmacyPaymentStatus paymentStatus = PharmacyPaymentStatus.PAYMENT_VERIFIED;

    @Enumerated(EnumType.STRING)
    public PharmacyStatus status = PharmacyStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    public SubscriptionPlan subscriptionPlan = SubscriptionPlan.BASIC;

    public Long subscriptionAmount = SubscriptionPlan.BASIC.monthlyAmount();
    public String paymentReference;
    public Instant paymentDate;
    public Instant subscriptionStartedAt;
    public Instant subscriptionExpiresAt;

    public boolean isOpen;
    public String closureReason;
    public Instant closedAt;
    public Instant expectedReopenAt;

    protected Pharmacy() {}

    public Pharmacy(
        String id,
        String name,
        String city,
        String address,
        String phone,
        String hours,
        double latitude,
        double longitude
    ) {
        this.id = id;
        this.name = name;
        this.city = city;
        this.address = address;
        this.phone = phone;
        this.hours = hours;
        this.latitude = latitude;
        this.longitude = longitude;
        this.verified = true;
        this.isOpen = true;
        this.applicationStatus = PharmacyApplicationStatus.APPROVED;
        this.paymentStatus = PharmacyPaymentStatus.PAYMENT_VERIFIED;
        this.status = PharmacyStatus.ACTIVE;
        this.subscriptionPlan = SubscriptionPlan.BASIC;
        this.subscriptionAmount = SubscriptionPlan.BASIC.monthlyAmount();
    }

    public static Pharmacy application(
        String id,
        String name,
        String ownerName,
        String registrationNumber,
        String email,
        String phone,
        String address,
        String city,
        String hours,
        Double latitude,
        Double longitude,
        SubscriptionPlan plan
    ) {
        Pharmacy pharmacy = new Pharmacy();
        pharmacy.id = id;
        pharmacy.name = name;
        pharmacy.ownerName = ownerName;
        pharmacy.registrationNumber = registrationNumber;
        pharmacy.email = email;
        pharmacy.phone = phone;
        pharmacy.address = address;
        pharmacy.city = city;
        pharmacy.hours = hours;
        pharmacy.latitude = latitude;
        pharmacy.longitude = longitude;
        pharmacy.verified = false;
        pharmacy.isOpen = false;
        pharmacy.applicationStatus = PharmacyApplicationStatus.PENDING_APPROVAL;
        pharmacy.paymentStatus = PharmacyPaymentStatus.PAYMENT_PENDING;
        pharmacy.status = PharmacyStatus.PENDING_APPROVAL;
        pharmacy.subscriptionPlan = plan;
        pharmacy.subscriptionAmount = plan.monthlyAmount();
        pharmacy.submittedAt = Instant.now();
        return pharmacy;
    }

    public void approveApplication() {
        applicationStatus = PharmacyApplicationStatus.APPROVED;
        updateOperationalStatus();
    }

    public void rejectApplication() {
        applicationStatus = PharmacyApplicationStatus.REJECTED;
        status = PharmacyStatus.REJECTED;
        verified = false;
        isOpen = false;
    }

    public void submitPayment(String reference) {
        paymentReference = reference;
        paymentStatus = PharmacyPaymentStatus.PAYMENT_SUBMITTED;
        updateOperationalStatus();
    }

    public void rejectPayment() {
        paymentStatus = PharmacyPaymentStatus.PAYMENT_REJECTED;
        updateOperationalStatus();
    }

    public void verifyPayment() {
        paymentStatus = PharmacyPaymentStatus.PAYMENT_VERIFIED;
        paymentDate = Instant.now();
        subscriptionStartedAt = paymentDate;
        subscriptionExpiresAt = paymentDate.plus(30, ChronoUnit.DAYS);
        updateOperationalStatus();
    }

    public void suspend() {
        status = PharmacyStatus.SUSPENDED;
        isOpen = false;
    }

    public void reactivate() {
        if (applicationStatus != PharmacyApplicationStatus.APPROVED ||
            paymentStatus != PharmacyPaymentStatus.PAYMENT_VERIFIED ||
            (subscriptionExpiresAt != null && !Instant.now().isBefore(subscriptionExpiresAt))) {
            throw new IllegalStateException("Approved application and verified, current subscription are required.");
        }
        status = PharmacyStatus.ACTIVE;
        isOpen = true;
    }

    public boolean isOperational() {
        return status == PharmacyStatus.ACTIVE &&
            (subscriptionExpiresAt == null || Instant.now().isBefore(subscriptionExpiresAt));
    }

    private void updateOperationalStatus() {
        if (applicationStatus == PharmacyApplicationStatus.REJECTED) {
            status = PharmacyStatus.REJECTED;
            isOpen = false;
        } else if (applicationStatus != PharmacyApplicationStatus.APPROVED) {
            status = PharmacyStatus.PENDING_APPROVAL;
            isOpen = false;
        } else if (paymentStatus != PharmacyPaymentStatus.PAYMENT_VERIFIED) {
            status = PharmacyStatus.PAYMENT_PENDING;
            isOpen = false;
        } else {
            status = PharmacyStatus.ACTIVE;
            verified = true;
            isOpen = true;
        }
    }

    public void closeTemporarily(String reason, Instant expectedReopenAt) {
        this.isOpen = false;
        this.closureReason = reason;
        this.closedAt = Instant.now();
        this.expectedReopenAt = expectedReopenAt;
    }

    public void reopen() {
        this.isOpen = true;
        this.closureReason = null;
        this.closedAt = null;
        this.expectedReopenAt = null;
    }
}
