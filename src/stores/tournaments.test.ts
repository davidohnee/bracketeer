import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useTournamentsStore } from "./tournaments";
import type { Tournament, TournamentConfig } from "../types/tournament";

// Mock external dependencies
vi.mock("@/share", () => ({
    pull: vi.fn(),
    push: vi.fn(),
}));

vi.mock("@/components/notifications/createNotification", () => ({
    Notifications: {
        addError: vi.fn(),
        addSuccess: vi.fn(),
    },
}));

vi.mock("@/helpers/matchplan/knockoutPhase", () => ({
    generateKnockoutBrackets: vi.fn((tournament) => tournament.phases),
}));

vi.mock("@/helpers/matchplan/groupPhase", () => ({
    generateGroupPhases: vi.fn((tournament) => tournament.phases),
}));

vi.mock("@/helpers/teamGenerator", () => ({
    generateNTeams: vi.fn((count) =>
        Array.from({ length: count }, (_, i) => ({
            id: `team-${i + 1}`,
            name: `Team ${i + 1}`,
        })),
    ),
}));

vi.mock("@/helpers", () => ({
    tournamentFromJson: vi.fn((json) => json),
}));

const THROTTLE_DURATION = 600;
const asyncThrottleDelay = () => new Promise((resolve) => setTimeout(resolve, THROTTLE_DURATION));

describe("Tournaments Store", () => {
    let mockConfig: TournamentConfig;

    beforeEach(() => {
        // Create a new pinia instance for each test
        setActivePinia(createPinia());

        // Clear localStorage before each test
        localStorage.clear();

        // Mock crypto.randomUUID
        let counter = 0;
        vi.stubGlobal("crypto", {
            randomUUID: () => `test-uuid-${++counter}`,
        });

        mockConfig = {
            courts: 2,
            matchDuration: 30,
            breakDuration: 5,
            knockoutBreakDuration: 10,
            startTime: new Date("2024-01-01T10:00:00"),
            sport: "test",
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    describe("Initial State", () => {
        it("should initialize with empty tournaments array when localStorage is empty", () => {
            const store = useTournamentsStore();
            expect(store.all).toEqual([]);
        });

        it("should load tournaments from localStorage on initialization", () => {
            const mockTournaments = [
                {
                    id: "tournament-1",
                    version: 3,
                    name: "Test Tournament",
                    teams: [],
                    phases: [],
                    config: mockConfig,
                },
            ];
            localStorage.setItem("tournaments", JSON.stringify(mockTournaments));

            const store = useTournamentsStore();
            expect(store.all).toHaveLength(1);
            expect(store.all[0]?.id).toBe("tournament-1");
        });
    });

    describe("add method", () => {
        it("should add a tournament to the store", () => {
            const store = useTournamentsStore();
            const tournament: Tournament = {
                id: "new-tournament",
                version: 3,
                name: "New Tournament",
                teams: [],
                phases: [],
                config: mockConfig,
            };

            store.add(tournament);
            expect(store.all).toHaveLength(1);
            expect(store.all[0]?.id).toBe("new-tournament");
        });

        it("should add multiple tournaments", () => {
            const store = useTournamentsStore();
            const tournament1: Tournament = {
                id: "tournament-1",
                version: 3,
                name: "Tournament 1",
                teams: [],
                phases: [],
                config: mockConfig,
            };
            const tournament2: Tournament = {
                id: "tournament-2",
                version: 3,
                name: "Tournament 2",
                teams: [],
                phases: [],
                config: mockConfig,
            };

            store.add(tournament1);
            store.add(tournament2);
            expect(store.all).toHaveLength(2);
        });
    });

    describe("remove method", () => {
        it("should remove a tournament by id", () => {
            const store = useTournamentsStore();
            const tournament: Tournament = {
                id: "to-remove",
                version: 3,
                name: "Remove Me",
                teams: [],
                phases: [],
                config: mockConfig,
            };

            store.add(tournament);
            expect(store.all).toHaveLength(1);

            store.remove("to-remove");
            expect(store.all).toHaveLength(0);
        });

        it("should not affect other tournaments when removing one", () => {
            const store = useTournamentsStore();
            const tournament1: Tournament = {
                id: "keep-1",
                version: 3,
                name: "Keep 1",
                teams: [],
                phases: [],
                config: mockConfig,
            };
            const tournament2: Tournament = {
                id: "remove",
                version: 3,
                name: "Remove",
                teams: [],
                phases: [],
                config: mockConfig,
            };
            const tournament3: Tournament = {
                id: "keep-2",
                version: 3,
                name: "Keep 2",
                teams: [],
                phases: [],
                config: mockConfig,
            };

            store.add(tournament1);
            store.add(tournament2);
            store.add(tournament3);

            store.remove("remove");
            expect(store.all).toHaveLength(2);
            expect(store.all.find((t) => t.id === "keep-1")).toBeDefined();
            expect(store.all.find((t) => t.id === "keep-2")).toBeDefined();
            expect(store.all.find((t) => t.id === "remove")).toBeUndefined();
        });
    });

    describe("update method", () => {
        it("should update an existing tournament", () => {
            const store = useTournamentsStore();
            const tournament: Tournament = {
                id: "update-me",
                version: 3,
                name: "Original Name",
                teams: [],
                phases: [],
                config: mockConfig,
            };

            store.add(tournament);

            const updatedTournament: Tournament = {
                ...tournament,
                name: "Updated Name",
            };

            store.update(updatedTournament);
            expect(store.all[0]?.name).toBe("Updated Name");
        });

        it("should not add a new tournament if id does not exist", () => {
            const store = useTournamentsStore();
            const tournament: Tournament = {
                id: "non-existent",
                version: 3,
                name: "Non Existent",
                teams: [],
                phases: [],
                config: mockConfig,
            };

            store.update(tournament);
            expect(store.all).toHaveLength(0);
        });
    });

    describe("create method", () => {
        it("should create a new tournament with specified team count", () => {
            const store = useTournamentsStore();
            store.create(8, mockConfig);

            expect(store.all).toHaveLength(1);
            expect(store.all[0]?.teams).toHaveLength(8);
        });

        it("should create tournament with correct phases", () => {
            const store = useTournamentsStore();
            store.create(8, mockConfig);

            const tournament = store.all[0];
            expect(tournament?.phases).toHaveLength(2);
            expect(tournament?.phases[0]?.type).toBe("group");
            expect(tournament?.phases[1]?.type).toBe("knockout");
        });

        it("should assign incremental names to tournaments", () => {
            const store = useTournamentsStore();
            store.create(4, mockConfig);
            store.create(4, mockConfig);
            store.create(4, mockConfig);

            expect(store.all[0]?.name).toBe("Tournament 1");
            expect(store.all[1]?.name).toBe("Tournament 2");
            expect(store.all[2]?.name).toBe("Tournament 3");
        });

        it("should create tournament with provided config", () => {
            const store = useTournamentsStore();
            const customConfig: TournamentConfig = {
                ...mockConfig,
                courts: 4,
                matchDuration: 45,
            };

            store.create(8, customConfig);

            const tournament = store.all[0];
            expect(tournament?.config.courts).toBe(4);
            expect(tournament?.config.matchDuration).toBe(45);
        });
    });

    describe("deleteTournament method", () => {
        it("should delete a tournament by id", () => {
            const store = useTournamentsStore();
            const tournament: Tournament = {
                id: "delete-me",
                version: 3,
                name: "Delete Me",
                teams: [],
                phases: [],
                config: mockConfig,
            };

            store.add(tournament);
            expect(store.all).toHaveLength(1);

            store.deleteTournament("delete-me");
            expect(store.all).toHaveLength(0);
        });
    });

    describe("getTournamentById method", () => {
        it("should return tournament by id", () => {
            const store = useTournamentsStore();
            const tournament: Tournament = {
                id: "find-me",
                version: 3,
                name: "Find Me",
                teams: [],
                phases: [],
                config: mockConfig,
            };

            store.add(tournament);
            const found = store.getTournamentById("find-me");

            expect(found).toBeDefined();
            expect(found?.id).toBe("find-me");
            expect(found?.name).toBe("Find Me");
        });

        it("should return undefined for non-existent id", () => {
            const store = useTournamentsStore();
            const found = store.getTournamentById("non-existent");
            expect(found).toBeUndefined();
        });
    });

    describe("download method", () => {
        it("should create a download link with tournament JSON", () => {
            const store = useTournamentsStore();
            const tournament: Tournament = {
                id: "download-me",
                version: 3,
                name: "Download Me",
                teams: [],
                phases: [],
                config: mockConfig,
            };

            // Mock document.createElement and related methods
            const mockElement = {
                href: "",
                download: "",
                click: vi.fn(),
            } as unknown as HTMLAnchorElement;
            vi.spyOn(document, "createElement").mockReturnValue(mockElement);
            vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");

            store.download(tournament);

            expect(document.createElement).toHaveBeenCalledWith("a");
            expect(mockElement.download).toBe("Download Me.bracketeer.json");
            expect(mockElement.click).toHaveBeenCalled();
        });
    });

    describe("localStorage synchronization", () => {
        it("should sync tournaments to localStorage when adding", async () => {
            const store = useTournamentsStore();
            const tournament: Tournament = {
                id: "sync-test",
                version: 3,
                name: "Sync Test",
                teams: [],
                phases: [],
                config: mockConfig,
            };

            store.add(tournament);

            // Wait for throttled sync
            await asyncThrottleDelay();

            const stored = localStorage.getItem("tournaments");
            expect(stored).not.toBeNull();
            const parsed = JSON.parse(stored!);
            expect(parsed).toHaveLength(1);
            expect(parsed[0].id).toBe("sync-test");
        });

        it("should sync tournaments to localStorage when updating", async () => {
            const store = useTournamentsStore();
            const tournament: Tournament = {
                id: "sync-update",
                version: 3,
                name: "Original",
                teams: [],
                phases: [],
                config: mockConfig,
            };

            store.add(tournament);
            await asyncThrottleDelay();

            store.update({ ...tournament, name: "Updated" });
            await asyncThrottleDelay();

            const stored = localStorage.getItem("tournaments");
            const parsed = JSON.parse(stored!);
            expect(parsed[0].name).toBe("Updated");
        });
    });
});
