package com.lera.social_media_service.controller;

import com.lera.social_media_service.entity.HashtagGroup;
import com.lera.social_media_service.repository.HashtagGroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/hashtag-groups")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','STAFF')")
public class HashtagGroupController {
    
    private final HashtagGroupRepository hashtagGroupRepository;
    
    @GetMapping
    public ResponseEntity<List<HashtagGroup>> getAllGroups() {
        return ResponseEntity.ok(hashtagGroupRepository.findByIsActiveTrueOrderByUseCountDesc());
    }
    
    @GetMapping("/all")
    public ResponseEntity<List<HashtagGroup>> getAllGroupsIncludingInactive(Pageable pageable) {
        return ResponseEntity.ok(hashtagGroupRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<HashtagGroup> getGroupById(@PathVariable UUID id) {
        return hashtagGroupRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/category/{category}")
    public ResponseEntity<List<HashtagGroup>> getGroupsByCategory(@PathVariable String category) {
        return ResponseEntity.ok(hashtagGroupRepository.findByCategoryAndIsActiveTrue(category));
    }
    
    @PostMapping
    public ResponseEntity<HashtagGroup> createGroup(@Valid @RequestBody HashtagGroup group) {
        group.setCreatedAt(LocalDateTime.now());
        group.setUpdatedAt(LocalDateTime.now());
        group.setUseCount(0);
        return ResponseEntity.ok(hashtagGroupRepository.save(group));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<HashtagGroup> updateGroup(@PathVariable UUID id, @Valid @RequestBody HashtagGroup details) {
        return hashtagGroupRepository.findById(id).map(group -> {
            if (details.getName() != null) group.setName(details.getName());
            if (details.getDescription() != null) group.setDescription(details.getDescription());
            if (details.getHashtags() != null) group.setHashtags(details.getHashtags());
            if (details.getCategory() != null) group.setCategory(details.getCategory());
            if (details.getIsActive() != null) group.setIsActive(details.getIsActive());
            group.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(hashtagGroupRepository.save(group));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/use")
    public ResponseEntity<HashtagGroup> incrementUseCount(@PathVariable UUID id) {
        return hashtagGroupRepository.findById(id).map(group -> {
            group.setUseCount(group.getUseCount() + 1);
            group.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(hashtagGroupRepository.save(group));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(@PathVariable UUID id) {
        if (hashtagGroupRepository.existsById(id)) {
            hashtagGroupRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
