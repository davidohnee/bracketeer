import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { gistShare, type GitHubUser } from "./gist";
import { toShare } from "..";
import type { Account, GistAccount } from "@/types/accounts";
import { generateId } from "@/helpers/id";

afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
});

describe("gist share functions", () => {
    describe("accessTokenToAccount", () => {
        it("should convert a valid access token to a GistAccount", async () => {
            const accessToken = "ghp_123456";
            const gitHubUser: GitHubUser = {
                login: "testuser",
                id: 12345,
                node_id: "MDQ6VXNlcjEyMzQ1",
                avatar_url: "https://avatars.githubusercontent.com/u/12345",
                gravatar_id: "",
                url: "https://api.github.com/users/testuser",
                html_url: "https://github.com/testuser",
                followers_url: "https://api.github.com/users/testuser/followers",
                following_url: "https://api.github.com/users/testuser/following{/other_user}",
                gists_url: "https://api.github.com/users/testuser/gists{/gist_id}",
                starred_url: "https://api.github.com/users/testuser/starred{/owner}{/repo}",
                subscriptions_url: "https://api.github.com/users/testuser/subscriptions",
                organizations_url: "https://api.github.com/users/testuser/orgs",
                repos_url: "https://api.github.com/users/testuser/repos",
                events_url: "https://api.github.com/users/testuser/events{/privacy}",
                received_events_url: "https://api.github.com/users/testuser/received_events",
            };

            // @ts-expect-error - Mocking global fetch
            globalThis.fetch = vi.fn(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(gitHubUser),
                }),
            );

            const result = await gistShare.accessTokenToAccount(accessToken);

            expect(result).not.toBeNull();
            expect(result?.type).toBe("gist");
            expect(result?.accessToken).toBe(accessToken);
            expect(result?.displayName).toBe("testuser");
            expect(result?.id).toBeDefined();

            expect(fetch).toHaveBeenCalledTimes(1);
            expect(fetch).toHaveBeenCalledWith("https://api.github.com/user", {
                headers: {
                    Authorization: "Bearer " + accessToken,
                },
            });
        });

        it("should return null when fetch fails", async () => {
            const accessToken = "ghp_invalid";

            // @ts-expect-error - Mocking global fetch
            globalThis.fetch = vi.fn(() =>
                Promise.resolve({
                    ok: false,
                }),
            );

            const result = await gistShare.accessTokenToAccount(accessToken);

            expect(result).toBeNull();
        });

        it("should return null when fetch throws an error", async () => {
            const accessToken = "ghp_error";

            globalThis.fetch = vi.fn(() => Promise.reject(new Error("Network error")));

            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

            const result = await gistShare.accessTokenToAccount(accessToken);

            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalled();
        });
    });

    describe("isMine", () => {
        it("should return the matching account when identifier author matches an account", async () => {
            const author = "johndoe";
            const identifier = toShare("gist", author, "gist-id").identifier;

            const accounts: GistAccount[] = [
                {
                    type: "gist",
                    id: generateId(),
                    accessToken: "token1",
                    displayName: author,
                },
                {
                    type: "gist",
                    id: generateId(),
                    accessToken: "token2",
                    displayName: "janedoe",
                },
            ];

            const result = await gistShare.isMine(identifier, accounts);

            expect(result).not.toBeNull();
            expect(result?.displayName).toBe(author);
            expect(result?.type).toBe("gist");
        });

        it("should return null when no account matches the identifier author", async () => {
            const identifier = toShare("gist", "unknownuser", "gist-id").identifier;

            const accounts: GistAccount[] = [
                {
                    type: "gist",
                    id: generateId(),
                    accessToken: "token1",
                    displayName: "johndoe",
                },
                {
                    type: "gist",
                    id: generateId(),
                    accessToken: "token2",
                    displayName: "janedoe",
                },
            ];

            const result = await gistShare.isMine(identifier, accounts);

            expect(result).toBeNull();
        });

        it("should return null when accounts list is empty", async () => {
            const identifier = toShare("gist", "johndoe", "gist-id").identifier;
            const accounts: Account[] = [];

            const result = await gistShare.isMine(identifier, accounts);

            expect(result).toBeNull();
        });
    });

    describe("isSharedWithAccount", () => {
        it("should return true when remote identifier author matches account displayName", () => {
            const author = "johndoe";
            const remoteIdentifier = toShare("gist", author, "gist-id:file.bra").identifier;

            const account: GistAccount = {
                type: "gist",
                id: generateId(),
                accessToken: "ghp_123",
                displayName: author,
            };

            const result = gistShare.isSharedWithAccount(remoteIdentifier, account);

            expect(result).toBe(true);
        });

        it("should return false when remote identifier author does not match account displayName", () => {
            const remoteIdentifier = toShare("gist", "johndoe", "gist-id:file.bra").identifier;

            const account: GistAccount = {
                type: "gist",
                id: generateId(),
                accessToken: "ghp_123",
                displayName: "janedoe",
            };

            const result = gistShare.isSharedWithAccount(remoteIdentifier, account);

            expect(result).toBe(false);
        });

        it("should handle identifiers with complex tags", () => {
            const author = "user123";
            const remoteIdentifier = toShare(
                "gist",
                author,
                "abc123:tournament-2024.bra",
            ).identifier;

            const account: GistAccount = {
                type: "gist",
                id: generateId(),
                accessToken: "ghp_123",
                displayName: author,
            };

            const result = gistShare.isSharedWithAccount(remoteIdentifier, account);

            expect(result).toBe(true);
        });
    });

    describe("migrate", () => {
        beforeEach(() => {
            localStorage.clear();
        });

        afterEach(() => {
            localStorage.clear();
        });

        it("should migrate valid localStorage data to Account", () => {
            const accessToken = "ghp_old_token";
            const user = JSON.stringify({ login: "migrated_user" });

            localStorage.setItem("github.pat", accessToken);
            localStorage.setItem("github.me", user);

            const result = gistShare.migrate();

            expect(result).not.toBeNull();
            expect(result?.type).toBe("gist");
            expect(result?.accessToken).toBe(accessToken);
            expect(result?.displayName).toBe("migrated_user");
            expect(result?.id).toBeDefined();

            // Verify localStorage was cleaned up
            expect(localStorage.getItem("github.pat")).toBeNull();
            expect(localStorage.getItem("github.me")).toBeNull();
        });

        it("should return null when access token is missing from localStorage", () => {
            const user = JSON.stringify({ login: "some_user" });
            localStorage.setItem("github.me", user);

            const result = gistShare.migrate();

            expect(result).toBeNull();
            // localStorage should not be modified if migration fails
            expect(localStorage.getItem("github.me")).toBe(user);
            expect(localStorage.getItem("github.pat")).toBeNull();
        });

        it("should return null when user data is missing from localStorage", () => {
            const accessToken = "ghp_old_token";
            localStorage.setItem("github.pat", accessToken);

            const result = gistShare.migrate();

            expect(result).toBeNull();
            // localStorage should not be modified if migration fails
            expect(localStorage.getItem("github.pat")).toBe(accessToken);
            expect(localStorage.getItem("github.me")).toBeNull();
        });

        it("should return null when both keys are missing from localStorage", () => {
            const result = gistShare.migrate();

            expect(result).toBeNull();
        });

        it("should clean up localStorage after successful migration", () => {
            const accessToken = "ghp_token_to_migrate";
            const user = JSON.stringify({ login: "user_to_migrate" });

            localStorage.setItem("github.pat", accessToken);
            localStorage.setItem("github.me", user);

            gistShare.migrate();

            expect(localStorage.getItem("github.pat")).toBeNull();
            expect(localStorage.getItem("github.me")).toBeNull();
        });

        it("should not clean up localStorage if accessToken is missing", () => {
            const user = JSON.stringify({ login: "incomplete_user" });
            localStorage.setItem("github.me", user);

            gistShare.migrate();

            expect(localStorage.getItem("github.me")).toBe(user);
        });

        it("should not clean up localStorage if user is missing", () => {
            const accessToken = "ghp_incomplete_token";
            localStorage.setItem("github.pat", accessToken);

            gistShare.migrate();

            expect(localStorage.getItem("github.pat")).toBe(accessToken);
        });
    });
});
