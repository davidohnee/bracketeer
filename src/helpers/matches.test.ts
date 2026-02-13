import { describe, it, expect, beforeEach } from "vitest";
import { groupMatches, tournamentRichMatches } from "./matches";
import type {
    Tournament,
    TournamentConfig,
    Match,
    MatchTeam,
    MatchRound,
    GroupTournamentPhase,
    RichMatch,
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

    describe("groupMatches", () => {
        let allMatches: RichMatch[] = [];
        const date1 = new Date();
        const date2 = new Date(date1.getTime() + 1000 * 60 * 30); // 30 minutes later

        beforeEach(() => {
            allMatches = [
                {
                    match: createMatch(
                        "match-1",
                        createMatchTeams("team-1", "team-2"),
                        date1,
                        "scheduled",
                        1,
                        createMatchRound("round-1", "Round 1"),
                    ),
                    roundName: "Round 1",
                    phaseName: "Group Phase",
                    phaseId: "phase-1",
                },
                {
                    match: createMatch(
                        "match-2",
                        createMatchTeams("team-3", "team-4"),
                        date2,
                        "scheduled",
                        2,
                        createMatchRound("round-2", "Round 2"),
                    ),
                    roundName: "Round 2",
                    phaseName: "Group Phase",
                    phaseId: "phase-1",
                },
                {
                    match: createMatch(
                        "match-2-2",
                        createMatchTeams("team-1", "team-2"),
                        date2,
                        "scheduled",
                        2,
                        createMatchRound("round-3", "Round 3"),
                    ),
                    roundName: "Round 3",
                    phaseName: "Group Phase",
                    phaseId: "phase-1",
                },
                {
                    match: createMatch(
                        "match-1-2",
                        createMatchTeams("team-1", "team-2"),
                        date1,
                        "scheduled",
                        1,
                        createMatchRound("round-1", "Round 1"),
                    ),
                    roundName: "Round 1",
                    phaseName: "Group Phase",
                    phaseId: "phase-1",
                },
            ];
        });

        it("should group matches by round", () => {
            const grouped = groupMatches({
                allMatches,
                tournament,
                selectedGroupOption: "round",
            });

            expect(grouped).toHaveProperty("phase-1.Round 1");
            expect(grouped).toHaveProperty("phase-1.Round 2");
            expect(grouped).toHaveProperty("phase-1.Round 3");
            expect(grouped["phase-1.Round 1"]).toHaveLength(2);
            expect(grouped["phase-1.Round 2"]).toHaveLength(1);
            expect(grouped["phase-1.Round 3"]).toHaveLength(1);
            expect(grouped["phase-1.Round 1"]).toEqual(
                expect.arrayContaining([allMatches[0], allMatches[3]]),
            );
            expect(grouped["phase-1.Round 2"]).toEqual(expect.arrayContaining([allMatches[1]]));
            expect(grouped["phase-1.Round 3"]).toEqual(expect.arrayContaining([allMatches[2]]));
        });

        it("should group matches by time", () => {
            const grouped = groupMatches({
                allMatches,
                tournament,
                selectedGroupOption: "time",
            });

            // The time keys will be locale-specific, so we need to generate them using the same logic as the grouping function
            // e.g. 06:23 PM
            const localeDateTimeString = (date: Date) =>
                date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            const timeKey1 = localeDateTimeString(date1);
            const timeKey2 = localeDateTimeString(date2);

            expect(grouped).toHaveProperty(timeKey1);
            expect(grouped).toHaveProperty(timeKey2);

            expect(grouped[timeKey1]).toHaveLength(2);
            expect(grouped[timeKey2]).toHaveLength(2);
            expect(grouped[timeKey1]).toEqual(
                expect.arrayContaining([allMatches[0], allMatches[3]]),
            );
            expect(grouped[timeKey2]).toEqual(
                expect.arrayContaining([allMatches[1], allMatches[2]]),
            );
        });

        it("should group matches by team", () => {
            const grouped = groupMatches({
                allMatches,
                tournament,
                selectedGroupOption: "team",
            });

            expect(grouped).toHaveProperty("Team 1");
            expect(grouped).toHaveProperty("Team 2");
            expect(grouped).toHaveProperty("Team 3");
            expect(grouped).toHaveProperty("Team 4");
            expect(grouped["Team 1"]).toHaveLength(3);
            expect(grouped["Team 2"]).toHaveLength(3);
            expect(grouped["Team 3"]).toHaveLength(1);
            expect(grouped["Team 4"]).toHaveLength(1);
            expect(grouped["Team 1"]).toEqual(
                expect.arrayContaining([allMatches[0], allMatches[2], allMatches[3]]),
            );
            expect(grouped["Team 2"]).toEqual(
                expect.arrayContaining([allMatches[0], allMatches[2], allMatches[3]]),
            );
            expect(grouped["Team 3"]).toEqual(expect.arrayContaining([allMatches[1]]));
            expect(grouped["Team 4"]).toEqual(expect.arrayContaining([allMatches[1]]));
        });

        it("should group matches by court", () => {
            const grouped = groupMatches({
                allMatches,
                tournament,
                selectedGroupOption: "court",
            });

            expect(grouped).toHaveProperty("Court 1");
            expect(grouped).toHaveProperty("Court 2");
            expect(grouped["Court 1"]).toHaveLength(2);
            expect(grouped["Court 2"]).toHaveLength(2);
            expect(grouped["Court 1"]).toEqual(
                expect.arrayContaining([allMatches[0], allMatches[3]]),
            );
            expect(grouped["Court 2"]).toEqual(
                expect.arrayContaining([allMatches[1], allMatches[2]]),
            );
        });

        it("should return empty groups for unmatched filters", () => {
            const grouped = groupMatches({
                allMatches,
                tournament,
                selectedGroupOption: "team",
                teamFilter: "non-existent-team",
            });

            expect(grouped).toEqual({});
        });
    });
});
