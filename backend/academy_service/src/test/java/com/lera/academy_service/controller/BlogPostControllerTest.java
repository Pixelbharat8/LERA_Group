package com.lera.academy_service.controller;

import com.lera.academy_service.entity.BlogPost;
import com.lera.academy_service.repository.BlogPostRepository;
import com.lera.academy_service.security.AuthUser;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BlogPostControllerTest {

    @Mock private BlogPostRepository blogPostRepository;

    @InjectMocks private BlogPostController controller;

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getPostById_parentPublishedParentAudience_ok() {
        UUID id = UUID.randomUUID();
        BlogPost p = new BlogPost();
        p.setId(id);
        p.setTitleEn("t");
        p.setStatus("published");
        p.setAudience("PARENT");
        login("PARENT", UUID.randomUUID());
        when(blogPostRepository.findById(id)).thenReturn(Optional.of(p));
        assertThat(controller.getPostById(id).getBody()).isEqualTo(p);
    }

    @Test
    void getPostById_studentPublishedParentAudience_notFound() {
        UUID id = UUID.randomUUID();
        BlogPost p = new BlogPost();
        p.setId(id);
        p.setTitleEn("t");
        p.setStatus("published");
        p.setAudience("PARENT");
        login("STUDENT", UUID.randomUUID());
        when(blogPostRepository.findById(id)).thenReturn(Optional.of(p));
        assertThat(controller.getPostById(id).getStatusCode().value()).isEqualTo(404);
    }

    @Test
    void getPostById_teacherDraft_ok() {
        UUID id = UUID.randomUUID();
        BlogPost p = new BlogPost();
        p.setId(id);
        p.setTitleEn("t");
        p.setStatus("draft");
        login("TEACHER", UUID.randomUUID());
        when(blogPostRepository.findById(id)).thenReturn(Optional.of(p));
        assertThat(controller.getPostById(id).getBody()).isEqualTo(p);
    }

    @Test
    void getPostBySlug_hiddenAudience_doesNotIncrementViews() {
        BlogPost p = new BlogPost();
        p.setTitleEn("t");
        p.setSlug("x");
        p.setStatus("published");
        p.setAudience("PARENT");
        p.setViews(3);
        login("STUDENT", UUID.randomUUID());
        when(blogPostRepository.findBySlug("x")).thenReturn(Optional.of(p));
        assertThat(controller.getPostBySlug("x").getStatusCode().value()).isEqualTo(404);
        verify(blogPostRepository, never()).save(any(BlogPost.class));
    }

    @Test
    void getPostBySlug_visible_incrementsViews() {
        BlogPost p = new BlogPost();
        p.setTitleEn("t");
        p.setSlug("y");
        p.setStatus("published");
        p.setAudience("STUDENT");
        p.setViews(2);
        login("STUDENT", UUID.randomUUID());
        when(blogPostRepository.findBySlug("y")).thenReturn(Optional.of(p));
        when(blogPostRepository.save(any(BlogPost.class))).thenAnswer(inv -> inv.getArgument(0));
        BlogPost out = controller.getPostBySlug("y").getBody();
        assertThat(out).isNotNull();
        assertThat(out.getViews()).isEqualTo(3);
        verify(blogPostRepository).save(any(BlogPost.class));
    }

    @Test
    void getByAudience_studentRequestsParent_forbidden() {
        login("STUDENT", UUID.randomUUID());
        assertThatThrownBy(() -> controller.getByAudience("PARENT", "published"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value()).isEqualTo(403));
        verify(blogPostRepository, never()).findByAudienceAndStatusOrderByPublishedAtDesc(any(), any());
    }

    @Test
    void getByAudience_studentRequestsStudent_ok() {
        login("STUDENT", UUID.randomUUID());
        when(blogPostRepository.findByAudienceAndStatusOrderByPublishedAtDesc("STUDENT", "published"))
                .thenReturn(List.of());
        assertThat(controller.getByAudience("STUDENT", "published").getBody()).isEmpty();
    }

    private static void login(String role, UUID userId) {
        AuthUser u = AuthUser.builder()
                .userId(userId)
                .roleName(role)
                .email("test@lera.io")
                .build();
        var auth = new UsernamePasswordAuthenticationToken(u, "n/a", java.util.List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }
}
