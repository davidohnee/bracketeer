import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAccountsStore } from "./accounts";
import type { Account } from "@/types/accounts";
import { gistShare } from "@/helpers/share/gist/gist";
import { nextTick } from "vue";

vi.mock("@/helpers/share/gist/gist", () => ({
    gistShare: {
        migrate: vi.fn(),
        isMine: vi.fn(),
    },
}));

describe("Accounts Store", () => {
    let mockAccount: Account;

    beforeEach(() => {
        // Create a new pinia instance for each test
        setActivePinia(createPinia());

        // Clear localStorage before each test
        localStorage.clear();

        // Clear all mocks before each test
        vi.clearAllMocks();

        mockAccount = {
            type: "gist",
            id: "test-account-1",
            displayName: "Test Account",
            accessToken: "test-token-123",
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("Initial State", () => {
        it("should initialize with empty accounts array when localStorage is empty", () => {
            const store = useAccountsStore();
            expect(store.all).toEqual([]);
        });

        it("should load accounts from localStorage on initialization", () => {
            const mockAccounts: Account[] = [
                {
                    type: "gist",
                    id: "stored-account-1",
                    displayName: "Stored Account",
                    accessToken: "stored-token",
                },
            ];
            const encoded = mockAccounts.map((x) => ({
                ...x,
                accessToken: btoa(x.accessToken),
            }));
            localStorage.setItem("accounts", JSON.stringify(encoded));

            const store = useAccountsStore();
            expect(store.all).toHaveLength(1);
            expect(store.all[0]?.id).toBe("stored-account-1");
            expect(store.all[0]?.accessToken).toBe("stored-token");
        });

        it("should ignore invalid accessToken values from localStorage", () => {
            const corrupted = [
                {
                    type: "gist",
                    id: "corrupted-account",
                    displayName: "Corrupted",
                    accessToken: "!!!invalid-base64!!!",
                },
            ];
            localStorage.setItem("accounts", JSON.stringify(corrupted));

            const store = useAccountsStore();
            expect(store.all).toEqual([]);
        });
    });

    describe("add method", () => {
        it("should add an account to the store", () => {
            const store = useAccountsStore();

            store.add(mockAccount);

            expect(store.all).toHaveLength(1);
            expect(store.all[0]?.id).toBe("test-account-1");
            expect(store.all[0]?.displayName).toBe("Test Account");
        });

        it("should add multiple accounts", () => {
            const store = useAccountsStore();
            const account2: Account = {
                type: "gist",
                id: "test-account-2",
                displayName: "Test Account 2",
                accessToken: "test-token-456",
            };

            store.add(mockAccount);
            store.add(account2);

            expect(store.all).toHaveLength(2);
            expect(store.all[0]?.id).toBe("test-account-1");
            expect(store.all[1]?.id).toBe("test-account-2");
        });
    });

    describe("remove method", () => {
        it("should remove an account by id", () => {
            const store = useAccountsStore();

            store.add(mockAccount);
            expect(store.all).toHaveLength(1);

            store.remove("test-account-1");

            expect(store.all).toHaveLength(0);
        });

        it("should not affect other accounts when removing one", () => {
            const store = useAccountsStore();
            const account1: Account = {
                type: "gist",
                id: "keep-1",
                displayName: "Keep 1",
                accessToken: "token-1",
            };
            const account2: Account = {
                type: "gist",
                id: "remove",
                displayName: "Remove",
                accessToken: "token-2",
            };
            const account3: Account = {
                type: "gist",
                id: "keep-2",
                displayName: "Keep 2",
                accessToken: "token-3",
            };

            store.add(account1);
            store.add(account2);
            store.add(account3);

            store.remove("remove");

            expect(store.all).toHaveLength(2);
            expect(store.all.find((a) => a.id === "keep-1")).toBeDefined();
            expect(store.all.find((a) => a.id === "keep-2")).toBeDefined();
            expect(store.all.find((a) => a.id === "remove")).toBeUndefined();
        });
    });

    describe("localStorage synchronization", () => {
        it("should sync accounts to localStorage when adding", async () => {
            const store = useAccountsStore();

            store.add(mockAccount);
            await nextTick();

            const stored = localStorage.getItem("accounts");
            expect(stored).not.toBeNull();
            const parsed = JSON.parse(stored ?? "[]");
            expect(parsed).toHaveLength(1);
            expect(parsed[0]?.id).toBe("test-account-1");
        });

        it("should encode accessToken in localStorage", async () => {
            const store = useAccountsStore();

            store.add(mockAccount);
            await nextTick();

            const stored = localStorage.getItem("accounts");
            const parsed = JSON.parse(stored ?? "[]");
            const storedToken = parsed[0]?.accessToken;

            // Should be base64 encoded
            expect(storedToken).not.toBe("test-token-123");
            expect(atob(storedToken)).toBe("test-token-123");
        });

        it("should sync multiple accounts to localStorage", async () => {
            const store = useAccountsStore();
            const account2: Account = {
                type: "gist",
                id: "test-account-2",
                displayName: "Test Account 2",
                accessToken: "test-token-456",
            };

            store.add(mockAccount);
            store.add(account2);

            await nextTick();

            const stored = localStorage.getItem("accounts");
            const parsed = JSON.parse(stored ?? "[]");
            expect(parsed).toHaveLength(2);
            expect(parsed[0]?.id).toBe("test-account-1");
            expect(parsed[1]?.id).toBe("test-account-2");
        });
    });

    describe("findShareAccount method", () => {
        it("should call gistShare.isMine with filtered gist accounts", async () => {
            const store = useAccountsStore();

            vi.mocked(gistShare.isMine).mockResolvedValue(mockAccount);

            store.add(mockAccount);

            const result = await store.findShareAccount("remote-id-123");

            expect(gistShare.isMine).toHaveBeenCalled();
            expect(result).toEqual(mockAccount);
        });

        it("should pass only gist type accounts to findShareAccount", async () => {
            const store = useAccountsStore();
            const account2: Account = {
                type: "gist",
                id: "test-account-2",
                displayName: "Test Account 2",
                accessToken: "test-token-456",
            };

            vi.mocked(gistShare.isMine).mockResolvedValue(mockAccount);

            store.add(mockAccount);
            store.add(account2);

            await store.findShareAccount("remote-id-123");

            expect(gistShare.isMine).toHaveBeenCalledWith(
                "remote-id-123",
                expect.arrayContaining([
                    expect.objectContaining({ id: "test-account-1" }),
                    expect.objectContaining({ id: "test-account-2" }),
                ]),
            );
        });
    });

    describe("migrate method", () => {
        it("should call gistShare.migrate and add account if returned", () => {
            const store = useAccountsStore();
            const migratedAccount: Account = {
                type: "gist",
                id: "migrated-account",
                displayName: "Migrated Account",
                accessToken: "migrated-token",
            };

            vi.mocked(gistShare.migrate).mockReturnValue(migratedAccount);

            store.migrate();

            expect(gistShare.migrate).toHaveBeenCalled();
            expect(store.all).toHaveLength(1);
            expect(store.all[0]?.id).toBe("migrated-account");
        });

        it("should not add account if gistShare.migrate returns null", () => {
            const store = useAccountsStore();

            vi.mocked(gistShare.migrate).mockReturnValue(null);

            store.migrate();

            expect(store.all).toHaveLength(0);
        });
    });
});
