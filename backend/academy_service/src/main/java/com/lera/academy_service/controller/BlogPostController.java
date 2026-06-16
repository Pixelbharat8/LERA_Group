package com.lera.academy_service.controller;

import com.lera.academy_service.entity.BlogPost;
import com.lera.academy_service.repository.BlogPostRepository;
import com.lera.academy_service.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/blog")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF','STUDENT','PARENT')")
public class BlogPostController {
    
    private final BlogPostRepository blogPostRepository;
    
    /**
     * Full list including drafts — staff only. Non-staff should use
     * {@code /published}, {@code /audience/...}, or single-post routes that
     * enforce visibility.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF')")
    public ResponseEntity<List<BlogPost>> getAllPosts() {
        return ResponseEntity.ok(blogPostRepository.findAllByOrderByCreatedAtDesc());
    }
    
    // Get published posts (public)
    @GetMapping("/published")
    @PreAuthorize("permitAll()")
    public ResponseEntity<List<BlogPost>> getPublishedPosts() {
        return ResponseEntity.ok(blogPostRepository.findByStatusOrderByPublishedAtDesc("published"));
    }
    
    // Get featured posts
    @GetMapping("/featured")
    @PreAuthorize("permitAll()")
    public ResponseEntity<List<BlogPost>> getFeaturedPosts() {
        return ResponseEntity.ok(blogPostRepository.findByIsFeaturedTrueAndStatusOrderByPublishedAtDesc("published"));
    }

    /**
     * Posts curated for a particular audience. Used by the parent / student
     * resources hubs.
     *
     * <p>Authorisation: staff roles can read any audience (editorial / preview
     * use); non-staff roles can only ask for the audience that matches their
     * own role or {@code ALL}. This stops a student from harvesting parent-
     * only posts via the URL (e.g. {@code /api/blog/audience/PARENT}).
     *
     * <p>{@code status} defaults to "published" so callers get only live posts.
     * Non-staff are forced to "published"; the {@code status=any} draft view
     * is staff-only — drafts must never leak to end users.
     */
    @GetMapping("/audience/{audience}")
    public ResponseEntity<List<BlogPost>> getByAudience(
            @PathVariable String audience,
            @RequestParam(required = false, defaultValue = "published") String status) {
        String requested = audience == null ? "" : audience.toUpperCase(Locale.ROOT);
        if (!CurrentUser.isStaff()) {
            String myAudience = roleToAudience(CurrentUser.role());
            if (!"ALL".equals(requested) && !requested.equals(myAudience)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "You can only request audience=ALL or audience=" + myAudience);
            }
            // Non-staff never see drafts, even if they pass status=any.
            status = "published";
        }
        if ("any".equalsIgnoreCase(status)) {
            return ResponseEntity.ok(blogPostRepository.findByAudienceOrderByCreatedAtDesc(requested));
        }
        return ResponseEntity.ok(blogPostRepository.findByAudienceAndStatusOrderByPublishedAtDesc(requested, status));
    }

    /**
     * Map a JWT role to the audience tag a non-staff user is allowed to read.
     * Anything not explicitly mapped falls back to ALL — better to over-share
     * the public audience than to crash on a role we haven't catalogued yet.
     */
    private static String roleToAudience(String role) {
        if (role == null) return "ALL";
        return switch (role.toUpperCase(Locale.ROOT)) {
            case "PARENT" -> "PARENT";
            case "STUDENT" -> "STUDENT";
            case "TEACHER" -> "TEACHER";
            default -> "ALL";
        };
    }

    /**
     * Staff may read any post; others only see published posts whose audience is
     * {@code ALL} or matches their role bucket (same rules as
     * {@link #getByAudience}).
     */
    private boolean canReadPost(BlogPost post) {
        if (CurrentUser.isStaff()) {
            return true;
        }
        if (post.getStatus() == null || !"published".equalsIgnoreCase(post.getStatus())) {
            return false;
        }
        String aud = post.getAudience() == null ? "ALL" : post.getAudience().toUpperCase(Locale.ROOT);
        if ("ALL".equals(aud)) {
            return true;
        }
        String mine = roleToAudience(CurrentUser.role());
        return aud.equals(mine);
    }
    
    // Get posts by category
    @GetMapping("/category/{category}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<List<BlogPost>> getPostsByCategory(@PathVariable String category) {
        return ResponseEntity.ok(blogPostRepository.findByCategoryAndStatusOrderByPublishedAtDesc(category, "published"));
    }
    
    // Get single post by ID
    @GetMapping("/{id}")
    public ResponseEntity<BlogPost> getPostById(@PathVariable UUID id) {
        Optional<BlogPost> opt = blogPostRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        BlogPost post = opt.get();
        if (!canReadPost(post)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(post);
    }
    
    // Get single post by slug (for public URLs)
    @GetMapping("/slug/{slug}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<BlogPost> getPostBySlug(@PathVariable String slug) {
        Optional<BlogPost> opt = blogPostRepository.findBySlug(slug);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        BlogPost post = opt.get();
        if (!canReadPost(post)) {
            return ResponseEntity.notFound().build();
        }
        post.setViews(post.getViews() + 1);
        blogPostRepository.save(post);
        return ResponseEntity.ok(post);
    }
    
    // Create blog post
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF')")
    public ResponseEntity<BlogPost> createPost(@Valid @RequestBody BlogPost post) {
        if ("published".equals(post.getStatus()) && post.getPublishedAt() == null) {
            post.setPublishedAt(LocalDateTime.now());
        }
        return ResponseEntity.ok(blogPostRepository.save(post));
    }
    
    // Update blog post
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF')")
    public ResponseEntity<BlogPost> updatePost(@PathVariable UUID id, @Valid @RequestBody BlogPost postDetails) {
        return blogPostRepository.findById(id).map(post -> {
            if (postDetails.getTitleEn() != null) post.setTitleEn(postDetails.getTitleEn());
            if (postDetails.getTitleVi() != null) post.setTitleVi(postDetails.getTitleVi());
            if (postDetails.getExcerptEn() != null) post.setExcerptEn(postDetails.getExcerptEn());
            if (postDetails.getExcerptVi() != null) post.setExcerptVi(postDetails.getExcerptVi());
            if (postDetails.getContentEn() != null) post.setContentEn(postDetails.getContentEn());
            if (postDetails.getContentVi() != null) post.setContentVi(postDetails.getContentVi());
            if (postDetails.getImageUrl() != null) post.setImageUrl(postDetails.getImageUrl());
            if (postDetails.getCategory() != null) post.setCategory(postDetails.getCategory());
            if (postDetails.getAuthor() != null) post.setAuthor(postDetails.getAuthor());
            if (postDetails.getSlug() != null) post.setSlug(postDetails.getSlug());
            if (postDetails.getStatus() != null) {
                // If publishing for the first time, set publishedAt
                if ("published".equals(postDetails.getStatus()) && !"published".equals(post.getStatus())) {
                    post.setPublishedAt(LocalDateTime.now());
                }
                post.setStatus(postDetails.getStatus());
            }
            if (postDetails.getIsFeatured() != null) post.setIsFeatured(postDetails.getIsFeatured());
            if (postDetails.getScheduledAt() != null) post.setScheduledAt(postDetails.getScheduledAt());
            if (postDetails.getAudience() != null) post.setAudience(postDetails.getAudience().toUpperCase());
            
            return ResponseEntity.ok(blogPostRepository.save(post));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    // Delete blog post
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF')")
    public ResponseEntity<Void> deletePost(@PathVariable UUID id) {
        if (blogPostRepository.existsById(id)) {
            blogPostRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    // Publish a post
    @PutMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF')")
    public ResponseEntity<BlogPost> publishPost(@PathVariable UUID id) {
        return blogPostRepository.findById(id).map(post -> {
            post.setStatus("published");
            post.setPublishedAt(LocalDateTime.now());
            return ResponseEntity.ok(blogPostRepository.save(post));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    // Unpublish a post
    @PutMapping("/{id}/unpublish")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF')")
    public ResponseEntity<BlogPost> unpublishPost(@PathVariable UUID id) {
        return blogPostRepository.findById(id).map(post -> {
            post.setStatus("draft");
            return ResponseEntity.ok(blogPostRepository.save(post));
        }).orElse(ResponseEntity.notFound().build());
    }
}
