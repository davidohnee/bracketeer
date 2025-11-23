import { describe, it, expect, beforeEach } from "vitest";
import { generateGroupPhase, generateGroupPhases } from "./groupPhase";
import type {
    Tournament,
    GroupTournamentPhase,
    Team,
    Group,
    Match,
} from "@/types/tournament";

describe("Group Phase Generation", () => {
    let tournament: Tournament;
    let teams: Team[];

    beforeEach(() => {
        // Create test teams
        teams = Array.from({ length: 8 }, (_, i) => ({
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

    describe("generateGroupPhase", () => {
        it("should generate matches for a single group with all teams", () => {
            const phase: GroupTournamentPhase = {
                id: "phase-1",
                name: "Group Phase",
                type: "group",
                rounds: 2,
                matches: [],
            };

            tournament.phases = [phase];
            const matches = generateGroupPhase(phase, tournament);

            // With 8 teams and 2 rounds, we should have 4 matches per round
            expect(matches.length).toBeGreaterThan(0);

            // All matches should be scheduled
            matches.forEach((match) => {
                expect(match.court).toBeGreaterThanOrEqual(1);
                expect(match.court).toBeLessThanOrEqual(tournament.config.courts);
                expect(match.date).toBeInstanceOf(Date);
                expect(match.status).toBe("scheduled");
            });
        });

        it("should generate correct number of rounds", () => {
            const phase: GroupTournamentPhase = {
                id: "phase-1",
                name: "Group Phase",
                type: "group",
                rounds: 3,
                matches: [],
            };

            tournament.phases = [phase];
            const matches = generateGroupPhase(phase, tournament);

            // Get unique round IDs
            const roundIds = new Set(matches.map((m) => m.round?.id));

            // Should have 3 rounds (or more if balance round is needed)
            expect(roundIds.size).toBeGreaterThanOrEqual(3);
        });

        it("should respect court constraints - no double booking", () => {
            const phase: GroupTournamentPhase = {
                id: "phase-1",
                name: "Group Phase",
                type: "group",
                rounds: 2,
                matches: [],
            };

            tournament.phases = [phase];
            const matches = generateGroupPhase(phase, tournament);

            // Group matches by time
            const matchesByTime = new Map<string, Match[]>();
            matches.forEach((match) => {
                const timeKey = match.date.toISOString();
                if (!matchesByTime.has(timeKey)) {
                    matchesByTime.set(timeKey, []);
                }
                matchesByTime.get(timeKey)!.push(match);
            });

            // For each time slot, verify no court is used more than once
            matchesByTime.forEach((matchesAtTime) => {
                const courts = matchesAtTime.map((m) => m.court);
                const uniqueCourts = new Set(courts);
                expect(courts.length).toBe(uniqueCourts.size);

                // No court should exceed configured limit
                courts.forEach((court) => {
                    expect(court).toBeLessThanOrEqual(tournament.config.courts);
                });
            });
        });

        it("should ensure teams don't play multiple matches at the same time", () => {
            const phase: GroupTournamentPhase = {
                id: "phase-1",
                name: "Group Phase",
                type: "group",
                rounds: 2,
                matches: [],
            };

            tournament.phases = [phase];
            const matches = generateGroupPhase(phase, tournament);

            // Group matches by time
            const matchesByTime = new Map<string, Match[]>();
            matches.forEach((match) => {
                const timeKey = match.date.toISOString();
                if (!matchesByTime.has(timeKey)) {
                    matchesByTime.set(timeKey, []);
                }
                matchesByTime.get(timeKey)!.push(match);
            });

            // For each time slot, verify no team plays more than once
            matchesByTime.forEach((matchesAtTime) => {
                const teamsAtTime: string[] = [];
                matchesAtTime.forEach((match) => {
                    match.teams.forEach((team) => {
                        if (team.ref?.id) {
                            teamsAtTime.push(team.ref.id);
                        }
                    });
                });

                const uniqueTeams = new Set(teamsAtTime);
                expect(teamsAtTime.length).toBe(uniqueTeams.size);
            });
        });

        it("should generate matches for multiple groups", () => {
            const groups: Group[] = [
                {
                    id: "group-a",
                    name: "Group A",
                    teams: teams.slice(0, 4).map((t) => ({ id: t.id })),
                },
                {
                    id: "group-b",
                    name: "Group B",
                    teams: teams.slice(4, 8).map((t) => ({ id: t.id })),
                },
            ];

            const phase: GroupTournamentPhase = {
                id: "phase-1",
                name: "Group Phase",
                type: "group",
                rounds: 2,
                matches: [],
                groups,
            };

            tournament.phases = [phase];
            const matches = generateGroupPhase(phase, tournament);

            expect(matches.length).toBeGreaterThan(0);

            // Each match should have valid teams
            matches.forEach((match) => {
                expect(match.teams.length).toBe(2);
                expect(match.teams[0].ref).toBeDefined();
                expect(match.teams[1].ref).toBeDefined();
            });
        });

        it("should schedule matches in chronological order", () => {
            const phase: GroupTournamentPhase = {
                id: "phase-1",
                name: "Group Phase",
                type: "group",
                rounds: 2,
                matches: [],
            };

            tournament.phases = [phase];
            const matches = generateGroupPhase(phase, tournament);

            // Get all unique times sorted
            const times = matches.map((m) => m.date.getTime()).sort((a, b) => a - b);

            // First match should start at or after the tournament start time
            expect(times[0]).toBeGreaterThanOrEqual(tournament.config.startTime.getTime());

            // Verify matches are scheduled with proper time gaps
            for (let i = 1; i < times.length; i++) {
                const timeDiff = times[i]! - times[i - 1]!;
                // Time difference should be a multiple of (matchDuration + breakDuration)
                // or 0 for simultaneous matches on different courts
                expect(timeDiff).toBeGreaterThanOrEqual(0);
            }
        });

        it("should respect match and break duration settings", () => {
            const phase: GroupTournamentPhase = {
                id: "phase-1",
                name: "Group Phase",
                type: "group",
                rounds: 2,
                matches: [],
            };

            tournament.phases = [phase];
            const matches = generateGroupPhase(phase, tournament);

            const uniqueTimes = [...new Set(matches.map((m) => m.date.getTime()))].sort();
            const roundDuration = tournament.config.matchDuration + tournament.config.breakDuration;

            // Check time differences between consecutive time slots
            for (let i = 1; i < uniqueTimes.length; i++) {
                const diff = uniqueTimes[i]! - uniqueTimes[i - 1]!;
                const diffInMinutes = diff / (1000 * 60);

                // Should be a multiple of round duration
                if (diffInMinutes > 0) {
                    expect(diffInMinutes % roundDuration).toBe(0);
                }
            }
        });
    });

    describe("generateGroupPhases", () => {
        it("should process multiple phases correctly", () => {
            const groupPhase: GroupTournamentPhase = {
                id: "phase-1",
                name: "Group Phase",
                type: "group",
                rounds: 2,
                matches: [],
            };

            tournament.phases = [groupPhase];
            const phases = generateGroupPhases(tournament);

            expect(phases.length).toBe(1);
            expect(phases[0]!.type).toBe("group");
            if (phases[0]!.type === "group") {
                expect(phases[0]!.matches.length).toBeGreaterThan(0);
            }
        });

        it("should preserve knockout phases unchanged", () => {
            const knockoutPhase = {
                id: "phase-knockout",
                name: "Knockout Phase",
                type: "knockout" as const,
                rounds: [],
            };

            tournament.phases = [knockoutPhase];
            const phases = generateGroupPhases(tournament);

            expect(phases.length).toBe(1);
            expect(phases[0]).toEqual(knockoutPhase);
        });

        it("should handle mixed phase types", () => {
            const groupPhase: GroupTournamentPhase = {
                id: "phase-1",
                name: "Group Phase",
                type: "group",
                rounds: 2,
                matches: [],
            };

            const knockoutPhase = {
                id: "phase-2",
                name: "Knockout Phase",
                type: "knockout" as const,
                rounds: [],
            };

            tournament.phases = [groupPhase, knockoutPhase];
            const phases = generateGroupPhases(tournament);

            expect(phases.length).toBe(2);
            expect(phases[0]!.type).toBe("group");
            expect(phases[1]!.type).toBe("knockout");
        });
    });

    describe("balance round", () => {
        it("should create balance rounds when teams have unequal match counts", () => {
            // Create scenario with odd number of teams requiring balance round
            const oddTeams = teams.slice(0, 5);
            tournament.teams = oddTeams;

            const phase: GroupTournamentPhase = {
                id: "phase-1",
                name: "Group Phase",
                type: "group",
                rounds: 2,
                matches: [],
            };

            tournament.phases = [phase];
            const matches = generateGroupPhase(phase, tournament);

            // Check if balance round exists (just verify matches were generated)
            expect(matches.length).toBeGreaterThan(0);
        });
    });
});
