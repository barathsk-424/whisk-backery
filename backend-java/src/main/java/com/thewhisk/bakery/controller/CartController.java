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
 * CartController — /api/cart
 * All routes require authentication.
 */
@RestController
@RequestMapping("/api/cart")
public class CartController {

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

    private ResponseEntity<Map<String, Object>> requireAuth() {
        Map<String, Object> user = getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Missing or invalid Authorization header"));
        }
        return null;
    }

    // ─── GET /api/cart ─────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<Map<String, Object>> getCart() {
        ResponseEntity<Map<String, Object>> authCheck = requireAuth();
        if (authCheck != null) return authCheck;

        Map<String, Object> user = getCurrentUser();
        String userId = (String) user.get("id");

        try {
            // Supabase foreign key join: select=id,quantity,created_at,product:products(id,name,price,image)
            List<Map<String, Object>> cartItems = supabaseClient.selectColumns(
                    "cart",
                    "id,quantity,created_at,product:products(id,name,price,image)",
                    "user_id=eq." + userId,
                    null
            );

            // Calculate total
            double total = 0;
            if (cartItems != null) {
                for (Map<String, Object> item : cartItems) {
                    Object productObj = item.get("product");
                    if (productObj instanceof Map) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> product = (Map<String, Object>) productObj;
                        Object priceObj = product.get("price");
                        double price = priceObj != null ? ((Number) priceObj).doubleValue() : 0;
                        Object qtyObj = item.get("quantity");
                        int qty = qtyObj != null ? ((Number) qtyObj).intValue() : 0;
                        total += price * qty;
                    }
                }
            }

            return ResponseEntity.ok(Map.of("cart", cartItems != null ? cartItems : List.of(), "total", total));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Server error fetching cart"));
        }
    }

    // ─── POST /api/cart ────────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<Map<String, Object>> addToCart(@RequestBody Map<String, Object> body) {
        ResponseEntity<Map<String, Object>> authCheck = requireAuth();
        if (authCheck != null) return authCheck;

        Map<String, Object> user = getCurrentUser();
        String userId = (String) user.get("id");

        String productId = (String) body.get("product_id");
        if (productId == null || productId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "product_id is required"));
        }

        int quantity = body.get("quantity") != null ? ((Number) body.get("quantity")).intValue() : 1;

        try {
            // Check if item already in cart
            Map<String, Object> existing = supabaseClient.maybeSingle(
                    "cart",
                    "user_id=eq." + userId + "&product_id=eq." + productId,
                    null
            );

            if (existing != null) {
                // Update quantity
                int existingQty = existing.get("quantity") != null
                        ? ((Number) existing.get("quantity")).intValue() : 0;
                Map<String, Object> data = supabaseClient.update(
                        "cart",
                        Map.of("quantity", existingQty + quantity),
                        "id", existing.get("id"),
                        null
                );
                return ResponseEntity.ok(Map.of("message", "Cart updated", "item", data));
            }

            // Insert new item
            Map<String, Object> newItem = new HashMap<>();
            newItem.put("user_id", userId);
            newItem.put("product_id", productId);
            newItem.put("quantity", quantity);

            Map<String, Object> data = supabaseClient.insert("cart", newItem, null);
            return ResponseEntity.status(201).body(Map.of("message", "Added to cart", "item", data));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Server error adding to cart"));
        }
    }

    // ─── PUT /api/cart/:id ─────────────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateCartItem(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        ResponseEntity<Map<String, Object>> authCheck = requireAuth();
        if (authCheck != null) return authCheck;

        Map<String, Object> user = getCurrentUser();
        String userId = (String) user.get("id");

        Object quantityObj = body.get("quantity");
        if (quantityObj == null || ((Number) quantityObj).intValue() < 1) {
            return ResponseEntity.badRequest().body(Map.of("error", "quantity must be at least 1"));
        }
        int quantity = ((Number) quantityObj).intValue();

        try {
            Map<String, Object> data = supabaseClient.updateMultiFilter(
                    "cart",
                    Map.of("quantity", quantity),
                    "id=eq." + id + "&user_id=eq." + userId,
                    null
            );
            if (data == null || data.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Cart item not found"));
            }
            return ResponseEntity.ok(Map.of("message", "Cart updated", "item", data));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Server error updating cart"));
        }
    }

    // ─── DELETE /api/cart/:id ──────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> removeFromCart(@PathVariable String id) {
        ResponseEntity<Map<String, Object>> authCheck = requireAuth();
        if (authCheck != null) return authCheck;

        Map<String, Object> user = getCurrentUser();
        String userId = (String) user.get("id");

        try {
            supabaseClient.deleteMultiFilter("cart", "id=eq." + id + "&user_id=eq." + userId, null);
            return ResponseEntity.ok(Map.of("message", "Item removed from cart"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Server error removing from cart"));
        }
    }
}
