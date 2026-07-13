package com.thewhisk.bakery.controller;

import com.thewhisk.bakery.util.SupabaseClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * OrdersController — /api/orders (Supabase-based, mixed auth)
 *
 * GET /api/orders     — public (no auth), optional query params: user_id, email
 * PATCH /api/orders/:id — requires auth + admin role
 */
@RestController
@RequestMapping("/api/orders")
public class OrdersController {

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

    // ─── GET /api/orders ───────────────────────────────────────────────────
    // Public — no auth required
    // Optional query params: user_id, email
    @GetMapping
    public ResponseEntity<Object> getOrders(
            @RequestParam(required = false) String user_id,
            @RequestParam(required = false) String email) {

        System.out.println("[PROXY] Order Retrieval Request: " + (email != null ? email : user_id));

        try {
            StringBuilder query = new StringBuilder("order=created_at.desc");

            if (user_id != null && !user_id.isBlank()) {
                query.append("&user_id=eq.").append(user_id);
            } else if (email != null && !email.isBlank()) {
                query.append("&user_email=eq.").append(email);
            }

            List<Map<String, Object>> data = supabaseClient.select("orders", query.toString(), null);
            // Return array directly (not wrapped)
            return ResponseEntity.ok(data);

        } catch (Exception e) {
            System.err.println("[PROXY ERROR]: " + e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Failed to bridge to Supabase."));
        }
    }

    // ─── PATCH /api/orders/:id — requires auth + admin role ───────────────
    @PatchMapping("/{id}")
    public ResponseEntity<Object> updateOrderStatus(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {

        Map<String, Object> user = getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "No token provided"));
        }
        if (!"admin".equals(user.get("role"))) {
            return ResponseEntity.status(403).body(Map.of("message", "Admin clearance required"));
        }

        String status = (String) body.get("status");
        System.out.println("[ADMIN] Status sync triggered for order " + id + " -> " + status);

        try {
            Map<String, Object> data = supabaseClient.update("orders", Map.of("status", status), "id", id, null);

            if (data == null || data.isEmpty()) {
                return ResponseEntity.status(404).body(
                        Map.of("message", "No record detected at specified coordinates. Verify ID signature."));
            }

            // Return data directly (not wrapped)
            return ResponseEntity.ok(data);

        } catch (Exception e) {
            System.err.println("[SYNC ERROR]: " + e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Failed to bridge synchronize operational state: " + e.getMessage()));
        }
    }
}
