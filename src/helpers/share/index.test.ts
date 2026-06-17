import { test, vi, expect, afterEach, describe, it, beforeEach } from "vitest";
import { generateTestTournament } from "@/helpers/test";
import type { GistAccount } from "@/types/accounts";
import { gistShare } from "./gist/gist";
import { Notifications } from "@/components/notifications/createNotification";
import * as accountsStoreModule from "@/stores/accounts";
import SimpleClient, { getShareLink } from ".";
import GistClient from "./gist";

afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
});

describe("share utils", () => {
    it("getShareLink should create a share URL for the identifier", () => {
        const result = getShareLink("abc123");
        expect(result).toBe(`${globalThis.location.origin}/s/abc123`);
    });

    it("fromShare should decode share identifier", () => {
        const author = "user";
        const tag = "gist-id:MyCup.bra";

        const encoded = GistClient.toShare({ mode: "gist", author, tag }).identifier;
        const result = GistClient.fromShare(encoded);

        expect(result).toEqual({
            mode: "gist",
            author,
            tag,
        });
    });

    it("accessTokenToAccount should delegate to gist account resolver", async () => {
        const account: GistAccount = {
            type: "gist",
            id: "1234",
            accessToken: "pat-123",
            displayName: "user",
        };
        const resolver = vi.spyOn(gistShare, "accessTokenToAccount").mockResolvedValue(account);

        const result = await GistClient.accessTokenToAccount("pat-123");

        expect(result).toEqual(account);
        expect(resolver).toHaveBeenCalledWith("pat-123");
    });
});

test("pull", async () => {
    const tournament = generateTestTournament();

    // @ts-expect-error - Mocking global fetch
    globalThis.fetch = vi.fn(() =>
        Promise.resolve({
            ok: true,
            json: () => Promise.resolve(tournament),
        }),
    );

    const author = "user";
    const gistId = "gistId";

    const { link, identifier } = GistClient.toShare({ mode: "gist", author, tag: gistId });

    const data = await GistClient.pull({ identifier });

    expect(data).toEqual({
        type: "success",
        author,
        tournament,
        link,
        date: expect.any(Date),
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
        `https://gist.githubusercontent.com/${author}/${gistId}/raw/`,
    );
});

test("pull should return not-supported for malformed identifier", async () => {
    const data = await GistClient.pull({ identifier: "not-valid-base64" });

    expect(data).toEqual({
        type: "error",
        error: "not-supported",
    });
});

describe("push", () => {
    const tournament = generateTestTournament();
    const fileName = `${tournament.name}.bra`;
    const author = "user";
    const gistId = "new-gist-id";
    const account: GistAccount = {
        type: "gist",
        id: "1234",
        accessToken: "pat-123",
        displayName: author,
    };
    const remote = [
        {
            identifier: GistClient.toShare({ mode: "gist", author, tag: gistId }).identifier,
            pushDate: new Date(),
            filename: tournament.name,
        },
    ];
    const remoteExpected = [
        {
            ...remote[0],
            pushDate: expect.any(Date),
        },
    ];

    beforeEach(() => {
        // @ts-expect-error - Mocking global fetch
        globalThis.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () =>
                    Promise.resolve({
                        id: "new-gist-id",
                        files: {
                            [fileName]: {
                                raw_url: `https://gist.githubusercontent.com/${author}/${gistId}/raw/${fileName}`,
                            },
                        },
                        owner: { login: author },
                    }),
            }),
        );
    });

    it("should push new tournament", async () => {
        const result = await GistClient.create(tournament, { account });
        expect(result).not.toBeNull();
        expect(result!.author).toBe(author);
        expect(result!.tournament).toEqual({
            ...tournament,
            remote: remoteExpected,
        });
        expect(result!.link).toBe(GistClient.toShare({ mode: "gist", author, tag: gistId }).link);

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(
            `https://api.github.com/gists`,
            expect.objectContaining({ method: "POST" }),
        );
    });

    it("should update existing tournament", async () => {
        const tournamentWithRemote = {
            ...tournament,
            remote,
        };

        const result = await GistClient.create(tournamentWithRemote, {
            account,
            updateOnly: true,
        });
        expect(result).not.toBeNull();
        expect(result!.author).toBe(author);
        expect(result!.tournament).toEqual({
            ...tournamentWithRemote,
            remote: remoteExpected,
        });
        expect(result!.link).toBe(
            GistClient.toShare({ mode: "gist", author, tag: `${gistId}` }).link,
        );

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(
            `https://api.github.com/gists/${gistId}`,
            expect.objectContaining({ method: "PATCH" }),
        );
    });

    it("should remove stale gist files when the tournament is renamed", async () => {
        const oldName = "Archived Tournament";
        const baseTournament = generateTestTournament();
        baseTournament.remote = [
            {
                identifier: GistClient.toShare({ mode: "gist", author, tag: gistId }).identifier,
                pushDate: new Date(),
                filename: oldName,
            },
        ];
        const renamedTournament = {
            ...baseTournament,
            name: "Renamed Tournament",
        };
        const renamedTournamentPayload = {
            ...renamedTournament,
        };
        const renamedFileName = `${renamedTournament.name}.bra`;

        // @ts-expect-error - Mocking global fetch
        globalThis.fetch = vi.fn((input: string, init?: RequestInit) => {
            if (!init?.method || init.method === "GET") {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            id: gistId,
                            files: {
                                [fileName]: {
                                    content: JSON.stringify({
                                        ...baseTournament,
                                        name: oldName,
                                    }),
                                },
                            },
                            owner: { login: author },
                        }),
                });
            }

            return Promise.resolve({
                ok: true,
                json: () =>
                    Promise.resolve({
                        id: gistId,
                        files: {
                            [renamedFileName]: {
                                raw_url: `https://gist.githubusercontent.com/${author}/${gistId}/raw/${renamedFileName}`,
                            },
                        },
                        owner: { login: author },
                    }),
            });
        });

        const result = await GistClient.create(renamedTournament, {
            account,
        });

        expect(result).not.toBeNull();
        expect(result!.author).toBe(author);
        expect(result!.tournament).toEqual({
            ...renamedTournament,
            remote: [
                {
                    identifier: GistClient.toShare({ mode: "gist", author, tag: gistId })
                        .identifier,
                    pushDate: expect.any(Date),
                    filename: renamedTournament.name,
                },
            ],
        });
        expect(result!.link).toBe(GistClient.toShare({ mode: "gist", author, tag: gistId }).link);

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenNthCalledWith(
            1,
            `https://api.github.com/gists/${gistId}`,
            expect.objectContaining({ method: "PATCH" }),
        );

        const requestBody = JSON.parse(
            (vi.mocked(fetch).mock.calls[0][1]?.body as string) ?? "{}",
        ) as {
            files?: Record<string, unknown>;
        };

        expect(requestBody.files).toMatchObject({
            [`${oldName}.bra`]: null,
            [`_${oldName}.md`]: null,
            [renamedFileName]: {
                content: JSON.stringify(renamedTournamentPayload, null, 4),
            },
            [`_${renamedTournament.name}.md`]: {
                content: expect.stringContaining("This gist was created with bracketeer"),
            },
        });
    });
});

describe("share", () => {
    const account: GistAccount = {
        type: "gist",
        id: "1234",
        accessToken: "pat-123",
        displayName: "user",
    };

    it("should return null when updateOnly is true and no remote exists", async () => {
        const tournament = generateTestTournament();

        const result = await GistClient.create(tournament, { updateOnly: true, account });

        expect(result).toBe(null);
    });

    it("should return null when no account can be resolved", async () => {
        const tournament = generateTestTournament();
        const store = { findShareAccount: vi.fn().mockResolvedValue(null) };
        vi.spyOn(accountsStoreModule, "useAccountsStore").mockReturnValue(store as never);

        const result = await GistClient.create(tournament, {
            accountResolver(remote) {
                return store.findShareAccount(remote.identifier);
            },
        });

        expect(store.findShareAccount).not.toHaveBeenCalled();
        expect(result).toBe(null);
    });

    it("should resolve account from remote and share successfully", async () => {
        const tournament = generateTestTournament();
        const remoteIdentifier = GistClient.toShare({
            mode: "gist",
            author: "user",
            tag: "gist-id:test.bra",
        }).identifier;
        tournament.remote = [
            {
                identifier: remoteIdentifier,
                pushDate: new Date(),
            },
        ];

        const remoteExpected = [
            {
                identifier: remoteIdentifier,
                pushDate: new Date(),
            },
        ];

        const store = { findShareAccount: vi.fn().mockResolvedValue(account) };
        const resultPayload = {
            type: "success" as const,
            author: "user",
            tournament: {
                ...generateTestTournament(),
                remote: remoteExpected,
            },
            link: "https://example.test/s/abc",
            date: new Date(),
        };

        const successSpy = vi.spyOn(Notifications, "addSuccess").mockImplementation(() => "");
        const pushSpy = vi.spyOn(gistShare, "push").mockResolvedValue(resultPayload);
        vi.spyOn(accountsStoreModule, "useAccountsStore").mockReturnValue(store as never);

        const result = await GistClient.create(tournament, {
            accountResolver(remote) {
                return store.findShareAccount(remote.identifier);
            },
        });

        expect(store.findShareAccount).toHaveBeenCalledWith(remoteIdentifier);
        expect(pushSpy).toHaveBeenCalledTimes(1);
        expect(successSpy).toHaveBeenCalledTimes(1);
        expect(tournament.remote).toEqual(remoteExpected);
        expect(result).toEqual(resultPayload);
    });

    it("should return null and show error notification when push fails", async () => {
        const tournament = generateTestTournament();

        const errorSpy = vi.spyOn(Notifications, "addError").mockImplementation(() => "");
        vi.spyOn(gistShare, "push").mockResolvedValue({
            type: "error",
            error: "not-allowed",
        });

        const result = await GistClient.create(tournament, { account });

        expect(result).toBe(null);
        expect(errorSpy).toHaveBeenCalledWith(
            "Sharing failed",
            expect.objectContaining({
                details: "There was an error sharing the tournament. Please try again.",
            }),
        );
    });
});

describe("pullFromRemote", () => {
    it("should throw when remote pull returns an error", async () => {
        const identifier = GistClient.toShare({
            mode: "gist",
            author: "user",
            tag: "gist-id",
        }).identifier;

        vi.spyOn(gistShare, "pull").mockResolvedValue({
            type: "error",
            error: "not-found",
        });

        expect(await GistClient.pull({ identifier })).toEqual({
            type: "error",
            error: "not-found",
        });
    });

    it("should update tournament fields from remote data", async () => {
        const tournament = generateTestTournament();
        const identifier = GistClient.toShare({
            mode: "gist",
            author: "user",
            tag: "gist-id",
        }).identifier;
        tournament.remote = [{ identifier, pushDate: new Date() }];

        const pulledTournament = generateTestTournament();
        pulledTournament.name = "Updated Tournament";

        vi.spyOn(gistShare, "pull").mockResolvedValue({
            type: "success",
            author: "user",
            tournament: pulledTournament,
            link: "https://example.test/s/xyz",
            date: new Date(),
        });

        const result = await SimpleClient.pullAndUpdate(tournament, { identifier });

        expect(result).not.toBeNull();
        expect(tournament.name).toBe("Updated Tournament");
        expect(tournament.config).toEqual(pulledTournament.config);
        expect(tournament.phases).toEqual(pulledTournament.phases);
    });
});
