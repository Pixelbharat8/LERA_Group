package com.lera.ai_gateway.controller;

import com.lera.ai_gateway.security.AiGatewaySecurity;
import com.lera.ai_gateway.security.AuthUser;
import com.lera.ai_gateway.service.VideoConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * AI video-generation gateway. Same "add your own API" model as {@link AiController}: the Chairman
 * sets a provider + key in Super Admin → AI Gateway (persisted to system_settings). There is no
 * free/local renderer — {@code /generate} returns a clear 400 until a provider is configured.
 *
 * The render call is a best-effort generic REST passthrough (POST body + Bearer key). Providers
 * differ, so once a specific provider is chosen the request/response mapping is finalised for it.
 */
@RestController
@RequestMapping("/api/ai/video")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class VideoController {

    private final VideoConfigService videoConfig;
    private final RestTemplate restTemplate;

    /** Provider config (admin). The key is never returned — only whether one is set + last 4 chars. */
    @GetMapping("/config")
    public ResponseEntity<?> getConfig(@AuthenticationPrincipal AuthUser authUser) {
        AiGatewaySecurity.assertOrgWide(authUser);
        VideoConfigService.VideoSettings s = videoConfig.resolve();
        String key = s.apiKey() == null ? "" : s.apiKey();
        Map<String, Object> body = new HashMap<>();
        body.put("provider", s.provider());
        body.put("baseUrl", s.baseUrl());
        body.put("model", s.model());
        body.put("costPerRender", s.costPerRender());
        body.put("configured", s.configured());
        body.put("keyHint", key.length() >= 4 ? "•••• " + key.substring(key.length() - 4) : "");
        return ResponseEntity.ok(body);
    }

    /** Set the video provider / key / url / model / cost (admin). Persists to system_settings. */
    @PutMapping("/config")
    public ResponseEntity<?> setConfig(@RequestBody Map<String, Object> req,
                                       @AuthenticationPrincipal AuthUser authUser) {
        AiGatewaySecurity.assertOrgWide(authUser);
        videoConfig.save(
                (String) req.get("provider"),
                (String) req.get("apiKey"),
                (String) req.get("baseUrl"),
                (String) req.get("model"),
                req.get("costPerRender") == null ? null : String.valueOf(req.get("costPerRender")));
        VideoConfigService.VideoSettings s = videoConfig.resolve();
        return ResponseEntity.ok(Map.of("success", true, "provider", s.provider(), "configured", s.configured()));
    }

    /** Lightweight status any authenticated caller can read (drives the Studio UI). */
    @GetMapping("/status")
    public ResponseEntity<?> status() {
        VideoConfigService.VideoSettings s = videoConfig.resolve();
        Map<String, Object> body = new HashMap<>();
        body.put("configured", s.configured());
        body.put("provider", s.provider());
        body.put("costPerRender", s.costPerRender());
        return ResponseEntity.ok(body);
    }

    /**
     * Submit a render job. Body: {@code {prompt, images:[url], template, caption, aspectRatio}}.
     * Returns the provider's job payload (best-effort passthrough), or a clear 400 when no provider
     * is configured. Actual per-render billing is the provider's — {@code costPerRender} is shown to
     * the operator before they confirm.
     */
    @PostMapping("/generate")
    public ResponseEntity<?> generate(@RequestBody Map<String, Object> req,
                                      @AuthenticationPrincipal AuthUser authUser) {
        // Authentication is guaranteed by the class-level @PreAuthorize("isAuthenticated()").
        VideoConfigService.VideoSettings s = videoConfig.resolve();
        if (!s.configured()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "configured", false,
                    "error", "No video provider is configured. Add a provider + API key in "
                            + "Super Admin → AI Gateway → Video Generation."));
        }
        try {
            Map<String, Object> payload = new HashMap<>(req);
            if (s.model() != null && !s.model().isBlank()) payload.putIfAbsent("model", s.model());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(s.apiKey());

            @SuppressWarnings("unchecked")
            ResponseEntity<Map> resp = restTemplate.exchange(
                    s.baseUrl(), HttpMethod.POST, new HttpEntity<>(payload, headers), Map.class);
            Map<String, Object> out = new HashMap<>();
            out.put("success", true);
            out.put("provider", s.provider());
            out.put("costPerRender", s.costPerRender());
            out.put("result", resp.getBody());
            return ResponseEntity.ok(out);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of(
                    "success", false,
                    "error", "Video provider call failed: " + e.getMessage()));
        }
    }
}
