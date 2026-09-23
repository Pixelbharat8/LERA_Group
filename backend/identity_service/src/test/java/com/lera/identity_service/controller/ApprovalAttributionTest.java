package com.lera.identity_service.controller;

import com.lera.identity_service.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Every identity on this controller used to come from the request body: who approved, who
 * rejected, and who wrote a comment. Approve and reject are limited to management roles, so only
 * a manager could approve — but any of them could record it under a colleague's name. Adding a
 * comment is open to every role the class admits, including STUDENT and PARENT, so anyone could
 * post one signed "Chairman".
 *
 * An approval trail that takes its own attribution from the client records nothing worth having.
 */
class ApprovalAttributionTest {

    private ApprovalController controller;
    private final UUID caller = UUID.randomUUID();
    private final AuthUser me = AuthUser.builder().userId(caller).roleName("CEO").build();

    @SuppressWarnings("unchecked")
    private String createRequest() {
        Map<String, Object> body = new HashMap<>();
        body.put("type", "USER_REGISTRATION");
        body.put("requestedBy", "someone");
        Map<String, Object> created = (Map<String, Object>) controller.createApprovalRequest(body).getBody();
        return String.valueOf(created.get("id"));
    }

    @BeforeEach
    void setUp() {
        controller = new ApprovalController();
    }

    @Test
    void theApproverIsTheCallerNotWhoeverTheBodyNames() {
        String id = createRequest();
        Map<String, Object> body = new HashMap<>();
        body.put("approvedBy", "Chairman");   // the forgery attempt
        Map<String, Object> after = controller.approveRequest(id, body, me).getBody();

        assertEquals(caller.toString(), after.get("approvedBy"));
        assertNotEquals("Chairman", after.get("approvedBy"));
    }

    @Test
    void theRejecterIsTheCallerToo() {
        String id = createRequest();
        Map<String, Object> body = new HashMap<>();
        body.put("rejectedBy", "Chairman");
        body.put("reason", "no");
        Map<String, Object> after = controller.rejectRequest(id, body, me).getBody();

        assertEquals(caller.toString(), after.get("rejectedBy"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void aCommentIsSignedByWhoeverPostedIt() {
        String id = createRequest();
        Map<String, Object> body = new HashMap<>();
        body.put("text", "looks fine to me");
        body.put("by", "Chairman");           // a STUDENT could send exactly this
        Map<String, Object> after = controller.addComment(id, body, me).getBody();

        List<Map<String, Object>> comments = (List<Map<String, Object>>) after.get("comments");
        assertEquals(caller.toString(), comments.get(comments.size() - 1).get("by"));
    }

    @Test
    void anUnauthenticatedCallerIsRecordedAsUnknownRatherThanAsAnybody() {
        String id = createRequest();
        Map<String, Object> after = controller.approveRequest(id, new HashMap<>(), null).getBody();
        assertEquals("unknown", after.get("approvedBy"));
    }
}
