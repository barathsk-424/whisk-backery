package com.thewhisk.bakery;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        // Load .env file if present (from parent directory or current)
        try {
            Dotenv dotenv = Dotenv.configure()
                    .directory("../backend")
                    .ignoreIfMissing()
                    .load();
            dotenv.entries().forEach(entry -> {
                if (System.getenv(entry.getKey()) == null) {
                    System.setProperty(entry.getKey(), entry.getValue());
                }
            });
        } catch (Exception e) {
            // .env not found — rely on environment variables or application.properties defaults
        }

        SpringApplication.run(BackendApplication.class, args);

        int port = Integer.parseInt(System.getProperty("server.port",
                System.getenv("PORT") != null ? System.getenv("PORT") : "5000"));
        System.out.println("\n🚀 ARTISAN BACKEND ONLINE → http://localhost:" + port);
        System.out.println("📦 MONITORING CHANNEL: cqdxnjhyoxqxofyhzgov.supabase.co\n");
    }
}
