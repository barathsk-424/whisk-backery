package com.thewhisk.bakery.controller;

import com.thewhisk.bakery.util.SupabaseClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

/**
 * InvoiceController — /api/invoices
 */
@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    @Autowired
    private SupabaseClient supabaseClient;

    @Value("${resend.api-key}")
    private String resendApiKey;

    // ─── Helpers ──────────────────────────────────────────────────────────

    private String generateInvoiceNumber() {
        int year = LocalDate.now().getYear();
        try {
            long count = supabaseClient.count("invoices",
                    "created_at=gte." + year + "-01-01T00:00:00Z", null);
            long nextNum = count + 1;
            return String.format("INV-%d-%04d", year, nextNum);
        } catch (Exception e) {
            System.err.println("[InvoiceNumber] Error: " + e.getMessage());
            int rand = new Random().nextInt(9000) + 1000;
            return String.format("INV-%d-%d", year, rand);
        }
    }

    private Map<String, Object> calculateGST(double total) {
        double subtotal = Math.round((total / 1.18) * 100.0) / 100.0;
        double totalGst = Math.round((total - subtotal) * 100.0) / 100.0;
        double cgst = Math.round((totalGst / 2) * 100.0) / 100.0;
        double sgst = Math.round((totalGst / 2) * 100.0) / 100.0;

        Map<String, Object> result = new HashMap<>();
        result.put("subtotal", subtotal);
        result.put("gst_amount", totalGst);
        result.put("cgst", cgst);
        result.put("sgst", sgst);
        result.put("total_amount", total);
        return result;
    }

    private Map<String, Object> extractDeliveryInfo(Map<String, Object> order) {
        if (order == null) return Map.of("phone", "", "address", "");

        Object detailsObj = order.get("delivery_details");
        if (detailsObj == null) detailsObj = order.get("address");

        String phone = order.get("phone") != null ? String.valueOf(order.get("phone")) : "";

        String formattedAddress = "";
        if (detailsObj instanceof String) {
            formattedAddress = (String) detailsObj;
        } else if (detailsObj instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> details = (Map<String, Object>) detailsObj;
            if (phone.isBlank() && details.get("phone") != null) {
                phone = String.valueOf(details.get("phone"));
            }
            List<String> parts = new ArrayList<>();
            addIfPresent(parts, details, "address");
            addIfPresent(parts, details, "line1");
            addIfPresent(parts, details, "city");
            addIfPresent(parts, details, "pincode");
            addIfPresent(parts, details, "zip");
            formattedAddress = String.join(", ", parts);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("phone", phone);
        result.put("address", formattedAddress);
        return result;
    }

    private void addIfPresent(List<String> parts, Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val != null && !String.valueOf(val).isBlank()) {
            parts.add(String.valueOf(val));
        }
    }

    private void sendInvoiceEmail(Map<String, Object> invoice, List<Object> items, Map<String, Object> gstData) {
        try {
            if (resendApiKey == null || "re_placeholder".equals(resendApiKey)) return;

            String customerEmail = (String) invoice.get("customer_email");
            if (customerEmail == null || customerEmail.isBlank()) return;

            String itemListHtml = buildItemListHtml(items);
            String emailHtml = buildEmailHtml(invoice, itemListHtml);

            Map<String, Object> emailBody = new HashMap<>();
            emailBody.put("from", "The Whisk <orders@resend.dev>");
            emailBody.put("to", customerEmail);
            emailBody.put("subject", "Your Invoice from The Whisk - " + invoice.get("invoice_id"));
            emailBody.put("html", emailHtml);

            supabaseClient.postExternal(
                    "https://api.resend.com/emails",
                    emailBody,
                    Map.of("Authorization", "Bearer " + resendApiKey)
            );
        } catch (Exception e) {
            System.err.println("[InvoiceEmail] Failed to send: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private String buildItemListHtml(List<Object> items) {
        if (items == null) return "";
        StringBuilder sb = new StringBuilder();
        for (Object itemObj : items) {
            if (itemObj instanceof Map) {
                Map<String, Object> item = (Map<String, Object>) itemObj;
                String name = item.get("name") != null
                        ? String.valueOf(item.get("name"))
                        : String.valueOf(item.getOrDefault("product_name", ""));
                Object priceObj = item.get("price");
                double price = priceObj != null ? ((Number) priceObj).doubleValue() : 0;
                Object qtyObj = item.get("quantity") != null ? item.get("quantity") : item.get("qty");
                int qty = qtyObj != null ? ((Number) qtyObj).intValue() : 1;

                sb.append("<tr>")
                  .append("<td style=\"padding: 12px; border-bottom: 1px solid #eee;\">").append(name).append("</td>")
                  .append("<td style=\"padding: 12px; border-bottom: 1px solid #eee; text-align: center;\">").append(qty).append("</td>")
                  .append("<td style=\"padding: 12px; border-bottom: 1px solid #eee; text-align: right;\">₹").append(price).append("</td>")
                  .append("<td style=\"padding: 12px; border-bottom: 1px solid #eee; text-align: right;\">₹")
                  .append(String.format("%.2f", price * qty)).append("</td>")
                  .append("</tr>");
            }
        }
        return sb.toString();
    }

    private String buildEmailHtml(Map<String, Object> invoice, String itemListHtml) {
        Object gstAmtObj = invoice.get("gst_amount");
        double gstAmt = gstAmtObj != null ? ((Number) gstAmtObj).doubleValue() : 0;
        String createdAt = invoice.get("created_at") != null ? String.valueOf(invoice.get("created_at")) : "";
        String dateStr = "";
        try {
            dateStr = createdAt.substring(0, 10);
        } catch (Exception e) {
            dateStr = LocalDate.now().toString();
        }

        return "        <div style=\"font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden; color: #333;\">\n"
                + "            <div style=\"background: #4A2A1A; padding: 30px; text-align: center;\">\n"
                + "                <h1 style=\"color: #FFF8E7; margin: 0; font-size: 24px; letter-spacing: 2px;\">THE WHISK BAKERY</h1>\n"
                + "                <p style=\"color: #F59E0B; margin: 5px 0 0; font-size: 12px; text-transform: uppercase; font-weight: bold;\">Artisan Goods &amp; Fine Pastries</p>\n"
                + "            </div>\n"
                + "            <div style=\"padding: 40px;\">\n"
                + "                <div style=\"display: flex; justify-content: space-between; margin-bottom: 30px;\">\n"
                + "                    <div>\n"
                + "                        <h2 style=\"margin: 0; color: #4A2A1A; font-size: 18px;\">INVOICE</h2>\n"
                + "                        <p style=\"margin: 5px 0; color: #666; font-size: 12px;\"># " + invoice.get("invoice_id") + "</p>\n"
                + "                    </div>\n"
                + "                    <div style=\"text-align: right;\">\n"
                + "                        <p style=\"margin: 0; font-size: 12px; color: #666;\">Date: " + dateStr + "</p>\n"
                + "                    </div>\n"
                + "                </div>\n"
                + "                <div style=\"margin-bottom: 30px; background: #fafafa; padding: 20px; border-radius: 8px;\">\n"
                + "                    <p style=\"margin: 0 0 10px; font-size: 10px; font-weight: bold; color: #999; text-transform: uppercase;\">Customer Details</p>\n"
                + "                    <p style=\"margin: 0; font-weight: bold; font-size: 14px;\">" + invoice.getOrDefault("customer_name", "") + "</p>\n"
                + "                    <p style=\"margin: 2px 0 0; color: #666; font-size: 12px;\">" + invoice.getOrDefault("customer_email", "") + "</p>\n"
                + "                </div>\n"
                + "                <table style=\"width: 100%; border-collapse: collapse; margin-bottom: 30px;\">\n"
                + "                    <thead>\n"
                + "                        <tr style=\"background: #fdfdfd;\">\n"
                + "                            <th style=\"padding: 12px; text-align: left; border-bottom: 2px solid #4A2A1A; font-size: 12px; text-transform: uppercase; color: #999;\">Item</th>\n"
                + "                            <th style=\"padding: 12px; text-align: center; border-bottom: 2px solid #4A2A1A; font-size: 12px; text-transform: uppercase; color: #999;\">Qty</th>\n"
                + "                            <th style=\"padding: 12px; text-align: right; border-bottom: 2px solid #4A2A1A; font-size: 12px; text-transform: uppercase; color: #999;\">Price</th>\n"
                + "                            <th style=\"padding: 12px; text-align: right; border-bottom: 2px solid #4A2A1A; font-size: 12px; text-transform: uppercase; color: #999;\">Total</th>\n"
                + "                        </tr>\n"
                + "                    </thead>\n"
                + "                    <tbody>\n"
                + itemListHtml
                + "                    </tbody>\n"
                + "                </table>\n"
                + "                <div style=\"margin-left: auto; width: 250px;\">\n"
                + "                    <div style=\"display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;\">\n"
                + "                        <span style=\"color: #666;\">Subtotal:</span>\n"
                + "                        <span style=\"font-weight: bold;\">₹" + invoice.getOrDefault("subtotal", 0) + "</span>\n"
                + "                    </div>\n"
                + "                    <div style=\"display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 11px; color: #888;\">\n"
                + "                        <span>CGST (9%):</span>\n"
                + "                        <span>₹" + String.format("%.2f", gstAmt / 2) + "</span>\n"
                + "                    </div>\n"
                + "                    <div style=\"display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 11px; color: #888;\">\n"
                + "                        <span>SGST (9%):</span>\n"
                + "                        <span>₹" + String.format("%.2f", gstAmt / 2) + "</span>\n"
                + "                    </div>\n"
                + "                    <div style=\"display: flex; justify-content: space-between; padding-top: 15px; border-top: 2px solid #eee;\">\n"
                + "                        <span style=\"font-weight: bold; color: #4A2A1A;\">Total Amount:</span>\n"
                + "                        <span style=\"font-weight: bold; color: #FF6B35; font-size: 18px;\">₹" + invoice.getOrDefault("total_amount", 0) + "</span>\n"
                + "                    </div>\n"
                + "                </div>\n"
                + "            </div>\n"
                + "            <div style=\"background: #fdfdfd; padding: 20px; text-align: center; border-top: 1px solid #f0f0f0;\">\n"
                + "                <p style=\"margin: 0; font-size: 11px; color: #999;\">GSTIN: 29AAAAA0000A1Z5 | FSSAI: 12345678901234</p>\n"
                + "                <p style=\"margin: 5px 0 0; font-size: 11px; color: #999;\">Thank you for choosing The Whisk Bakery!</p>\n"
                + "            </div>\n"
                + "        </div>\n";
    }

    // ─── POST /api/invoices/generate ──────────────────────────────────────
    @PostMapping("/generate")
    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, Object>> generateInvoice(@RequestBody Map<String, Object> body) {
        String orderId = (String) body.get("order_id");
        Object totalAmountObj = body.get("total_amount");

        if (orderId == null || totalAmountObj == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "error", "Missing required order details"));
        }

        try {
            // Check if invoice already exists
            Map<String, Object> existing = supabaseClient.maybeSingle(
                    "invoices", "order_id=eq." + orderId, null);
            if (existing != null) {
                return ResponseEntity.ok(Map.of("success", true, "invoice", existing));
            }

            double totalAmount = ((Number) totalAmountObj).doubleValue();
            String invoiceIdFormatted = generateInvoiceNumber();
            Map<String, Object> gstData = calculateGST(totalAmount);

            Map<String, Object> invoice = new HashMap<>();
            invoice.put("invoice_id", invoiceIdFormatted);
            invoice.put("order_id", orderId);
            invoice.put("user_id", body.get("user_id"));
            invoice.put("customer_name", body.get("customer_name"));
            invoice.put("customer_email", body.get("customer_email"));
            invoice.put("total_amount", gstData.get("total_amount"));
            invoice.put("subtotal", gstData.get("subtotal"));
            invoice.put("gst_amount", gstData.get("gst_amount"));
            invoice.put("status", "Generated");
            invoice.put("items", body.getOrDefault("items", List.of()));
            invoice.put("customer_phone", body.getOrDefault("customer_phone", ""));
            invoice.put("customer_address", body.getOrDefault("customer_address", ""));
            invoice.put("payment_method", body.getOrDefault("payment_method", "Online"));
            invoice.put("delivery_slot", body.getOrDefault("delivery_slot", "Standard"));

            Map<String, Object> data = supabaseClient.insert("invoices", invoice, null);

            // Send email if configured
            String customerEmail = (String) body.get("customer_email");
            if (customerEmail != null && !customerEmail.isBlank()
                    && resendApiKey != null && !"re_placeholder".equals(resendApiKey)) {
                List<Object> items = body.get("items") instanceof List ? (List<Object>) body.get("items") : List.of();
                sendInvoiceEmail(data, items, gstData);
            }

            return ResponseEntity.ok(Map.of("success", true, "invoice", data));
        } catch (Exception e) {
            System.err.println("[InvoiceGenerate] Error: " + e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // ─── GET /api/invoices/order/:order_id ────────────────────────────────
    @GetMapping("/order/{order_id}")
    public ResponseEntity<Map<String, Object>> getInvoiceByOrder(@PathVariable("order_id") String orderId) {
        try {
            Map<String, Object> existing = supabaseClient.maybeSingle(
                    "invoices", "order_id=eq." + orderId, null);

            if (existing != null) {
                return ResponseEntity.ok(Map.of("success", true, "invoice", existing));
            }

            // Auto-generate from order
            Map<String, Object> order = supabaseClient.single("orders", "id=eq." + orderId, null);

            double total = order.get("total_price") != null
                    ? ((Number) order.get("total_price")).doubleValue() : 0;
            Map<String, Object> gstData = calculateGST(total);
            String invoiceIdFormatted = generateInvoiceNumber();
            Map<String, Object> deliveryInfo = extractDeliveryInfo(order);

            Map<String, Object> newInvoice = new HashMap<>();
            newInvoice.put("invoice_id", invoiceIdFormatted);
            newInvoice.put("order_id", order.get("id"));
            newInvoice.put("user_id", order.get("user_id"));
            newInvoice.put("customer_name", order.getOrDefault("customer_name", "Artisan Guest"));
            newInvoice.put("customer_email", order.getOrDefault("user_email", "guest@thewhisk.com"));
            newInvoice.put("total_amount", gstData.get("total_amount"));
            newInvoice.put("subtotal", gstData.get("subtotal"));
            newInvoice.put("gst_amount", gstData.get("gst_amount"));
            newInvoice.put("status", "Paid");
            newInvoice.put("shop_name", "The Whisk Bakery");
            newInvoice.put("shop_address", "Mannivakkam, Chennai, Tamil Nadu, 614001, India");
            newInvoice.put("shop_gstin", "29AAAAA0000A1Z5");
            newInvoice.put("items", order.getOrDefault("items", List.of()));
            newInvoice.put("customer_phone", deliveryInfo.get("phone"));
            newInvoice.put("customer_address", deliveryInfo.get("address"));
            newInvoice.put("payment_method", order.getOrDefault("payment_method", "Online"));
            newInvoice.put("delivery_slot", order.getOrDefault("delivery_time", "Standard"));

            Map<String, Object> created = supabaseClient.insert("invoices", newInvoice, null);
            return ResponseEntity.ok(Map.of("success", true, "invoice", created));

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // ─── GET /api/invoices/all ─────────────────────────────────────────────
    @GetMapping("/all")
    public ResponseEntity<Map<String, Object>> getAllInvoices() {
        try {
            List<Map<String, Object>> invoices = supabaseClient.select(
                    "invoices", "order=created_at.desc", null);
            return ResponseEntity.ok(Map.of("success", true, "invoices", invoices));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // ─── PUT /api/invoices/:id ─────────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateInvoice(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        try {
            // Update all fields from body
            Map<String, Object> data = supabaseClient.update("invoices", body, "id", id, null);
            return ResponseEntity.ok(Map.of("success", true, "invoice", data));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
