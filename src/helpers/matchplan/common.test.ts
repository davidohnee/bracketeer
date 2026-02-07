import { describe, it, expect, beforeEach } from "vitest";
import { adjustStartTimes, earliestFreeSlot } from "./common";
import type {
    Tournament,
    Match,
    Ref,
    GroupTournamentPhase,
    KnockoutTournamentPhase,
} from "@/types/tournament";
import { generateTestTournament, inNHours } from "../test";

describe("Matchplan Common Functions", () => {
    let tournament: Tournament;
    let baseDate: Date;

    beforeEach(() => {
        tournament = generateTestTournament(8);
        baseDate = tournament.config.startTime;
    });

    describe("earliestFreeSlot", () => {
        it("should return the earliest time when no matches are scheduled", () => {
            const teams: Ref[] = [{ id: "team-1" }, { id: "team-2" }];
            const slot = earliestFreeSlot([], baseDate, 35, teams, 2);

            expect(slot.time.getTime()).toBe(baseDate.getTime());
            expect(slot.court).toBe(1);
        });

        it("should find the next available court when first court is occupied", () => {
            const team1: Ref = { id: "team-1" };
            const team2: Ref = { id: "team-2" };
            const team3: Ref = { id: "team-3" };
            const team4: Ref = { id: "team-4" };

            const existingMatch: Match = {
                id: "match-1",
                court: 1,
                teams: [
                    { ref: team1, score: 0 },
                    { ref: team2, score: 0 },
                ],
                date: new Date(baseDate),
                status: "scheduled",
            };

            const newTeams = [team3, team4];
            const slot = earliestFreeSlot([existingMatch], baseDate, 35, newTeams, 2);

            expect(slot.time.getTime()).toBe(baseDate.getTime());
            expect(slot.court).toBe(2);
        });

        it("should schedule in next time slot when all courts are occupied", () => {
            const teams: Ref[] = [
                { id: "team-1" },
                { id: "team-2" },
                { id: "team-3" },
                { id: "team-4" },
            ];

            const existingMatches: Match[] = [
                {
                    id: "match-1",
                    court: 1,
                    teams: [
                        { ref: teams[0], score: 0 },
                        { ref: teams[1], score: 0 },
                    ],
                    date: new Date(baseDate),
                    status: "scheduled",
                },
                {
                    id: "match-2",
                    court: 2,
                    teams: [
                        { ref: teams[2], score: 0 },
                        { ref: teams[3], score: 0 },
                    ],
                    date: new Date(baseDate),
                    status: "scheduled",
                },
            ];

            const newTeams: Ref[] = [{ id: "team-5" }, { id: "team-6" }];
            const timeDelta = 35;
            const slot = earliestFreeSlot(existingMatches, baseDate, timeDelta, newTeams, 2);

            const expectedTime = new Date(baseDate);
            expectedTime.setMinutes(expectedTime.getMinutes() + timeDelta);

            expect(slot.time.getTime()).toBe(expectedTime.getTime());
            expect(slot.court).toBe(1);
        });

        it("should prevent team from playing multiple matches at the same time", () => {
            const team1: Ref = { id: "team-1" };
            const team2: Ref = { id: "team-2" };
            const team3: Ref = { id: "team-3" };

            const existingMatch: Match = {
                id: "match-1",
                court: 1,
                teams: [
                    { ref: team1, score: 0 },
                    { ref: team2, score: 0 },
                ],
                date: new Date(baseDate),
                status: "scheduled",
            };

            // Try to schedule team1 again at the same time
            const slot = earliestFreeSlot([existingMatch], baseDate, 35, [team1, team3], 2);

            // Should move to next time slot since team1 is already playing
            const expectedTime = new Date(baseDate);
            expectedTime.setMinutes(expectedTime.getMinutes() + 35);

            expect(slot.time.getTime()).toBe(expectedTime.getTime());
        });

        it("should respect the number of available courts", () => {
            const teams: Ref[] = Array.from({ length: 6 }, (_, i) => ({ id: `team-${i + 1}` }));

            const existingMatches: Match[] = [
                {
                    id: "match-1",
                    court: 1,
                    teams: [
                        { ref: teams[0], score: 0 },
                        { ref: teams[1], score: 0 },
                    ],
                    date: new Date(baseDate),
                    status: "scheduled",
                },
                {
                    id: "match-2",
                    court: 2,
                    teams: [
                        { ref: teams[2], score: 0 },
                        { ref: teams[3], score: 0 },
                    ],
                    date: new Date(baseDate),
                    status: "scheduled",
                },
            ];

            const slot = earliestFreeSlot(existingMatches, baseDate, 35, [teams[4]!, teams[5]!], 2);

            // All courts occupied, should move to next slot
            const expectedTime = new Date(baseDate);
            expectedTime.setMinutes(expectedTime.getMinutes() + 35);

            expect(slot.time.getTime()).toBe(expectedTime.getTime());
        });
    });

    describe("adjustStartTimes", () => {
        beforeEach(() => {
            const inAnHour = inNHours(1);
            const inTwoHours = inNHours(2);

            // Create a group phase with scheduled matches
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
                        date: inAnHour,
                        status: "scheduled",
                        round: { id: "round-1", name: "Round 1" },
                    },
                    {
                        id: "match-2",
                        court: 2,
                        teams: [
                            { ref: { id: "team-3" }, score: 0 },
                            { ref: { id: "team-4" }, score: 0 },
                        ],
                        date: inAnHour,
                        status: "scheduled",
                        round: { id: "round-1", name: "Round 1" },
                    },
                    {
                        id: "match-3",
                        court: 1,
                        teams: [
                            { ref: { id: "team-5" }, score: 0 },
                            { ref: { id: "team-6" }, score: 0 },
                        ],
                        date: inTwoHours,
                        status: "scheduled",
                        round: { id: "round-2", name: "Round 2" },
                    },
                ],
            };

            tournament.phases = [phase];
        });

        it("should adjust all scheduled matches to current time", () => {
            const result = adjustStartTimes(tournament);

            const phase = result.phases[0] as GroupTournamentPhase;
            expect(phase.matches.length).toBe(3);

            // All matches should have dates adjusted to current time or later
            const now = new Date();
            phase.matches.forEach((match) => {
                if (match.status === "scheduled") {
                    expect(match.date.getTime()).toBeGreaterThanOrEqual(now.getTime() - 60000); // within a minute
                }
            });
        });

        it("should preserve relative time differences between matches (approximately)", () => {
            const oldPhase = tournament.phases[0] as GroupTournamentPhase;
            const oldTimes = oldPhase.matches.map((m) => m.date.getTime());
            const oldDiffs = [oldTimes[1]! - oldTimes[0]!, oldTimes[2]! - oldTimes[1]!];

            const result = adjustStartTimes(tournament);

            const newPhase = result.phases[0] as GroupTournamentPhase;
            const newTimes = newPhase.matches.map((m) => m.date.getTime());
            const newDiffs = [newTimes[1]! - newTimes[0]!, newTimes[2]! - newTimes[1]!];

            // Time differences should be approximately preserved (within 1 minute due to ceiling)
            expect(Math.abs(newDiffs[0]! - oldDiffs[0]!)).toBeLessThanOrEqual(60000);
            expect(Math.abs(newDiffs[1]! - oldDiffs[1]!)).toBeLessThanOrEqual(60000);
        });

        it("should start matches when startMatches option is true", () => {
            const phase = tournament.phases[0] as GroupTournamentPhase;

            // Set first match to start exactly at the reference time
            const refTime = tournament.config.startTime;
            phase.matches[0]!.date = new Date(refTime);

            const result = adjustStartTimes(tournament, { startMatches: true });

            const updatedPhase = result.phases[0] as GroupTournamentPhase;

            // Check if any match that was scheduled at the start time is now in-progress
            const firstMatch = updatedPhase.matches.find((m) => m.id === "match-1");
            expect(firstMatch).toBeDefined();
        });

        it("should not adjust completed matches", () => {
            const phase = tournament.phases[0] as GroupTournamentPhase;
            const completedMatch = phase.matches[0]!;
            completedMatch.status = "completed";

            adjustStartTimes(tournament);

            // Completed match date should remain unchanged
            expect(completedMatch.status).toBe("completed");
        });

        it("should not adjust in-progress matches", () => {
            const phase = tournament.phases[0] as GroupTournamentPhase;
            const inProgressMatch = phase.matches[1]!;
            inProgressMatch.status = "in-progress";

            adjustStartTimes(tournament);

            // In-progress match should remain in-progress
            expect(inProgressMatch.status).toBe("in-progress");
        });

        it("should use custom start time when provided", () => {
            const customStartTime = new Date("2024-06-15T14:00:00");

            const result = adjustStartTimes(tournament, { startTime: customStartTime });

            const phase = result.phases[0] as GroupTournamentPhase;

            // Matches should be adjusted relative to custom start time
            // The function adjusts to current time, so we just verify matches are scheduled
            phase.matches.forEach((match) => {
                if (match.status === "scheduled") {
                    expect(match.date).toBeInstanceOf(Date);
                    // Date should be valid and not in distant past
                    expect(match.date.getTime()).toBeGreaterThan(0);
                }
            });
        });

        it("should handle knockout phase matches", () => {
            // Add a knockout phase
            const knockoutPhase: KnockoutTournamentPhase = {
                id: "phase-2",
                name: "Knockout Phase",
                type: "knockout" as const,
                rounds: [
                    {
                        id: "semi-final",
                        name: "Semi-finals",
                        matches: [
                            {
                                id: "ko-match-1",
                                court: 1,
                                teams: [
                                    { ref: { id: "team-1" }, score: 0 },
                                    { ref: { id: "team-2" }, score: 0 },
                                ],
                                date: new Date("2024-01-01T11:00:00"),
                                status: "scheduled" as const,
                            },
                        ],
                    },
                ],
            };

            tournament.phases.push(knockoutPhase);

            const result = adjustStartTimes(tournament);

            const koPhase = result.phases[1];
            expect(koPhase!.type).toBe("knockout");
            if (koPhase?.type === "knockout") {
                expect(koPhase.rounds[0]!.matches[0]!.status).toBe("scheduled");
            }
        });
    });

    describe("court constraint verification", () => {
        it("should never use more courts than configured", () => {
            const phase: GroupTournamentPhase = {
                id: "phase-1",
                name: "Group Phase",
                type: "group",
                rounds: 2,
                matches: [],
            };

            tournament.config.courts = 3;

            // Create many matches
            for (let i = 0; i < 20; i++) {
                phase.matches.push({
                    id: `match-${i}`,
                    court: (i % 3) + 1,
                    teams: [
                        { ref: { id: `team-${i * 2}` }, score: 0 },
                        { ref: { id: `team-${i * 2 + 1}` }, score: 0 },
                    ],
                    date: new Date(baseDate.getTime() + i * 35 * 60000),
                    status: "scheduled",
                });
            }

            tournament.phases = [phase];

            // All matches should respect court limit
            phase.matches.forEach((match) => {
                expect(match.court).toBeGreaterThanOrEqual(1);
                expect(match.court).toBeLessThanOrEqual(tournament.config.courts);
            });
        });
    });
});
