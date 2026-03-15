import { describe, it, expect } from "vitest";
import type { Match, TeamScore } from "@/types/tournament";
import { COMPARATORS } from "./comparators";

const createTeamScore = ({
    id,
    wins = 0,
    draws = 0,
    losses = 0,
    pointsFor = 0,
    pointsAgainst = 0,
}: {
    id: string;
    wins?: number;
    draws?: number;
    losses?: number;
    pointsFor?: number;
    pointsAgainst?: number;
}): TeamScore => ({
    team: { id },
    wins,
    draws,
    losses,
    points: {
        for: pointsFor,
        against: pointsAgainst,
    },
});

const createMatch = ({
    id,
    teamAId,
    teamAScore,
    teamBId,
    teamBScore,
}: {
    id: string;
    teamAId: string;
    teamAScore: number;
    teamBId: string;
    teamBScore: number;
}): Match => ({
    id,
    court: 1,
    teams: [
        { ref: { id: teamAId }, score: teamAScore },
        { ref: { id: teamBId }, score: teamBScore },
    ],
    date: new Date("2026-01-01T10:00:00.000Z"),
    status: "completed",
});

describe("Table Comparators", () => {
    describe("points", () => {
        it("should prioritize the team with more tournament points", () => {
            const a = createTeamScore({ id: "team-a", wins: 2, draws: 0 }); // 6 points
            const b = createTeamScore({ id: "team-b", wins: 1, draws: 1 }); // 4 points

            const result = COMPARATORS.points({ a, b, matches: [] });

            expect(result).toBe(-2);
        });

        it("should return 0 when both teams have equal tournament points", () => {
            const a = createTeamScore({ id: "team-a", wins: 1, draws: 2 }); // 5 points
            const b = createTeamScore({ id: "team-b", wins: 1, draws: 2 }); // 5 points

            const result = COMPARATORS.points({ a, b, matches: [] });

            expect(result).toBe(0);
        });
    });

    describe("directEncounter", () => {
        it("should prioritize team a when it wins more head-to-head matches", () => {
            const a = createTeamScore({ id: "team-a" });
            const b = createTeamScore({ id: "team-b" });
            const matches: Match[] = [
                createMatch({
                    id: "h2h-1",
                    teamAId: "team-a",
                    teamAScore: 2,
                    teamBId: "team-b",
                    teamBScore: 1,
                }),
                createMatch({
                    id: "h2h-2",
                    teamAId: "team-a",
                    teamAScore: 3,
                    teamBId: "team-b",
                    teamBScore: 0,
                }),
                createMatch({
                    id: "h2h-3",
                    teamAId: "team-a",
                    teamAScore: 0,
                    teamBId: "team-b",
                    teamBScore: 1,
                }),
                // Unrelated match should be ignored.
                createMatch({
                    id: "other",
                    teamAId: "team-c",
                    teamAScore: 2,
                    teamBId: "team-d",
                    teamBScore: 2,
                }),
            ];

            const result = COMPARATORS.directEncounter({ a, b, matches });

            expect(result).toBe(1);
        });

        it("should return 0 when there are no head-to-head matches", () => {
            const a = createTeamScore({ id: "team-a" });
            const b = createTeamScore({ id: "team-b" });
            const matches: Match[] = [
                createMatch({
                    id: "other",
                    teamAId: "team-c",
                    teamAScore: 1,
                    teamBId: "team-d",
                    teamBScore: 0,
                }),
            ];

            const result = COMPARATORS.directEncounter({ a, b, matches });

            expect(result).toBe(0);
        });
    });

    describe("difference", () => {
        it("should compare teams by point difference", () => {
            const a = createTeamScore({ id: "team-a", pointsFor: 14, pointsAgainst: 10 }); // +4
            const b = createTeamScore({ id: "team-b", pointsFor: 10, pointsAgainst: 11 }); // -1

            const result = COMPARATORS.difference({ a, b, matches: [] });

            expect(result).toBe(-5);
        });
    });

    describe("pointsFor", () => {
        it("should prioritize the team with more points scored", () => {
            const a = createTeamScore({ id: "team-a", pointsFor: 12 });
            const b = createTeamScore({ id: "team-b", pointsFor: 9 });

            const result = COMPARATORS.pointsFor({ a, b, matches: [] });

            expect(result).toBe(-3);
        });
    });

    describe("pointsAgainst", () => {
        it("should prioritize the team with fewer points conceded", () => {
            const a = createTeamScore({ id: "team-a", pointsAgainst: 6 });
            const b = createTeamScore({ id: "team-b", pointsAgainst: 11 });

            const result = COMPARATORS.pointsAgainst({ a, b, matches: [] });

            expect(result).toBe(-5);
        });
    });

    describe("draws", () => {
        it("should prioritize the team with more draws", () => {
            const a = createTeamScore({ id: "team-a", draws: 1 });
            const b = createTeamScore({ id: "team-b", draws: 3 });

            const result = COMPARATORS.draws({ a, b, matches: [] });

            expect(result).toBe(2);
        });
    });
});
