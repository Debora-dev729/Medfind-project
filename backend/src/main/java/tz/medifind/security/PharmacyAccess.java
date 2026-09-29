package tz.medifind.security;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.server.ResponseStatusException;

public final class PharmacyAccess {

    private PharmacyAccess() {
    }

    public static void requireAccess(
        Authentication authentication,
        String pharmacyId
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Authentication required."
            );
        }

        boolean admin = authentication.getAuthorities().stream()
            .anyMatch(authority ->
                authority.equals(new SimpleGrantedAuthority("ROLE_ADMIN")));

        if (admin) {
            return;
        }

        boolean pharmacyStaff = authentication.getAuthorities().stream()
            .anyMatch(authority ->
                authority.equals(new SimpleGrantedAuthority("ROLE_PHARMACY_STAFF")));

        if (!pharmacyStaff) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You do not have access to this pharmacy."
            );
        }

        Object details = authentication.getDetails();

        if (!(details instanceof String assignedPharmacyId) ||
            !assignedPharmacyId.equals(pharmacyId)) {

            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You do not have access to this pharmacy."
            );
        }
    }
}
