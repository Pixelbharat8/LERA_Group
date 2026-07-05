package com.lera.academy_service.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Fetches a Google Sheet as CSV so the bulk importer can consume it — no Google OAuth/API key.
 * The user just shares the sheet as "Anyone with the link can view" (or Publish to web).
 *
 * SSRF-safe: we NEVER fetch the user-supplied URL. We extract the sheet id from a docs.google.com
 * link and fetch a URL we construct ourselves against docs.google.com's CSV export endpoint.
 */
@Slf4j
@RestController
@RequestMapping("/api/import")
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
public class GoogleSheetImportController {

    private static final Pattern SHEET_ID = Pattern.compile("/spreadsheets/d/([a-zA-Z0-9-_]+)");
    private static final Pattern GID = Pattern.compile("[?#&]gid=([0-9]+)");
    private static final int MAX_CSV_BYTES = 5_000_000; // 5 MB cap

    private final HttpClient http = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @PostMapping("/google-sheet")
    public ResponseEntity<Map<String, Object>> fetchSheet(@RequestBody Map<String, String> body) {
        String url = body == null ? "" : body.getOrDefault("url", "").trim();
        if (url.isEmpty()) {
            return ResponseEntity.ok(Map.of("success", false, "error", "Paste a Google Sheets link."));
        }

        URI uri;
        try {
            uri = URI.create(url);
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("success", false, "error", "That doesn't look like a valid URL."));
        }
        String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
        if (!host.equals("docs.google.com")) {
            return ResponseEntity.ok(Map.of("success", false,
                    "error", "Only Google Sheets links (docs.google.com) are allowed."));
        }
        Matcher idm = SHEET_ID.matcher(uri.getPath() == null ? "" : uri.getPath());
        if (!idm.find()) {
            return ResponseEntity.ok(Map.of("success", false,
                    "error", "Not a Google Sheets link — expected .../spreadsheets/d/<id>/…"));
        }
        String sheetId = idm.group(1);
        String gid = "0";
        Matcher gm = GID.matcher(url);
        if (gm.find()) gid = gm.group(1);

        // Constructed by us against docs.google.com only — the user URL is never fetched.
        String exportUrl = "https://docs.google.com/spreadsheets/d/" + sheetId + "/export?format=csv&gid=" + gid;
        try {
            HttpRequest req = HttpRequest.newBuilder(URI.create(exportUrl))
                    .timeout(Duration.ofSeconds(20))
                    .header("User-Agent", "LERA-Import/1.0")
                    .GET().build();
            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            String contentType = resp.headers().firstValue("content-type").orElse("").toLowerCase();
            String csv = resp.body() == null ? "" : resp.body();

            // A non-public sheet redirects to an HTML sign-in page instead of CSV.
            if (resp.statusCode() != 200 || contentType.contains("text/html") || csv.stripLeading().startsWith("<")) {
                return ResponseEntity.ok(Map.of("success", false,
                        "error", "Couldn't read that sheet. Share it as “Anyone with the link can view” (Share → General access → Anyone with the link → Viewer), then try again."));
            }
            if (csv.length() > MAX_CSV_BYTES) {
                return ResponseEntity.ok(Map.of("success", false,
                        "error", "That sheet is too large (over 5 MB of CSV). Split it into smaller imports."));
            }
            return ResponseEntity.ok(Map.of("success", true, "csv", csv));
        } catch (Exception e) {
            log.warn("Google Sheet fetch failed for id {}: {}", sheetId, e.getMessage());
            return ResponseEntity.ok(Map.of("success", false,
                    "error", "Failed to fetch the sheet. Check the link and sharing settings, then retry."));
        }
    }
}
