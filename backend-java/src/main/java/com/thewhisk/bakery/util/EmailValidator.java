package com.thewhisk.bakery.util;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

@Component
public class EmailValidator {

    private static final Set<String> DISPOSABLE_DOMAINS = Set.of(
            "mailinator.com",
            "tempmail.com",
            "guerrillamail.com",
            "10minutemail.com",
            "yopmail.com",
            "throwawaymail.com",
            "sharklasers.com",
            "getnada.com",
            "dispostable.com",
            "trashmail.com",
            "maildrop.cc"
    );

    private static final Pattern EMAIL_REGEX =
            Pattern.compile("^[a-zA-Z0-9._%+\\-]+@([a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,})$");

    /**
     * Returns {"valid": true} or {"valid": false, "message": "..."}
     */
    public Map<String, Object> validate(String email) {
        if (email == null || email.isBlank()) {
            return Map.of("valid", false, "message", "Please provide a valid artisan email format.");
        }

        var matcher = EMAIL_REGEX.matcher(email);
        if (!matcher.matches()) {
            return Map.of("valid", false, "message", "Please provide a valid artisan email format.");
        }

        String domain = matcher.group(1).toLowerCase();
        if (DISPOSABLE_DOMAINS.contains(domain)) {
            return Map.of("valid", false,
                    "message", "Disposable artisan identities are not permitted for registry.");
        }

        return Map.of("valid", true);
    }

    public boolean isValid(String email) {
        return (boolean) validate(email).get("valid");
    }
}
