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
import java.util.concurrent.CompletableFuture;

/**
 * AdminController — /api/admin/**
 * All routes require JWT auth with role=admin.
 * Also handles GET /api/admin-dashboard at root level.
 */
@RestController
public class AdminController {

    @Autowired
    private SupabaseClient supabaseClient;

    // ─── Auth helpers ──────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private Map<String, Object> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getDetails() instanceof Map) {
            return (Map<String, Object>) auth.getDetails();
        }
        return null;
    }

    private ResponseEntity<Map<String, Object>> requireAuth() {
        Map<String, Object> user = getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "No token provided"));
        }
        return null;
    }

    private ResponseEntity<Map<String, Object>> requireAdmin() {
        ResponseEntity<Map<String, Object>> authCheck = requireAuth();
        if (authCheck != null) return authCheck;
        Map<String, Object> user = getCurrentUser();
        if (!"admin".equals(user.get("role"))) {
            return ResponseEntity.status(403).body(Map.of("error", "Access Denied: Admin role required"));
        }
        return null;
    }

    // ─── POST /api/admin/products ──────────────────────────────────────────
    @PostMapping("/api/admin/products")
    public ResponseEntity<Map<String, Object>> createProduct(@RequestBody Map<String, Object> body) {
        ResponseEntity<Map<String, Object>> check = requireAdmin();
        if (check != null) return check;

        String name = (String) body.get("name");
        Object basePrice = body.get("base_price");
        Object price = body.get("price");

        if (name == null || name.isBlank() || (basePrice == null && price == null)) {
            return ResponseEntity.badRequest().body(Map.of("error", "name and price are required"));
        }

        Object pPrice = basePrice != null ? basePrice : price;

        try {
            Map<String, Object> product = new HashMap<>();
            product.put("name", name);
            product.put("price", pPrice);
            product.put("image", body.getOrDefault("image",
                    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop"));
            product.put("tags", body.getOrDefault("tags", List.of()));
            product.put("rating", body.getOrDefault("rating", 5.0));
            product.put("description", body.getOrDefault("description", ""));
            product.put("stock_quantity", body.getOrDefault("stock_quantity", 100));

            Map<String, Object> data = supabaseClient.insert("products", product, null);
            return ResponseEntity.status(201).body(Map.of("product", data));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    // ─── GET /api/admin/products ───────────────────────────────────────────
    @GetMapping("/api/admin/products")
    public ResponseEntity<Map<String, Object>> getAdminProducts() {
        ResponseEntity<Map<String, Object>> check = requireAdmin();
        if (check != null) return check;

        try {
            List<Map<String, Object>> products = supabaseClient.select(
                    "products", "order=name.asc", null);
            return ResponseEntity.ok(Map.of("products", products != null ? products : List.of()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Server error fetching products"));
        }
    }

    // ─── PUT /api/admin/products/:id ──────────────────────────────────────
    @PutMapping("/api/admin/products/{id}")
    public ResponseEntity<Map<String, Object>> updateProduct(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        ResponseEntity<Map<String, Object>> check = requireAdmin();
        if (check != null) return check;

        Map<String, Object> updates = new HashMap<>(body);
        // Rename base_price → price
        if (updates.containsKey("base_price")) {
            updates.put("price", updates.remove("base_price"));
        }
        // Rename image_url → image
        if (updates.containsKey("image_url")) {
            updates.put("image", updates.remove("image_url"));
        }

        try {
            Map<String, Object> data = supabaseClient.update("products", updates, "id", id, null);
            return ResponseEntity.ok(Map.of("product", data));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    // ─── DELETE /api/admin/products/:id ───────────────────────────────────
    @DeleteMapping("/api/admin/products/{id}")
    public ResponseEntity<Map<String, Object>> deleteProduct(@PathVariable String id) {
        ResponseEntity<Map<String, Object>> check = requireAdmin();
        if (check != null) return check;

        try {
            supabaseClient.delete("products", "id", id, null);
            return ResponseEntity.ok(Map.of("success", true, "message", "Product deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    // ─── GET /api/admin/orders ─────────────────────────────────────────────
    @GetMapping("/api/admin/orders")
    public ResponseEntity<Map<String, Object>> getAdminOrders() {
        ResponseEntity<Map<String, Object>> check = requireAdmin();
        if (check != null) return check;

        try {
            List<Map<String, Object>> orders = supabaseClient.select(
                    "orders", "order=created_at.desc", null);
            return ResponseEntity.ok(Map.of("orders", orders != null ? orders : List.of()));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", "Server error fetching orders"));
        }
    }

    // ─── PUT /api/admin/orders/:id/status ─────────────────────────────────
    @PutMapping("/api/admin/orders/{id}/status")
    public ResponseEntity<Map<String, Object>> updateOrderStatus(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        ResponseEntity<Map<String, Object>> check = requireAdmin();
        if (check != null) return check;

        String status = (String) body.get("status");
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "status is required"));
        }

        try {
            Map<String, Object> data = supabaseClient.update("orders",
                    Map.of("status", status), "id", id, null);
            return ResponseEntity.ok(Map.of("order", data));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    // ─── GET /api/admin/users ──────────────────────────────────────────────
    @GetMapping("/api/admin/users")
    public ResponseEntity<Map<String, Object>> getAdminUsers() {
        ResponseEntity<Map<String, Object>> check = requireAdmin();
        if (check != null) return check;

        try {
            List<Map<String, Object>> users = supabaseClient.select(
                    "users", "order=created_at.desc", null);
            return ResponseEntity.ok(Map.of("users", users != null ? users : List.of()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Server error fetching users"));
        }
    }

    // ─── DELETE /api/admin/users/:id ──────────────────────────────────────
    @DeleteMapping("/api/admin/users/{id}")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable String id) {
        ResponseEntity<Map<String, Object>> check = requireAdmin();
        if (check != null) return check;

        try {
            supabaseClient.delete("users", "id", id, null);
            return ResponseEntity.ok(Map.of("success", true, "message", "User deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    // ─── GET /api/admin-dashboard ──────────────────────────────────────────
    @GetMapping("/api/admin-dashboard")
    public ResponseEntity<Map<String, Object>> adminDashboard() {
        ResponseEntity<Map<String, Object>> check = requireAdmin();
        if (check != null) return check;

        try {
            // Parallel fetch
            CompletableFuture<List<Map<String, Object>>> ordersFuture = CompletableFuture.supplyAsync(() -> {
                try { return supabaseClient.select("orders", "order=created_at.desc", null); }
                catch (Exception e) { throw new RuntimeException(e); }
            });
            CompletableFuture<List<Map<String, Object>>> productsFuture = CompletableFuture.supplyAsync(() -> {
                try { return supabaseClient.select("products", "order=created_at.desc", null); }
                catch (Exception e) { throw new RuntimeException(e); }
            });
            CompletableFuture<List<Map<String, Object>>> usersFuture = CompletableFuture.supplyAsync(() -> {
                try { return supabaseClient.select("users", "order=created_at.desc", null); }
                catch (Exception e) { throw new RuntimeException(e); }
            });
            CompletableFuture<List<Map<String, Object>>> bundlesFuture = CompletableFuture.supplyAsync(() -> {
                try { return supabaseClient.select("bundles", "order=created_at.desc", null); }
                catch (Exception e) { throw new RuntimeException(e); }
            });

            List<Map<String, Object>> orders = ordersFuture.join();
            List<Map<String, Object>> products = productsFuture.join();
            List<Map<String, Object>> users = usersFuture.join();
            List<Map<String, Object>> bundles = bundlesFuture.join();

            List<Map<String, Object>> contacts = supabaseClient.select("contacts", "order=created_at.desc", null);
            List<Map<String, Object>> reviews = supabaseClient.select("reviews", "order=created_at.desc", null);
            List<Map<String, Object>> feedback = supabaseClient.select("feedback", "order=created_at.desc", null);

            Map<String, Object> response = new HashMap<>();
            response.put("orders", orders);
            response.put("products", products);
            response.put("users", users);
            response.put("bundles", bundles);
            response.put("contacts", contacts);
            response.put("reviews", reviews);
            response.put("feedback", feedback);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("[MONITORING ERROR]: " + e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Failed to harmonize artisan intelligence: " + e.getMessage()));
        }
    }
}
