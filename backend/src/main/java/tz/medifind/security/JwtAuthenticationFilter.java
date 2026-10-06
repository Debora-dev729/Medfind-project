package tz.medifind.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tz.medifind.model.User;
import tz.medifind.repository.UserRepository;
import tz.medifind.model.Pharmacy;
import tz.medifind.model.UserRole;
import tz.medifind.repository.PharmacyRepository;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository users;
    private final PharmacyRepository pharmacies;

    public JwtAuthenticationFilter(
        JwtService jwtService,
        UserRepository users,
        PharmacyRepository pharmacies
    ) {
        this.jwtService = jwtService;
        this.users = users;
        this.pharmacies = pharmacies;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {

        String authorizationHeader = request.getHeader("Authorization");

        if (authorizationHeader == null ||
            !authorizationHeader.startsWith("Bearer ")) {

            filterChain.doFilter(request, response);
            return;
        }

        String token = authorizationHeader.substring(7);

        try {
            Claims claims = jwtService.extractClaims(token);

            String userId = claims.getSubject();
            User user = users.findById(userId).orElseThrow();
            if (!user.isActive()) throw new IllegalArgumentException("Inactive account.");
            if (user.getRole() == UserRole.PHARMACY_STAFF) {
                Pharmacy pharmacy = pharmacies.findById(user.getPharmacyId()).orElseThrow();
                if (!pharmacy.isOperational()) {
                    throw new IllegalArgumentException("Assigned pharmacy is not active.");
                }
            }

            if (user.isMustChangePassword() &&
                !"/api/auth/change-password".equals(request.getServletPath())) {
                SecurityContextHolder.clearContext();
            } else {
                var authorities = List.of(
                    new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
                );

                var authentication = new UsernamePasswordAuthenticationToken(
                    userId,
                    null,
                    authorities
                );

                authentication.setDetails(user.getPharmacyId());

                SecurityContextHolder.getContext()
                    .setAuthentication(authentication);
            }

        } catch (Exception exception) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
