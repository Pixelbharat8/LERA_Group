package com.lera.connect_service.service.push;

/**
 * Outcome of a single APNs / FCM call. We split the "failed" bucket so the
 * dispatcher knows whether to keep the token (transient failure — try again
 * next time) or delete it (the device uninstalled the app, the token rotated,
 * etc.; the provider will keep returning the same error forever otherwise).
 */
public enum PushResult {
    /** Provider accepted the message. */
    DELIVERED,
    /** Transient failure — network blip, 5xx, throttling. Token kept. */
    RETRY,
    /** Permanent failure — token is dead. Caller MUST delete the row. */
    DEAD
}
