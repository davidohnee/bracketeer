import type { Account, GistAccount } from "@/types/accounts";
import { tournamentFromJson } from "@/helpers";
import { deepCopy } from "@/helpers/common";
import { generateId } from "@/helpers/id";
import type { IRemote, Tournament } from "@/types/tournament";
import { fromShare, toShare, type Import } from "..";

export type Files = Record<string, object>;

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
    files: Record<string, { raw_url: string }>;
}

const getHeaders = (pat: string) => ({
    Authorization: "Bearer " + pat,
});

const buildBody = (options: GistOptions) => {
    const base = globalThis.location.origin;
    const payload: {
        public: boolean;
        description?: string;
        files: Record<string, { content: string }>;
    } = {
        public: options.isPublic ?? false,
        description: options.description,
        files: {
            [`_${options.filename ?? "bracketeer"}.md`]: {
                content: `# bracketeer\n\nThis gist was created with bracketeer\n\n${base}`,
            },
        },
    };

    for (const [key, value] of Object.entries(options.files)) {
        payload.files[key] = {
            content: JSON.stringify(value, null, 4),
        };
    }

    return JSON.stringify(payload);
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
    const { author } = fromShare(identifier);
    return accounts.find((x) => x.displayName === author) ?? null;
};

const isSharedWithAccount = (remoteIdentifier: string, account: Account) => {
    const { author } = fromShare(remoteIdentifier);
    return author === account.displayName;
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
        remote,
        account,
    }: {
        remote?: IRemote;
        account: GistAccount;
    },
): Promise<Import> => {
    const name = `${tournament.name}.bra`;

    const copy = deepCopy(tournament);
    delete copy.remote;

    const options: GistOptions = {
        filename: tournament.name,
        isPublic: false,
        files: { [name]: copy },
        account,
    };

    if (remote) {
        const { tag } = fromShare(remote.identifier);
        options.gistId = tag.split(":")[0];
    }

    const jdata = await setGist(options);

    if (!jdata) {
        return { type: "error", error: "not-allowed" };
    }

    const file = jdata.files[name];
    const rawUrl = file.raw_url;
    // "https://gist.githubusercontent.com/{user}/{gist}/raw/{file}/{filename}"
    // gist:{user}:{gist}:{filename}
    const gistId = jdata.id;
    const user = jdata.owner.login;
    const revision = rawUrl.split("/raw/")[1].split("/")[0];

    const { identifier, link } = toShare("gist", user, `${gistId}:${revision}`);

    if (tournament.remote?.length) {
        tournament.remote[0].pushDate = new Date();
    } else {
        tournament.remote = [
            {
                identifier,
                pushDate: new Date(),
            },
        ];
    }

    return { type: "success", author: jdata.owner.login, tournament, link, date: new Date() };
};

const pull = async (identifier: string): Promise<Import> => {
    const { mode, author, tag } = fromShare(identifier);
    if (!author || !tag) {
        return {
            type: "error",
            error: "not-supported",
        };
    }

    if (mode === "gist") {
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
            link: toShare(mode, author, tag).link,
            date: new Date(),
        };
    }
    return { type: "error", error: "not-supported" };
};

export const gistShare = {
    push,
    pull,
    accessTokenToAccount,
    isSharedWithAccount,
    isMine,
    migrate,
};
