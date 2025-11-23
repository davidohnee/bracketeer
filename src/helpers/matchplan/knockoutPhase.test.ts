import { describe, it, expect, beforeEach } from "vitest";
import { generateKnockoutBracket, generateKnockoutBrackets } from "./knockoutPhase";
import type { Tournament, KnockoutTournamentPhase, Team } from "@/types/tournament";

describe("Knockout Phase Generation", () => {
    let tournament: Tournament;
    let teams: Team[];

    beforeEach(() => {
        teams = Array.from({ length: 16 }, (_, i) => ({
            id: `team-${i + 1}`,
            name: `Team ${i + 1}`,
        }));

        tournament = {
            id: "test-tournament",
            version: 3,
            name: "Test Tournament",
            teams,
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

    describe("generateKnockoutBracket", () => {
        it("should generate correct number of rounds for 16 teams", () => {
            const phase: KnockoutTournamentPhase = {
                id: "phase-knockout",
                name: "Knockout Phase",
                type: "knockout",
                teamCount: 16,
                rounds: [],
            };

            tournament.phases = [phase];
            const rounds = generateKnockoutBracket(phase, tournament);

            // 16 teams: Round of 16, Quarter-finals, Semi-finals, 3rd Place, Final
            // That's 5 rounds total
            expect(rounds.length).toBe(5);
        });

        it("should generate correct number of rounds for 8 teams", () => {
            tournament.teams = teams.slice(0, 8);
            const phase: KnockoutTournamentPhase = {
                id: "phase-knockout",
                name: "Knockout Phase",
                type: "knockout",
                teamCount: 8,
                rounds: [],
            };

            tournament.phases = [phase];
            const rounds = generateKnockoutBracket(phase, tournament);

            // 8 teams: Quarter-finals, Semi-finals, 3rd Place, Final
            // That's 4 rounds total
            expect(rounds.length).toBe(4);
        });

        it("should have correct round names", () => {
            const phase: KnockoutTournamentPhase = {
                id: "phase-knockout",
                name: "Knockout Phase",
                type: "knockout",
                teamCount: 16,
                rounds: [],
            };

            tournament.phases = [phase];
            const rounds = generateKnockoutBracket(phase, tournament);

            expect(rounds[0]!.name).toBe("Round of 16");
            expect(rounds[1]!.name).toBe("Quarter-finals");
            expect(rounds[2]!.name).toBe("Semi-finals");
            expect(rounds[3]!.name).toBe("3rd Place Playoff");
            expect(rounds[4]!.name).toBe("Final");
        });

        it("should have correct number of matches per round", () => {
            const phase: KnockoutTournamentPhase = {
                id: "phase-knockout",
                name: "Knockout Phase",
                type: "knockout",
                teamCount: 16,
                rounds: [],
            };

            tournament.phases = [phase];
            const rounds = generateKnockoutBracket(phase, tournament);

            expect(rounds[0]!.matches.length).toBe(8); // Round of 16
            expect(rounds[1]!.matches.length).toBe(4); // Quarter-finals
            expect(rounds[2]!.matches.length).toBe(2); // Semi-finals
            expect(rounds[3]!.matches.length).toBe(1); // 3rd Place
            expect(rounds[4]!.matches.length).toBe(1); // Final
        });

        it("should ensure final cannot occur before semi-finals", () => {
            const phase: KnockoutTournamentPhase = {
                id: "phase-knockout",
                name: "Knockout Phase",
                type: "knockout",
                teamCount: 8,
                rounds: [],
            };

            tournament.phases = [phase];
            const rounds = generateKnockoutBracket(phase, tournament);

            // Find semi-finals and final rounds
            const semiFinalRound = rounds.find((r) => r.name === "Semi-finals");
            const finalRound = rounds.find((r) => r.name === "Final");

            expect(semiFinalRound).toBeDefined();
            expect(finalRound).toBeDefined();

            const semiFinalTime = semiFinalRound!.matches[0]!.date.getTime();
            const finalTime = finalRound!.matches[0]!.date.getTime();

            // Final should be after semi-finals
            expect(finalTime).toBeGreaterThan(semiFinalTime);
        });

        it("should ensure 3rd place playoff happens before final", () => {
            const phase: KnockoutTournamentPhase = {
                id: "phase-knockout",
                name: "Knockout Phase",
                type: "knockout",
                teamCount: 8,
                rounds: [],
            };

            tournament.phases = [phase];
            const rounds = generateKnockoutBracket(phase, tournament);

            const thirdPlaceRound = rounds.find((r) => r.name === "3rd Place Playoff");
            const finalRound = rounds.find((r) => r.name === "Final");

            expect(thirdPlaceRound).toBeDefined();
            expect(finalRound).toBeDefined();

            const thirdPlaceTime = thirdPlaceRound!.matches[0]!.date.getTime();
            const finalTime = finalRound!.matches[0]!.date.getTime();

            // 3rd place should not be after final
            expect(thirdPlaceTime).toBeLessThanOrEqual(finalTime);
        });

        it("should respect court constraints - no more courts used than configured", () => {
            const phase: KnockoutTournamentPhase = {
                id: "phase-knockout",
                name: "Knockout Phase",
                type: "knockout",
                teamCount: 16,
                rounds: [],
            };

            tournament.phases = [phase];
            const rounds = generateKnockoutBracket(phase, tournament);

            // Check all matches
            rounds.forEach((round) => {
                round.matches.forEach((match) => {
                    expect(match.court).toBeGreaterThanOrEqual(1);
                    expect(match.court).toBeLessThanOrEqual(tournament.config.courts);
                });
            });
        });

        it("should schedule matches with proper time progression", () => {
            const phase: KnockoutTournamentPhase = {
                id: "phase-knockout",
                name: "Knockout Phase",
                type: "knockout",
                teamCount: 8,
                rounds: [],
            };

            tournament.phases = [phase];
            const rounds = generateKnockoutBracket(phase, tournament);

            // Each subsequent round should start after the previous round
            for (let i = 1; i < rounds.length; i++) {
                const prevRoundLastMatch = rounds[i - 1]!.matches[rounds[i - 1]!.matches.length - 1];
                const currentRoundFirstMatch = rounds[i]!.matches[0];

                const prevTime = prevRoundLastMatch!.date.getTime();
                const currentTime = currentRoundFirstMatch!.date.getTime();

                // Current round should start after previous round
                expect(currentTime).toBeGreaterThanOrEqual(prevTime);
            }
        });

        it("should not double-book courts at the same time", () => {
            const phase: KnockoutTournamentPhase = {
                id: "phase-knockout",
                name: "Knockout Phase",
                type: "knockout",
                teamCount: 16,
                rounds: [],
            };

            tournament.phases = [phase];
            const rounds = generateKnockoutBracket(phase, tournament);

            // Collect all matches
            const allMatches = rounds.flatMap((r) => r.matches);

            // Group by time
            const matchesByTime = new Map<string, typeof allMatches>();
            allMatches.forEach((match) => {
                const timeKey = match.date.toISOString();
                if (!matchesByTime.has(timeKey)) {
                    matchesByTime.set(timeKey, []);
                }
                matchesByTime.get(timeKey)!.push(match);
            });

            // For each time slot, verify no court is used more than once
            matchesByTime.forEach((matches) => {
                const courts = matches.map((m) => m.court);
                const uniqueCourts = new Set(courts);
                expect(courts.length).toBe(uniqueCourts.size);
            });
        });

        it("should have all matches scheduled", () => {
            const phase: KnockoutTournamentPhase = {
                id: "phase-knockout",
                name: "Knockout Phase",
                type: "knockout",
                teamCount: 8,
                rounds: [],
            };

            tournament.phases = [phase];
            const rounds = generateKnockoutBracket(phase, tournament);

            const allMatches = rounds.flatMap((r) => r.matches);

            allMatches.forEach((match) => {
                expect(match.date).toBeInstanceOf(Date);
                expect(match.status).toBe("scheduled");
                expect(match.court).toBeGreaterThanOrEqual(1);
            });
        });

        it("should use team links correctly for first round", () => {
            const phase: KnockoutTournamentPhase = {
                id: "phase-knockout",
                name: "Knockout Phase",
                type: "knockout",
                teamCount: 8,
                rounds: [],
            };

            tournament.phases = [phase];
            const rounds = generateKnockoutBracket(phase, tournament);

            const firstRound = rounds[0];
            expect(firstRound).toBeDefined();

            firstRound!.matches.forEach((match) => {
                // First round should have "league" type links
                expect(match.teams[0].link?.type).toBe("league");
                expect(match.teams[1].link?.type).toBe("league");
                expect(match.teams[0].link?.placement).toBeDefined();
                expect(match.teams[1].link?.placement).toBeDefined();
            });
        });

        it("should use winner links for subsequent rounds", () => {
            const phase: KnockoutTournamentPhase = {
                id: "phase-knockout",
                name: "Knockout Phase",
                type: "knockout",
                teamCount: 8,
                rounds: [],
            };

            tournament.phases = [phase];
            const rounds = generateKnockoutBracket(phase, tournament);

            // Check second round (Quarter-finals for 8 teams, should be Semi-finals)
            const secondRound = rounds[1];
            expect(secondRound).toBeDefined();

            secondRound!.matches.forEach((match) => {
                // Second and subsequent rounds should have "winner" type links
                expect(match.teams[0].link?.type).toBe("winner");
                expect(match.teams[1].link?.type).toBe("winner");
            });
        });

        it("should have 3rd place playoff with loser links", () => {
            const phase: KnockoutTournamentPhase = {
                id: "phase-knockout",
                name: "Knockout Phase",
                type: "knockout",
                teamCount: 8,
                rounds: [],
            };

            tournament.phases = [phase];
            const rounds = generateKnockoutBracket(phase, tournament);

            const thirdPlaceRound = rounds.find((r) => r.name === "3rd Place Playoff");
            expect(thirdPlaceRound).toBeDefined();

            const thirdPlaceMatch = thirdPlaceRound!.matches[0];
            expect(thirdPlaceMatch!.teams[0].link?.type).toBe("loser");
            expect(thirdPlaceMatch!.teams[1].link?.type).toBe("loser");
        });
    });

    describe("generateKnockoutBrackets", () => {
        it("should process multiple phases correctly", () => {
            const knockoutPhase: KnockoutTournamentPhase = {
                id: "phase-knockout",
                name: "Knockout Phase",
                type: "knockout",
                teamCount: 8,
                rounds: [],
            };

            tournament.phases = [knockoutPhase];
            const phases = generateKnockoutBrackets(tournament);

            expect(phases.length).toBe(1);
            expect(phases[0]!.type).toBe("knockout");
            if (phases[0]!.type === "knockout") {
                expect(phases[0]!.rounds.length).toBeGreaterThan(0);
            }
        });

        it("should preserve group phases unchanged", () => {
            const groupPhase = {
                id: "phase-group",
                name: "Group Phase",
                type: "group" as const,
                rounds: 2,
                matches: [],
            };

            tournament.phases = [groupPhase];
            const phases = generateKnockoutBrackets(tournament);

            expect(phases.length).toBe(1);
            expect(phases[0]).toEqual(groupPhase);
        });

        it("should handle mixed phase types", () => {
            const groupPhase = {
                id: "phase-1",
                name: "Group Phase",
                type: "group" as const,
                rounds: 2,
                matches: [],
            };

            const knockoutPhase: KnockoutTournamentPhase = {
                id: "phase-2",
                name: "Knockout Phase",
                type: "knockout",
                teamCount: 8,
                rounds: [],
            };

            tournament.phases = [groupPhase, knockoutPhase];
            const phases = generateKnockoutBrackets(tournament);

            expect(phases.length).toBe(2);
            expect(phases[0]!.type).toBe("group");
            expect(phases[1]!.type).toBe("knockout");
        });
    });

    describe("round dependencies", () => {
        it("should ensure quarter-finals occur before semi-finals", () => {
            const phase: KnockoutTournamentPhase = {
                id: "phase-knockout",
                name: "Knockout Phase",
                type: "knockout",
                teamCount: 16,
                rounds: [],
            };

            tournament.phases = [phase];
            const rounds = generateKnockoutBracket(phase, tournament);

            const quarterFinals = rounds.find((r) => r.name === "Quarter-finals");
            const semiFinals = rounds.find((r) => r.name === "Semi-finals");

            expect(quarterFinals).toBeDefined();
            expect(semiFinals).toBeDefined();

            const quarterTime = quarterFinals!.matches[0]!.date.getTime();
            const semiTime = semiFinals!.matches[0]!.date.getTime();

            expect(semiTime).toBeGreaterThan(quarterTime);
        });

        it("should ensure round of 16 occurs before quarter-finals", () => {
            const phase: KnockoutTournamentPhase = {
                id: "phase-knockout",
                name: "Knockout Phase",
                type: "knockout",
                teamCount: 16,
                rounds: [],
            };

            tournament.phases = [phase];
            const rounds = generateKnockoutBracket(phase, tournament);

            const roundOf16 = rounds.find((r) => r.name === "Round of 16");
            const quarterFinals = rounds.find((r) => r.name === "Quarter-finals");

            expect(roundOf16).toBeDefined();
            expect(quarterFinals).toBeDefined();

            const r16Time = roundOf16!.matches[0]!.date.getTime();
            const quarterTime = quarterFinals!.matches[0]!.date.getTime();

            expect(quarterTime).toBeGreaterThan(r16Time);
        });
    });
});
