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
 * ProductController — /api/products
 * GET (public), POST (requires auth), GET /:id (public)
 */
@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private SupabaseClient supabaseClient;

    // ─── GET /api/products ─────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllProducts() {
        try {
            List<Map<String, Object>> products = supabaseClient.select(
                    "products", "order=created_at.desc", null);
            return ResponseEntity.ok(Map.of("products", products));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Server error fetching products"));
        }
    }

    // ─── GET /api/products/:id ─────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getProductById(@PathVariable String id) {
        try {
            Map<String, Object> product = supabaseClient.maybeSingle(
                    "products", "id=eq." + id, null);
            if (product == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Product not found"));
            }
            return ResponseEntity.ok(Map.of("product", product));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Server error fetching product"));
        }
    }

    // ─── POST /api/products (requires auth) ───────────────────────────────
    @PostMapping
    public ResponseEntity<Map<String, Object>> createProduct(@RequestBody Map<String, Object> body) {
        // Auth check
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).body(Map.of("error", "Missing or invalid Authorization header"));
        }

        String name = (String) body.get("name");
        Object price = body.get("price");

        if (name == null || name.isBlank() || price == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "name and price are required"));
        }

        try {
            Map<String, Object> product = new HashMap<>();
            product.put("name", name);
            product.put("price", price);
            product.put("image", body.getOrDefault("image",
                    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop"));

            Map<String, Object> data = supabaseClient.insert("products", product, null);
            return ResponseEntity.status(201).body(Map.of("product", data));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Server error creating product"));
        }
    }
}
