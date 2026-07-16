package com.lera.ai_gateway.service;

import com.lera.ai_gateway.entity.AiUsage;
import com.lera.ai_gateway.repository.AiUsageRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Per-user monthly AI token quota. Budgets live in {@code system_settings} (so the Chairman sets
 * them in the UI without a redeploy): {@code ai_token_budget} = default for everyone, and
 * {@code ai_token_budget_<userId>} = optional per-user override. A budget of 0 means "unlimited".
 * Consumption is tracked in {@code ai_usage} per (user, calendar-month).
 */
@Service
public class AiUsageService {

    private static final long DEFAULT_BUDGET = 100_000; // tokens / month
    private static final DateTimeFormatter YM = DateTimeFormatter.ofPattern("yyyy-MM");

    private final AiUsageRepository repo;
    private final JdbcTemplate jdbc;

    public AiUsageService(AiUsageRepository repo, JdbcTemplate jdbc) {
        this.repo = repo;
        this.jdbc = jdbc;
    }

    public String period() { return LocalDate.now().format(YM); }

    private String setting(String key) {
        try {
            List<String> r = jdbc.queryForList(
                    "SELECT setting_value FROM system_settings WHERE setting_key = ? LIMIT 1", String.class, key);
            return r.isEmpty() ? null : r.get(0);
        } catch (Exception e) { return null; }
    }

    private long parse(String v, long def) {
        try { return v == null || v.isBlank() ? def : Long.parseLong(v.trim()); } catch (Exception e) { return def; }
    }

    /** Resolved monthly budget for a user (per-user override → default setting → built-in default). */
    public long budget(UUID userId) {
        String override = userId == null ? null : setting("ai_token_budget_" + userId);
        if (override != null) return Math.max(0, parse(override, DEFAULT_BUDGET));
        return Math.max(0, parse(setting("ai_token_budget"), DEFAULT_BUDGET));
    }

    public long used(UUID userId) {
        if (userId == null) return 0;
        return repo.findByUserIdAndPeriod(userId, period()).map(AiUsage::getTokensUsed).orElse(0L);
    }

    /** True if the user may make a real AI call now (budget 0 = unlimited). */
    public boolean canUse(UUID userId) {
        if (userId == null) return true;
        long b = budget(userId);
        return b == 0 || used(userId) < b;
    }

    /** Add consumed tokens to the user's running monthly total. */
    @Transactional
    public void record(UUID userId, long tokens) {
        if (userId == null || tokens <= 0) return;
        String p = period();
        AiUsage row = repo.findByUserIdAndPeriod(userId, p).orElseGet(() -> {
            AiUsage u = new AiUsage();
            u.setUserId(userId);
            u.setPeriod(p);
            return u;
        });
        row.setTokensUsed(row.getTokensUsed() + tokens);
        row.setUpdatedAt(java.time.LocalDateTime.now());
        repo.save(row);
    }

    /** Set a user's monthly budget (null userId sets the global default). Persisted to system_settings. */
    public void setBudget(UUID userId, long budget) {
        String key = userId == null ? "ai_token_budget" : "ai_token_budget_" + userId;
        int n = jdbc.update("UPDATE system_settings SET setting_value = ?, updated_at = now() WHERE setting_key = ?",
                String.valueOf(budget), key);
        if (n == 0) {
            jdbc.update("INSERT INTO system_settings (id, category, description, is_public, setting_key, setting_type, setting_value, updated_at) "
                    + "VALUES (gen_random_uuid(), 'AI', ?, false, ?, 'number', ?, now())",
                    "AI monthly token budget", key, String.valueOf(budget));
        }
    }

    /** Total tokens across all users — all-time when {@code period} is null, else for that month. */
    public long totalTokens(String period) {
        try {
            Long v = period == null
                ? jdbc.queryForObject("SELECT COALESCE(SUM(tokens_used),0) FROM ai_usage", Long.class)
                : jdbc.queryForObject("SELECT COALESCE(SUM(tokens_used),0) FROM ai_usage WHERE period = ?", Long.class, period);
            return v == null ? 0 : v;
        } catch (Exception e) { return 0; }
    }

    /** Distinct users who consumed any tokens in the given month. */
    public long activeUsers(String period) {
        try {
            Long v = jdbc.queryForObject("SELECT COUNT(DISTINCT user_id) FROM ai_usage WHERE period = ?", Long.class, period);
            return v == null ? 0 : v;
        } catch (Exception e) { return 0; }
    }

    public Map<String, Object> status(UUID userId) {
        long b = budget(userId), u = used(userId);
        return Map.of(
            "period", period(),
            "used", u,
            "budget", b,
            "remaining", b == 0 ? -1 : Math.max(0, b - u),
            "unlimited", b == 0,
            "exceeded", b != 0 && u >= b
        );
    }
}
