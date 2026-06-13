package com.lera.social_media_service.controller;

import com.lera.social_media_service.entity.CommunityEvent;
import com.lera.social_media_service.entity.CommunityPost;
import com.lera.social_media_service.repository.CommunityEventRepository;
import com.lera.social_media_service.repository.CommunityPostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Community feed (posts, events, likes, event registration) — now DB-backed (was an in-memory stub).
 * Frontend: GET/POST /api/social-media/posts, POST /posts/{id}/like, GET /api/social-media/events,
 * POST /events/{id}/register.
 */
@RestController
@RequestMapping("/api/social-media")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("isAuthenticated()")
public class SocialController {

    private final CommunityPostRepository posts;
    private final CommunityEventRepository events;

    private Map<String, Object> toPostMap(CommunityPost p) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", p.getId());
        m.put("authorId", p.getAuthorId());
        m.put("authorName", p.getAuthorName());
        m.put("authorAvatar", p.getAuthorAvatar());
        m.put("content", p.getContent());
        m.put("imageUrl", p.getImageUrl());
        m.put("likes", p.getLikes());
        m.put("comments", p.getComments());
        m.put("shares", p.getShares());
        m.put("isLiked", false);
        m.put("createdAt", p.getCreatedAt());
        return m;
    }

    private Map<String, Object> toEventMap(CommunityEvent e) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", e.getId());
        m.put("title", e.getTitle());
        m.put("description", e.getDescription());
        m.put("date", e.getEventDate());
        m.put("location", e.getLocation());
        m.put("organizerId", e.getOrganizerId());
        m.put("organizerName", e.getOrganizerName());
        m.put("attendees", e.getAttendees());
        m.put("maxAttendees", e.getMaxAttendees());
        m.put("isRegistered", false);
        m.put("status", e.getStatus());
        return m;
    }

    @GetMapping("/posts")
    public ResponseEntity<List<Map<String, Object>>> getPosts(@RequestParam(required = false) UUID centerId,
                                                              @RequestParam(required = false) String type) {
        List<CommunityPost> list = centerId != null
                ? posts.findByCenterIdOrderByCreatedAtDesc(centerId) : posts.findAllByOrderByCreatedAtDesc();
        return ResponseEntity.ok(list.stream().map(this::toPostMap).collect(Collectors.toList()));
    }

    @PostMapping("/posts")
    public ResponseEntity<Map<String, Object>> createPost(@RequestBody Map<String, Object> req) {
        CommunityPost p = new CommunityPost();
        if (req.get("authorId") != null) {
            try { p.setAuthorId(UUID.fromString(req.get("authorId").toString())); } catch (IllegalArgumentException ignored) {}
        }
        p.setAuthorName(str(req.getOrDefault("authorName", "User")));
        p.setAuthorAvatar(str(req.get("authorAvatar")));
        p.setContent(str(req.get("content")));
        p.setImageUrl(str(req.get("imageUrl")));
        if (req.get("centerId") != null) {
            try { p.setCenterId(UUID.fromString(req.get("centerId").toString())); } catch (IllegalArgumentException ignored) {}
        }
        return ResponseEntity.ok(toPostMap(posts.save(p)));
    }

    @PostMapping("/posts/{id}/like")
    public ResponseEntity<Map<String, Object>> likePost(@PathVariable UUID id) {
        return posts.findById(id).map(p -> {
            p.setLikes((p.getLikes() != null ? p.getLikes() : 0) + 1);
            posts.save(p);
            return ResponseEntity.ok(Map.<String, Object>of("postId", id, "liked", true, "likes", p.getLikes()));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/events")
    public ResponseEntity<List<Map<String, Object>>> getEvents(@RequestParam(required = false) UUID centerId,
                                                               @RequestParam(required = false) String status) {
        List<CommunityEvent> list;
        if (centerId != null) list = events.findByCenterIdOrderByEventDateAsc(centerId);
        else if (status != null && !status.isBlank()) list = events.findByStatusOrderByEventDateAsc(status);
        else list = events.findAllByOrderByEventDateAsc();
        return ResponseEntity.ok(list.stream().map(this::toEventMap).collect(Collectors.toList()));
    }

    @PostMapping("/events")
    public ResponseEntity<Map<String, Object>> createEvent(@RequestBody Map<String, Object> req) {
        CommunityEvent e = new CommunityEvent();
        e.setTitle(str(req.get("title")));
        e.setDescription(str(req.get("description")));
        e.setLocation(str(req.get("location")));
        e.setOrganizerName(str(req.get("organizerName")));
        if (req.get("maxAttendees") != null) {
            try { e.setMaxAttendees(Integer.valueOf(req.get("maxAttendees").toString())); } catch (NumberFormatException ignored) {}
        }
        if (req.get("date") != null) {
            try { e.setEventDate(java.time.LocalDateTime.parse(req.get("date").toString())); } catch (Exception ignored) {}
        }
        return ResponseEntity.ok(toEventMap(events.save(e)));
    }

    @PostMapping("/events/{id}/register")
    public ResponseEntity<Map<String, Object>> registerForEvent(@PathVariable UUID id,
                                                                @RequestBody(required = false) Map<String, Object> req) {
        return events.findById(id).map(e -> {
            e.setAttendees((e.getAttendees() != null ? e.getAttendees() : 0) + 1);
            events.save(e);
            return ResponseEntity.ok(Map.<String, Object>of("eventId", id, "registered", true, "attendees", e.getAttendees()));
        }).orElse(ResponseEntity.notFound().build());
    }

    private static String str(Object o) { return o != null ? o.toString() : null; }
}
