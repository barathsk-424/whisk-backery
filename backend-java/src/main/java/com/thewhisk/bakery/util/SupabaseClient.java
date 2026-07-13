package com.thewhisk.bakery.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.thewhisk.bakery.config.SupabaseConfig;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Component
public class SupabaseClient {

    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    @Autowired
    private SupabaseConfig config;

    @Autowired
    private OkHttpClient httpClient;

    @Autowired
    private ObjectMapper objectMapper;

    // ─────────────────────────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────────────────────────

    private String effectiveToken(String token) {
        return (token != null && !token.isBlank()) ? token : config.getSupabaseAnonKey();
    }

    private String restUrl(String table) {
        return config.getSupabaseUrl() + "/rest/v1/" + table;
    }

    private Request.Builder baseBuilder(String token) {
        String bearer = effectiveToken(token);
        return new Request.Builder()
                .header("apikey", config.getSupabaseAnonKey())
                .header("Authorization", "Bearer " + bearer)
                .header("Content-Type", "application/json")
                .header("Prefer", "return=representation");
    }

    private List<Map<String, Object>> executeList(Request request) throws IOException {
        try (Response response = httpClient.newCall(request).execute()) {
            String body = response.body() != null ? response.body().string() : "[]";
            if (!response.isSuccessful()) {
                throw new IOException("Supabase error " + response.code() + ": " + body);
            }
            if (body == null || body.isBlank() || body.equals("null")) {
                return Collections.emptyList();
            }
            // Handle both array and single object responses
            if (body.trim().startsWith("[")) {
                return objectMapper.readValue(body, new TypeReference<List<Map<String, Object>>>() {});
            } else {
                Map<String, Object> single = objectMapper.readValue(body, new TypeReference<Map<String, Object>>() {});
                return Collections.singletonList(single);
            }
        }
    }

    private Map<String, Object> executeSingle(Request request) throws IOException {
        try (Response response = httpClient.newCall(request).execute()) {
            String body = response.body() != null ? response.body().string() : "{}";
            if (!response.isSuccessful()) {
                throw new IOException("Supabase error " + response.code() + ": " + body);
            }
            if (body == null || body.isBlank() || body.equals("null")) {
                return Collections.emptyMap();
            }
            if (body.trim().startsWith("[")) {
                List<Map<String, Object>> list = objectMapper.readValue(body, new TypeReference<List<Map<String, Object>>>() {});
                return list.isEmpty() ? Collections.emptyMap() : list.get(0);
            }
            return objectMapper.readValue(body, new TypeReference<Map<String, Object>>() {});
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // SELECT — GET /rest/v1/{table}?select=*&{extraQuery}
    // ─────────────────────────────────────────────────────────────────

    public List<Map<String, Object>> select(String table, String query, String token) throws IOException {
        String url = restUrl(table) + "?select=*" + (query != null && !query.isBlank() ? "&" + query : "");
        Request request = baseBuilder(token).url(url).get().build();
        return executeList(request);
    }

    /** Overload: no extra query params */
    public List<Map<String, Object>> select(String table, String token) throws IOException {
        return select(table, null, token);
    }

    // ─────────────────────────────────────────────────────────────────
    // SELECT with custom select clause
    // ─────────────────────────────────────────────────────────────────

    public List<Map<String, Object>> selectColumns(String table, String columns, String query, String token) throws IOException {
        String url = restUrl(table) + "?select=" + columns + (query != null && !query.isBlank() ? "&" + query : "");
        Request request = baseBuilder(token).url(url).get().build();
        return executeList(request);
    }

    // ─────────────────────────────────────────────────────────────────
    // MAYBE SINGLE — fetch list and return first or null
    // ─────────────────────────────────────────────────────────────────

    public Map<String, Object> maybeSingle(String table, String query, String token) throws IOException {
        List<Map<String, Object>> list = select(table, query, token);
        return list.isEmpty() ? null : list.get(0);
    }

    // ─────────────────────────────────────────────────────────────────
    // SINGLE — fetch list and return first, throw if empty
    // ─────────────────────────────────────────────────────────────────

    public Map<String, Object> single(String table, String query, String token) throws IOException {
        List<Map<String, Object>> list = select(table, query, token);
        if (list.isEmpty()) {
            throw new IOException("No rows found in table: " + table);
        }
        return list.get(0);
    }

    // ─────────────────────────────────────────────────────────────────
    // INSERT — POST /rest/v1/{table} with Prefer: return=representation
    // ─────────────────────────────────────────────────────────────────

    public Map<String, Object> insert(String table, Object body, String token) throws IOException {
        String json = objectMapper.writeValueAsString(body);
        RequestBody requestBody = RequestBody.create(json, JSON);
        Request request = baseBuilder(token).url(restUrl(table)).post(requestBody).build();
        return executeSingle(request);
    }

    public List<Map<String, Object>> insertMany(String table, Object body, String token) throws IOException {
        String json = objectMapper.writeValueAsString(body);
        RequestBody requestBody = RequestBody.create(json, JSON);
        Request request = baseBuilder(token).url(restUrl(table)).post(requestBody).build();
        return executeList(request);
    }

    // ─────────────────────────────────────────────────────────────────
    // UPDATE — PATCH /rest/v1/{table}?{filterCol}=eq.{filterVal}
    // ─────────────────────────────────────────────────────────────────

    public Map<String, Object> update(String table, Object body, String filterCol, Object filterVal, String token) throws IOException {
        String url = restUrl(table) + "?" + filterCol + "=eq." + filterVal;
        String json = objectMapper.writeValueAsString(body);
        RequestBody requestBody = RequestBody.create(json, JSON);
        Request request = baseBuilder(token).url(url).patch(requestBody).build();
        return executeSingle(request);
    }

    /** Update with multiple filter conditions */
    public Map<String, Object> updateMultiFilter(String table, Object body, String filterQuery, String token) throws IOException {
        String url = restUrl(table) + "?" + filterQuery;
        String json = objectMapper.writeValueAsString(body);
        RequestBody requestBody = RequestBody.create(json, JSON);
        Request request = baseBuilder(token).url(url).patch(requestBody).build();
        return executeSingle(request);
    }

    // ─────────────────────────────────────────────────────────────────
    // DELETE — DELETE /rest/v1/{table}?{filterCol}=eq.{filterVal}
    // ─────────────────────────────────────────────────────────────────

    public void delete(String table, String filterCol, Object filterVal, String token) throws IOException {
        String url = restUrl(table) + "?" + filterCol + "=eq." + filterVal;
        Request request = baseBuilder(token).url(url).delete().build();
        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String body = response.body() != null ? response.body().string() : "";
                throw new IOException("Supabase delete error " + response.code() + ": " + body);
            }
        }
    }

    /** Delete with multiple filter conditions */
    public void deleteMultiFilter(String table, String filterQuery, String token) throws IOException {
        String url = restUrl(table) + "?" + filterQuery;
        Request request = baseBuilder(token).url(url).delete().build();
        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String body = response.body() != null ? response.body().string() : "";
                throw new IOException("Supabase delete error " + response.code() + ": " + body);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // COUNT — GET with Prefer: count=exact, head=true
    // ─────────────────────────────────────────────────────────────────

    public long count(String table, String query, String token) throws IOException {
        String url = restUrl(table) + "?select=*" + (query != null && !query.isBlank() ? "&" + query : "");
        String bearer = effectiveToken(token);
        Request request = new Request.Builder()
                .url(url)
                .header("apikey", config.getSupabaseAnonKey())
                .header("Authorization", "Bearer " + bearer)
                .header("Content-Type", "application/json")
                .header("Prefer", "count=exact")
                .head()
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            String contentRange = response.header("Content-Range");
            if (contentRange != null && contentRange.contains("/")) {
                String total = contentRange.split("/")[1];
                if (!total.equals("*")) {
                    return Long.parseLong(total);
                }
            }
            return 0L;
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // AUTH ENDPOINTS — Supabase /auth/v1/...
    // ─────────────────────────────────────────────────────────────────

    public Map<String, Object> authSignup(String email, String password, String fullName) throws IOException {
        Map<String, Object> body = Map.of(
                "email", email,
                "password", password,
                "data", Map.of("full_name", fullName)
        );
        String json = objectMapper.writeValueAsString(body);
        RequestBody requestBody = RequestBody.create(json, JSON);
        Request request = new Request.Builder()
                .url(config.getSupabaseUrl() + "/auth/v1/signup")
                .header("apikey", config.getSupabaseAnonKey())
                .header("Authorization", "Bearer " + config.getSupabaseAnonKey())
                .header("Content-Type", "application/json")
                .post(requestBody)
                .build();
        return executeSingle(request);
    }

    public Map<String, Object> authLogin(String email, String password) throws IOException {
        Map<String, Object> body = Map.of("email", email, "password", password);
        String json = objectMapper.writeValueAsString(body);
        RequestBody requestBody = RequestBody.create(json, JSON);
        Request request = new Request.Builder()
                .url(config.getSupabaseUrl() + "/auth/v1/token?grant_type=password")
                .header("apikey", config.getSupabaseAnonKey())
                .header("Authorization", "Bearer " + config.getSupabaseAnonKey())
                .header("Content-Type", "application/json")
                .post(requestBody)
                .build();
        return executeSingle(request);
    }

    public void authRecover(String email) throws IOException {
        Map<String, Object> body = Map.of("email", email);
        String json = objectMapper.writeValueAsString(body);
        RequestBody requestBody = RequestBody.create(json, JSON);
        Request request = new Request.Builder()
                .url(config.getSupabaseUrl() + "/auth/v1/recover")
                .header("apikey", config.getSupabaseAnonKey())
                .header("Authorization", "Bearer " + config.getSupabaseAnonKey())
                .header("Content-Type", "application/json")
                .post(requestBody)
                .build();
        try (Response response = httpClient.newCall(request).execute()) {
            // Consume body to release resources
            if (response.body() != null) response.body().close();
        }
    }

    public Map<String, Object> authUpdateUser(String userToken, String newPassword) throws IOException {
        Map<String, Object> body = Map.of("password", newPassword);
        String json = objectMapper.writeValueAsString(body);
        RequestBody requestBody = RequestBody.create(json, JSON);
        Request request = new Request.Builder()
                .url(config.getSupabaseUrl() + "/auth/v1/user")
                .header("apikey", config.getSupabaseAnonKey())
                .header("Authorization", "Bearer " + userToken)
                .header("Content-Type", "application/json")
                .put(requestBody)
                .build();
        return executeSingle(request);
    }

    // ─────────────────────────────────────────────────────────────────
    // GENERIC HTTP — for Resend and other external calls
    // ─────────────────────────────────────────────────────────────────

    public Map<String, Object> postExternal(String url, Map<String, Object> body, Map<String, String> headers) throws IOException {
        String json = objectMapper.writeValueAsString(body);
        RequestBody requestBody = RequestBody.create(json, JSON);
        Request.Builder builder = new Request.Builder().url(url).post(requestBody);
        headers.forEach(builder::header);
        return executeSingle(builder.build());
    }
}
