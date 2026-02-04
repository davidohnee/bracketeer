import { describe, it, expect } from "vitest";
import { generateNTeams } from "./teamGenerator";

describe("Team Generator Helper Functions", () => {
    describe("generateNTeams", () => {
        it("should generate the specified number of teams", () => {
            const teams = generateNTeams(5);
            expect(teams).toHaveLength(5);
        });

        it("should generate teams with unique ids", () => {
            const teams = generateNTeams(10);
            const ids = teams.map(team => team.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(10);
        });

        it("should generate teams with sequential names", () => {
            const teams = generateNTeams(3);
            expect(teams[0]?.name).toBe("Team 1");
            expect(teams[1]?.name).toBe("Team 2");
            expect(teams[2]?.name).toBe("Team 3");
        });

        it("should generate teams with empty players array", () => {
            const teams = generateNTeams(4);
            teams.forEach(team => {
                expect(team.players).toEqual([]);
            });
        });

        it("should handle generating 0 teams", () => {
            const teams = generateNTeams(0);
            expect(teams).toHaveLength(0);
        });

        it("should handle generating 1 team", () => {
            const teams = generateNTeams(1);
            expect(teams).toHaveLength(1);
            expect(teams[0]?.name).toBe("Team 1");
            expect(teams[0]?.id).toBeTruthy();
            expect(teams[0]?.players).toEqual([]);
        });

        it("should handle generating a large number of teams", () => {
            const teams = generateNTeams(100);
            expect(teams).toHaveLength(100);
            expect(teams[0]?.name).toBe("Team 1");
            expect(teams[99]?.name).toBe("Team 100");
        });

        it("should generate teams with all required properties", () => {
            const teams = generateNTeams(2);
            teams.forEach(team => {
                expect(team).toHaveProperty("id");
                expect(team).toHaveProperty("name");
                expect(team).toHaveProperty("players");
                expect(typeof team.id).toBe("string");
                expect(typeof team.name).toBe("string");
                expect(Array.isArray(team.players)).toBe(true);
            });
        });

        it("should generate different teams on subsequent calls", () => {
            const teams1 = generateNTeams(3);
            const teams2 = generateNTeams(3);
            
            // Teams should have different ids
            expect(teams1[0]?.id).not.toBe(teams2[0]?.id);
            expect(teams1[1]?.id).not.toBe(teams2[1]?.id);
            expect(teams1[2]?.id).not.toBe(teams2[2]?.id);
            
            // But same names
            expect(teams1[0]?.name).toBe(teams2[0]?.name);
            expect(teams1[1]?.name).toBe(teams2[1]?.name);
            expect(teams1[2]?.name).toBe(teams2[2]?.name);
        });
    });
});
