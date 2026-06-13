package com.lera.connect_service.controller;

import com.lera.connect_service.entity.ChatGroup;
import com.lera.connect_service.repository.ChatGroupRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectTestAuth;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GroupControllerAuthorizationTest {

    @Mock
    private ChatGroupRepository chatGroupRepository;

    private GroupController controller;

    private final UUID member = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private final UUID outsider = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    @BeforeEach
    void setUp() {
        controller = new GroupController(chatGroupRepository);
    }

    @Test
    void getAllGroups_nonOrgWide_onlyMembership() {
        ChatGroup mine = new ChatGroup();
        mine.setId(UUID.randomUUID());
        mine.setName("Mine");
        mine.setIsActive(true);
        mine.setMemberIds(List.of(member));
        when(chatGroupRepository.findByMemberId(member)).thenReturn(List.of(mine));

        AuthUser user = ConnectTestAuth.participant(member);
        var res = controller.getAllGroups(user);
        assertEquals(200, res.getStatusCode().value());
        assertEquals(1, ((List<?>) res.getBody()).size());
    }

    @Test
    void getGroup_outsider_forbidden() {
        ChatGroup group = new ChatGroup();
        group.setId(UUID.randomUUID());
        group.setIsActive(true);
        group.setMemberIds(List.of(member));
        group.setAdminIds(List.of(member));
        when(chatGroupRepository.findById(group.getId())).thenReturn(java.util.Optional.of(group));

        AuthUser user = ConnectTestAuth.participant(outsider);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.getGroup(group.getId().toString(), user));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }
}
