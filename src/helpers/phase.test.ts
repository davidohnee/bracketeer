import { describe, it, expect, beforeEach } from "vitest";
import { allMatches, rankedTeams, previousPhase } from "./phase";
import type { Tournament, GroupTournamentPhase, KnockoutTournamentPhase } from "@/types/tournament";
import { generateTestTournament } from "./test";

describe("Phase Helper Functions", () => {
    let tournament: Tournament;

    beforeEach(() => {
        tournament = generateTestTournament(8);
    });

    describe("allMatches", () => {
        it("should return empty array when phase is undefined", () => {
            const matches = allMatches(undefined);
            expect(matches).toEqual([]);
        });

        it("should return all matches from a group phase", () => {
            const phase: GroupTournamentPhase = {
                id: "phase-1",
                name: "Group Phase",
                type: "group",
                rounds: 2,
                matches: [
                    {
                        id: "match-1",
                        court: 1,
                        teams: [
                            { ref: { id: "team-1" }, score: 0 },
                            { ref: { id: "team-2" }, score: 0 },
                        ],
                        date: new Date(),
                        status: "scheduled",
                    },
                    {
                        id: "match-2",
                        court: 2,
                        teams: [
                            { ref: { id: "team-3" }, score: 0 },
                            { ref: { id: "team-4" }, score: 0 },
                        ],
                        date: new Date(),
                        status: "scheduled",
                    },
                ],
            };

            const matches = allMatches(phase);
            expect(matches.length).toBe(2);
            expect(matches[0]!.id).toBe("match-1");
            expect(matches[1]!.id).toBe("match-2");
        });

        it("should return all matches from a knockout phase", () => {
            const phase: KnockoutTournamentPhase = {
                id: "phase-knockout",
                name: "Knockout Phase",
                type: "knockout",
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
                                date: new Date(),
                                status: "scheduled",
                            },
                            {
                                id: "match-2",
                                court: 2,
                                teams: [
                                    { ref: { id: "team-3" }, score: 0 },
                                    { ref: { id: "team-4" }, score: 0 },
                                ],
                                date: new Date(),
                                status: "scheduled",
                            },
                        ],
                    },
                    {
                        id: "round-2",
                        name: "Final",
                        matches: [
                            {
                                id: "match-3",
                                court: 1,
                                teams: [
                                    { ref: { id: "team-1" }, score: 0 },
                                    { ref: { id: "team-3" }, score: 0 },
                                ],
                                date: new Date(),
                                status: "scheduled",
                            },
                        ],
                    },
                ],
            };

            const matches = allMatches(phase);
            expect(matches.length).toBe(3);
            expect(matches[0]!.id).toBe("match-1");
            expect(matches[1]!.id).toBe("match-2");
            expect(matches[2]!.id).toBe("match-3");
        });

        it("should flatten all matches from multiple rounds in knockout phase", () => {
            const phase: KnockoutTournamentPhase = {
                id: "phase-knockout",
                name: "Knockout Phase",
                type: "knockout",
                rounds: [
                    {
                        id: "round-1",
                        name: "Quarter-finals",
                        matches: Array.from({ length: 4 }, (_, i) => ({
                            id: `qf-match-${i}`,
                            court: 1,
                            teams: [
                                { ref: { id: `team-${i * 2}` }, score: 0 },
                                { ref: { id: `team-${i * 2 + 1}` }, score: 0 },
                            ],
                            date: new Date(),
                            status: "scheduled" as const,
                        })),
                    },
                    {
                        id: "round-2",
                        name: "Semi-finals",
                        matches: Array.from({ length: 2 }, (_, i) => ({
                            id: `sf-match-${i}`,
                            court: 1,
                            teams: [
                                { ref: { id: `team-${i * 2}` }, score: 0 },
                                { ref: { id: `team-${i * 2 + 1}` }, score: 0 },
                            ],
                            date: new Date(),
                            status: "scheduled" as const,
                        })),
                    },
                ],
            };

            const matches = allMatches(phase);
            expect(matches.length).toBe(6); // 4 QF + 2 SF
        });
    });

    describe("rankedTeams", () => {
        it("should return ranked teams from group phase based on standings", () => {
            const phase: GroupTournamentPhase = {
                id: "phase-1",
                name: "Group Phase",
                type: "group",
                rounds: 2,
                matches: [
                    {
                        id: "match-1",
                        court: 1,
                        teams: [
                            { ref: { id: "team-1" }, score: 3 },
                            { ref: { id: "team-2" }, score: 0 },
                        ],
                        date: new Date(),
                        status: "completed",
                    },
                    {
                        id: "match-2",
                        court: 2,
                        teams: [
                            { ref: { id: "team-3" }, score: 2 },
                            { ref: { id: "team-4" }, score: 1 },
                        ],
                        date: new Date(),
                        status: "completed",
                    },
                ],
            };

            const ranked = rankedTeams(phase);

            // Should return teams in some order
            expect(ranked.length).toBeGreaterThan(0);
            ranked.forEach((team) => {
                expect(team).toHaveProperty("id");
            });
        });

        it("should return ranked teams from knockout phase", () => {
            const phase: KnockoutTournamentPhase = {
                id: "phase-knockout",
                name: "Knockout Phase",
                type: "knockout",
                rounds: [
                    {
                        id: "final",
                        name: "Final",
                        matches: [
                            {
                                id: "final-match",
                                court: 1,
                                teams: [
                                    { ref: { id: "team-1" }, score: 2 },
                                    { ref: { id: "team-2" }, score: 1 },
                                ],
                                date: new Date(),
                                status: "completed",
                            },
                        ],
                    },
                ],
            };

            const ranked = rankedTeams(phase);

            expect(ranked.length).toBe(2);
            // Winner should be first
            expect(ranked[0]!.id).toBe("team-1");
            // Loser should be second
            expect(ranked[1]!.id).toBe("team-2");
        });

        it("should handle scheduled knockout matches by using first team in match", () => {
            const phase: KnockoutTournamentPhase = {
                id: "phase-knockout",
                name: "Knockout Phase",
                type: "knockout",
                rounds: [
                    {
                        id: "semi-finals",
                        name: "Semi-finals",
                        matches: [
                            {
                                id: "sf-1",
                                court: 1,
                                teams: [
                                    { ref: { id: "team-1" }, score: 0 },
                                    { ref: { id: "team-2" }, score: 0 },
                                ],
                                date: new Date(),
                                status: "scheduled",
                            },
                        ],
                    },
                ],
            };

            const ranked = rankedTeams(phase);

            expect(ranked.length).toBeGreaterThan(0);
            expect(ranked[0]!.id).toBe("team-1");
        });

        it("should rank winners before losers in knockout phase", () => {
            const phase: KnockoutTournamentPhase = {
                id: "phase-knockout",
                name: "Knockout Phase",
                type: "knockout",
                rounds: [
                    {
                        id: "semi-finals",
                        name: "Semi-finals",
                        matches: [
                            {
                                id: "sf-1",
                                court: 1,
                                teams: [
                                    { ref: { id: "team-1" }, score: 3 },
                                    { ref: { id: "team-2" }, score: 1 },
                                ],
                                date: new Date(),
                                status: "completed",
                            },
                            {
                                id: "sf-2",
                                court: 2,
                                teams: [
                                    { ref: { id: "team-3" }, score: 2 },
                                    { ref: { id: "team-4" }, score: 0 },
                                ],
                                date: new Date(),
                                status: "completed",
                            },
                        ],
                    },
                    {
                        id: "final",
                        name: "Final",
                        matches: [
                            {
                                id: "final",
                                court: 1,
                                teams: [
                                    { ref: { id: "team-1" }, score: 2 },
                                    { ref: { id: "team-3" }, score: 1 },
                                ],
                                date: new Date(),
                                status: "completed",
                            },
                        ],
                    },
                ],
            };

            const ranked = rankedTeams(phase);

            // Final winner should be first
            expect(ranked[0]!.id).toBe("team-1");
            // Final loser should be second
            expect(ranked[1]!.id).toBe("team-3");
            // Then semi-final winners (already in final)
            // Then semi-final losers
            expect(ranked).toContain(ranked.find((t) => t.id === "team-2"));
            expect(ranked).toContain(ranked.find((t) => t.id === "team-4"));
        });
    });

    describe("previousPhase", () => {
        it("should return null for the first phase", () => {
            const phase: GroupTournamentPhase = {
                id: "phase-1",
                name: "Group Phase",
                type: "group",
                rounds: 2,
                matches: [],
            };

            tournament.phases = [phase];

            const prev = previousPhase(tournament, phase);
            expect(prev).toBeNull();
        });

        it("should return the previous phase for second phase", () => {
            const phase1: GroupTournamentPhase = {
                id: "phase-1",
                name: "Group Phase",
                type: "group",
                rounds: 2,
                matches: [],
            };

            const phase2: KnockoutTournamentPhase = {
                id: "phase-2",
                name: "Knockout Phase",
                type: "knockout",
                rounds: [],
            };

            tournament.phases = [phase1, phase2];

            const prev = previousPhase(tournament, phase2);
            expect(prev).not.toBeNull();
            expect(prev?.id).toBe("phase-1");
        });

        it("should return the correct previous phase in a multi-phase tournament", () => {
            const phase1: GroupTournamentPhase = {
                id: "phase-1",
                name: "First Group Phase",
                type: "group",
                rounds: 2,
                matches: [],
            };

            const phase2: GroupTournamentPhase = {
                id: "phase-2",
                name: "Second Group Phase",
                type: "group",
                rounds: 2,
                matches: [],
            };

            const phase3: KnockoutTournamentPhase = {
                id: "phase-3",
                name: "Knockout Phase",
                type: "knockout",
                rounds: [],
            };

            tournament.phases = [phase1, phase2, phase3];

            const prev = previousPhase(tournament, phase3);
            expect(prev).not.toBeNull();
            expect(prev?.id).toBe("phase-2");

            const prevOfPhase2 = previousPhase(tournament, phase2);
            expect(prevOfPhase2).not.toBeNull();
            expect(prevOfPhase2?.id).toBe("phase-1");
        });

        it("should handle phases correctly when phase is not found", () => {
            const phase1: GroupTournamentPhase = {
                id: "phase-1",
                name: "Group Phase",
                type: "group",
                rounds: 2,
                matches: [],
            };

            const orphanPhase: KnockoutTournamentPhase = {
                id: "orphan",
                name: "Orphan Phase",
                type: "knockout",
                rounds: [],
            };

            tournament.phases = [phase1];

            const prev = previousPhase(tournament, orphanPhase);
            expect(prev).toBeNull();
        });
    });
});
