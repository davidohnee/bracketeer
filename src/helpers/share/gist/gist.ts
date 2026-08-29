import type { Account, GistAccount } from "@/types/accounts";
import { tournamentFromJson } from "@/helpers";
import { deepCopy } from "@/helpers/common";
import { generateId } from "@/helpers/id";
import type { IRemote, Tournament } from "@/types/tournament";
import { findRemoteWithMode, type Import } from "..";
import GistClient from ".";

export type Files = Record<string, object | null>;

export interface GistOptions {
    files: Files;
    account: GistAccount;
    filename?: string;
    description?: string;
    gistId?: string;
    isPublic?: boolean;
}

export interface GitHubUser {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
}

interface GistResponse {
    id: string;
    owner: { login: string };
    files: Record<string, { raw_url?: string; content?: string; filename?: string }>;
}

const getHeaders = (pat: string) => ({
    Authorization: "Bearer " + pat,
});

const getGistFilename = (filename: string) => `${filename}.bra`;

const getGistReadmeFilename = (filename: string) => `_${filename}.md`;

const parseTournamentName = (content?: string) => {
    if (!content) {
        return null;
    }

    try {
        const data = JSON.parse(content) as Partial<Tournament>;
        return typeof data.name === "string" ? data.name : null;
    } catch {
        return null;
    }
};

const getGist = async (gistId: string, accessToken: string) => {
    try {
        const res = await fetch(`https://api.github.com/gists/${gistId}`, {
            headers: getHeaders(accessToken),
        });

        if (!res.ok) {
            return null;
        }

        return (await res.json()) as GistResponse;
    } catch {
        return null;
    }
};

const buildBody = (options: GistOptions) => {
    const base = globalThis.location.origin;
    const payload: {
        public: boolean;
        description?: string;
        files: Record<string, { content: string } | null>;
    } = {
        public: options.isPublic ?? false,
        description: options.description,
        files: {
            [getGistReadmeFilename(options.filename ?? "bracketeer")]: {
                content: `# bracketeer\n\nThis gist was created with bracketeer\n\n${base}`,
            },
        },
    };

    for (const [key, value] of Object.entries(options.files)) {
        payload.files[key] = value ? { content: JSON.stringify(value, null, 4) } : null;
    }

    return JSON.stringify(payload);
};

const getPreviousFilename = async ({
    remote,
    account,
    currentFilename,
}: {
    remote: IRemote;
    account: GistAccount;
    currentFilename: string;
}) => {
    if (remote.filename) {
        return remote.filename;
    }

    const { tag } = GistClient.fromShare(remote.identifier);
    const gistId = tag.split(":")[0];
    const gist = await getGist(gistId, account.accessToken);

    if (!gist) {
        return null;
    }

    for (const [filename, file] of Object.entries(gist.files)) {
        if (!filename.endsWith(".bra")) {
            continue;
        }

        const previousName = parseTournamentName(file.content);
        if (previousName && previousName !== currentFilename) {
            return previousName;
        }

        if (filename !== getGistFilename(currentFilename)) {
            return filename.slice(0, -4);
        }
    }

    return null;
};

const setGist = async (options: GistOptions) => {
    try {
        let endpoint = "https://api.github.com/gists";
        if (options.gistId) {
            endpoint += "/" + options.gistId;
        }

        const res = await fetch(endpoint, {
            method: options.gistId ? "PATCH" : "POST",
            headers: getHeaders(options.account.accessToken),
            body: buildBody(options),
        });

        if (!res.ok) {
            return null;
        }

        return (await res.json()) as GistResponse;
    } catch {
        return null;
    }
};

const accessTokenToAccount = async (accessToken: string) => {
    try {
        const res = await fetch("https://api.github.com/user", {
            headers: getHeaders(accessToken),
        });

        if (!res.ok) {
            return null;
        }

        const data = (await res.json()) as GitHubUser;

        return {
            type: "gist",
            accessToken,
            displayName: data.login,
            id: generateId(),
        } as GistAccount;
    } catch (error) {
        console.error(error);
        return null;
    }
};

const isMine = async (identifier: string, accounts: Account[]) => {
    try {
        const { author } = GistClient.fromShare(identifier);
        return accounts.find((x) => x.displayName === author) ?? null;
    } catch {
        return null;
    }
};

const isSharedWithAccount = (remoteIdentifier: string, account: Account) => {
    try {
        const { author } = GistClient.fromShare(remoteIdentifier);
        return author === account.displayName;
    } catch {
        return false;
    }
};

const migrate = (): Account | null => {
    const patKey = "github.pat";
    const meKey = "github.me";

    const accessToken = localStorage.getItem(patKey);
    const user = localStorage.getItem(meKey);

    if (!accessToken || !user) {
        return null;
    }

    localStorage.removeItem(patKey);
    localStorage.removeItem(meKey);

    return {
        type: "gist",
        accessToken,
        displayName: JSON.parse(user).login,
        id: generateId(),
    };
};

const push = async (
    tournament: Tournament,
    {
        account,
    }: {
        account: GistAccount;
    },
): Promise<Import> => {
    const name = getGistFilename(tournament.name);

    const copy = deepCopy(tournament);
    const gistRemote = findRemoteWithMode(tournament, "gist");

    const options: GistOptions = {
        filename: tournament.name,
        isPublic: false,
        files: { [name]: copy },
        account,
    };

    if (gistRemote) {
        const { tag } = GistClient.fromShare(gistRemote.identifier);
        options.gistId = tag.split(":")[0];

        const previousFilename = await getPreviousFilename({
            remote: gistRemote,
            account,
            currentFilename: tournament.name,
        });

        if (previousFilename && previousFilename !== tournament.name) {
            options.files[getGistFilename(previousFilename)] = null;
            options.files[getGistReadmeFilename(previousFilename)] = null;
        }
    }

    const jdata = await setGist(options);

    if (!jdata) {
        return { type: "error", error: "not-allowed" };
    }

    const file = jdata.files[name];
    const rawUrl = file?.raw_url;

    if (!rawUrl) {
        return { type: "error", error: "not-allowed" };
    }
    // "https://gist.githubusercontent.com/{user}/{gist}/raw/{file}/{revision}"
    // gist:{user}:{gist}:{filename}
    const gistId = jdata.id;
    const user = jdata.owner.login;

    const { identifier, link } = GistClient.toShare({
        mode: "gist",
        author: user,
        tag: gistId,
    });

    tournament.remote ??= [];

    if (gistRemote) {
        gistRemote.identifier = identifier;
        gistRemote.pushDate = new Date();
        gistRemote.filename = tournament.name;
    } else {
        tournament.remote.push({
            identifier,
            pushDate: new Date(),
            filename: tournament.name,
        });
    }

    return { type: "success", author: jdata.owner.login, tournament, link, date: new Date() };
};

const pull = async (identifier: string): Promise<Import> => {
    try {
        const { mode, author, tag } = GistClient.fromShare(identifier);
        if (!author || !tag) {
            return {
                type: "error",
                error: "not-supported",
            };
        }

        const [gist] = tag.split(":");
        const url = `https://gist.githubusercontent.com/${author}/${gist}/raw/`;

        const res = await fetch(url);

        if (res.status == 404) {
            return { type: "error", error: "not-found" };
        } else if (res.status == 403) {
            return { type: "error", error: "not-allowed" };
        }

        const jdata = await res.json();

        return {
            type: "success",
            author,
            tournament: tournamentFromJson(jdata),
            link: GistClient.toShare({ mode, author, tag }).link,
            date: new Date(),
        };
    } catch {
        return {
            type: "error",
            error: "not-supported",
        };
    }
};

const remove = async (identifier: string, account: Account) => {
    try {
        const { author, tag } = GistClient.fromShare(identifier);
        if (author !== account.displayName) {
            return false;
        }

        const [gistId] = tag.split(":");
        const res = await fetch(`https://api.github.com/gists/${gistId}`, {
            method: "DELETE",
            headers: getHeaders(account.accessToken),
        });

        return res.ok;
    } catch {
        return false;
    }
};

export const gistShare = {
    push,
    pull,
    remove,
    accessTokenToAccount,
    isSharedWithAccount,
    isMine,
    migrate,
};
