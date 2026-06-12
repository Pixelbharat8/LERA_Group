package com.lera.connect_service.service;

import com.lera.connect_service.entity.ParentTeacherMeeting;
import com.lera.connect_service.repository.ParentTeacherMeetingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class MeetingService {

    private final ParentTeacherMeetingRepository meetingRepository;

    public Page<ParentTeacherMeeting> getAll(Pageable pageable) {
        return meetingRepository.findAll(pageable);
    }

    public Optional<ParentTeacherMeeting> getById(UUID id) {
        return meetingRepository.findById(id);
    }

    @Transactional
    public ParentTeacherMeeting create(ParentTeacherMeeting meeting) {
        log.info("Creating parent-teacher meeting");
        return meetingRepository.save(meeting);
    }

    @Transactional
    public Optional<ParentTeacherMeeting> update(UUID id, ParentTeacherMeeting details) {
        return meetingRepository.findById(id).map(existing -> {
            details.setId(id);
            return meetingRepository.save(details);
        });
    }

    @Transactional
    public boolean delete(UUID id) {
        if (meetingRepository.existsById(id)) {
            meetingRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
