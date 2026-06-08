package com.lera.connect_service.service.messaging;

/**
 * A pluggable outbound messaging channel (Zalo, SMS, …). Implementations send only when
 * configured (provider credentials present); otherwise they report SKIPPED so the platform
 * still records the intent. Wiring a provider = filling in the credentials/endpoint config.
 */
public interface MessageChannel {

    /** ZALO | SMS | EMAIL */
    String name();

    /** True when provider credentials/endpoint are configured. */
    boolean isConfigured();

    SendResult send(String toPhone, String body);

    record SendResult(String status, String provider, String error) {
        public static SendResult skipped(String provider) { return new SendResult("SKIPPED", provider, "not configured"); }
        public static SendResult sent(String provider) { return new SendResult("SENT", provider, null); }
        public static SendResult failed(String provider, String error) { return new SendResult("FAILED", provider, error); }
    }
}
