package com.lera.connect_service.controller;

import com.lera.connect_service.entity.ChatPoll;
import com.lera.connect_service.entity.ChatPollOption;
import com.lera.connect_service.entity.ChatPollVote;
import com.lera.connect_service.repository.ChatPollRepository;
import com.lera.connect_service.repository.ChatPollOptionRepository;
import com.lera.connect_service.repository.ChatPollVoteRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ChatAuthorizationService;
import com.lera.connect_service.security.ConnectSecurity;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Poll Controller - Telegram-style polls for education
 * 
 * Features:
 * - Single/Multiple choice polls
 * - Quiz mode with correct answers (like Telegram)
 * - Anonymous voting option
 * - Auto-close on expiry
 * - Real-time vote updates via WebSocket
 */
@RestController
@RequestMapping("/api/chat/polls")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class PollController {

    private final ChatPollRepository pollRepository;
    private final ChatPollOptionRepository optionRepository;
    private final ChatPollVoteRepository voteRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatAuthorizationService chatAuth;

    private UUID requireSelf(AuthUser authUser) {
        return ConnectSecurity.requireUserId(authUser);
    }

    private ChatPoll requirePollInConversation(AuthUser authUser, UUID pollId) {
        ChatPoll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Poll not found"));
        chatAuth.requireParticipantConversation(authUser, poll.getConversationId().toString());
        return poll;
    }

    // DTO for creating polls
    public record CreatePollRequest(
        UUID conversationId,
        String question,
        List<String> options,
        String pollType,  // SINGLE, MULTIPLE, QUIZ
        Integer correctOption,  // For quiz mode
        Boolean isAnonymous,
        Boolean allowsMultiple,
        LocalDateTime expiresAt
    ) {}

    // DTO for poll response
    public record PollResponse(
        UUID id,
        UUID conversationId,
        UUID createdBy,
        String question,
        String pollType,
        Boolean isAnonymous,
        Boolean isClosed,
        LocalDateTime expiresAt,
        LocalDateTime createdAt,
        List<OptionResponse> options,
        long totalVotes,
        List<UUID> userVotes  // Which options the current user voted for
    ) {}

    public record OptionResponse(
        UUID id,
        int optionIndex,
        String optionText,
        int voteCount,
        double percentage,
        Boolean isCorrect
    ) {}

    public record VoteRequest(
        UUID pollId,
        UUID optionId
    ) {}

    /**
     * Create a new poll (like Telegram poll creation)
     */
    @PostMapping
    public ResponseEntity<?> createPoll(
            @Valid @RequestBody CreatePollRequest request,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID userId = requireSelf(authUser);
        chatAuth.requireParticipantConversation(authUser, request.conversationId().toString());

        // Validate minimum 2 options
        if (request.options() == null || request.options().size() < 2) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Poll must have at least 2 options"
            ));
        }

        // Create poll
        ChatPoll poll = ChatPoll.builder()
            .conversationId(request.conversationId())
            .createdBy(userId)
            .question(request.question())
            .pollType(request.pollType() != null ? request.pollType() : "SINGLE")
            .correctOption(request.correctOption())
            .isAnonymous(request.isAnonymous() != null && request.isAnonymous())
            .allowsMultiple(request.allowsMultiple() != null && request.allowsMultiple())
            .expiresAt(request.expiresAt())
            .build();
        
        poll = pollRepository.save(poll);
        
        // Create options
        UUID pollId = poll.getId();
        List<ChatPollOption> options = new ArrayList<>();
        for (int i = 0; i < request.options().size(); i++) {
            ChatPollOption option = ChatPollOption.builder()
                .pollId(pollId)
                .optionIndex(i)
                .optionText(request.options().get(i))
                .voteCount(0)
                .build();
            options.add(optionRepository.save(option));
        }

        // Build response
        PollResponse response = buildPollResponse(poll, options, userId, null);

        // Notify via WebSocket
        messagingTemplate.convertAndSend(
            "/topic/chat/" + request.conversationId() + "/poll",
            Map.of("type", "NEW_POLL", "poll", response)
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Get poll by ID with current vote status
     */
    @GetMapping("/{pollId}")
    public ResponseEntity<?> getPoll(
            @PathVariable UUID pollId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID userId = requireSelf(authUser);
        ChatPoll poll = requirePollInConversation(authUser, pollId);
        List<ChatPollOption> options = optionRepository.findByPollIdOrderByOptionIndexAsc(pollId);
        List<ChatPollVote> userVotes = voteRepository.findByPollIdAndUserId(pollId, userId);

        return ResponseEntity.ok(buildPollResponse(poll, options, userId, userVotes));
    }

    /**
     * Get all polls in a conversation
     */
    @GetMapping("/conversation/{conversationId}")
    public ResponseEntity<?> getPollsByConversation(
            @PathVariable UUID conversationId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID userId = requireSelf(authUser);
        chatAuth.requireParticipantConversation(authUser, conversationId.toString());
        List<ChatPoll> polls = pollRepository.findByConversationIdOrderByCreatedAtDesc(conversationId);
        
        List<PollResponse> responses = polls.stream().map(poll -> {
            List<ChatPollOption> options = optionRepository.findByPollIdOrderByOptionIndexAsc(poll.getId());
            List<ChatPollVote> userVotes = voteRepository.findByPollIdAndUserId(poll.getId(), userId);
            return buildPollResponse(poll, options, userId, userVotes);
        }).collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    /**
     * Vote on a poll option
     */
    @PostMapping("/vote")
    public ResponseEntity<?> vote(
            @Valid @RequestBody VoteRequest request,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID userId = requireSelf(authUser);
        ChatPoll poll = requirePollInConversation(authUser, request.pollId());
        
        if (poll.getIsClosed()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Poll is closed"));
        }

        if (poll.getExpiresAt() != null && poll.getExpiresAt().isBefore(LocalDateTime.now())) {
            // Auto-close expired poll
            poll.setIsClosed(true);
            poll.setClosedAt(LocalDateTime.now());
            pollRepository.save(poll);
            return ResponseEntity.badRequest().body(Map.of("error", "Poll has expired"));
        }

        // Check if user already voted (for single-choice polls)
        boolean allowsMultiple = poll.getAllowsMultiple() != null && poll.getAllowsMultiple();
        if (!allowsMultiple && voteRepository.existsByPollIdAndUserId(request.pollId(), userId)) {
            // Remove existing vote first (toggle behavior like Telegram)
            List<ChatPollVote> existingVotes = voteRepository.findByPollIdAndUserId(request.pollId(), userId);
            for (ChatPollVote v : existingVotes) {
                optionRepository.decrementVoteCount(v.getOptionId());
                voteRepository.delete(v);
            }
        }

        // Check if user already voted for this specific option (toggle off)
        Optional<ChatPollVote> existingVote = voteRepository.findByPollIdAndUserIdAndOptionId(
            request.pollId(), userId, request.optionId());
        
        if (existingVote.isPresent()) {
            // Toggle off - remove vote
            optionRepository.decrementVoteCount(request.optionId());
            voteRepository.delete(existingVote.get());
        } else {
            // Add new vote
            ChatPollVote vote = ChatPollVote.builder()
                .pollId(request.pollId())
                .optionId(request.optionId())
                .userId(userId)
                .build();
            voteRepository.save(vote);
            optionRepository.incrementVoteCount(request.optionId());
        }

        // Get updated poll
        List<ChatPollOption> options = optionRepository.findByPollIdOrderByOptionIndexAsc(request.pollId());
        List<ChatPollVote> userVotes = voteRepository.findByPollIdAndUserId(request.pollId(), userId);
        PollResponse response = buildPollResponse(poll, options, userId, userVotes);

        // Broadcast update via WebSocket
        messagingTemplate.convertAndSend(
            "/topic/chat/" + poll.getConversationId() + "/poll",
            Map.of("type", "POLL_UPDATE", "poll", response)
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Close a poll (only creator can close)
     */
    @PostMapping("/{pollId}/close")
    public ResponseEntity<?> closePoll(
            @PathVariable UUID pollId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID userId = requireSelf(authUser);
        ChatPoll poll = requirePollInConversation(authUser, pollId);

        if (!poll.getCreatedBy().equals(userId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Only poll creator can close it"));
        }

        poll.setIsClosed(true);
        poll.setClosedAt(LocalDateTime.now());
        pollRepository.save(poll);

        List<ChatPollOption> options = optionRepository.findByPollIdOrderByOptionIndexAsc(pollId);
        PollResponse response = buildPollResponse(poll, options, userId, null);

        // Broadcast close event
        messagingTemplate.convertAndSend(
            "/topic/chat/" + poll.getConversationId() + "/poll",
            Map.of("type", "POLL_CLOSED", "poll", response)
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Delete a poll (only creator can delete)
     */
    @DeleteMapping("/{pollId}")
    public ResponseEntity<?> deletePoll(
            @PathVariable UUID pollId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID userId = requireSelf(authUser);
        ChatPoll poll = requirePollInConversation(authUser, pollId);

        if (!poll.getCreatedBy().equals(userId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Only poll creator can delete it"));
        }

        UUID conversationId = poll.getConversationId();

        // Delete in order: votes -> options -> poll
        voteRepository.deleteAll(voteRepository.findByPollId(pollId));
        optionRepository.deleteByPollId(pollId);
        pollRepository.delete(poll);

        // Broadcast delete event
        messagingTemplate.convertAndSend(
            "/topic/chat/" + conversationId + "/poll",
            Map.of("type", "POLL_DELETED", "pollId", pollId)
        );

        return ResponseEntity.ok(Map.of("deleted", true));
    }

    // Helper method to build poll response
    private PollResponse buildPollResponse(ChatPoll poll, List<ChatPollOption> options, 
                                           UUID userId, List<ChatPollVote> userVotes) {
        long totalVotes = options.stream().mapToInt(ChatPollOption::getVoteCount).sum();
        
        List<OptionResponse> optionResponses = options.stream().map(opt -> {
            double percentage = totalVotes > 0 ? (opt.getVoteCount() * 100.0 / totalVotes) : 0;
            Boolean isCorrect = poll.getCorrectOption() != null && 
                               poll.getCorrectOption().equals(opt.getOptionIndex());
            
            return new OptionResponse(
                opt.getId(),
                opt.getOptionIndex(),
                opt.getOptionText(),
                opt.getVoteCount(),
                Math.round(percentage * 10) / 10.0,
                "QUIZ".equals(poll.getPollType()) && poll.getIsClosed() ? isCorrect : null
            );
        }).collect(Collectors.toList());

        List<UUID> userVoteIds = userVotes != null 
            ? userVotes.stream().map(ChatPollVote::getOptionId).collect(Collectors.toList())
            : List.of();

        return new PollResponse(
            poll.getId(),
            poll.getConversationId(),
            poll.getCreatedBy(),
            poll.getQuestion(),
            poll.getPollType(),
            poll.getIsAnonymous(),
            poll.getIsClosed(),
            poll.getExpiresAt(),
            poll.getCreatedAt(),
            optionResponses,
            totalVotes,
            userVoteIds
        );
    }
}
