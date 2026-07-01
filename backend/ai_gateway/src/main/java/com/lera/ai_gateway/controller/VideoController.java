package com.lera.ai_gateway.controller;

import com.lera.ai_gateway.entity.VideoRequest;
import com.lera.ai_gateway.repository.VideoRequestRepository;
import com.lera.ai_gateway.security.AiGatewaySecurity;
import com.lera.ai_gateway.security.AuthUser;
import com.lera.ai_gateway.service.VideoConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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
    private final VideoRequestRepository videoRequests;

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
        // Direct render (spends provider money) is STAFF-only. Students/customers must go through
        // /requests → staff approval, so they can never trigger a paid render on their own.
        AiGatewaySecurity.assertStaff(authUser);
        VideoConfigService.VideoSettings s = videoConfig.resolve();
        if (!s.configured()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "configured", false,
                    "error", "No video provider is configured. Add a provider + API key in "
                            + "Super Admin → AI Gateway → Video Generation."));
        }
        try {
            Map<String, Object> result = callProvider(s, req);
            Map<String, Object> out = new HashMap<>();
            out.put("success", true);
            out.put("provider", s.provider());
            out.put("costPerRender", s.costPerRender());
            out.put("result", result);
            return ResponseEntity.ok(out);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of(
                    "success", false,
                    "error", "Video provider call failed: " + e.getMessage()));
        }
    }

    /** Best-effort generic REST render call (POST body + Bearer key). Provider-agnostic. */
    @SuppressWarnings("unchecked")
    private Map<String, Object> callProvider(VideoConfigService.VideoSettings s, Map<String, Object> req) {
        Map<String, Object> payload = new HashMap<>(req);
        if (s.model() != null && !s.model().isBlank()) payload.putIfAbsent("model", s.model());
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(s.apiKey());
        ResponseEntity<Map> resp = restTemplate.exchange(
                s.baseUrl(), HttpMethod.POST, new HttpEntity<>(payload, headers), Map.class);
        return resp.getBody();
    }

    /** Pull a likely video URL out of a provider response (common field names). */
    private static String extractUrl(Map<String, Object> r) {
        if (r == null) return null;
        for (String k : List.of("url", "videoUrl", "video_url", "output", "outputUrl", "downloadUrl", "resultUrl")) {
            Object v = r.get(k);
            if (v instanceof String str && str.startsWith("http")) return str;
        }
        return null;
    }

    // ---- Request queue: students/customers request, marketing approves & renders (cost guard) ----

    /** Anyone authenticated (incl. students) may REQUEST a video. Never triggers a paid render. */
    @PostMapping("/requests")
    public ResponseEntity<?> createRequest(@RequestBody Map<String, Object> req,
                                           @AuthenticationPrincipal AuthUser authUser) {
        String prompt = req.get("prompt") == null ? "" : req.get("prompt").toString().trim();
        if (prompt.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "A prompt/brief is required."));
        }
        VideoRequest vr = new VideoRequest();
        vr.setRequesterId(authUser != null ? authUser.getUserId() : null);
        vr.setRequesterLabel(authUser != null ? authUser.getEmail() : null);
        vr.setPrompt(prompt);
        Object imgs = req.get("images");
        if (imgs instanceof List<?> list) {
            vr.setImages(String.join("\n", list.stream().map(String::valueOf).toList()));
        } else if (imgs != null) {
            vr.setImages(imgs.toString());
        }
        vr.setAspectRatio(req.get("aspectRatio") == null ? "9:16" : req.get("aspectRatio").toString());
        vr.setStatus("PENDING");
        return ResponseEntity.ok(videoRequests.save(vr));
    }

    /** Staff (marketing/manager) see all requests; anyone else sees only their own. */
    @GetMapping("/requests")
    public ResponseEntity<?> listRequests(@RequestParam(required = false) String status,
                                          @AuthenticationPrincipal AuthUser authUser) {
        if (AiGatewaySecurity.isAcademyStaff(authUser)) {
            List<VideoRequest> all = (status != null && !status.isBlank())
                    ? videoRequests.findByStatusOrderByCreatedAtDesc(status.toUpperCase())
                    : videoRequests.findAllByOrderByCreatedAtDesc();
            return ResponseEntity.ok(all);
        }
        UUID uid = authUser != null ? authUser.getUserId() : null;
        return ResponseEntity.ok(uid == null ? List.of() : videoRequests.findByRequesterIdOrderByCreatedAtDesc(uid));
    }

    /** Staff approve → the (paid) render is triggered here, never by the requester. */
    @PostMapping("/requests/{id}/approve")
    public ResponseEntity<?> approveRequest(@PathVariable UUID id, @AuthenticationPrincipal AuthUser authUser) {
        AiGatewaySecurity.assertStaff(authUser);
        VideoRequest vr = videoRequests.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));
        VideoConfigService.VideoSettings s = videoConfig.resolve();
        if (!s.configured()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "error", "No video provider configured — set one in Super Admin → AI Gateway before approving."));
        }
        vr.setDecidedBy(authUser.getUserId());
        vr.setDecidedAt(LocalDateTime.now());
        try {
            Map<String, Object> req = new HashMap<>();
            req.put("prompt", vr.getPrompt());
            if (vr.getImages() != null && !vr.getImages().isBlank()) {
                req.put("images", Arrays.stream(vr.getImages().split("\\n")).filter(x -> !x.isBlank()).toList());
            }
            req.put("aspectRatio", vr.getAspectRatio());
            Map<String, Object> result = callProvider(s, req);
            vr.setStatus("RENDERED");
            vr.setResultUrl(extractUrl(result));
            vr.setCost(BigDecimal.valueOf(s.costPerRender()));
            videoRequests.save(vr);
            return ResponseEntity.ok(Map.of("success", true, "request", vr, "result", result == null ? Map.of() : result));
        } catch (Exception e) {
            vr.setStatus("APPROVED"); // approved but render failed — can retry
            videoRequests.save(vr);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of(
                    "success", false, "error", "Render failed: " + e.getMessage(), "request", vr));
        }
    }

    /** Staff reject a request (optional note). */
    @PostMapping("/requests/{id}/reject")
    public ResponseEntity<?> rejectRequest(@PathVariable UUID id, @RequestBody(required = false) Map<String, Object> body,
                                           @AuthenticationPrincipal AuthUser authUser) {
        AiGatewaySecurity.assertStaff(authUser);
        VideoRequest vr = videoRequests.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));
        vr.setStatus("REJECTED");
        vr.setDecidedBy(authUser.getUserId());
        vr.setDecidedAt(LocalDateTime.now());
        if (body != null && body.get("note") != null) vr.setNote(body.get("note").toString());
        return ResponseEntity.ok(videoRequests.save(vr));
    }
}
