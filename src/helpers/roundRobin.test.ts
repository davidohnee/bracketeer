import { describe, it, expect } from "vitest";
import { roundRobin } from "./roundRobin";

describe("roundRobin", () => {
    it("should generate correct round-robin schedule for even number of teams", () => {
        const teams = ["A", "B", "C", "D"];
        const schedule = roundRobin(teams);

        // With 4 teams, we should have 3 rounds
        expect(schedule.length).toBe(3);

        // Each round should have 2 matches (n/2)
        schedule.forEach((round) => {
            expect(round.length).toBe(2);
        });

        // Collect all matches to verify each team plays every other team exactly once
        const allPairs = schedule.flat();
        expect(allPairs.length).toBe(6); // C(4,2) = 6 combinations

        // Verify no team plays itself
        allPairs.forEach(([team1, team2]) => {
            expect(team1).not.toBe(team2);
        });
    });

    it("should generate correct round-robin schedule for odd number of teams", () => {
        const teams = ["A", "B", "C", "D", "E"];
        const schedule = roundRobin(teams);

        // With 5 teams, we should have 5 rounds (odd teams need n rounds)
        expect(schedule.length).toBe(5);

        // Each round should have 2 matches (floor(n/2))
        schedule.forEach((round) => {
            expect(round.length).toBe(2);
        });

        // Total matches should be C(5,2) = 10
        const allPairs = schedule.flat();
        expect(allPairs.length).toBe(10);
    });

    it("should ensure each team plays every other team exactly once", () => {
        const teams = ["A", "B", "C", "D"];
        const schedule = roundRobin(teams);

        const allPairs = schedule.flat();
        const pairStrings = allPairs.map(([a, b]) =>
            [a, b].sort((x, y) => x!.localeCompare(y!)).join("-"),
        );

        // Check uniqueness - no duplicate pairings
        const uniquePairs = new Set(pairStrings);
        expect(uniquePairs.size).toBe(pairStrings.length);

        // Verify all possible combinations exist
        const expectedPairs = [
            ["A", "B"],
            ["A", "C"],
            ["A", "D"],
            ["B", "C"],
            ["B", "D"],
            ["C", "D"],
        ];

        expectedPairs.forEach(([team1, team2]) => {
            const pairStr = [team1, team2].sort((x, y) => x!.localeCompare(y!)).join("-");
            expect(uniquePairs.has(pairStr)).toBe(true);
        });
    });

    it("should work with single team (edge case)", () => {
        const teams = ["A"];
        const schedule = roundRobin(teams);

        // Single team gets 1 round with no matches (after filtering out BYE)
        expect(schedule.length).toBe(1);
        expect(schedule[0]?.length).toBe(0);
    });

    it("should work with two teams", () => {
        const teams = ["A", "B"];
        const schedule = roundRobin(teams);

        // Two teams should have 1 round with 1 match
        expect(schedule.length).toBe(1);
        expect(schedule[0]?.length).toBe(1);

        const match = schedule[0]?.[0];
        expect(match).toEqual(["A", "B"]);
    });

    it("should ensure no team plays more than once per round", () => {
        const teams = ["A", "B", "C", "D", "E", "F"];
        const schedule = roundRobin(teams);

        schedule.forEach((round) => {
            const teamsInRound = round.flat();
            const uniqueTeams = new Set(teamsInRound);

            // Each team should appear at most once per round
            expect(uniqueTeams.size).toBe(teamsInRound.length);
        });
    });

    it("should work with object references (teams)", () => {
        const teams = [
            { id: "1", name: "Team A" },
            { id: "2", name: "Team B" },
            { id: "3", name: "Team C" },
            { id: "4", name: "Team D" },
        ];
        const schedule = roundRobin(teams);

        expect(schedule.length).toBe(3);

        // Verify objects are preserved correctly
        const allPairs = schedule.flat();
        allPairs.forEach(([team1, team2]) => {
            expect(team1).toHaveProperty("id");
            expect(team1).toHaveProperty("name");
            expect(team2).toHaveProperty("id");
            expect(team2).toHaveProperty("name");
        });
    });
});
