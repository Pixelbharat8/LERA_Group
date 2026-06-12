package com.lera.social_media_service.service;

import com.lera.social_media_service.entity.*;
import com.lera.social_media_service.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ContentServiceTest {

    @Mock
    private ContentTemplateRepository templateRepository;
    @Mock
    private HashtagGroupRepository hashtagGroupRepository;
    @Mock
    private SocialMediaPostRepository postRepository;

    @InjectMocks
    private ContentService contentService;

    private ContentTemplate testTemplate;
    private HashtagGroup testGroup;
    private UUID templateId;
    private UUID groupId;

    @BeforeEach
    void setUp() {
        templateId = UUID.randomUUID();
        groupId = UUID.randomUUID();

        testTemplate = new ContentTemplate();
        testTemplate.setId(templateId);
        testTemplate.setName("Promo Template");
        testTemplate.setContentTemplate("Hello {{name}}, welcome to {{course}}!");
        testTemplate.setCategory("promotion");
        testTemplate.setIsActive(true);
        testTemplate.setUseCount(5);
        testTemplate.setPlatforms(new String[]{"facebook", "instagram"});
        testTemplate.setMediaUrls(new String[]{"https://example.com/img.jpg"});
        testTemplate.setHashtags(new String[]{"#lera", "#education"});

        testGroup = new HashtagGroup();
        testGroup.setId(groupId);
        testGroup.setName("Education Tags");
        testGroup.setHashtags(new String[]{"#education", "#learning", "#english"});
        testGroup.setIsActive(true);
        testGroup.setUseCount(3);
    }

    // ============ Template CRUD ============

    @Test
    void createTemplate_shouldSetDefaults() {
        when(templateRepository.save(any(ContentTemplate.class))).thenAnswer(inv -> inv.getArgument(0));
        ContentTemplate t = new ContentTemplate();
        t.setName("New");
        ContentTemplate result = contentService.createTemplate(t);
        assertEquals(0, result.getUseCount());
        assertNotNull(result.getCreatedAt());
    }

    @Test
    void updateTemplate_shouldUpdateFields() {
        when(templateRepository.findById(templateId)).thenReturn(Optional.of(testTemplate));
        when(templateRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ContentTemplate details = new ContentTemplate();
        details.setName("Updated Name");
        details.setCategory("event");

        ContentTemplate result = contentService.updateTemplate(templateId, details);
        assertEquals("Updated Name", result.getName());
        assertEquals("event", result.getCategory());
        assertNotNull(result.getUpdatedAt());
    }

    @Test
    void updateTemplate_notFound_shouldThrow() {
        UUID id = UUID.randomUUID();
        when(templateRepository.findById(id)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> contentService.updateTemplate(id, new ContentTemplate()));
    }

    @Test
    void deleteTemplate_shouldDelegate() {
        contentService.deleteTemplate(templateId);
        verify(templateRepository).deleteById(templateId);
    }

    @Test
    void getTemplateById_shouldReturn() {
        when(templateRepository.findById(templateId)).thenReturn(Optional.of(testTemplate));
        assertTrue(contentService.getTemplateById(templateId).isPresent());
    }

    @Test
    void getAllTemplates_shouldReturnAll() {
        when(templateRepository.findAll()).thenReturn(List.of(testTemplate));
        assertEquals(1, contentService.getAllTemplates().size());
    }

    @Test
    void getActiveTemplates_shouldReturnActive() {
        when(templateRepository.findByIsActiveTrueOrderByUseCountDesc()).thenReturn(List.of(testTemplate));
        assertEquals(1, contentService.getActiveTemplates().size());
    }

    // ============ Template Usage ============

    @Test
    void createPostFromTemplate_shouldReplaceVariables() {
        when(templateRepository.findById(templateId)).thenReturn(Optional.of(testTemplate));
        when(templateRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(postRepository.save(any(SocialMediaPost.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, String> vars = Map.of("name", "John", "course", "English");
        SocialMediaPost result = contentService.createPostFromTemplate(templateId, vars);

        assertEquals("Hello John, welcome to English!", result.getContent());
        assertEquals("draft", result.getStatus());
        assertEquals(6, testTemplate.getUseCount()); // incremented from 5
    }

    @Test
    void previewTemplate_shouldReplaceVariables() {
        when(templateRepository.findById(templateId)).thenReturn(Optional.of(testTemplate));
        String result = contentService.previewTemplate(templateId, Map.of("name", "Jane", "course", "Math"));
        assertEquals("Hello Jane, welcome to Math!", result);
    }

    // ============ Hashtag Groups ============

    @Test
    void createHashtagGroup_shouldSetDefaults() {
        when(hashtagGroupRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        HashtagGroup g = new HashtagGroup();
        g.setName("New Group");
        HashtagGroup result = contentService.createHashtagGroup(g);
        assertEquals(0, result.getUseCount());
        assertNotNull(result.getCreatedAt());
    }

    @Test
    void getHashtagsAsString_shouldJoinAndIncrementCount() {
        when(hashtagGroupRepository.findById(groupId)).thenReturn(Optional.of(testGroup));
        when(hashtagGroupRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        String result = contentService.getHashtagsAsString(groupId);
        assertEquals("#education #learning #english", result);
        assertEquals(4, testGroup.getUseCount()); // incremented from 3
    }

    @Test
    void combineHashtagGroups_shouldMergeUnique() {
        HashtagGroup g2 = new HashtagGroup();
        g2.setId(UUID.randomUUID());
        g2.setHashtags(new String[]{"#english", "#lera", "#academy"});
        g2.setUseCount(0);

        when(hashtagGroupRepository.findById(groupId)).thenReturn(Optional.of(testGroup));
        when(hashtagGroupRepository.findById(g2.getId())).thenReturn(Optional.of(g2));
        when(hashtagGroupRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        String[] result = contentService.combineHashtagGroups(List.of(groupId, g2.getId()));
        // Should be unique set: #education, #learning, #english, #lera, #academy
        assertEquals(5, result.length);
    }

    // ============ Content Suggestions ============

    @Test
    void suggestContent_shouldReturnStructuredMap() {
        when(templateRepository.findByCategoryAndIsActiveTrue("english")).thenReturn(List.of(testTemplate));
        when(hashtagGroupRepository.findByCategoryAndIsActiveTrue("english")).thenReturn(List.of(testGroup));

        Map<String, Object> result = contentService.suggestContent("english", "instagram");
        assertNotNull(result.get("templates"));
        assertNotNull(result.get("hashtagGroups"));
        assertNotNull(result.get("bestPostingTimes"));
    }

    // ============ Content Calendar ============

    @Test
    void getScheduledContent_shouldDelegate() {
        LocalDateTime start = LocalDateTime.now();
        LocalDateTime end = start.plusDays(7);
        when(postRepository.findByScheduledAtBetweenOrderByScheduledAtAsc(start, end)).thenReturn(List.of());

        List<SocialMediaPost> result = contentService.getScheduledContent(start, end);
        assertEquals(0, result.size());
    }
}
