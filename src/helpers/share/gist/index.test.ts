import { vi, expect, describe, it, beforeEach } from "vitest";
import type { Tournament } from "@/types/tournament";
import GistClient from ".";
import { generateTestTournament } from "@/helpers/test";
import { gistShare } from "./gist";
import type { GistAccount } from "@/types/accounts";

// mock createP2PPullSync

const ACCOUNT: GistAccount = {
    type: "gist",
    id: "test-account-id",
    displayName: "Test Account",
    accessToken: "test-access-token",
};

const newImportResponse = (tournament: Tournament | null = null) => ({
    type: "success",
    tournament: tournament || generateTestTournament(),
    author: ACCOUNT.displayName,
    link: "",
    date: new Date(),
});

vi.mock("./gist", () => ({
    gistShare: {
        pull: vi.fn().mockImplementation(async () => {
            return newImportResponse();
        }),
        stop: vi.fn(),
        push: vi.fn().mockImplementation(async (tournament: Tournament) => {
            return newImportResponse(tournament);
        }),
    },
}));

const accountResolver = vi.fn().mockImplementation(async (ident) => {
    console.log("Resolving account for identifier:", ident);
    return ACCOUNT;
});

describe("pull sync", () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    describe("pull", () => {
        it("should pull tournament", async () => {
            const identifier = GistClient.toShare({
                mode: "gist",
                author: "test-author",
                tag: "test-gist-id",
            });
            const result = await GistClient.pull({
                identifier: identifier.identifier,
            });
            expect(result).toEqual({
                type: "success",
                tournament: expect.any(Object),
                author: ACCOUNT.displayName,
                link: "",
                date: expect.any(Date),
            });
            expect(gistShare.pull).toHaveBeenCalledWith(identifier.identifier);
        });
    });

    describe("create", () => {
        it("should create a new tournament", async () => {
            const tournament = generateTestTournament();

            expect(tournament.remote).toBeUndefined();

            const result = await GistClient.create(tournament, {
                updateOnly: false,
                account: ACCOUNT,
            });
            expect(result).toEqual({
                type: "success",
                tournament,
                date: expect.any(Date),
                link: expect.any(String),
                author: ACCOUNT.displayName,
            });
        });
    });

    describe("update", () => {
        it("should update an existing tournament", async () => {
            const tournament = generateTestTournament();
            const identifier = GistClient.toShare({
                mode: "gist",
                author: ACCOUNT.displayName,
                tag: "test-gist-id",
            });
            tournament.remote = [
                {
                    identifier: identifier.identifier,
                },
            ];

            const result = await GistClient.create(tournament, {
                updateOnly: true,
                accountResolver,
            });
            expect(result).toEqual({
                type: "success",
                tournament,
                date: expect.any(Date),
                link: expect.any(String),
                author: ACCOUNT.displayName,
            });
            expect(accountResolver).toHaveBeenCalledWith({ identifier: identifier.identifier });
        });

        it("should return null if no gist remote found when updateOnly is true", async () => {
            const tournament = generateTestTournament();

            const result = await GistClient.create(tournament, {
                updateOnly: true,
                accountResolver,
            });
            expect(result).toBeNull();
        });

        it("should return null if account resolver returns null when updateOnly is true", async () => {
            const tournament = generateTestTournament();
            const identifier = GistClient.toShare({
                mode: "gist",
                author: ACCOUNT.displayName,
                tag: "test-gist-id",
            });
            tournament.remote = [
                {
                    identifier: identifier.identifier,
                },
            ];

            const result = await GistClient.create(tournament, {
                updateOnly: true,
                accountResolver: vi.fn().mockResolvedValue(null),
            });
            expect(result).toBeNull();
        });
    });
});
