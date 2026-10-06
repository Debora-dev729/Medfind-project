package tz.medifind.model;

public enum SubscriptionPlan {
    BASIC(20_000),
    STANDARD(50_000),
    PREMIUM(100_000);

    private final long monthlyAmount;

    SubscriptionPlan(long monthlyAmount) {
        this.monthlyAmount = monthlyAmount;
    }

    public long monthlyAmount() {
        return monthlyAmount;
    }
}