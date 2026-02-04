import { describe, it, expect, beforeEach } from "vitest";
import { tournamentRichMatches } from "./matches";
import type { Tournament } from "@/types/tournament";

describe("Matches Helper Functions", () => {
    let tournament: Tournament;

    beforeEach(() => {
        tournament = {
            id: "test-tournament",
            version: 3,
            name: "Test Tournament",
            teams: [
                { id: "team-1", name: "Team 1", players: [] },
                { id: "team-2", name: "Team 2", players: [] },
                { id: "team-3", name: "Team 3", players: [] },
                { id: "team-4", name: "Team 4", players: [] },
            ],
            phases: [],
            config: {
                courts: 2,
                matchDuration: 30,
                breakDuration: 5,
                knockoutBreakDuration: 10,
                startTime: new Date("2024-01-01T10:00:00"),
                sport: "test",
            },
        };
    });

    describe("tournamentRichMatches", () => {
        it("should return empty array for tournament with no phases", () => {
            const richMatches = tournamentRichMatches(tournament);
            expect(richMatches).toEqual([]);
        });

        it("should extract matches from group phase", () => {
            tournament.phases = [
                {
                    id: "phase-1",
                    type: "group",
                    name: "Group Phase",
                    rounds: 2,
                    matches: [
                        {
                            id: "match-1",
                            court: 1,
                            teams: [
                                { ref: { id: "team-1" }, score: 0 },
                                { ref: { id: "team-2" }, score: 0 },
                            ],
                            date: new Date("2024-01-01T10:00:00"),
                            status: "scheduled",
                            round: { name: "Round 1" },
                        },
                        {
                            id: "match-2",
                            court: 2,
                            teams: [
                                { ref: { id: "team-3" }, score: 0 },
                                { ref: { id: "team-4" }, score: 0 },
                            ],
                            date: new Date("2024-01-01T10:30:00"),
                            status: "scheduled",
                            round: { name: "Round 1" },
                        },
                    ],
                },
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
                                {
                                    id: "match-1",
                                    court: 1,
                                    teams: [
                                        { ref: { id: "team-1" }, score: 0 },
                                        { ref: { id: "team-2" }, score: 0 },
                                    ],
                                    date: new Date("2024-01-01T12:00:00"),
                                    status: "scheduled",
                                },
                            ],
                        },
                        {
                            id: "round-2",
                            name: "Final",
                            matches: [
                                {
                                    id: "match-2",
                                    court: 1,
                                    teams: [
                                        { ref: { id: "team-1" }, score: 0 },
                                        { ref: { id: "team-3" }, score: 0 },
                                    ],
                                    date: new Date("2024-01-01T14:00:00"),
                                    status: "scheduled",
                                },
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
                        {
                            id: "match-1",
                            court: 1,
                            teams: [
                                { ref: { id: "team-1" }, score: 0 },
                                { ref: { id: "team-2" }, score: 0 },
                            ],
                            date: new Date("2024-01-01T10:00:00"),
                            status: "scheduled",
                            round: { name: "Round 1" },
                        },
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
                                {
                                    id: "match-2",
                                    court: 1,
                                    teams: [
                                        { ref: { id: "team-1" }, score: 0 },
                                        { ref: { id: "team-2" }, score: 0 },
                                    ],
                                    date: new Date("2024-01-01T12:00:00"),
                                    status: "scheduled",
                                },
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
                {
                    id: "phase-1",
                    type: "group",
                    name: "Group Phase",
                    rounds: 2,
                    matches: [
                        {
                            id: "match-2",
                            court: 1,
                            teams: [
                                { ref: { id: "team-1" }, score: 0 },
                                { ref: { id: "team-2" }, score: 0 },
                            ],
                            date: new Date("2024-01-01T12:00:00"),
                            status: "scheduled",
                            round: { name: "Round 2" },
                        },
                        {
                            id: "match-1",
                            court: 2,
                            teams: [
                                { ref: { id: "team-3" }, score: 0 },
                                { ref: { id: "team-4" }, score: 0 },
                            ],
                            date: new Date("2024-01-01T10:00:00"),
                            status: "scheduled",
                            round: { name: "Round 1" },
                        },
                    ],
                },
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
                        {
                            id: "match-b",
                            court: 1,
                            teams: [
                                { ref: { id: "team-1" }, score: 0 },
                                { ref: { id: "team-2" }, score: 0 },
                            ],
                            date: sameDate,
                            status: "scheduled",
                            round: { name: "Round B" },
                        },
                        {
                            id: "match-a",
                            court: 2,
                            teams: [
                                { ref: { id: "team-3" }, score: 0 },
                                { ref: { id: "team-4" }, score: 0 },
                            ],
                            date: sameDate,
                            status: "scheduled",
                            round: { name: "Round A" },
                        },
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
                        {
                            id: "match-1",
                            court: 1,
                            teams: [
                                { ref: { id: "team-1" }, score: 0 },
                                { ref: { id: "team-2" }, score: 0 },
                            ],
                            date: new Date("2024-01-01T10:00:00"),
                            status: "scheduled",
                            round: { name: "Round 1" },
                        },
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
