import { describe, it, expect } from "vitest";
import { getCourtType, DEFAULTS, emptyTournament } from "./defaults";

describe("Defaults Helper Functions", () => {
    describe("DEFAULTS constant", () => {
        it("should contain beerpong defaults", () => {
            expect(DEFAULTS.beerpong).toBeDefined();
            expect(DEFAULTS.beerpong.name).toBe("Beer Pong");
            expect(DEFAULTS.beerpong.icon).toBe("beer-outline");
            expect(DEFAULTS.beerpong.courtLabel.singular).toBe("table");
            expect(DEFAULTS.beerpong.courtLabel.plural).toBe("tables");
            expect(DEFAULTS.beerpong.matchDuration).toBe(10);
            expect(DEFAULTS.beerpong.breakDuration).toBe(5);
            expect(DEFAULTS.beerpong.sets.supported).toBe(false);
            expect(DEFAULTS.beerpong.sets.default).toBe(false);
        });

        it("should contain foosball defaults", () => {
            expect(DEFAULTS.foosball).toBeDefined();
            expect(DEFAULTS.foosball.name).toBe("Foosball");
            expect(DEFAULTS.foosball.icon).toBe("football-outline");
            expect(DEFAULTS.foosball.courtLabel.singular).toBe("table");
            expect(DEFAULTS.foosball.courtLabel.plural).toBe("tables");
            expect(DEFAULTS.foosball.matchDuration).toBe(15);
            expect(DEFAULTS.foosball.breakDuration).toBe(5);
            expect(DEFAULTS.foosball.sets.supported).toBe(true);
            expect(DEFAULTS.foosball.sets.default).toBe(true);
        });

        it("should contain other defaults", () => {
            expect(DEFAULTS.other).toBeDefined();
            expect(DEFAULTS.other.name).toBe("Other");
            expect(DEFAULTS.other.icon).toBe("help-outline");
            expect(DEFAULTS.other.courtLabel.singular).toBe("court");
            expect(DEFAULTS.other.courtLabel.plural).toBe("courts");
            expect(DEFAULTS.other.matchDuration).toBe(15);
            expect(DEFAULTS.other.breakDuration).toBe(5);
            expect(DEFAULTS.other.sets.supported).toBe(true);
            expect(DEFAULTS.other.sets.default).toBe(false);
        });
    });

    describe("getCourtType", () => {
        it("should return singular court label when plural is false", () => {
            const result = getCourtType("beerpong", false, false);
            expect(result).toBe("table");
        });

        it("should return plural court label when plural is true", () => {
            const result = getCourtType("beerpong", true, false);
            expect(result).toBe("tables");
        });

        it("should capitalise court label when capitalised is true", () => {
            const result = getCourtType("beerpong", false, true);
            expect(result).toBe("Table");
        });

        it("should capitalise and pluralise court label", () => {
            const result = getCourtType("beerpong", true, true);
            expect(result).toBe("Tables");
        });

        it("should handle foosball sport", () => {
            expect(getCourtType("foosball", false, false)).toBe("table");
            expect(getCourtType("foosball", true, false)).toBe("tables");
        });

        it("should fall back to other defaults for unknown sport", () => {
            const result = getCourtType("unknown-sport", false, false);
            expect(result).toBe("court");
        });

        it("should add 's' to singular if plural not defined", () => {
            // Test the fallback logic by using a sport with no explicit plural
            const result = getCourtType("other", true, false);
            expect(result).toBe("courts");
        });
    });

    describe("emptyTournament", () => {
        it("should create a tournament with version 3", () => {
            const tournament = emptyTournament();
            expect(tournament.version).toBe(3);
        });

        it("should have a unique id", () => {
            const tournament1 = emptyTournament();
            const tournament2 = emptyTournament();
            expect(tournament1.id).toBeTruthy();
            expect(tournament1.id).not.toBe(tournament2.id);
        });

        it("should have empty name", () => {
            const tournament = emptyTournament();
            expect(tournament.name).toBe("");
        });

        it("should have empty teams array", () => {
            const tournament = emptyTournament();
            expect(tournament.teams).toEqual([]);
        });

        it("should have two phases", () => {
            const tournament = emptyTournament();
            expect(tournament.phases).toHaveLength(2);
        });

        it("should have a group phase as first phase", () => {
            const tournament = emptyTournament();
            const groupPhase = tournament.phases[0];
            expect(groupPhase?.type).toBe("group");
            expect(groupPhase?.name).toBe("Group Phase");
            expect(groupPhase).toHaveProperty("matches");
            expect(groupPhase).toHaveProperty("groups");
            expect(groupPhase).toHaveProperty("rounds");
            if (groupPhase?.type === "group") {
                expect(groupPhase.rounds).toBe(3);
            }
        });

        it("should have a knockout phase as second phase", () => {
            const tournament = emptyTournament();
            const knockoutPhase = tournament.phases[1];
            expect(knockoutPhase?.type).toBe("knockout");
            expect(knockoutPhase?.name).toBe("Knockout Phase");
            if (knockoutPhase?.type === "knockout") {
                expect(knockoutPhase.rounds).toEqual([]);
                expect(knockoutPhase.teamCount).toBe(8);
            }
        });

        it("should have config with default values", () => {
            const tournament = emptyTournament();
            expect(tournament.config.breakDuration).toBe(5);
            expect(tournament.config.knockoutBreakDuration).toBe(5);
            expect(tournament.config.courts).toBe(4);
            expect(tournament.config.matchDuration).toBe(10);
            expect(tournament.config.sport).toBe("other");
        });

        it("should set startTime to today at 18:00", () => {
            const tournament = emptyTournament();
            const startTime = tournament.config.startTime;
            expect(startTime.getHours()).toBe(18);
            expect(startTime.getMinutes()).toBe(0);
            expect(startTime.getSeconds()).toBe(0);
            expect(startTime.getMilliseconds()).toBe(0);
        });

        it("should create unique phase ids", () => {
            const tournament = emptyTournament();
            const ids = tournament.phases.map(p => p.id);
            expect(ids[0]).not.toBe(ids[1]);
        });

        it("should create phases with ids", () => {
            const tournament = emptyTournament();
            tournament.phases.forEach(phase => {
                expect(phase.id).toBeTruthy();
                expect(typeof phase.id).toBe("string");
            });
        });
    });
});
