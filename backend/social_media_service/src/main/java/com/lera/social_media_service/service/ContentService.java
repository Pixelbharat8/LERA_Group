package com.lera.social_media_service.service;

import com.lera.social_media_service.entity.*;
import com.lera.social_media_service.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ContentService {
    
    private final ContentTemplateRepository templateRepository;
    private final HashtagGroupRepository hashtagGroupRepository;
    private final SocialMediaPostRepository postRepository;
    
    // ===================== CONTENT TEMPLATE CRUD =====================
    
    @CacheEvict(value = "templates", allEntries = true)
    public ContentTemplate createTemplate(ContentTemplate template) {
        template.setCreatedAt(LocalDateTime.now());
        template.setUseCount(0);
        return templateRepository.save(template);
    }
    
    @CacheEvict(value = "templates", allEntries = true)
    public ContentTemplate updateTemplate(UUID id, ContentTemplate details) {
        ContentTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found: " + id));
        
        if (details.getName() != null) template.setName(details.getName());
        if (details.getContentTemplate() != null) template.setContentTemplate(details.getContentTemplate());
        if (details.getCategory() != null) template.setCategory(details.getCategory());
        if (details.getHashtags() != null) template.setHashtags(details.getHashtags());
        if (details.getPlatforms() != null) template.setPlatforms(details.getPlatforms());
        if (details.getMediaUrls() != null) template.setMediaUrls(details.getMediaUrls());
        if (details.getIsActive() != null) template.setIsActive(details.getIsActive());
        if (details.getDescription() != null) template.setDescription(details.getDescription());
        if (details.getTemplateType() != null) template.setTemplateType(details.getTemplateType());
        
        template.setUpdatedAt(LocalDateTime.now());
        
        return templateRepository.save(template);
    }
    
    @CacheEvict(value = "templates", allEntries = true)
    public void deleteTemplate(UUID id) {
        templateRepository.deleteById(id);
    }
    
    @Cacheable(value = "templates", key = "#id")
    public Optional<ContentTemplate> getTemplateById(UUID id) {
        return templateRepository.findById(id);
    }
    
    @Cacheable(value = "templates", key = "'all'")
    public List<ContentTemplate> getAllTemplates() {
        return templateRepository.findAll();
    }
    
    // ===================== TEMPLATE QUERIES =====================
    
    public List<ContentTemplate> getTemplatesByCategory(String category) {
        return templateRepository.findByCategory(category);
    }
    
    public List<ContentTemplate> getTemplatesByTemplateType(String templateType) {
        return templateRepository.findByTemplateType(templateType);
    }
    
    @Cacheable(value = "templates", key = "'active'")
    public List<ContentTemplate> getActiveTemplates() {
        return templateRepository.findByIsActiveTrueOrderByUseCountDesc();
    }
    
    public List<ContentTemplate> getActiveTemplatesByCategory(String category) {
        return templateRepository.findByCategoryAndIsActiveTrue(category);
    }
    
    public List<ContentTemplate> getMostUsedTemplates(int limit) {
        return templateRepository.findByIsActiveTrueOrderByUseCountDesc().stream()
                .limit(limit)
                .toList();
    }
    
    public List<ContentTemplate> getTemplatesByCreator(UUID createdBy) {
        return templateRepository.findByCreatedBy(createdBy);
    }
    
    // ===================== TEMPLATE USAGE =====================
    
    public SocialMediaPost createPostFromTemplate(UUID templateId, Map<String, String> variables) {
        ContentTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new RuntimeException("Template not found: " + templateId));
        
        String content = template.getContentTemplate();
        
        // Replace variables in template
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            content = content.replace("{{" + entry.getKey() + "}}", entry.getValue());
        }
        
        SocialMediaPost post = new SocialMediaPost();
        post.setContent(content);
        if (template.getMediaUrls() != null && template.getMediaUrls().length > 0) {
            post.setMediaUrl(template.getMediaUrls()[0]);
            post.setMediaUrls(template.getMediaUrls());
        }
        post.setPlatforms(template.getPlatforms());
        post.setHashtags(template.getHashtags());
        post.setStatus("draft");
        
        // Update template usage count
        template.setUseCount(template.getUseCount() + 1);
        templateRepository.save(template);
        
        return postRepository.save(post);
    }
    
    public String previewTemplate(UUID templateId, Map<String, String> variables) {
        ContentTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new RuntimeException("Template not found: " + templateId));
        
        String content = template.getContentTemplate();
        
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            content = content.replace("{{" + entry.getKey() + "}}", entry.getValue());
        }
        
        return content;
    }
    
    // ===================== HASHTAG GROUP CRUD =====================
    
    @CacheEvict(value = "hashtags", allEntries = true)
    public HashtagGroup createHashtagGroup(HashtagGroup group) {
        group.setCreatedAt(LocalDateTime.now());
        group.setUseCount(0);
        return hashtagGroupRepository.save(group);
    }
    
    @CacheEvict(value = "hashtags", allEntries = true)
    public HashtagGroup updateHashtagGroup(UUID id, HashtagGroup details) {
        HashtagGroup group = hashtagGroupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hashtag group not found: " + id));
        
        if (details.getName() != null) group.setName(details.getName());
        if (details.getHashtags() != null) group.setHashtags(details.getHashtags());
        if (details.getCategory() != null) group.setCategory(details.getCategory());
        if (details.getDescription() != null) group.setDescription(details.getDescription());
        if (details.getIsActive() != null) group.setIsActive(details.getIsActive());
        
        group.setUpdatedAt(LocalDateTime.now());
        
        return hashtagGroupRepository.save(group);
    }
    
    @CacheEvict(value = "hashtags", allEntries = true)
    public void deleteHashtagGroup(UUID id) {
        hashtagGroupRepository.deleteById(id);
    }
    
    @Cacheable(value = "hashtags", key = "#id")
    public Optional<HashtagGroup> getHashtagGroupById(UUID id) {
        return hashtagGroupRepository.findById(id);
    }
    
    @Cacheable(value = "hashtags", key = "'all'")
    public List<HashtagGroup> getAllHashtagGroups() {
        return hashtagGroupRepository.findAll();
    }
    
    // ===================== HASHTAG QUERIES =====================
    
    public List<HashtagGroup> getHashtagGroupsByCategory(String category) {
        return hashtagGroupRepository.findByCategory(category);
    }
    
    @Cacheable(value = "hashtags", key = "'active'")
    public List<HashtagGroup> getActiveHashtagGroups() {
        return hashtagGroupRepository.findByIsActiveTrueOrderByUseCountDesc();
    }
    
    public List<HashtagGroup> getActiveHashtagGroupsByCategory(String category) {
        return hashtagGroupRepository.findByCategoryAndIsActiveTrue(category);
    }
    
    public List<HashtagGroup> getMostUsedHashtagGroups(int limit) {
        return hashtagGroupRepository.findByIsActiveTrueOrderByUseCountDesc().stream()
                .limit(limit)
                .toList();
    }
    
    // ===================== HASHTAG USAGE =====================
    
    public String getHashtagsAsString(UUID groupId) {
        HashtagGroup group = hashtagGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Hashtag group not found: " + groupId));
        
        // Update usage count
        group.setUseCount(group.getUseCount() + 1);
        hashtagGroupRepository.save(group);
        
        String[] hashtags = group.getHashtags();
        if (hashtags == null || hashtags.length == 0) {
            return "";
        }
        
        return String.join(" ", hashtags);
    }
    
    public String[] combineHashtagGroups(List<UUID> groupIds) {
        Set<String> allHashtags = new LinkedHashSet<>();
        
        for (UUID groupId : groupIds) {
            HashtagGroup group = hashtagGroupRepository.findById(groupId).orElse(null);
            if (group != null && group.getHashtags() != null) {
                allHashtags.addAll(Arrays.asList(group.getHashtags()));
                
                // Update usage
                group.setUseCount(group.getUseCount() + 1);
                hashtagGroupRepository.save(group);
            }
        }
        
        return allHashtags.toArray(new String[0]);
    }
    
    // ===================== CONTENT SUGGESTIONS =====================
    
    public Map<String, Object> suggestContent(String topic, String platform) {
        Map<String, Object> suggestions = new HashMap<>();
        
        // Find relevant templates by category
        List<ContentTemplate> templates = templateRepository.findByCategoryAndIsActiveTrue(topic);
        if (templates.isEmpty()) {
            templates = templateRepository.findByIsActiveTrueOrderByUseCountDesc();
        }
        suggestions.put("templates", templates.stream().limit(5).toList());
        
        // Find relevant hashtag groups by category
        List<HashtagGroup> hashtagGroups = hashtagGroupRepository.findByCategoryAndIsActiveTrue(topic);
        if (hashtagGroups.isEmpty()) {
            hashtagGroups = hashtagGroupRepository.findByIsActiveTrueOrderByUseCountDesc();
        }
        suggestions.put("hashtagGroups", hashtagGroups.stream().limit(5).toList());
        
        // Suggest best posting times (simplified - in production, use ML/analytics)
        Map<String, String[]> bestTimes = new HashMap<>();
        bestTimes.put("instagram", new String[]{"9:00 AM", "12:00 PM", "7:00 PM"});
        bestTimes.put("facebook", new String[]{"1:00 PM", "4:00 PM", "8:00 PM"});
        bestTimes.put("tiktok", new String[]{"7:00 AM", "12:00 PM", "9:00 PM"});
        bestTimes.put("youtube", new String[]{"2:00 PM", "4:00 PM", "9:00 PM"});
        suggestions.put("bestPostingTimes", platform != null ? bestTimes.get(platform.toLowerCase()) : bestTimes);
        
        return suggestions;
    }
    
    // ===================== CONTENT CALENDAR =====================
    
    public List<SocialMediaPost> getScheduledContent(LocalDateTime start, LocalDateTime end) {
        return postRepository.findByScheduledAtBetweenOrderByScheduledAtAsc(start, end);
    }
    
    public Map<String, List<SocialMediaPost>> getContentCalendar(LocalDateTime start, LocalDateTime end) {
        List<SocialMediaPost> posts = postRepository.findByScheduledAtBetweenOrderByScheduledAtAsc(start, end);
        
        Map<String, List<SocialMediaPost>> calendar = new LinkedHashMap<>();
        
        for (SocialMediaPost post : posts) {
            if (post.getScheduledAt() != null) {
                String dateKey = post.getScheduledAt().toLocalDate().toString();
                calendar.computeIfAbsent(dateKey, k -> new ArrayList<>()).add(post);
            }
        }
        
        return calendar;
    }
}
