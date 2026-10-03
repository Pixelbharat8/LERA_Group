package com.lera.connect_service.controller;

import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * useConnectStomp has always fetched GET /api/chat/ws-url, and the endpoint did not exist.
 * The hook does `if (!res.ok) return;`, so the 404 was silent: the socket was never opened,
 * chat quietly ran on its polling fallback, and WebRTC call signalling — which has no
 * fallback — went nowhere at all.
 */
class ChatWsUrlTest {

    // wsUrl reads only the request, so the injected collaborators are irrelevant here and
    // passing nulls keeps the test honest about what the method actually touches.
    private final ChatController controller =
            new ChatController(null, null, null, null, null);

    @SuppressWarnings("unchecked")
    private String url(MockHttpServletRequest req) {
        ResponseEntity<Map<String, String>> res = controller.wsUrl(req);
        assertEquals(200, res.getStatusCode().value());
        return res.getBody().get("url");
    }

    @Test
    void behindCaddyItReturnsAWssUrlOnThePublicHost() {
        // Caddy terminates TLS and proxies to the gateway over plain HTTP, so the request the
        // service sees is http:// — the scheme has to come from the forwarded header or every
        // browser would be told to open an insecure socket from an https page and refuse.
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setScheme("http");
        req.addHeader("Host", "gateway:8080");
        req.addHeader("X-Forwarded-Proto", "https");
        req.addHeader("X-Forwarded-Host", "app.leraacademy.edu.vn");

        assertEquals("wss://app.leraacademy.edu.vn/ws/chat", url(req));
    }

    @Test
    void inLocalDevelopmentItReturnsWsOnTheRequestHost() {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setScheme("http");
        req.addHeader("Host", "localhost");

        assertEquals("ws://localhost/ws/chat", url(req));
    }

    @Test
    void itTakesTheFirstHopWhenHeadersAreChained() {
        // X-Forwarded-* accumulate as "client, proxy1, proxy2"; the client's own value is first.
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("Host", "gateway:8080");
        req.addHeader("X-Forwarded-Proto", "https, http");
        req.addHeader("X-Forwarded-Host", "app.leraacademy.edu.vn, gateway:8080");

        assertEquals("wss://app.leraacademy.edu.vn/ws/chat", url(req));
    }

    @Test
    void theUrlNeverCarriesTheSessionToken() {
        // The handshake is same-origin, so the browser sends the HttpOnly `token` cookie and
        // JwtAuthenticationFilter reads it. Putting the JWT in the query string would make it
        // readable by JavaScript and loggable by every proxy on the path.
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("Host", "app.leraacademy.edu.vn");
        req.addHeader("X-Forwarded-Proto", "https");
        req.setCookies(new jakarta.servlet.http.Cookie("token", "a.real.jwt"));

        String out = url(req);
        assertFalse(out.contains("?"), "no query string at all: " + out);
        assertFalse(out.contains("a.real.jwt"));
        assertFalse(out.toLowerCase().contains("token"));
    }

    @Test
    void itRefusesRatherThanGuessWhenNoHostIsKnown() {
        ResponseEntity<Map<String, String>> res = controller.wsUrl(new MockHttpServletRequest());
        assertEquals(503, res.getStatusCode().value());
    }
}
