package com.thewhisk.bakery.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * OrderController — /api/order (MongoDB-based routes)
 * Since MongoDB is not used in the Java migration, all routes return 503.
 * This preserves the API surface for drop-in compatibility.
 */
@RestController
@RequestMapping("/api/order")
public class OrderController {

    private static final Map<String, Object> MONGO_NOT_CONNECTED =
            Map.of("error", "MongoDB not connected");

    @PostMapping
    public ResponseEntity<Map<String, Object>> placeOrder(@RequestBody Map<String, Object> body) {
        return ResponseEntity.status(503).body(MONGO_NOT_CONNECTED);
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllOrders() {
        return ResponseEntity.status(503).body(MONGO_NOT_CONNECTED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getOrderById(@PathVariable String id) {
        return ResponseEntity.status(503).body(MONGO_NOT_CONNECTED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateOrder(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.status(503).body(MONGO_NOT_CONNECTED);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteOrder(@PathVariable String id) {
        return ResponseEntity.status(503).body(MONGO_NOT_CONNECTED);
    }
}
