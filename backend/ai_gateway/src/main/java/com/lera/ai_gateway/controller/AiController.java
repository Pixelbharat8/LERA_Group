package com.lera.ai_gateway.controller;

import com.lera.ai_gateway.security.AiGatewaySecurity;
import com.lera.ai_gateway.security.AuthUser;
import com.lera.ai_gateway.service.AcademyStudentAccessClient;
import com.lera.ai_gateway.service.AiConfigService;
import com.lera.ai_gateway.service.OpenAIService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/ai")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class AiController {

    private final OpenAIService openAIService;
    private final AcademyStudentAccessClient academyStudentAccess;
    private final AiConfigService aiConfig;
    private final com.lera.ai_gateway.service.AiUsageService aiUsage;
    private final com.lera.ai_gateway.repository.AiConversationRepository aiConversationRepo;
    private final com.lera.ai_gateway.repository.AiAssessmentRepository aiAssessmentRepo;

    private static java.util.UUID uid(AuthUser u) { return u != null ? u.getUserId() : null; }
    private static long tokensOf(Map<String, Object> r) {
        Object t = r.get("tokensUsed");
        return t instanceof Number ? ((Number) t).longValue() : 0L;
    }

    /** My current month's AI quota status. */
    @GetMapping("/usage")
    public ResponseEntity<?> myUsage(@AuthenticationPrincipal AuthUser authUser) {
        return ResponseEntity.ok(aiUsage.status(uid(authUser)));
    }

    /** A user's quota status (admin — used by Feature Management). */
    @GetMapping("/usage/{userId}")
    public ResponseEntity<?> userUsage(@PathVariable java.util.UUID userId, @AuthenticationPrincipal AuthUser authUser) {
        AiGatewaySecurity.assertOrgWide(authUser);
        return ResponseEntity.ok(aiUsage.status(userId));
    }

    /** Set a monthly token budget (admin). {userId} omitted/null = global default. 0 = unlimited. */
    @PutMapping("/budget")
    public ResponseEntity<?> setBudget(@RequestBody Map<String, Object> req, @AuthenticationPrincipal AuthUser authUser) {
        AiGatewaySecurity.assertOrgWide(authUser);
        java.util.UUID userId = req.get("userId") != null && !req.get("userId").toString().isBlank()
                ? java.util.UUID.fromString(req.get("userId").toString()) : null;
        long budget = req.get("budget") instanceof Number ? ((Number) req.get("budget")).longValue()
                : Long.parseLong(String.valueOf(req.getOrDefault("budget", "0")));
        aiUsage.setBudget(userId, Math.max(0, budget));
        return ResponseEntity.ok(aiUsage.status(userId));
    }

    // Health check
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        AiConfigService.AiSettings s = aiConfig.resolve();
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "AI Gateway",
            "timestamp", LocalDateTime.now().toString(),
            "provider", s.provider(),
            "model", s.model(),
            "configured", openAIService.isConfigured()
        ));
    }

    /**
     * Current AI provider config (admin). The API key is NEVER returned — only whether one is set
     * and its last 4 chars, so the UI can show "•••• abcd" without exposing the secret.
     */
    @GetMapping("/config")
    public ResponseEntity<?> getConfig(@AuthenticationPrincipal AuthUser authUser) {
        AiGatewaySecurity.assertOrgWide(authUser);
        AiConfigService.AiSettings s = aiConfig.resolve();
        String key = s.apiKey() == null ? "" : s.apiKey();
        Map<String, Object> body = new HashMap<>();
        body.put("provider", s.provider());
        body.put("model", s.model());
        body.put("configured", key != null && !key.isBlank());
        body.put("keyHint", key.length() >= 4 ? "•••• " + key.substring(key.length() - 4) : "");
        body.put("providers", Arrays.asList("anthropic", "openai"));
        return ResponseEntity.ok(body);
    }

    /**
     * Set the AI provider / API key / model (admin). Persists to system_settings so it takes
     * effect immediately without a redeploy — this is the "add your own API" path.
     */
    @PutMapping("/config")
    public ResponseEntity<?> setConfig(@RequestBody Map<String, Object> req,
                                       @AuthenticationPrincipal AuthUser authUser) {
        AiGatewaySecurity.assertOrgWide(authUser);
        String provider = (String) req.get("provider");
        String apiKey = (String) req.get("apiKey");
        String model = (String) req.get("model");
        aiConfig.save(provider, apiKey, model);
        AiConfigService.AiSettings s = aiConfig.resolve();
        return ResponseEntity.ok(Map.of(
            "success", true,
            "provider", s.provider(),
            "model", s.model(),
            "configured", openAIService.isConfigured()
        ));
    }

    // Stats endpoint for SuperAdmin dashboard
    /**
     * Real AI-usage stats for the Super Admin dashboard. Every figure is derived from actual data
     * (the ai_conversations / ai_assessments tables and the ai_usage token ledger) — no fabricated
     * numbers. Metrics we don't measure (request count, error rate, uptime) are simply omitted
     * rather than invented; genuine zeros mean "no usage yet", which is the honest state pre-key.
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getStats(@AuthenticationPrincipal AuthUser authUser) {
        AiGatewaySecurity.assertOrgWide(authUser);
        AiConfigService.AiSettings s = aiConfig.resolve();
        String month = aiUsage.period();
        Map<String, Object> stats = new HashMap<>();
        // Dashboard cards — real counts from the AI tables (0 when unused, never fabricated).
        stats.put("tutorSessions", aiConversationRepo.countByConversationType("TUTORING"));
        stats.put("gradedEssays", aiAssessmentRepo.count());
        stats.put("chatQueries", aiConversationRepo.count());
        // Real token usage from the ai_usage ledger.
        stats.put("totalTokens", aiUsage.totalTokens(null));
        stats.put("currentMonthTokens", aiUsage.totalTokens(month));
        stats.put("activeUsersThisMonth", aiUsage.activeUsers(month));
        // Real provider/model configuration.
        stats.put("provider", s.provider());
        stats.put("model", s.model());
        stats.put("configured", openAIService.isConfigured());
        stats.put("period", month);
        stats.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.ok(stats);
    }

    // Chat with AI - uses real OpenAI API if configured, otherwise fallback
    @PostMapping("/chat")
    public ResponseEntity<?> chat(@Valid @RequestBody Map<String, Object> request,
                                  @AuthenticationPrincipal AuthUser authUser) {
        try {
            String message = (String) request.get("message");
            String subject = (String) request.getOrDefault("subject", "English");
            String model = (String) request.getOrDefault("model", "gpt-4o-mini");
            String systemPrompt = (String) request.getOrDefault("systemPrompt",
                "You are an expert " + subject + " tutor helping students learn. Be clear, helpful, and encouraging.");

            java.util.UUID me = uid(authUser);
            Map<String, Object> response = new HashMap<>();
            // Quota gate: if over the monthly budget, don't spend real tokens.
            if (!aiUsage.canUse(me)) {
                response.put("message", "You've reached your monthly AI quota. Ask your administrator to increase your token budget.");
                response.put("usingRealAI", false);
                response.put("quotaExceeded", true);
                response.put("usage", aiUsage.status(me));
                return ResponseEntity.ok(response);
            }

            Map<String, Object> result = openAIService.chat(message, systemPrompt, model);
            if (Boolean.TRUE.equals(result.get("success"))) aiUsage.record(me, tokensOf(result));

            response.put("message", result.get("message"));
            response.put("model", model);
            response.put("timestamp", LocalDateTime.now().toString());
            response.put("tokensUsed", result.getOrDefault("tokensUsed", 0));
            response.put("usingRealAI", result.getOrDefault("success", false));
            response.put("usage", aiUsage.status(me));
            if (result.containsKey("error")) {
                response.put("note", result.get("error"));
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    private final com.fasterxml.jackson.databind.ObjectMapper json = new com.fasterxml.jackson.databind.ObjectMapper();

    /** Extract a JSON object from an AI reply (tolerates ```json fences / surrounding prose). */
    private Map<String, Object> extractJson(Object message) {
        if (message == null) return null;
        String s = message.toString().trim();
        int a = s.indexOf('{'), b = s.lastIndexOf('}');
        if (a < 0 || b <= a) return null;
        try {
            return json.readValue(s.substring(a, b + 1), Map.class);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * AI LEAD SCORING + next-best-action (CRM). Given a lead's profile (status, source, existing
     * rule-based score/temperature, notes, recency), Claude estimates conversion likelihood and
     * recommends the next action + channel. Always returns a usable assessment: if no API key is
     * configured or the model returns prose, it falls back to a deterministic heuristic so the CRM
     * UI keeps working. POST body: { "lead": { ...lead fields... }, "lang": "en"|"vi" (optional) }.
     */
    @PostMapping("/lead-score")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> leadScore(@RequestBody Map<String, Object> req,
                                       @AuthenticationPrincipal AuthUser authUser) {
        Object leadObj = req.get("lead");
        Map<String, Object> lead = leadObj instanceof Map ? (Map<String, Object>) leadObj : req;
        String lang = "vi".equalsIgnoreCase(String.valueOf(req.getOrDefault("lang", "en"))) ? "vi" : "en";
        java.util.UUID me = uid(authUser);

        Map<String, Object> out = new HashMap<>();
        // Over quota → return the deterministic heuristic (no real tokens spent), flagged as such.
        if (!aiUsage.canUse(me)) {
            out.putAll(heuristicScore(lead));
            out.put("usingRealAI", false);
            out.put("quotaExceeded", true);
            out.put("usage", aiUsage.status(me));
            return ResponseEntity.ok(out);
        }

        String system = "You are a CRM conversion analyst for a premium English-education academy in Vietnam. "
            + "Assess how likely a lead is to enroll and what to do next. "
            + "Reply with ONLY valid JSON, no prose, no markdown fences.";
        String prompt = "Analyze this sales lead and return JSON with this exact shape: "
            + "{\"conversionLikelihood\": number 0-100, \"temperature\": \"HOT\"|\"WARM\"|\"COLD\", "
            + "\"urgency\": \"HIGH\"|\"MEDIUM\"|\"LOW\", "
            + "\"channel\": \"PHONE\"|\"ZALO\"|\"EMAIL\"|\"SMS\"|\"MEETING\", "
            + "\"nextAction\": string (one concrete next step" + (lang.equals("vi") ? ", written in Vietnamese" : "") + "), "
            + "\"reasoning\": string (1-2 sentences" + (lang.equals("vi") ? ", in Vietnamese" : "") + ")}. "
            + "Lead profile:\n" + leadProfile(lead);

        Map<String, Object> r = openAIService.chat(prompt, system, null);
        boolean success = Boolean.TRUE.equals(r.get("success"));
        if (success) aiUsage.record(me, tokensOf(r));

        Map<String, Object> parsed = success ? extractJson(r.get("message")) : null;
        Map<String, Object> assessment = normalizeAssessment(parsed, lead);

        out.putAll(assessment);
        out.put("usingRealAI", "ai".equals(assessment.get("source")));
        out.put("tokensUsed", r.getOrDefault("tokensUsed", 0));
        out.put("usage", aiUsage.status(me));
        if (r.containsKey("error")) out.put("note", r.get("error"));
        return ResponseEntity.ok(out);
    }

    /**
     * Batch lead scoring for LIST views — scores many leads in one call using the deterministic
     * heuristic ONLY (no per-lead model calls; running Claude per row would be impractical and
     * costly at list scale). For the full single-lead AI analysis use POST /api/ai/lead-score.
     * Returns one entry per input lead, keyed by its "id". POST body: { "leads": [ {...}, ... ] }.
     */
    @PostMapping("/lead-score/batch")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> leadScoreBatch(@RequestBody Map<String, Object> req) {
        Object leadsObj = req.get("leads");
        if (!(leadsObj instanceof List<?> leads)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Body must contain a 'leads' array."));
        }
        List<Map<String, Object>> out = new ArrayList<>();
        int n = 0;
        for (Object o : leads) {
            if (n++ >= 500) break; // cap to keep the call cheap and bounded
            if (!(o instanceof Map)) continue;
            Map<String, Object> lead = (Map<String, Object>) o;
            Map<String, Object> score = new HashMap<>(heuristicScore(lead));
            score.put("id", lead.get("id"));
            out.add(score);
        }
        return ResponseEntity.ok(Map.of("scores", out, "count", out.size()));
    }

    /** Compact, model-readable summary of a lead's fields (skips blanks; never leaks raw PII labels). */
    private String leadProfile(Map<String, Object> lead) {
        StringBuilder b = new StringBuilder();
        appendField(b, "Status", lead.get("status"));
        appendField(b, "Existing rule-based score (0-100)", lead.get("score"));
        appendField(b, "Existing temperature", lead.get("temperature"));
        appendField(b, "Student age", lead.get("studentAge"));
        appendField(b, "Interested in a specific program", lead.get("interestedProgramId") != null ? "yes" : null);
        appendField(b, "Preferred schedule", lead.get("preferredSchedule"));
        appendField(b, "Source", firstNonNull(lead.get("source"), lead.get("utmSource"), lead.get("sourceId")));
        appendField(b, "UTM medium", lead.get("utmMedium"));
        appendField(b, "UTM campaign", lead.get("utmCampaign"));
        appendField(b, "Has phone on file", isBlank(lead.get("parentPhone")) ? null : "yes");
        appendField(b, "Has email on file", isBlank(lead.get("parentEmail")) ? null : "yes");
        Long days = daysSince(lead.get("createdAt"));
        if (days != null) appendField(b, "Days since created", days);
        appendField(b, "Contacted before", lead.get("firstContactedAt") != null ? "yes" : "no");
        if (!isBlank(lead.get("notes"))) appendField(b, "Notes", truncate(lead.get("notes").toString(), 500));
        return b.length() == 0 ? "(no data provided)" : b.toString();
    }

    private void appendField(StringBuilder b, String label, Object v) {
        if (isBlank(v)) return;
        b.append("- ").append(label).append(": ").append(v).append('\n');
    }
    private static boolean isBlank(Object v) { return v == null || v.toString().isBlank(); }
    private static Object firstNonNull(Object... vs) { for (Object v : vs) if (!isBlank(v)) return v; return null; }
    private static String truncate(String s, int n) { return s.length() <= n ? s : s.substring(0, n) + "…"; }

    private Long daysSince(Object iso) {
        if (isBlank(iso)) return null;
        try {
            String s = iso.toString();
            java.time.LocalDate d = java.time.LocalDate.parse(s.length() >= 10 ? s.substring(0, 10) : s);
            long days = java.time.temporal.ChronoUnit.DAYS.between(d, java.time.LocalDate.now());
            return days < 0 ? 0 : days;
        } catch (Exception e) { return null; }
    }

    /** Validate/clamp the model's JSON; fill any missing field from the deterministic heuristic. */
    private Map<String, Object> normalizeAssessment(Map<String, Object> parsed, Map<String, Object> lead) {
        Map<String, Object> out = new HashMap<>(heuristicScore(lead)); // defaults; overwritten by valid model values
        if (parsed == null) return out;
        Integer like = asInt(parsed.get("conversionLikelihood"));
        if (like != null) {
            out.put("conversionLikelihood", Math.max(0, Math.min(100, like)));
            out.put("source", "ai"); // only trust the model's verdict when it returned a usable likelihood
        }
        String temp = asEnum(parsed.get("temperature"), "HOT", "WARM", "COLD");
        if (temp != null) out.put("temperature", temp);
        String urg = asEnum(parsed.get("urgency"), "HIGH", "MEDIUM", "LOW");
        if (urg != null) out.put("urgency", urg);
        String ch = asEnum(parsed.get("channel"), "PHONE", "ZALO", "EMAIL", "SMS", "MEETING");
        if (ch != null) out.put("channel", ch);
        if (!isBlank(parsed.get("nextAction"))) out.put("nextAction", parsed.get("nextAction").toString().trim());
        if (!isBlank(parsed.get("reasoning"))) out.put("reasoning", parsed.get("reasoning").toString().trim());
        return out;
    }

    private static Integer asInt(Object v) {
        if (v instanceof Number n) return n.intValue();
        if (v == null) return null;
        try { return (int) Math.round(Double.parseDouble(v.toString().replaceAll("[^0-9.\\-]", ""))); }
        catch (Exception e) { return null; }
    }
    private static String asEnum(Object v, String... allowed) {
        if (v == null) return null;
        String u = v.toString().trim().toUpperCase();
        for (String a : allowed) if (a.equals(u)) return a;
        return null;
    }

    /**
     * Deterministic fallback score from status + existing rule-based score + recency. Guarantees the
     * CRM always gets a usable assessment even with no API key configured or on a model failure.
     */
    private Map<String, Object> heuristicScore(Map<String, Object> lead) {
        String status = String.valueOf(lead.getOrDefault("status", "NEW")).toUpperCase();
        int base = switch (status) {
            case "CONVERTED" -> 100;
            case "TRIAL_ATTENDED" -> 80;
            case "TRIAL_BOOKED" -> 70;
            case "QUALIFIED" -> 55;
            case "CONTACTED" -> 35;
            case "NO_SHOW" -> 25;
            case "LOST" -> 3;
            default -> 20; // NEW / unknown
        };
        Integer existing = asInt(lead.get("score"));
        int likelihood = existing != null
            ? (int) Math.round(base * 0.6 + Math.max(0, Math.min(100, existing)) * 0.4)
            : base;

        // Staleness penalty: an untouched lead sitting for weeks cools off.
        Long days = daysSince(lead.get("createdAt"));
        boolean contacted = lead.get("firstContactedAt") != null;
        if (days != null && days > 14 && !contacted && likelihood > 10) likelihood = Math.max(10, likelihood - 15);

        String temp = likelihood >= 65 ? "HOT" : likelihood >= 40 ? "WARM" : "COLD";
        String channel = !isBlank(lead.get("parentPhone")) ? "PHONE" : !isBlank(lead.get("parentEmail")) ? "EMAIL" : "PHONE";
        String urgency = "HOT".equals(temp) ? "HIGH" : "WARM".equals(temp) ? "MEDIUM" : "LOW";
        String nextAction = switch (status) {
            case "CONTACTED" -> "Follow up to book a free trial class.";
            case "QUALIFIED" -> "Book a trial class and confirm the schedule.";
            case "TRIAL_BOOKED" -> "Send a reminder and confirm attendance for the trial.";
            case "TRIAL_ATTENDED" -> "Call to close: present the enrollment package and pricing.";
            case "NO_SHOW" -> "Re-engage and reschedule the missed trial.";
            case "CONVERTED" -> "Onboard the student and set up the renewal cadence.";
            case "LOST" -> "Add to a long-term nurture list; revisit next term.";
            default -> "Call within 24h to introduce the academy and qualify interest."; // NEW / unknown
        };

        Map<String, Object> m = new HashMap<>();
        m.put("conversionLikelihood", likelihood);
        m.put("temperature", temp);
        m.put("urgency", urgency);
        m.put("channel", channel);
        m.put("nextAction", nextAction);
        m.put("reasoning", "Heuristic estimate from lead status (" + status + ")"
            + (existing != null ? ", existing score " + existing : "")
            + (days != null ? ", " + days + "d old" : "") + ".");
        m.put("source", "heuristic");
        return m;
    }

    /**
     * Generate an interactive multiple-choice GAME from a lesson topic/plan (Teacher AI Studio).
     * Returns structured JSON the frontend renders as a playable quiz; falls back to a real
     * sample game (so the feature works) if no API key is set or the model returns prose.
     */
    @PostMapping("/generate-game")
    public ResponseEntity<?> generateGame(@RequestBody Map<String, Object> req,
                                          @AuthenticationPrincipal AuthUser authUser) {
        String topic = String.valueOf(req.getOrDefault("topic", "English lesson"));
        String level = String.valueOf(req.getOrDefault("level", "beginner"));
        java.util.UUID me = uid(authUser);
        // Over quota → return a sample (no real tokens spent) flagged as such.
        if (!aiUsage.canUse(me)) {
            Map<String, Object> game = sampleGame(topic);
            game.put("usingRealAI", false);
            game.put("quotaExceeded", true);
            game.put("usage", aiUsage.status(me));
            return ResponseEntity.ok(game);
        }
        String system = "You are an expert English teacher building a fun classroom QUIZ game. Reply with ONLY valid JSON, no prose, no markdown fences.";
        String prompt = "Create a multiple-choice quiz game for this lesson: \"" + topic + "\" (level: " + level + "). "
            + "JSON shape: {\"title\": string, \"instructions\": string, \"questions\": "
            + "[{\"q\": string, \"options\": [string,string,string,string], \"correct\": number(0-3), \"explain\": string}]}. "
            + "Make exactly 6 age-appropriate questions tied to the lesson.";
        Map<String, Object> r = openAIService.chat(prompt, system, null);
        if (Boolean.TRUE.equals(r.get("success"))) aiUsage.record(me, tokensOf(r));
        Map<String, Object> game = extractJson(r.get("message"));
        if (game == null || !game.containsKey("questions")) game = sampleGame(topic);
        game.put("usingRealAI", r.getOrDefault("success", false));
        game.put("tokensUsed", r.getOrDefault("tokensUsed", 0));
        game.put("usage", aiUsage.status(me));
        return ResponseEntity.ok(game);
    }

    /**
     * Generate an interactive PRESENTATION (slides) from a lesson topic/plan. Returns structured
     * JSON the frontend renders as a slideshow; falls back to a real sample deck if unconfigured.
     */
    @PostMapping("/generate-presentation")
    public ResponseEntity<?> generatePresentation(@RequestBody Map<String, Object> req,
                                                  @AuthenticationPrincipal AuthUser authUser) {
        String topic = String.valueOf(req.getOrDefault("topic", "English lesson"));
        String level = String.valueOf(req.getOrDefault("level", "beginner"));
        java.util.UUID me = uid(authUser);
        if (!aiUsage.canUse(me)) {
            Map<String, Object> deck = samplePresentation(topic);
            deck.put("usingRealAI", false);
            deck.put("quotaExceeded", true);
            deck.put("usage", aiUsage.status(me));
            return ResponseEntity.ok(deck);
        }
        String system = "You are an expert English teacher building an engaging class slide deck. Reply with ONLY valid JSON, no prose, no markdown fences.";
        String prompt = "Create an interactive lesson presentation for: \"" + topic + "\" (level: " + level + "). "
            + "JSON shape: {\"title\": string, \"slides\": [{\"title\": string, \"bullets\": [string], \"note\": string}]}. "
            + "Make 6-8 slides: intro, key vocabulary, grammar/concept, examples, a practice activity, and a recap.";
        Map<String, Object> r = openAIService.chat(prompt, system, null);
        if (Boolean.TRUE.equals(r.get("success"))) aiUsage.record(me, tokensOf(r));
        Map<String, Object> deck = extractJson(r.get("message"));
        if (deck == null || !deck.containsKey("slides")) deck = samplePresentation(topic);
        deck.put("usingRealAI", r.getOrDefault("success", false));
        deck.put("tokensUsed", r.getOrDefault("tokensUsed", 0));
        deck.put("usage", aiUsage.status(me));
        return ResponseEntity.ok(deck);
    }

    private Map<String, Object> sampleGame(String topic) {
        List<Map<String, Object>> qs = new ArrayList<>();
        qs.add(Map.of("q", "Which sentence is in the present simple?", "options", List.of("She is running.", "She runs every day.", "She has run.", "She will run."), "correct", 1, "explain", "Present simple states a habit: 'runs every day'."));
        qs.add(Map.of("q", "Choose the correct article: ___ apple a day.", "options", List.of("A", "An", "The", "(none)"), "correct", 1, "explain", "'An' before a vowel sound."));
        qs.add(Map.of("q", "What is the opposite of 'happy'?", "options", List.of("sad", "tall", "fast", "blue"), "correct", 0, "explain", "'Sad' is the antonym of 'happy'."));
        return new HashMap<>(Map.of(
            "title", "Quiz: " + topic,
            "instructions", "Pick the correct answer for each question. (Sample — add a Claude API key in AI Gateway for AI-generated games on your real lesson.)",
            "questions", qs));
    }

    private Map<String, Object> samplePresentation(String topic) {
        List<Map<String, Object>> slides = new ArrayList<>();
        slides.add(Map.of("title", topic, "bullets", List.of("Today's objective", "Why it matters", "What we'll practice"), "note", "Welcome + warm-up."));
        slides.add(Map.of("title", "Key vocabulary", "bullets", List.of("Word 1 — meaning + example", "Word 2 — meaning + example", "Word 3 — meaning + example"), "note", "Drill pronunciation."));
        slides.add(Map.of("title", "Concept", "bullets", List.of("The rule, simply stated", "A clear example", "A common mistake to avoid"), "note", "Check understanding."));
        slides.add(Map.of("title", "Practice activity", "bullets", List.of("Pair work: make 3 sentences", "Share with the class", "Teacher feedback"), "note", "5–7 minutes."));
        slides.add(Map.of("title", "Recap", "bullets", List.of("What we learned", "Homework", "Next lesson preview"), "note", "Exit ticket."));
        return new HashMap<>(Map.of(
            "title", topic,
            "slides", slides));
    }

    /**
     * Generate an SEO-optimised, bilingual (EN + VI) blog article from a target keyword, tuned for
     * a Hải Phòng English-centre audience. Returns ready-to-publish BlogPost-shaped JSON
     * (titleEn/titleVi/excerptEn/excerptVi/contentEn/contentVi/slug/category, status=draft); falls
     * back to a real sample article if the AI is unconfigured or the caller is over quota.
     */
    @PostMapping("/seo-article")
    public ResponseEntity<?> generateSeoArticle(@RequestBody Map<String, Object> req,
                                                @AuthenticationPrincipal AuthUser authUser) {
        String keyword = String.valueOf(req.getOrDefault("keyword", "học tiếng Anh ở Hải Phòng")).trim();
        String category = String.valueOf(req.getOrDefault("category", "Tips"));
        java.util.UUID me = uid(authUser);
        if (!aiUsage.canUse(me)) {
            Map<String, Object> a = sampleSeoArticle(keyword, category);
            a.put("usingRealAI", false);
            a.put("quotaExceeded", true);
            a.put("usage", aiUsage.status(me));
            return ResponseEntity.ok(a);
        }
        String system = "You are an SEO content writer for LERA Academy, a premium English language centre in "
            + "Hải Phòng, Vietnam (Vinhomes Marina). Write genuinely helpful, original, expert content. "
            + "Reply with ONLY valid JSON, no prose, no markdown code fences.";
        String prompt = "Write an SEO-optimised blog article targeting the keyword \"" + keyword + "\". "
            + "Use the keyword and related local terms (Hải Phòng, Vinhomes Marina, Cambridge, IELTS) naturally, "
            + "no keyword-stuffing. Provide BOTH English and Vietnamese. JSON shape: "
            + "{\"titleEn\": string, \"titleVi\": string, "
            + "\"excerptEn\": string (<=155 chars, meta description), \"excerptVi\": string (<=155 chars), "
            + "\"slug\": string (kebab-case from the English title, ascii only), \"category\": string, "
            + "\"contentEn\": string (HTML using <h2>/<p>/<ul>: a short intro, 3-5 H2 sections, and a closing "
            + "call-to-action to book a free trial at LERA Academy; ~600-800 words), "
            + "\"contentVi\": string (the same article in natural Vietnamese)}.";
        Map<String, Object> r = openAIService.chat(prompt, system, null);
        if (Boolean.TRUE.equals(r.get("success"))) aiUsage.record(me, tokensOf(r));
        Map<String, Object> article = extractJson(r.get("message"));
        if (article == null || !article.containsKey("titleEn")) article = sampleSeoArticle(keyword, category);
        Object slug = article.get("slug");
        article.put("slug", slugify(slug == null || String.valueOf(slug).isBlank()
            ? String.valueOf(article.getOrDefault("titleEn", keyword)) : String.valueOf(slug)));
        article.put("status", "draft");
        article.put("usingRealAI", r.getOrDefault("success", false));
        article.put("tokensUsed", r.getOrDefault("tokensUsed", 0));
        article.put("usage", aiUsage.status(me));
        return ResponseEntity.ok(article);
    }

    /** kebab-case ascii slug, diacritic- and đ-aware so Vietnamese titles produce clean URLs. */
    private static String slugify(String s) {
        String n = java.text.Normalizer.normalize(s == null ? "" : s, java.text.Normalizer.Form.NFD)
            .replaceAll("\\p{M}+", "")
            .replace("đ", "d").replace("Đ", "D")
            .toLowerCase()
            .replaceAll("[^a-z0-9]+", "-")
            .replaceAll("(^-|-$)", "");
        if (n.isBlank()) return "lera-article";
        return n.length() > 80 ? n.substring(0, 80).replaceAll("-$", "") : n;
    }

    private Map<String, Object> sampleSeoArticle(String keyword, String category) {
        Map<String, Object> a = new HashMap<>();
        a.put("titleEn", "How to Choose the Right English Centre in Hải Phòng");
        a.put("titleVi", "Cách chọn trung tâm tiếng Anh phù hợp ở Hải Phòng");
        a.put("excerptEn", "A practical guide to choosing an English centre in Hải Phòng — teachers, class size, curriculum and results.");
        a.put("excerptVi", "Hướng dẫn chọn trung tâm tiếng Anh ở Hải Phòng — giáo viên, sĩ số lớp, chương trình và kết quả học tập.");
        a.put("slug", slugify(keyword));
        a.put("category", category);
        a.put("contentEn", "<h2>What to look for</h2><p>Native and qualified teachers, small classes, a clear Cambridge-aligned"
            + " curriculum, and measurable results.</p><p><em>(Sample article — add a Claude API key in Super Admin →"
            + " AI Gateway to generate a real, unique article for your keyword: \"" + keyword + "\".)</em></p>");
        a.put("contentVi", "<h2>Những điều cần lưu ý</h2><p>Giáo viên bản ngữ và có chuyên môn, lớp học nhỏ, chương trình"
            + " Cambridge rõ ràng và kết quả đo lường được.</p><p><em>(Bản mẫu — thêm Claude API key trong AI Gateway để"
            + " tạo bài viết thật.)</em></p>");
        return a;
    }

    // AI Tutoring endpoint
    @PostMapping("/tutor")
    public ResponseEntity<?> tutor(@Valid @RequestBody Map<String, Object> request,
                                   @AuthenticationPrincipal AuthUser authUser) {
        try {
            String question = (String) request.get("question");
            String subject = (String) request.getOrDefault("subject", "English");
            String level = (String) request.getOrDefault("level", "intermediate");

            // Quota gate: /tutor spends real tokens (paid AI), so meter it like /chat — otherwise any
            // authenticated user (incl. students) could burn the token budget unmetered.
            java.util.UUID me = uid(authUser);
            if (!aiUsage.canUse(me)) {
                return ResponseEntity.ok(Map.of(
                    "response", "You've reached your monthly AI quota. Ask your administrator to increase your token budget.",
                    "quotaExceeded", true,
                    "usage", aiUsage.status(me)
                ));
            }

            // Use OpenAI for tutoring
            Map<String, Object> result = openAIService.generateEducationalContent(question, subject, level);
            if (Boolean.TRUE.equals(result.get("success"))) aiUsage.record(me, tokensOf(result));

            return ResponseEntity.ok(Map.of(
                "response", result.get("message"),
                "subject", subject,
                "level", level,
                "hints", generateHints(question, subject),
                "relatedTopics", getRelatedTopics(subject),
                "nextSteps", Arrays.asList("Practice with exercises", "Review related topics", "Take a quiz")
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    // AI Assessment endpoint
    @PostMapping("/assess")
    public ResponseEntity<?> assess(@Valid @RequestBody Map<String, Object> request) {
        try {
            String answer = (String) request.get("answer");
            String correctAnswer = (String) request.get("correctAnswer");
            String subject = (String) request.getOrDefault("subject", "English");
            
            double score = calculateAnswerScore(answer, correctAnswer);
            String feedback = generateFeedback(answer, correctAnswer, score);
            
            return ResponseEntity.ok(Map.of(
                "score", score,
                "percentage", Math.round(score * 100) + "%",
                "feedback", feedback,
                "isCorrect", score >= 0.8,
                "suggestions", generateImprovementSuggestions(answer, subject),
                "detailedAnalysis", Map.of(
                    "accuracy", score > 0.8 ? "High" : score > 0.5 ? "Medium" : "Low",
                    "completeness", score > 0.7 ? "Complete" : "Partial",
                    "clarity", "Good"
                )
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    // AI Learning Path generator
    @PostMapping("/learning-path")
    public ResponseEntity<?> generateLearningPath(@Valid @RequestBody Map<String, Object> request) {
        try {
            String subject = (String) request.getOrDefault("subject", "English");
            String currentLevel = (String) request.getOrDefault("currentLevel", "beginner");
            String targetLevel = (String) request.getOrDefault("targetLevel", "advanced");
            
            List<Map<String, Object>> path = createLearningPath(subject, currentLevel, targetLevel);
            
            return ResponseEntity.ok(Map.of(
                "subject", subject,
                "currentLevel", currentLevel,
                "targetLevel", targetLevel,
                "estimatedDuration", "12 weeks",
                "totalHours", 60,
                "path", path
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    // AI Recommendations endpoint
    @GetMapping("/recommendations")
    public ResponseEntity<?> getRecommendations(
            @RequestParam(required = false) String studentId,
            @RequestParam(required = false) String subject,
            @AuthenticationPrincipal AuthUser authUser) {
        if (studentId != null && !studentId.isBlank()) {
            academyStudentAccess.assertCanAccessStudentEntity(
                    authUser, java.util.UUID.fromString(studentId.trim()));
        } else {
            AiGatewaySecurity.assertStaff(authUser);
        }

        List<Map<String, Object>> recommendations = new ArrayList<>();
        
        recommendations.add(Map.of(
            "id", UUID.randomUUID().toString(),
            "type", "COURSE",
            "title", "Advanced Grammar Course",
            "description", "Based on your performance, we recommend strengthening grammar skills",
            "priority", "HIGH",
            "confidence", 0.92
        ));
        
        recommendations.add(Map.of(
            "id", UUID.randomUUID().toString(),
            "type", "PRACTICE",
            "title", "Vocabulary Practice Session",
            "description", "Daily vocabulary practice will help expand your word bank",
            "priority", "MEDIUM",
            "confidence", 0.85
        ));
        
        recommendations.add(Map.of(
            "id", UUID.randomUUID().toString(),
            "type", "ASSESSMENT",
            "title", "Progress Assessment",
            "description", "Time for a progress check to track your improvement",
            "priority", "LOW",
            "confidence", 0.78
        ));
        
        return ResponseEntity.ok(recommendations);
    }

    // Generate practice questions
    @PostMapping("/generate-questions")
    public ResponseEntity<?> generateQuestions(@Valid @RequestBody Map<String, Object> request) {
        try {
            String topic = (String) request.getOrDefault("topic", "General English");
            String level = (String) request.getOrDefault("level", "intermediate");
            int count = (int) request.getOrDefault("count", 5);
            
            List<Map<String, Object>> questions = generatePracticeQuestions(topic, level, count);
            
            return ResponseEntity.ok(Map.of(
                "topic", topic,
                "level", level,
                "totalQuestions", questions.size(),
                "questions", questions
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    // Helper methods for AI response generation

    private List<String> generateHints(String question, String subject) {
        return Arrays.asList(
            "💡 Think about the context in which this is used",
            "💡 Consider similar examples you've seen before",
            "💡 Break down the problem into smaller parts",
            "💡 Try to relate it to something you already know"
        );
    }

    private List<String> getRelatedTopics(String subject) {
        if ("English".equalsIgnoreCase(subject)) {
            return Arrays.asList("Grammar Basics", "Vocabulary Building", "Pronunciation", "Reading Skills", "Writing Practice");
        }
        return Arrays.asList("Fundamentals", "Intermediate Practice", "Advanced Topics", "Real-world Applications");
    }

    private double calculateAnswerScore(String answer, String correctAnswer) {
        if (answer == null || correctAnswer == null) return 0.0;
        if (answer.equalsIgnoreCase(correctAnswer)) return 1.0;
        
        String[] answerWords = answer.toLowerCase().split("\\s+");
        String[] correctWords = correctAnswer.toLowerCase().split("\\s+");
        
        int matches = 0;
        for (String word : answerWords) {
            for (String correct : correctWords) {
                if (word.equals(correct)) matches++;
            }
        }
        
        return Math.min(1.0, (double) matches / correctWords.length);
    }

    private String generateFeedback(String answer, String correctAnswer, double score) {
        if (score >= 0.9) return "🎉 Excellent! Your answer is correct and well-formulated.";
        if (score >= 0.7) return "👍 Good effort! You're on the right track. Consider refining your answer slightly.";
        if (score >= 0.5) return "📚 Partial credit. You have some correct elements, but review the key concepts.";
        return "💪 Keep practicing! Review the material and try again.";
    }

    private List<String> generateImprovementSuggestions(String answer, String subject) {
        return Arrays.asList(
            "Practice more examples of this type",
            "Review the fundamental concepts",
            "Try explaining your reasoning step by step",
            "Create flashcards for key terms"
        );
    }

    private List<Map<String, Object>> createLearningPath(String subject, String currentLevel, String targetLevel) {
        List<Map<String, Object>> path = new ArrayList<>();
        
        path.add(Map.of(
            "step", 1,
            "title", "Foundation Review",
            "duration", "2 weeks",
            "hours", 10,
            "topics", Arrays.asList("Basic concepts", "Key vocabulary", "Simple exercises"),
            "status", "not_started"
        ));
        
        path.add(Map.of(
            "step", 2,
            "title", "Intermediate Skills",
            "duration", "4 weeks",
            "hours", 20,
            "topics", Arrays.asList("Complex grammar", "Reading comprehension", "Writing practice"),
            "status", "not_started"
        ));
        
        path.add(Map.of(
            "step", 3,
            "title", "Advanced Application",
            "duration", "4 weeks",
            "hours", 20,
            "topics", Arrays.asList("Real-world usage", "Exam preparation", "Fluency practice"),
            "status", "not_started"
        ));
        
        path.add(Map.of(
            "step", 4,
            "title", "Mastery & Certification",
            "duration", "2 weeks",
            "hours", 10,
            "topics", Arrays.asList("Mock exams", "Final assessment", "Certification test"),
            "status", "not_started"
        ));
        
        return path;
    }

    private List<Map<String, Object>> generatePracticeQuestions(String topic, String level, int count) {
        List<Map<String, Object>> questions = new ArrayList<>();
        
        String[] sampleQuestions = {
            "Fill in the blank: She ___ to the store yesterday. (go)",
            "Choose the correct article: ___ apple a day keeps the doctor away.",
            "Identify the tense: 'I have been studying for three hours.'",
            "Select the correct preposition: The book is ___ the table.",
            "Correct the sentence: He don't like ice cream."
        };
        
        String[] answers = {"went", "An", "Present Perfect Continuous", "on", "He doesn't like ice cream."};
        
        for (int i = 0; i < Math.min(count, sampleQuestions.length); i++) {
            questions.add(Map.of(
                "id", i + 1,
                "question", sampleQuestions[i],
                "type", "fill_blank",
                "difficulty", level,
                "correctAnswer", answers[i],
                "points", 10
            ));
        }
        
        return questions;
    }
}
