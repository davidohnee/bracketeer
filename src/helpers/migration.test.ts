import { describe, it, expect } from "vitest";
import type {
    GroupTournamentPhase,
    KnockoutTournamentPhase,
    TournamentV1,
} from "@/types/tournament";
import { migrateTournament } from "./migration";

describe("Migrations", () => {
    const matchDate = new Date().toISOString() as unknown as Date;

    const originalTournament: TournamentV1 = {
        version: undefined,
        id: "test-tournament",
        name: "Test Tournament",
        teams: [
            { id: "team-1", name: "Team 1" },
            { id: "team-2", name: "Team 2" },
            { id: "team-3", name: "Team 3" },
            { id: "team-4", name: "Team 4" },
        ],
        groupPhase: [
            {
                id: "round-1",
                name: "Round 1",
                matches: [
                    {
                        id: "match-1",
                        court: 1,
                        teams: [
                            { ref: { id: "team-1" }, score: 0 },
                            { ref: { id: "team-2" }, score: 0 },
                        ],
                        status: "scheduled",
                        date: matchDate,
                    },
                    {
                        id: "match-2",
                        court: 2,
                        teams: [
                            { ref: { id: "team-3" }, score: 0 },
                            { ref: { id: "team-4" }, score: 1 },
                        ],
                        status: "scheduled",
                        date: matchDate,
                    },
                ],
            },
        ],
        knockoutPhase: [
            {
                id: "knockout-1",
                name: "final",
                matches: [
                    {
                        id: "knockout-match-1",
                        court: 1,
                        teams: [
                            { ref: { id: "team-1" }, score: 0 },
                            { ref: { id: "team-4" }, score: 0 },
                        ],
                        status: "scheduled",
                        date: matchDate,
                    },
                ],
            },
        ],
        config: {
            startTime: matchDate,
            matchDuration: 30,
            breakDuration: 10,
            knockoutBreakDuration: 15,
            courts: 2,
            sport: "any",
            rounds: 1,
            knockoutTeams: 2,
        },
    };

    describe("should migrate to latest version", () => {
        const tournament = migrateTournament(originalTournament);

        it("should have version 3", () => {
            expect(tournament.version).toBe(3);
        });

        it("should only have phases", () => {
            expect(tournament).not.toHaveProperty("knockoutPhase");
            expect(tournament).not.toHaveProperty("groupPhase");
            expect(tournament).toHaveProperty("phases");
        });

        it("should have correct phase types", () => {
            expect(tournament.phases.length).toBe(2);
            expect(tournament.phases[0]!.type).toBe("group");
            expect(tournament.phases[1]!.type).toBe("knockout");
        });

        it("should convert dates to Date objects", () => {
            const groupPhase = tournament.phases[0] as GroupTournamentPhase;
            const knockoutPhase = tournament.phases[1] as KnockoutTournamentPhase;

            groupPhase.matches.forEach((match) => {
                expect(match.date).toBeInstanceOf(Date);
            });

            knockoutPhase.rounds.forEach((round) => {
                round.matches.forEach((match) => {
                    expect(match.date).toBeInstanceOf(Date);
                });
            });

            expect(tournament.config.startTime).toBeInstanceOf(Date);
        });

        describe("config", () => {
            it("should not have rounds and knockoutTeams", () => {
                expect(tournament.config).not.toHaveProperty("rounds");
                expect(tournament.config).not.toHaveProperty("knockoutTeams");
            });
        });
    });
});
