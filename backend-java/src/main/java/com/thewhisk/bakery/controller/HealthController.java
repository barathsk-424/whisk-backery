package com.thewhisk.bakery.controller;

import com.thewhisk.bakery.util.SupabaseClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class HealthController {

    @Autowired
    private SupabaseClient supabaseClient;

    /**
     * GET /
     * Returns health status including Supabase connectivity check.
     */
    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> health() {
        String supabaseStatus = "connected";

        try {
            // Check Supabase connection by counting products (head=true)
            supabaseClient.count("products", null, null);
        } catch (Exception e) {
            supabaseStatus = "error";
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "ok");
        response.put("message", "🍰 The Whisk Unified Java API is active!");
        response.put("supabase", supabaseStatus);
        response.put("timestamp", Instant.now().toString());

        return ResponseEntity.ok(response);
    }
}
