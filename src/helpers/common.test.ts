import { describe, it, expect, beforeEach, vi } from "vitest";
import {
    chunks,
    ALPHABET,
    ROUND_NAME,
    deepCopy,
    agoString,
    shuffle,
    getTournamentStatus,
    capitalise,
    ceilToNextMinute,
    localeDateTimeString,
    formatPlacement,
} from "./common";
import type { Tournament, DynamicTeamRef } from "@/types/tournament";

describe("Common Helper Functions", () => {
    describe("chunks", () => {
        it("should split array into chunks of specified size", () => {
            const result = chunks([1, 2, 3, 4, 5, 6], 2);
            expect(result).toEqual([[1, 2], [3, 4], [5, 6]]);
        });

        it("should handle arrays that don't divide evenly", () => {
            const result = chunks([1, 2, 3, 4, 5], 2);
            expect(result).toEqual([[1, 2], [3, 4], [5]]);
        });

        it("should handle empty arrays", () => {
            const result = chunks([], 2);
            expect(result).toEqual([]);
        });

        it("should handle chunk size larger than array", () => {
            const result = chunks([1, 2, 3], 5);
            expect(result).toEqual([[1, 2, 3]]);
        });
    });

    describe("ALPHABET constant", () => {
        it("should contain all uppercase letters", () => {
            expect(ALPHABET).toBe("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
            expect(ALPHABET.length).toBe(26);
        });
    });

    describe("ROUND_NAME constant", () => {
        it("should contain proper round names for common knockout stages", () => {
            expect(ROUND_NAME[16]).toBe("Round of 16");
            expect(ROUND_NAME[8]).toBe("Quarter-finals");
            expect(ROUND_NAME[4]).toBe("Semi-finals");
            expect(ROUND_NAME[2]).toBe("Final");
        });
    });

    describe("deepCopy", () => {
        it("should create a deep copy of an object", () => {
            const original = { a: 1, b: { c: 2 } };
            const copy = deepCopy(original);
            
            expect(copy).toEqual(original);
            expect(copy).not.toBe(original);
            expect(copy.b).not.toBe(original.b);
        });

        it("should create a deep copy of an array", () => {
            const original = [1, 2, [3, 4]];
            const copy = deepCopy(original);
            
            expect(copy).toEqual(original);
            expect(copy).not.toBe(original);
            expect(copy[2]).not.toBe(original[2]);
        });

        it("should handle null", () => {
            const copy = deepCopy(null);
            expect(copy).toBeNull();
        });

        it("should handle primitive values", () => {
            expect(deepCopy(42)).toBe(42);
            expect(deepCopy("test")).toBe("test");
            expect(deepCopy(true)).toBe(true);
        });
    });

    describe("agoString", () => {
        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date("2024-01-15T12:00:00"));
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it("should return 'Just now' for times less than 60 seconds ago", () => {
            const date = new Date("2024-01-15T11:59:30");
            expect(agoString(date)).toBe("Just now");
        });

        it("should return minutes for times less than 60 minutes ago", () => {
            const date = new Date("2024-01-15T11:45:00");
            expect(agoString(date)).toBe("15 minutes ago");
        });

        it("should return '1 minute ago' for exactly 1 minute", () => {
            const date = new Date("2024-01-15T11:59:00");
            expect(agoString(date)).toBe("1 minute ago");
        });

        it("should return hours for times less than 24 hours ago", () => {
            const date = new Date("2024-01-15T08:00:00");
            expect(agoString(date)).toBe("4 hours ago");
        });

        it("should return '1 hour ago' for exactly 1 hour", () => {
            const date = new Date("2024-01-15T11:00:00");
            expect(agoString(date)).toBe("1 hour ago");
        });

        it("should return days for times less than 7 days ago", () => {
            const date = new Date("2024-01-12T12:00:00");
            expect(agoString(date)).toBe("3 days ago");
        });

        it("should return formatted date for times more than 7 days ago", () => {
            const date = new Date("2024-01-01T12:00:00");
            const result = agoString(date);
            expect(result).toContain("01");
            expect(result).toContain("2024");
        });
    });

    describe("shuffle", () => {
        it("should return an array of the same length", () => {
            const items = [1, 2, 3, 4, 5];
            const shuffled = shuffle([...items]);
            expect(shuffled.length).toBe(items.length);
        });

        it("should contain all original elements", () => {
            const items = [1, 2, 3, 4, 5];
            const shuffled = shuffle([...items]);
            items.forEach(item => {
                expect(shuffled).toContain(item);
            });
        });

        it("should handle empty arrays", () => {
            const shuffled = shuffle([]);
            expect(shuffled).toEqual([]);
        });

        it("should handle single element arrays", () => {
            const shuffled = shuffle([1]);
            expect(shuffled).toEqual([1]);
        });
    });

    describe("getTournamentStatus", () => {
        let tournament: Tournament;

        beforeEach(() => {
            tournament = {
                id: "test-tournament",
                version: 3,
                name: "Test Tournament",
                teams: [],
                phases: [],
                config: {
                    courts: 2,
                    matchDuration: 30,
                    breakDuration: 5,
                    knockoutBreakDuration: 10,
                    startTime: new Date(),
                    sport: "test",
                },
            };
        });

        it("should return 'completed' when all matches are completed", () => {
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
                                { ref: { id: "team-1" }, score: 2 },
                                { ref: { id: "team-2" }, score: 1 },
                            ],
                            date: new Date(),
                            status: "completed",
                        },
                        {
                            id: "match-2",
                            court: 2,
                            teams: [
                                { ref: { id: "team-3" }, score: 3 },
                                { ref: { id: "team-4" }, score: 0 },
                            ],
                            date: new Date(),
                            status: "completed",
                        },
                    ],
                },
            ];
            
            expect(getTournamentStatus(tournament)).toBe("completed");
        });

        it("should return 'in-progress' when some matches are in progress", () => {
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
                                { ref: { id: "team-1" }, score: 1 },
                                { ref: { id: "team-2" }, score: 1 },
                            ],
                            date: new Date(),
                            status: "in-progress",
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
            ];
            
            expect(getTournamentStatus(tournament)).toBe("in-progress");
        });

        it("should return 'in-progress' when some matches are completed", () => {
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
                                { ref: { id: "team-1" }, score: 2 },
                                { ref: { id: "team-2" }, score: 1 },
                            ],
                            date: new Date(),
                            status: "completed",
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
            ];
            
            expect(getTournamentStatus(tournament)).toBe("in-progress");
        });

        it("should return 'scheduled' when all matches are scheduled", () => {
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
                            date: new Date(),
                            status: "scheduled",
                        },
                    ],
                },
            ];
            
            expect(getTournamentStatus(tournament)).toBe("scheduled");
        });

        it("should handle knockout phases", () => {
            tournament.phases = [
                {
                    id: "phase-1",
                    type: "knockout",
                    name: "Knockout Phase",
                    teamCount: 4,
                    rounds: [
                        {
                            id: "round-1",
                            name: "Final",
                            matches: [
                                {
                                    id: "match-1",
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
                },
            ];
            
            expect(getTournamentStatus(tournament)).toBe("completed");
        });
    });

    describe("capitalise", () => {
        it("should capitalise the first letter", () => {
            expect(capitalise("hello")).toBe("Hello");
        });

        it("should handle already capitalised strings", () => {
            expect(capitalise("Hello")).toBe("Hello");
        });

        it("should handle single character strings", () => {
            expect(capitalise("a")).toBe("A");
        });

        it("should handle empty strings", () => {
            expect(capitalise("")).toBe("");
        });

        it("should only capitalise the first letter", () => {
            expect(capitalise("hELLO")).toBe("HELLO");
        });
    });

    describe("ceilToNextMinute", () => {
        it("should not change time if seconds are 0", () => {
            const date = new Date("2024-01-15T12:30:00");
            const result = ceilToNextMinute(date);
            expect(result.getMinutes()).toBe(30);
            expect(result.getSeconds()).toBe(0);
        });

        it("should ceil to next minute if seconds > 0", () => {
            const date = new Date("2024-01-15T12:30:30");
            const result = ceilToNextMinute(date);
            expect(result.getMinutes()).toBe(31);
            expect(result.getSeconds()).toBe(0);
        });

        it("should handle hour boundary", () => {
            const date = new Date("2024-01-15T12:59:30");
            const result = ceilToNextMinute(date);
            expect(result.getHours()).toBe(13);
            expect(result.getMinutes()).toBe(0);
            expect(result.getSeconds()).toBe(0);
        });
    });

    describe("localeDateTimeString", () => {
        it("should format date with time", () => {
            const date = new Date("2024-01-15T12:30:00");
            const result = localeDateTimeString(date, { today: false, thisYear: false });
            expect(result).toContain("12:30");
        });

        it("should hide date if today", () => {
            const now = new Date();
            const result = localeDateTimeString(now, { today: true });
            // Should contain time but the format depends on locale
            expect(result.length).toBeGreaterThan(0);
            // Should not contain month/day when today
            expect(result.toLowerCase()).not.toContain("jan");
            expect(result.toLowerCase()).not.toContain("feb");
        });

        it("should hide year if this year", () => {
            const date = new Date();
            date.setMonth(0);
            date.setDate(1);
            const result = localeDateTimeString(date, { today: false, thisYear: true });
            expect(result).not.toContain(date.getFullYear().toString());
        });
    });

    describe("formatPlacement", () => {
        it("should format league placement without label", () => {
            const placement: DynamicTeamRef = {
                type: "league",
                placement: 0,
            };
            expect(formatPlacement(placement)).toBe("Place 1");
        });

        it("should format league placement with label", () => {
            const placement: DynamicTeamRef = {
                type: "league",
                placement: 0,
                label: "1st",
            };
            expect(formatPlacement(placement)).toBe("Place 1st");
        });

        it("should format winner placement without label", () => {
            const placement: DynamicTeamRef = {
                type: "winner",
                placement: 0,
            };
            expect(formatPlacement(placement)).toBe("Winner A");
        });

        it("should format winner placement with label", () => {
            const placement: DynamicTeamRef = {
                type: "winner",
                placement: 0,
                label: "Group 1",
            };
            expect(formatPlacement(placement)).toBe("Winner Group 1");
        });

        it("should format loser placement without label", () => {
            const placement: DynamicTeamRef = {
                type: "loser",
                placement: 1,
            };
            expect(formatPlacement(placement)).toBe("Loser B");
        });

        it("should format loser placement with label", () => {
            const placement: DynamicTeamRef = {
                type: "loser",
                placement: 1,
                label: "SF1",
            };
            expect(formatPlacement(placement)).toBe("Loser SF1");
        });
    });
});
