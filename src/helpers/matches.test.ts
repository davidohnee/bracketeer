import { describe, it, expect, beforeEach } from "vitest";
import { tournamentRichMatches } from "./matches";
import type {
    Tournament,
    TournamentConfig,
    Match,
    MatchTeam,
    MatchRound,
    GroupTournamentPhase,
} from "@/types/tournament";

// Test helper constants
const TEST_TOURNAMENT_CONFIG: TournamentConfig = {
    courts: 2,
    matchDuration: 30,
    breakDuration: 5,
    knockoutBreakDuration: 10,
    startTime: new Date("2024-01-01T10:00:00"),
    sport: "test",
};

const TEST_TEAMS = [
    { id: "team-1", name: "Team 1", players: [] },
    { id: "team-2", name: "Team 2", players: [] },
    { id: "team-3", name: "Team 3", players: [] },
    { id: "team-4", name: "Team 4", players: [] },
];

// Test helper functions
const createMatchTeams = (
    team1Id: string,
    team2Id: string,
    score1 = 0,
    score2 = 0,
): [MatchTeam, MatchTeam] => [
    { ref: { id: team1Id }, score: score1 },
    { ref: { id: team2Id }, score: score2 },
];

const createMatchRound = (id: string, name: string): MatchRound => ({ id, name });

const createMatch = (
    id: string,
    teams: [MatchTeam, MatchTeam],
    date: Date,
    status: "scheduled" | "in-progress" | "completed" = "scheduled",
    court = 1,
    round?: MatchRound,
): Match => ({
    id,
    court,
    teams,
    date,
    status,
    ...(round && { round }),
});

const createGroupPhase = (
    matches: Match[],
    id: string = "phase-1",
    rounds: number = 1,
    name: string = "Group Phase",
): GroupTournamentPhase => ({
    id,
    type: "group",
    name,
    rounds,
    matches,
});

describe("Matches Helper Functions", () => {
    let tournament: Tournament;

    beforeEach(() => {
        tournament = {
            id: "test-tournament",
            version: 3,
            name: "Test Tournament",
            teams: TEST_TEAMS,
            phases: [],
            config: TEST_TOURNAMENT_CONFIG,
        };
    });

    describe("tournamentRichMatches", () => {
        it("should return empty array for tournament with no phases", () => {
            const richMatches = tournamentRichMatches(tournament);
            expect(richMatches).toEqual([]);
        });

        it("should extract matches from group phase", () => {
            tournament.phases = [
                createGroupPhase([
                    createMatch(
                        "match-1",
                        createMatchTeams("team-1", "team-2"),
                        new Date("2024-01-01T10:00:00"),
                        "scheduled",
                        1,
                        createMatchRound("round-1", "Round 1"),
                    ),
                    createMatch(
                        "match-2",
                        createMatchTeams("team-3", "team-4"),
                        new Date("2024-01-01T10:30:00"),
                        "scheduled",
                        2,
                        createMatchRound("round-1", "Round 1"),
                    ),
                ]),
            ];

            const richMatches = tournamentRichMatches(tournament);
            expect(richMatches).toHaveLength(2);
            expect(richMatches[0]?.match.id).toBe("match-1");
            expect(richMatches[0]?.roundName).toBe("Round 1");
            expect(richMatches[0]?.phaseName).toBe("Group Phase");
            expect(richMatches[0]?.phaseId).toBe("phase-1");
        });

        it("should extract matches from knockout phase", () => {
            tournament.phases = [
                {
                    id: "phase-knockout",
                    type: "knockout",
                    name: "Knockout Phase",
                    teamCount: 4,
                    rounds: [
                        {
                            id: "round-1",
                            name: "Semi-finals",
                            matches: [
                                createMatch(
                                    "match-1",
                                    createMatchTeams("team-1", "team-2"),
                                    new Date("2024-01-01T12:00:00"),
                                ),
                            ],
                        },
                        {
                            id: "round-2",
                            name: "Final",
                            matches: [
                                createMatch(
                                    "match-2",
                                    createMatchTeams("team-1", "team-3"),
                                    new Date("2024-01-01T14:00:00"),
                                ),
                            ],
                        },
                    ],
                },
            ];

            const richMatches = tournamentRichMatches(tournament);
            expect(richMatches).toHaveLength(2);
            expect(richMatches[0]?.match.id).toBe("match-1");
            expect(richMatches[0]?.roundName).toBe("Semi-finals");
            expect(richMatches[0]?.phaseName).toBe("Knockout Phase");
            expect(richMatches[1]?.match.id).toBe("match-2");
            expect(richMatches[1]?.roundName).toBe("Final");
        });

        it("should extract matches from multiple phases", () => {
            tournament.phases = [
                {
                    id: "phase-1",
                    type: "group",
                    name: "Group Phase",
                    rounds: 2,
                    matches: [
                        createMatch(
                            "match-1",
                            createMatchTeams("team-1", "team-2"),
                            new Date("2024-01-01T10:00:00"),
                            "scheduled",
                            1,
                            createMatchRound("round-1", "Round 1"),
                        ),
                    ],
                },
                {
                    id: "phase-2",
                    type: "knockout",
                    name: "Knockout Phase",
                    teamCount: 2,
                    rounds: [
                        {
                            id: "round-1",
                            name: "Final",
                            matches: [
                                createMatch(
                                    "match-2",
                                    createMatchTeams("team-1", "team-2"),
                                    new Date("2024-01-01T12:00:00"),
                                ),
                            ],
                        },
                    ],
                },
            ];

            const richMatches = tournamentRichMatches(tournament);
            expect(richMatches).toHaveLength(2);
            expect(richMatches[0]?.phaseName).toBe("Group Phase");
            expect(richMatches[1]?.phaseName).toBe("Knockout Phase");
        });

        it("should sort matches by date", () => {
            tournament.phases = [
                createGroupPhase([
                    createMatch(
                        "match-2",
                        createMatchTeams("team-3", "team-4"),
                        new Date("2024-01-01T10:30:00"),
                        "scheduled",
                        2,
                        createMatchRound("round-1", "Round 1"),
                    ),
                    createMatch(
                        "match-1",
                        createMatchTeams("team-1", "team-2"),
                        new Date("2024-01-01T10:00:00"),
                        "scheduled",
                        1,
                        createMatchRound("round-1", "Round 1"),
                    ),
                ]),
            ];

            const richMatches = tournamentRichMatches(tournament);
            expect(richMatches[0]?.match.id).toBe("match-1");
            expect(richMatches[1]?.match.id).toBe("match-2");
        });

        it("should sort by round name when dates are equal", () => {
            const sameDate = new Date("2024-01-01T10:00:00");
            tournament.phases = [
                {
                    id: "phase-1",
                    type: "group",
                    name: "Group Phase",
                    rounds: 2,
                    matches: [
                        createMatch(
                            "match-b",
                            createMatchTeams("team-1", "team-2"),
                            sameDate,
                            "scheduled",
                            1,
                            createMatchRound("round-b", "Round B"),
                        ),
                        createMatch(
                            "match-a",
                            createMatchTeams("team-3", "team-4"),
                            sameDate,
                            "scheduled",
                            2,
                            createMatchRound("round-a", "Round A"),
                        ),
                    ],
                },
            ];

            const richMatches = tournamentRichMatches(tournament);
            expect(richMatches[0]?.match.id).toBe("match-a");
            expect(richMatches[1]?.match.id).toBe("match-b");
        });

        it("should handle empty knockout rounds", () => {
            tournament.phases = [
                {
                    id: "phase-knockout",
                    type: "knockout",
                    name: "Knockout Phase",
                    teamCount: 4,
                    rounds: [],
                },
            ];

            const richMatches = tournamentRichMatches(tournament);
            expect(richMatches).toEqual([]);
        });

        it("should include phase and round metadata for each match", () => {
            tournament.phases = [
                {
                    id: "phase-1",
                    type: "group",
                    name: "Group Phase",
                    rounds: 1,
                    matches: [
                        createMatch(
                            "match-1",
                            createMatchTeams("team-1", "team-2"),
                            new Date("2024-01-01T10:00:00"),
                            "scheduled",
                            1,
                            createMatchRound("round-1", "Round 1"),
                        ),
                    ],
                },
            ];

            const richMatches = tournamentRichMatches(tournament);
            const richMatch = richMatches[0];

            expect(richMatch).toHaveProperty("match");
            expect(richMatch).toHaveProperty("roundName");
            expect(richMatch).toHaveProperty("phaseName");
            expect(richMatch).toHaveProperty("phaseId");
            expect(richMatch?.roundName).toBe("Round 1");
            expect(richMatch?.phaseName).toBe("Group Phase");
            expect(richMatch?.phaseId).toBe("phase-1");
        });
    });
});
