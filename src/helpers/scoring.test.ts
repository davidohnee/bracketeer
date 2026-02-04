import { describe, it, expect } from "vitest";
import { calculateTeamPoints, calculateDifference, calculateScoresFromSets } from "./scoring";
import type { TeamScore, SetScore } from "@/types/tournament";

describe("Scoring Helper Functions", () => {
    describe("calculateTeamPoints", () => {
        it("should calculate points correctly for wins only", () => {
            const teamScore: TeamScore = {
                wins: 3,
                draws: 0,
                losses: 0,
                points: { for: 10, against: 5 },
            };
            expect(calculateTeamPoints(teamScore)).toBe(9); // 3 wins * 3 points
        });

        it("should calculate points correctly for draws only", () => {
            const teamScore: TeamScore = {
                wins: 0,
                draws: 2,
                losses: 0,
                points: { for: 5, against: 5 },
            };
            expect(calculateTeamPoints(teamScore)).toBe(2); // 2 draws * 1 point
        });

        it("should calculate points correctly for wins and draws", () => {
            const teamScore: TeamScore = {
                wins: 2,
                draws: 1,
                losses: 1,
                points: { for: 8, against: 6 },
            };
            expect(calculateTeamPoints(teamScore)).toBe(7); // 2*3 + 1*1 = 7
        });

        it("should return 0 for no wins or draws", () => {
            const teamScore: TeamScore = {
                wins: 0,
                draws: 0,
                losses: 3,
                points: { for: 2, against: 10 },
            };
            expect(calculateTeamPoints(teamScore)).toBe(0);
        });

        it("should handle mixed results", () => {
            const teamScore: TeamScore = {
                wins: 4,
                draws: 3,
                losses: 2,
                points: { for: 15, against: 12 },
            };
            expect(calculateTeamPoints(teamScore)).toBe(15); // 4*3 + 3*1 = 15
        });
    });

    describe("calculateDifference", () => {
        it("should return positive difference with + prefix", () => {
            const teamScore: TeamScore = {
                wins: 2,
                draws: 0,
                losses: 0,
                points: { for: 10, against: 5 },
            };
            expect(calculateDifference(teamScore)).toBe("+5");
        });

        it("should return negative difference without + prefix", () => {
            const teamScore: TeamScore = {
                wins: 0,
                draws: 0,
                losses: 2,
                points: { for: 3, against: 8 },
            };
            expect(calculateDifference(teamScore)).toBe("-5");
        });

        it("should return 0 for equal points", () => {
            const teamScore: TeamScore = {
                wins: 1,
                draws: 1,
                losses: 1,
                points: { for: 7, against: 7 },
            };
            expect(calculateDifference(teamScore)).toBe("0");
        });

        it("should handle large positive differences", () => {
            const teamScore: TeamScore = {
                wins: 5,
                draws: 0,
                losses: 0,
                points: { for: 50, against: 10 },
            };
            expect(calculateDifference(teamScore)).toBe("+40");
        });

        it("should handle large negative differences", () => {
            const teamScore: TeamScore = {
                wins: 0,
                draws: 0,
                losses: 5,
                points: { for: 5, against: 45 },
            };
            expect(calculateDifference(teamScore)).toBe("-40");
        });
    });

    describe("calculateScoresFromSets", () => {
        it("should calculate scores when team1 wins all sets", () => {
            const sets: SetScore[] = [
                { team1: 11, team2: 5 },
                { team1: 11, team2: 7 },
                { team1: 11, team2: 9 },
            ];
            const [team1Score, team2Score] = calculateScoresFromSets(sets);
            expect(team1Score).toBe(3);
            expect(team2Score).toBe(0);
        });

        it("should calculate scores when team2 wins all sets", () => {
            const sets: SetScore[] = [
                { team1: 5, team2: 11 },
                { team1: 7, team2: 11 },
            ];
            const [team1Score, team2Score] = calculateScoresFromSets(sets);
            expect(team1Score).toBe(0);
            expect(team2Score).toBe(2);
        });

        it("should calculate scores for mixed set wins", () => {
            const sets: SetScore[] = [
                { team1: 11, team2: 5 },
                { team1: 8, team2: 11 },
                { team1: 11, team2: 9 },
            ];
            const [team1Score, team2Score] = calculateScoresFromSets(sets);
            expect(team1Score).toBe(2);
            expect(team2Score).toBe(1);
        });

        it("should handle empty sets array", () => {
            const sets: SetScore[] = [];
            const [team1Score, team2Score] = calculateScoresFromSets(sets);
            expect(team1Score).toBe(0);
            expect(team2Score).toBe(0);
        });

        it("should handle tied sets (no winner)", () => {
            const sets: SetScore[] = [
                { team1: 10, team2: 10 },
                { team1: 11, team2: 11 },
            ];
            const [team1Score, team2Score] = calculateScoresFromSets(sets);
            expect(team1Score).toBe(0);
            expect(team2Score).toBe(0);
        });

        it("should calculate scores for a typical best-of-5 match", () => {
            const sets: SetScore[] = [
                { team1: 11, team2: 5 },
                { team1: 8, team2: 11 },
                { team1: 11, team2: 7 },
                { team1: 9, team2: 11 },
                { team1: 11, team2: 6 },
            ];
            const [team1Score, team2Score] = calculateScoresFromSets(sets);
            expect(team1Score).toBe(3);
            expect(team2Score).toBe(2);
        });

        it("should handle single set", () => {
            const sets: SetScore[] = [
                { team1: 21, team2: 19 },
            ];
            const [team1Score, team2Score] = calculateScoresFromSets(sets);
            expect(team1Score).toBe(1);
            expect(team2Score).toBe(0);
        });

        it("should handle zero scores in sets", () => {
            const sets: SetScore[] = [
                { team1: 0, team2: 11 },
                { team1: 11, team2: 0 },
            ];
            const [team1Score, team2Score] = calculateScoresFromSets(sets);
            expect(team1Score).toBe(1);
            expect(team2Score).toBe(1);
        });
    });
});
