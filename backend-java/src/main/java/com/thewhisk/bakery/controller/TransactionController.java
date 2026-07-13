package com.thewhisk.bakery.controller;

import com.thewhisk.bakery.util.SupabaseClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * TransactionController — handles both:
 *   - Root-level /api/transactions routes (from server.js)
 *   - Router-level /api/transactions routes (from routes/transactions.js)
 *
 * These are mapped to the same paths, using the same methods.
 * The dedicated router routes have slightly stricter validation and different response wrapping.
 *
 * Since both sets hit the same paths, we consolidate them here and handle both
 * behaviors by checking the Accept header or simply applying the combined logic.
 * The router (routes/transactions.js) behavior is given priority as it is more complete.
 */
@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

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
        if (getCurrentUser() == null) {
            return ResponseEntity.status(401).body(Map.of("message", "No token provided"));
        }
        return null;
    }

    // ─── GET /api/transactions ─────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<Map<String, Object>> getTransactions(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(value = "sort_by", defaultValue = "date") String sortBy,
            @RequestParam(defaultValue = "desc") String order) {

        ResponseEntity<Map<String, Object>> authCheck = requireAuth();
        if (authCheck != null) return authCheck;

        Map<String, Object> user = getCurrentUser();
        boolean isAdmin = "admin".equals(user.get("role"));

        try {
            // Build query
            StringBuilder query = new StringBuilder();

            if (type != null && !type.isBlank()) {
                if (query.length() > 0) query.append("&");
                query.append("type=eq.").append(type);
            }
            if (category != null && !category.isBlank()) {
                if (query.length() > 0) query.append("&");
                query.append("category=eq.").append(category);
            }
            if (search != null && !search.isBlank()) {
                if (query.length() > 0) query.append("&");
                query.append("title=ilike.*").append(search).append("*");
            }

            // Sort
            List<String> validCols = List.of("date", "amount", "created_at");
            String sortCol = validCols.contains(sortBy) ? sortBy : "date";
            if (query.length() > 0) query.append("&");
            query.append("order=").append(sortCol).append(".").append("asc".equals(order) ? "asc" : "desc");

            List<Map<String, Object>> data = supabaseClient.select("transactions", query.toString(), null);

            // Filter if not admin (from server.js behavior)
            if (!isAdmin) {
                String userEmail = (String) user.get("email");
                List<Map<String, Object>> filtered = new ArrayList<>();
                for (Map<String, Object> t : data) {
                    String tEmail = t.get("user_email") != null ? String.valueOf(t.get("user_email")) : null;
                    if (userEmail.equals(tEmail) || t.get("user_id") == null) {
                        filtered.add(t);
                    }
                }
                data = filtered;
            }

            // Compute summary
            double income = 0, expense = 0;
            for (Map<String, Object> t : data) {
                Object amtObj = t.get("amount");
                double amt = amtObj != null ? ((Number) amtObj).doubleValue() : 0;
                String tType = t.get("type") != null ? String.valueOf(t.get("type")) : "";
                if ("income".equals(tType)) income += amt;
                else if ("expense".equals(tType)) expense += amt;
            }

            Map<String, Object> summary = new LinkedHashMap<>();
            summary.put("income", income);
            summary.put("expense", expense);
            summary.put("balance", income - expense);
            summary.put("count", data.size());

            return ResponseEntity.ok(Map.of("transactions", data, "summary", summary));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Finance ledger unreachable."));
        }
    }

    // ─── POST /api/transactions ────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<Map<String, Object>> createTransaction(@RequestBody Map<String, Object> body) {
        ResponseEntity<Map<String, Object>> authCheck = requireAuth();
        if (authCheck != null) return authCheck;

        Map<String, Object> user = getCurrentUser();

        String title = (String) body.get("title");
        Object amountObj = body.get("amount");
        String type = (String) body.get("type");

        // Validation (from routes/transactions.js)
        if (title == null || title.isBlank() || amountObj == null || type == null || type.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "title, amount, and type are required"));
        }
        if (!List.of("income", "expense").contains(type)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "type must be \"income\" or \"expense\""));
        }
        double amount = ((Number) amountObj).doubleValue();
        if (amount <= 0) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "amount must be greater than 0"));
        }

        try {
            Map<String, Object> record = new HashMap<>();
            record.put("title", title.trim());
            record.put("amount", amount);
            record.put("type", type);
            record.put("category", body.getOrDefault("category", "Other"));
            record.put("date", body.get("date") != null ? body.get("date")
                    : new java.sql.Date(System.currentTimeMillis()).toString());
            record.put("note", body.getOrDefault("note", ""));
            record.put("user_email", user.get("email"));

            Map<String, Object> data = supabaseClient.insert("transactions", record, null);
            // Return wrapped in "transaction" key (routes/transactions.js behavior)
            return ResponseEntity.status(201).body(Map.of("transaction", data));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Failed to record transaction."));
        }
    }

    // ─── PUT /api/transactions/:id ─────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateTransaction(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {

        ResponseEntity<Map<String, Object>> authCheck = requireAuth();
        if (authCheck != null) return authCheck;

        try {
            // Partial updates only (routes/transactions.js behavior)
            Map<String, Object> updates = new HashMap<>();
            if (body.containsKey("title") && body.get("title") != null)
                updates.put("title", body.get("title").toString().trim());
            if (body.containsKey("amount") && body.get("amount") != null)
                updates.put("amount", ((Number) body.get("amount")).doubleValue());
            if (body.containsKey("type") && body.get("type") != null)
                updates.put("type", body.get("type"));
            if (body.containsKey("category") && body.get("category") != null)
                updates.put("category", body.get("category"));
            if (body.containsKey("date") && body.get("date") != null)
                updates.put("date", body.get("date"));
            if (body.containsKey("note") && body.get("note") != null)
                updates.put("note", body.get("note"));

            // Validate type if present
            if (updates.containsKey("type") && !List.of("income", "expense").contains(updates.get("type"))) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "type must be \"income\" or \"expense\""));
            }
            if (updates.containsKey("amount") && ((Number) updates.get("amount")).doubleValue() <= 0) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "amount must be greater than 0"));
            }

            Map<String, Object> data = supabaseClient.update("transactions", updates, "id", id, null);
            return ResponseEntity.ok(Map.of("transaction", data));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Failed to calibrate transaction record."));
        }
    }

    // ─── DELETE /api/transactions/:id ──────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteTransaction(@PathVariable String id) {
        ResponseEntity<Map<String, Object>> authCheck = requireAuth();
        if (authCheck != null) return authCheck;

        try {
            supabaseClient.delete("transactions", "id", id, null);
            // Return routes/transactions.js format
            return ResponseEntity.ok(Map.of("success", true, "message", "Transaction deleted"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Purge sequence failed."));
        }
    }
}
