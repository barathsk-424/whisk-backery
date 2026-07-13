package com.thewhisk.bakery.controller;

import com.thewhisk.bakery.util.SupabaseClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * AuthRouteController — /api/auth/**
 * Mirrors routes/auth.js in the Node.js backend.
 *
 * POST /api/auth/signup   — Supabase Auth signup
 * POST /api/auth/login    — Supabase Auth login
 * GET  /api/auth/profile  — requires JWT auth
 */
@RestController
@RequestMapping("/api/auth")
public class AuthRouteController {

    @Autowired
    private SupabaseClient supabaseClient;

    @SuppressWarnings("unchecked")
    private Map<String, Object> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getDetails() instanceof Map) {
            return (Map<String, Object>) auth.getDetails();
        }
        return null;
    }

    // ─── POST /api/auth/signup ─────────────────────────────────────────────
    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String email = (String) body.get("email");
        String password = (String) body.get("password");

        if (name == null || name.isBlank() || email == null || email.isBlank()
                || password == null || password.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "name, email, and password are required"));
        }

        if (password.length() < 6) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Password must be at least 6 characters"));
        }

        try {
            Map<String, Object> data = supabaseClient.authSignup(email, password, name);

            // Extract user and session from Supabase response
            @SuppressWarnings("unchecked")
            Map<String, Object> userObj = data.get("user") instanceof Map
                    ? (Map<String, Object>) data.get("user") : data;
            @SuppressWarnings("unchecked")
            Map<String, Object> sessionObj = data.get("session") instanceof Map
                    ? (Map<String, Object>) data.get("session") : null;

            Map<String, Object> userResponse = new HashMap<>();
            userResponse.put("id", userObj.get("id"));
            userResponse.put("email", userObj.get("email"));
            userResponse.put("name", name);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "User registered successfully");
            response.put("user", userResponse);

            if (sessionObj != null) {
                Map<String, Object> sessionResponse = new HashMap<>();
                sessionResponse.put("access_token", sessionObj.get("access_token"));
                sessionResponse.put("refresh_token", sessionObj.get("refresh_token"));
                sessionResponse.put("expires_in", sessionObj.get("expires_in"));
                response.put("session", sessionResponse);
            } else {
                response.put("session", null);
                response.put("note", "Email confirmation required. Check your inbox or enable auto-confirm in Supabase Dashboard → Auth → Settings.");
            }

            return ResponseEntity.status(201).body(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Server error during signup"));
        }
    }

    // ─── POST /api/auth/login ──────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, Object> body) {
        String email = (String) body.get("email");
        String password = (String) body.get("password");

        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "email and password are required"));
        }

        try {
            Map<String, Object> data = supabaseClient.authLogin(email, password);

            // Check for error in response
            if (data.containsKey("error") || data.containsKey("error_code")) {
                String errMsg = data.get("error_description") != null
                        ? String.valueOf(data.get("error_description"))
                        : String.valueOf(data.getOrDefault("msg", "Login failed"));
                return ResponseEntity.status(401).body(Map.of("error", errMsg));
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> userObj = data.get("user") instanceof Map
                    ? (Map<String, Object>) data.get("user") : null;

            Map<String, Object> userResponse = new HashMap<>();
            if (userObj != null) {
                userResponse.put("id", userObj.get("id"));
                userResponse.put("email", userObj.get("email"));
            } else {
                userResponse.put("id", data.get("user_id"));
                userResponse.put("email", email);
            }

            Map<String, Object> sessionResponse = new HashMap<>();
            sessionResponse.put("access_token", data.get("access_token"));
            sessionResponse.put("refresh_token", data.get("refresh_token"));
            sessionResponse.put("expires_in", data.get("expires_in"));

            return ResponseEntity.ok(Map.of(
                    "message", "Login successful",
                    "user", userResponse,
                    "session", sessionResponse
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Server error during login"));
        }
    }

    // ─── GET /api/auth/profile (requires auth) ────────────────────────────
    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getProfile() {
        Map<String, Object> user = getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Missing or invalid Authorization header"));
        }

        String userId = (String) user.get("id");

        try {
            List<Map<String, Object>> results = supabaseClient.select(
                    "users", "id=eq." + userId, null);

            if (results == null || results.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Profile not found"));
            }

            return ResponseEntity.ok(Map.of("user", results.get(0)));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Server error fetching profile"));
        }
    }
}
