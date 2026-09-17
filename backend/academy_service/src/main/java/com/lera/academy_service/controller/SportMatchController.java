package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.SportMatch;
import com.lera.academy_service.entity.SportTeam;
import com.lera.academy_service.repository.SportMatchRepository;
import com.lera.academy_service.repository.SportTeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/sport-matches")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class SportMatchController {

    private final SportMatchRepository sportMatchRepository;
    private final SportTeamRepository sportTeamRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAll(Pageable pageable) {
        return ResponseEntity.ok(withTeamNames(sportMatchRepository.findAll(pageable).getContent()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable UUID id) {
        return sportMatchRepository.findById(id)
                .map(m -> ResponseEntity.ok(withTeamNames(List.of(m)).get(0)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * A match row holds only homeTeamId / awayTeamId, so a fixtures table rendered from it
     * shows two raw UUIDs where the team names belong. Resolve them in one query.
     */
    private List<Map<String, Object>> withTeamNames(List<SportMatch> matches) {
        Set<UUID> teamIds = matches.stream()
                .flatMap(m -> java.util.stream.Stream.of(m.getHomeTeamId(), m.getAwayTeamId()))
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, String> names = teamIds.isEmpty()
                ? Map.of()
                : sportTeamRepository.findAllById(teamIds).stream()
                        .filter(t -> t.getTeamName() != null)
                        .collect(Collectors.toMap(SportTeam::getId, SportTeam::getTeamName, (a, b) -> a));

        List<Map<String, Object>> out = new ArrayList<>(matches.size());
        for (SportMatch m : matches) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", m.getId());
            row.put("sportTypeId", m.getSportTypeId());
            row.put("matchCode", m.getMatchCode());
            row.put("matchName", m.getMatchName());
            row.put("tournamentId", m.getTournamentId());
            row.put("homeTeamId", m.getHomeTeamId());
            row.put("awayTeamId", m.getAwayTeamId());
            row.put("homeTeamName", m.getHomeTeamId() != null ? names.get(m.getHomeTeamId()) : null);
            row.put("awayTeamName", m.getAwayTeamId() != null ? names.get(m.getAwayTeamId()) : null);
            row.put("matchDate", m.getMatchDate());
            row.put("matchTime", m.getMatchTime());
            row.put("venue", m.getVenue());
            row.put("matchType", m.getMatchType());
            row.put("homeTeamScore", m.getHomeTeamScore());
            row.put("awayTeamScore", m.getAwayTeamScore());
            row.put("winnerTeamId", m.getWinnerTeamId());
            row.put("status", m.getStatus());
            row.put("refereeId", m.getRefereeId());
            row.put("matchDurationMinutes", m.getMatchDurationMinutes());
            row.put("attendance", m.getAttendance());
            row.put("summary", m.getSummary());
            out.add(row);
        }
        return out;
    }

    @PostMapping
    public ResponseEntity<SportMatch> create(@Valid @RequestBody SportMatch sportMatch) {
        return ResponseEntity.ok(sportMatchRepository.save(sportMatch));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SportMatch> update(@PathVariable UUID id, @Valid @RequestBody SportMatch sportMatch) {
        return sportMatchRepository.findById(id)
                .map(existing -> {
                    sportMatch.setId(id);
                    return ResponseEntity.ok(sportMatchRepository.save(sportMatch));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (sportMatchRepository.existsById(id)) {
            sportMatchRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
