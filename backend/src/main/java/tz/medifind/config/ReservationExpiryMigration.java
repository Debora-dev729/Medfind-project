package tz.medifind.config;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.stereotype.Component;

@Component
public class ReservationExpiryMigration implements SmartInitializingSingleton {

    private final JdbcTemplate jdbc;

    public ReservationExpiryMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void afterSingletonsInstantiated() {
        jdbc.update("""
            UPDATE reservation
            SET expires_at = created_at + INTERVAL '15 minutes'
            WHERE expires_at IS NULL
            """);
        jdbc.execute("ALTER TABLE reservation DROP CONSTRAINT IF EXISTS reservation_status_check");
        jdbc.execute("ALTER TABLE reservation ADD CONSTRAINT reservation_status_check CHECK (status >= 0 AND status <= 5)");
    }
}