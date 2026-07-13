package com.thewhisk.bakery.middleware;

import com.thewhisk.bakery.util.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * JWT Authentication Filter — runs once per request.
 * Extracts Bearer token from Authorization header, verifies it,
 * and sets the SecurityContext so controllers can access user info.
 *
 * Does NOT reject unauthenticated requests — controllers decide
 * whether authentication is required (matches Node.js middleware pattern).
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                Claims claims = jwtUtil.verify(token);

                Map<String, Object> userDetails = new HashMap<>();
                userDetails.put("id", claims.get("id") != null ? String.valueOf(claims.get("id")) : null);
                userDetails.put("email", claims.get("email") != null ? String.valueOf(claims.get("email")) : null);
                userDetails.put("role", claims.get("role") != null ? String.valueOf(claims.get("role")) : "user");
                userDetails.put("source", claims.get("source") != null ? String.valueOf(claims.get("source")) : "");

                String role = (String) userDetails.get("role");
                SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role.toUpperCase());

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails.get("email"),
                                null,
                                Collections.singletonList(authority)
                        );
                authentication.setDetails(userDetails);

                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (Exception e) {
                // Invalid/expired token — clear context and continue
                // Controllers that require auth will check and return 401
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }
}
