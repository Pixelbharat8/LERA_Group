package com.lera.ai_gateway.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Resolves the active AI-video-generation provider config, mirroring {@link AiConfigService}.
 * Admin-set values in {@code system_settings} (category 'VIDEO') let the Chairman "add their own
 * video API" from the UI with no redeploy. There is no free/local video renderer — until a
 * provider + key are set, {@link VideoSettings#configured()} is false and generation is disabled.
 *
 * Keys: {@code video_provider}, {@code video_api_key}, {@code video_api_url}, {@code video_model},
 * {@code video_cost_per_render}. The API key is a secret — stored here, masked by the controller.
 */
@Service
public class VideoConfigService {

    private final JdbcTemplate jdbc;

    @Value("${video.api-key:${VIDEO_API_KEY:}}")
    private String envKey;
    @Value("${video.api-url:${VIDEO_API_URL:}}")
    private String envUrl;
    @Value("${video.provider:${VIDEO_PROVIDER:}}")
    private String envProvider;
    @Value("${video.model:${VIDEO_MODEL:}}")
    private String envModel;

    public VideoConfigService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** Resolved, ready-to-use video-provider settings. */
    public record VideoSettings(String provider, String apiKey, String baseUrl, String model, double costPerRender) {
        public boolean configured() {
            return apiKey != null && !apiKey.isBlank() && baseUrl != null && !baseUrl.isBlank();
        }
    }

    private String setting(String key) {
        try {
            List<String> r = jdbc.queryForList(
                    "SELECT setting_value FROM system_settings WHERE setting_key = ? LIMIT 1",
                    String.class, key);
            return r.isEmpty() ? null : r.get(0);
        } catch (Exception e) {
            return null;
        }
    }

    private static String firstNonBlank(String... vals) {
        for (String v : vals) if (v != null && !v.isBlank()) return v.trim();
        return "";
    }

    public VideoSettings resolve() {
        double cost = 0.0;
        try { cost = Double.parseDouble(firstNonBlank(setting("video_cost_per_render"), "0")); } catch (Exception ignore) {}
        return new VideoSettings(
                firstNonBlank(setting("video_provider"), envProvider),
                firstNonBlank(setting("video_api_key"), envKey),
                firstNonBlank(setting("video_api_url"), envUrl),
                firstNonBlank(setting("video_model"), envModel),
                cost);
    }

    /** Persist admin-chosen provider/key/url/model/cost. Blank/masked values are ignored. */
    public void save(String provider, String apiKey, String baseUrl, String model, String costPerRender) {
        if (provider != null && !provider.isBlank()) upsert("video_provider", provider.trim());
        if (baseUrl != null && !baseUrl.isBlank()) upsert("video_api_url", baseUrl.trim());
        if (model != null && !model.isBlank()) upsert("video_model", model.trim());
        if (costPerRender != null && !costPerRender.isBlank()) upsert("video_cost_per_render", costPerRender.trim());
        if (apiKey != null && !apiKey.isBlank() && !apiKey.startsWith("****") && !apiKey.startsWith("••••")) {
            upsert("video_api_key", apiKey.trim());
        }
    }

    private void upsert(String key, String value) {
        int n = jdbc.update(
                "UPDATE system_settings SET setting_value = ?, updated_at = now() WHERE setting_key = ?",
                value, key);
        if (n == 0) {
            jdbc.update(
                    "INSERT INTO system_settings (id, category, description, is_public, setting_key, setting_type, setting_value, updated_at) "
                            + "VALUES (gen_random_uuid(), 'VIDEO', ?, false, ?, 'text', ?, now())",
                    "AI video generation setting", key, value);
        }
    }
}
