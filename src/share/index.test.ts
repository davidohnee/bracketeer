import { test, vi, expect, afterEach, describe, it, beforeEach } from "vitest";
import { pull, toShare, push } from ".";
import type { Tournament } from "@/types/tournament";

const generateTestTournament = (teamCount: number): Tournament => {
    const teams = Array.from({ length: teamCount }, (_, i) => ({
        id: `team-${i + 1}`,
        name: `Team ${i + 1}`,
    }));

    return {
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
};

test("pull", async () => {
    const tournament = generateTestTournament(4);

    // @ts-expect-error - Mocking global fetch
    globalThis.fetch = vi.fn(() =>
        Promise.resolve({
            ok: true,
            json: () => Promise.resolve(tournament),
        }),
    );

    const author = "user";
    const gistId = "gistId";

    const { link, identifier } = toShare("gist", author, gistId);

    // Call the function and assert the result
    const data = await pull(identifier);

    expect(data).toEqual({
        author,
        tournament,
        link,
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
        `https://gist.githubusercontent.com/${author}/${gistId}/raw/`,
    );

    vi.clearAllMocks();
});

describe("push", () => {
    const tournament = generateTestTournament(4);
    const fileName = `${tournament.name}.bra`;
    const author = "user";
    const gistId = "new-gist-id";
    const remote = [
        {
            identifier: toShare("gist", author, `${gistId}:${fileName}`).identifier,
            pushDate: new Date(),
        },
    ];
    const remoteExpected = [
        {
            ...remote[0],
            pushDate: expect.any(Date),
        },
    ];

    afterEach(() => {
        vi.clearAllMocks(); // Reset all mocked calls between tests
    });

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
        localStorage.setItem("github.pat", "test-pat");
    });

    it("should push new tournament", async () => {
        const result = await push(tournament);
        expect(result.author).toBe(author);
        expect(result.tournament).toEqual({
            ...tournament,
            remote: remoteExpected,
        });
        expect(result.link).toBe(toShare("gist", author, `${gistId}:${fileName}`).link);

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

        const result = await push(tournamentWithRemote);
        expect(result.author).toBe(author);
        expect(result.tournament).toEqual({
            ...tournamentWithRemote,
            remote: remoteExpected,
        });
        expect(result.link).toBe(toShare("gist", author, `${gistId}:${fileName}`).link);

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(
            `https://api.github.com/gists/${gistId}`,
            expect.objectContaining({ method: "PATCH" }),
        );
    });
});
