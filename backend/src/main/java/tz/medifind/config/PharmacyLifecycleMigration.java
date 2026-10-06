package tz.medifind.config;

import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class PharmacyLifecycleMigration implements SmartInitializingSingleton {

    private final JdbcTemplate jdbc;

    public PharmacyLifecycleMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void afterSingletonsInstantiated() {
        jdbc.update("UPDATE pharmacy SET application_status = 'APPROVED' WHERE application_status IS NULL");
        jdbc.update("UPDATE pharmacy SET payment_status = 'PAYMENT_VERIFIED' WHERE payment_status IS NULL");
        jdbc.update("UPDATE pharmacy SET status = 'ACTIVE' WHERE status IS NULL");
        jdbc.update("UPDATE pharmacy SET subscription_plan = 'BASIC' WHERE subscription_plan IS NULL");
        jdbc.update("UPDATE pharmacy SET subscription_amount = 20000 WHERE subscription_amount IS NULL");
    }
}