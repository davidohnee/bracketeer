import type { IRemote, Tournament } from "@/types/tournament";
import type { Account } from "@/types/accounts";
import P2PClient from "@/helpers/share/p2p";
import GistClient from "@/helpers/share/gist";

type ErrorType = "not-found" | "not-allowed" | "not-supported" | "no-connection";

interface IImportResult {
    type: "success" | "error";
    author?: string;
    tournament?: Tournament;
    link?: string;
    identifier?: string;
    error?: ErrorType;
}

interface IImportSuccess extends IImportResult {
    type: "success";
    author?: string;
    tournament: Tournament;
    link: string;
    date: Date;
}

interface IImportError extends IImportResult {
    type: "error";
    error: ErrorType;
}

export type Import = IImportSuccess | IImportError;

export const SHARE_MODE = ["gist", "p2p"] as const;
export type ShareMode = (typeof SHARE_MODE)[number];

export interface IdentifierComponents {
    mode: ShareMode;
}

export type AccountResolver = (remote: IRemote) => Promise<Account | null>;

export interface ISimpleShareClient {
    pull: (remote: IRemote) => Promise<Import | null>;
    pullAndUpdate: (tournament: Tournament, remote: IRemote) => Promise<Import | null>;
    accessTokenToAccount: (accessToken: string) => Promise<Account | null>;
}

export interface IShareClient<C extends IdentifierComponents, S> {
    pull: (remote: IRemote) => Promise<Import | null>;
    create: (tournament: Tournament, options: S) => Promise<Import | null>;
    delete: (tournament: Tournament, remote: IRemote, options: S) => void;
    fromShare: (identifier: string) => C;
    toShare: (components: C) => { link: string; identifier: string };
    accessTokenToAccount: (accessToken: string) => Promise<Account | null>;
}

const PREFIX = Object.fromEntries(
    SHARE_MODE.map((mode) => [mode, encodeURIComponent(btoa(`${mode}:`).slice(0, -4))]),
) as Record<ShareMode, string>;

export const getIdentifierFragments = (identifier: string) => {
    const str = atob(decodeURIComponent(identifier));
    return str.split(":");
};

export const getModeFromIdentifier = (identifier: string): ShareMode | null => {
    for (const mode of SHARE_MODE) {
        if (identifier.startsWith(PREFIX[mode])) {
            return mode;
        }
    }
    return null;
};

export const findRemoteWithMode = (tournament: Tournament, mode: ShareMode): IRemote | null => {
    return tournament.remote?.find((r) => getModeFromIdentifier(r.identifier) === mode) ?? null;
};

export const findRemoteIndexWithMode = (tournament: Tournament, mode: ShareMode): number => {
    return tournament.remote?.findIndex((r) => getModeFromIdentifier(r.identifier) === mode) ?? -1;
};

const normaliseShareIdentifier = (identifier: string) => {
    try {
        return encodeURIComponent(decodeURIComponent(identifier));
    } catch {
        return encodeURIComponent(identifier);
    }
};

export const getShareLink = (identifier: string, target: "viewer" | "import" = "import") => {
    const base = globalThis.location.origin;
    const normalisedIdentifier = normaliseShareIdentifier(identifier);
    const path = target === "viewer" ? "v" : "s";
    return `${base}/${path}/${normalisedIdentifier}`;
};

const simpleClient: ISimpleShareClient = {
    async pull(remote: IRemote) {
        if (getModeFromIdentifier(remote.identifier) === "p2p") {
            return await P2PClient.pull(remote);
        }
        if (getModeFromIdentifier(remote.identifier) === "gist") {
            return await GistClient.pull(remote);
        }
        return null;
    },
    async pullAndUpdate(tournament: Tournament, remote: IRemote) {
        const importResult = await simpleClient.pull(remote);
        if (importResult?.type === "success" && importResult.tournament) {
            tournament.name = importResult.tournament.name;
            tournament.teams = importResult.tournament.teams;
            tournament.phases = importResult.tournament.phases;
            tournament.config = importResult.tournament.config;
            tournament.content = importResult.tournament.content;
        }
        return importResult;
    },
    async accessTokenToAccount(accessToken: string) {
        return await GistClient.accessTokenToAccount(accessToken);
    },
};

export default simpleClient;
