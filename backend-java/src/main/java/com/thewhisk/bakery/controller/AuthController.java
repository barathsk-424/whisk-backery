package com.thewhisk.bakery.controller;

import com.thewhisk.bakery.util.EmailValidator;
import com.thewhisk.bakery.util.JwtUtil;
import com.thewhisk.bakery.util.SupabaseClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * AuthController — handles /signup, /login, /forgot-password, /reset-password
 * These are root-level routes (matching server.js in Node.js).
 */
@RestController
public class AuthController {

    @Autowired
    private SupabaseClient supabaseClient;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private EmailValidator emailValidator;

    // ─── POST /signup ──────────────────────────────────────────────────────
    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String email = (String) body.get("email");
        String password = (String) body.get("password");

        String userEmail = email != null ? email.trim().toLowerCase() : "";

        System.out.println("\n[MEMBERSHIP] Registration attempt: " + userEmail);

        // Email validation
        Map<String, Object> validation = emailValidator.validate(userEmail);
        if (!(boolean) validation.get("valid")) {
            return ResponseEntity.badRequest().body(Map.of("message", validation.get("message")));
        }

        try {
            // Check if exists in admins
            Map<String, Object> existingAdmin = supabaseClient.maybeSingle(
                    "admins", "email=eq." + userEmail, null);
            // Check if exists in users
            Map<String, Object> existingUser = supabaseClient.maybeSingle(
                    "users", "email=eq." + userEmail, null);

            if (existingAdmin != null || existingUser != null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Artisan already exists in the registry."));
            }

            // Insert new user
            Map<String, Object> newUser = new HashMap<>();
            newUser.put("name", name != null && !name.isBlank() ? name : "New Artisan");
            newUser.put("email", userEmail);
            newUser.put("password", password);
            newUser.put("role", "user");
            newUser.put("created_at", Instant.now().toString());

            supabaseClient.insert("users", newUser, null);

            System.out.println("   → OK: New Artisan registered: " + userEmail);
            return ResponseEntity.status(201)
                    .body(Map.of("message", "Registration successful. Welcome to the community!"));

        } catch (Exception e) {
            System.err.println("   → SYSTEM ERROR SIGNUP: " + e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Backend error during registration."));
        }
    }

    // ─── POST /login ───────────────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, Object> body) {
        String email = (String) body.get("email");
        String password = (String) body.get("password");
        String userEmail = email != null ? email.trim().toLowerCase() : "";

        System.out.println("\n[AUTH] LOGIN ATTEMPT: " + userEmail);

        try {
            // 1. Check master admin vault
            Map<String, Object> masterAdmin = supabaseClient.maybeSingle(
                    "admins", "email=eq." + userEmail, null);

            if (masterAdmin != null && password != null && password.equals(masterAdmin.get("password"))) {
                System.out.println("   → Success: Master Admin Access Granted: " + masterAdmin.get("email"));
                Map<String, Object> claims = new HashMap<>();
                claims.put("id", masterAdmin.get("id"));
                claims.put("email", masterAdmin.get("email"));
                claims.put("role", "admin");
                claims.put("source", "master");

                String token = jwtUtil.sign(claims);
                return ResponseEntity.ok(Map.of(
                        "token", token,
                        "user", Map.of(
                                "id", masterAdmin.get("id"),
                                "email", masterAdmin.get("email"),
                                "role", "admin",
                                "name", masterAdmin.getOrDefault("name", "")
                        )
                ));
            }

            // 2. Check general users
            Map<String, Object> user = supabaseClient.maybeSingle(
                    "users", "email=eq." + userEmail, null);

            if (user != null) {
                if (password != null && password.equals(user.get("password"))) {
                    System.out.println("   → Success: Member Session Initialized: " + user.get("email"));
                    String role = user.get("role") != null ? String.valueOf(user.get("role")) : "user";
                    Map<String, Object> claims = new HashMap<>();
                    claims.put("id", user.get("id"));
                    claims.put("email", user.get("email"));
                    claims.put("role", role);
                    claims.put("source", "general");

                    String token = jwtUtil.sign(claims);
                    return ResponseEntity.ok(Map.of(
                            "token", token,
                            "user", Map.of(
                                    "id", user.get("id"),
                                    "email", user.get("email"),
                                    "role", role,
                                    "name", user.getOrDefault("name", "")
                            )
                    ));
                } else {
                    return ResponseEntity.status(401).body(Map.of("message", "Invalid password"));
                }
            }

            return ResponseEntity.status(401).body(
                    Map.of("message", "Artisan not found in registry (Search: " + userEmail + ")")
            );

        } catch (Exception e) {
            System.err.println("   → SYSTEM ERROR LOGIN: " + e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Server error during authentication"));
        }
    }

    // ─── POST /forgot-password ─────────────────────────────────────────────
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@RequestBody Map<String, Object> body) {
        String email = (String) body.get("email");
        String userEmail = email != null ? email.trim().toLowerCase() : "";

        System.out.println("\n[AUTH] PASSWORD RESET REQUEST: " + userEmail);

        try {
            supabaseClient.authRecover(userEmail);
            return ResponseEntity.ok(Map.of("message", "Recovery instructions sent to your email."));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Recovery relay failure."));
        }
    }

    // ─── POST /reset-password ──────────────────────────────────────────────
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody Map<String, Object> body) {
        String token = (String) body.get("token");
        String password = (String) body.get("password");

        System.out.println("\n[AUTH] PASSWORD UPDATE ATTEMPT");

        try {
            supabaseClient.authUpdateUser(token, password);
            System.out.println("   → SUCCESS: Cipher updated");
            return ResponseEntity.ok(Map.of("message", "Cipher updated successfully. Identity re-secured."));
        } catch (Exception e) {
            System.out.println("   → RESET FAILED: " + e.getMessage());
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }
}
