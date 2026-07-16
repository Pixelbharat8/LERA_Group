package com.lera.ai_gateway.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Resolves the active AI provider configuration. Precedence: admin-set values in the shared
 * {@code system_settings} table (so the Chairman can "add their own API" from the UI without a
 * redeploy) override environment/properties defaults.
 *
 * Keys in system_settings (category 'AI'): {@code ai_provider}, {@code ai_api_key}, {@code ai_model}.
 * The API key is a secret — it is stored here but never returned to the client in full (the
 * controller masks it).
 */
@Service
public class AiConfigService {

    public static final String PROVIDER_ANTHROPIC = "anthropic";
    public static final String PROVIDER_OPENAI = "openai";

    private final JdbcTemplate jdbc;

    // Anthropic (Claude) defaults
    @Value("${anthropic.api-key:${ANTHROPIC_API_KEY:}}")
    private String envAnthropicKey;
    @Value("${anthropic.model:claude-sonnet-5}")
    private String envAnthropicModel;
    @Value("${anthropic.base-url:https://api.anthropic.com/v1/messages}")
    private String anthropicBaseUrl;
    @Value("${anthropic.version:2023-06-01}")
    private String anthropicVersion;

    // OpenAI-compatible defaults (legacy / in-house gateway)
    @Value("${ai.provider:}")
    private String envProvider;
    @Value("${ai.api-key:${openai.api.key:}}")
    private String envOpenaiKey;
    @Value("${ai.base-url:${openai.api.url:https://api.openai.com/v1/chat/completions}}")
    private String envOpenaiUrl;
    @Value("${ai.model:${openai.model:gpt-4o-mini}}")
    private String envOpenaiModel;

    public AiConfigService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** Resolved, ready-to-use settings for the active provider. */
    public record AiSettings(String provider, String apiKey, String model, String url, String version) {
        public boolean configured() {
            return apiKey != null && !apiKey.isBlank();
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

    /** Active provider: admin setting → env → auto (prefer Anthropic if a Claude key exists). */
    public String provider() {
        String p = firstNonBlank(setting("ai_provider"), envProvider);
        if (!p.isBlank()) return p.toLowerCase();
        // auto-detect
        if (!firstNonBlank(setting("ai_api_key"), envAnthropicKey).isBlank()) return PROVIDER_ANTHROPIC;
        if (!firstNonBlank(envOpenaiKey).isBlank()) return PROVIDER_OPENAI;
        return PROVIDER_ANTHROPIC; // default target so the UI nudges adding a Claude key
    }

    public AiSettings resolve() {
        String provider = provider();
        String dbKey = setting("ai_api_key");
        String dbModel = setting("ai_model");
        if (PROVIDER_OPENAI.equals(provider)) {
            return new AiSettings(PROVIDER_OPENAI,
                    firstNonBlank(dbKey, envOpenaiKey),
                    firstNonBlank(dbModel, envOpenaiModel),
                    firstNonBlank(envOpenaiUrl), null);
        }
        return new AiSettings(PROVIDER_ANTHROPIC,
                firstNonBlank(dbKey, envAnthropicKey),
                firstNonBlank(dbModel, envAnthropicModel),
                anthropicBaseUrl, anthropicVersion);
    }

    /** Persist admin-chosen provider/key/model into system_settings (upsert). Blank/masked key is ignored. */
    public void save(String provider, String apiKey, String model) {
        if (provider != null && !provider.isBlank()) upsert("ai_provider", provider.trim().toLowerCase());
        if (model != null && !model.isBlank()) upsert("ai_model", model.trim());
        if (apiKey != null && !apiKey.isBlank() && !apiKey.startsWith("****")) upsert("ai_api_key", apiKey.trim());
    }

    private void upsert(String key, String value) {
        int n = jdbc.update(
                "UPDATE system_settings SET setting_value = ?, updated_at = now() WHERE setting_key = ?",
                value, key);
        if (n == 0) {
            jdbc.update(
                    "INSERT INTO system_settings (id, category, description, is_public, setting_key, setting_type, setting_value, updated_at) "
                            + "VALUES (gen_random_uuid(), 'AI', ?, false, ?, 'text', ?, now())",
                    "AI gateway setting", key, value);
        }
    }
}
