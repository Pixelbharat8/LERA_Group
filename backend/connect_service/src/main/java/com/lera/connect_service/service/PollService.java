package com.lera.connect_service.service;

import com.lera.connect_service.entity.ChatPoll;
import com.lera.connect_service.entity.ChatPollOption;
import com.lera.connect_service.entity.ChatPollVote;
import com.lera.connect_service.repository.ChatPollRepository;
import com.lera.connect_service.repository.ChatPollOptionRepository;
import com.lera.connect_service.repository.ChatPollVoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class PollService {
    private final ChatPollRepository pollRepo;
    private final ChatPollOptionRepository optionRepo;
    private final ChatPollVoteRepository voteRepo;

    public Page<ChatPoll> getAll(Pageable pageable) { return pollRepo.findAll(pageable); }
    public Optional<ChatPoll> getById(UUID id) { return pollRepo.findById(id); }
    public List<ChatPoll> getByConversation(UUID convId) { return pollRepo.findByConversationIdOrderByCreatedAtDesc(convId); }
    public List<ChatPoll> getByCreator(UUID userId) { return pollRepo.findByCreatedBy(userId); }
    public List<ChatPollOption> getOptions(UUID pollId) { return optionRepo.findByPollIdOrderByOptionIndexAsc(pollId); }
    public List<ChatPollVote> getVotes(UUID pollId) { return voteRepo.findByPollId(pollId); }

    @Transactional public ChatPoll savePoll(ChatPoll entity) { return pollRepo.save(entity); }
    @Transactional public ChatPollOption saveOption(ChatPollOption entity) { return optionRepo.save(entity); }
    @Transactional public ChatPollVote saveVote(ChatPollVote entity) { return voteRepo.save(entity); }
    @Transactional public void deletePoll(UUID id) { pollRepo.deleteById(id); }
    @Transactional public void deleteVotesByUser(UUID pollId, UUID userId) { voteRepo.deleteByPollIdAndUserId(pollId, userId); }
}
