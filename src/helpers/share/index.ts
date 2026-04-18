import type { IRemote, Tournament } from "@/types/tournament";
import { gistShare } from "./gist/gist";
import type { Account } from "@/types/accounts";
import { Notifications } from "@/components/notifications/createNotification";
import { deepCopy } from "../common";

interface IImportResult {
    type: "success" | "error";
    author?: string;
    tournament?: Tournament;
    link?: string;
    identifier?: string;
    error?: "not-found" | "not-allowed" | "not-supported";
}

interface IImportSuccess extends IImportResult {
    type: "success";
    author: string;
    tournament: Tournament;
    link: string;
    date: Date;
}

interface IImportError extends IImportResult {
    type: "error";
    error: "not-found" | "not-allowed" | "not-supported";
}

export type Import = IImportSuccess | IImportError;

const normaliseShareIdentifier = (identifier: string) => {
    try {
        return encodeURIComponent(decodeURIComponent(identifier));
    } catch {
        return encodeURIComponent(identifier);
    }
};

export const getShareLink = (identifier: string) => {
    const base = globalThis.location.origin;
    const normalisedIdentifier = normaliseShareIdentifier(identifier);
    return `${base}/s/${normalisedIdentifier}`;
};

export const toShare = (mode: "gist", author: string, tag: string) => {
    const gistUrl = `${mode}:${author}:${tag}`;
    const base64 = encodeURIComponent(btoa(gistUrl));
    const link = getShareLink(base64);

    return {
        link,
        identifier: base64,
    };
};

export const fromShare = (identifier: string) => {
    const str = atob(decodeURIComponent(identifier));
    const [mode, author, ...data] = str.split(":");

    return {
        mode,
        author,
        tag: data.join(":"),
    };
};

export const push = async (
    tournament: Tournament,
    options: {
        remote?: IRemote;
        account: Account;
    },
): Promise<Import> => {
    if (options.account.type == "gist") {
        return await gistShare.push(tournament, options);
    }
    return {
        type: "error",
        error: "not-supported",
    };
};

export const pull = async (identifier: string): Promise<Import> => {
    try {
        const { mode } = fromShare(identifier);
        if (mode === "gist") {
            return await gistShare.pull(identifier);
        }
    } catch (error) {
        console.error(error);
    }
    return { type: "error", error: "not-supported" };
};

export const accessTokenToAccount = async (
    accessToken: string,
    type: "gist",
): Promise<Account | null> => {
    if (type === "gist") {
        return gistShare.accessTokenToAccount(accessToken);
    }
    throw new Error("NotSupported");
};

type AccountResolver = (remote: IRemote) => Promise<Account | null>;

interface IShareOptions {
    updateOnly?: boolean;
    account?: Account | null;
    accountResolver?: AccountResolver;
}

interface UpdateOptions extends IShareOptions {
    updateOnly?: boolean;
    account?: Account | null;
    accountResolver: AccountResolver;
}

interface PublishOptions extends IShareOptions {
    updateOnly?: boolean;
    account: Account | null;
    accountResolver?: AccountResolver;
}

type ShareOptions = UpdateOptions | PublishOptions;

export const share = async (
    tournament: Tournament,
    { updateOnly, account, accountResolver }: ShareOptions,
) => {
    if (updateOnly) {
        if (!tournament.remote?.length) {
            return false;
        }
    }

    if (!account) {
        if (tournament.remote?.length && accountResolver) {
            account = await accountResolver(tournament.remote[0]);
        }

        if (!account) {
            return false;
        }
    }

    const tournamentCopy = deepCopy(tournament);
    delete tournamentCopy.remote;

    const result = await push(tournamentCopy, {
        remote: tournament.remote?.[0],
        account,
    });
    if (result.tournament) {
        tournament.remote = result.tournament.remote;
    } else if (result.error) {
        console.error("Error sharing tournament:", result.error);
        Notifications.addError("Sharing failed", {
            details: "There was an error sharing the tournament. Please try again.",
            timeout: 5000,
        });
        return false;
    }

    Notifications.addSuccess("Tournament shared", {
        details: "The tournament has been shared successfully.",
        timeout: 5000,
        onClick: () => {
            globalThis.open(result.link, "_blank");
        },
        redirect: result.link,
    });

    return result;
};

export const pullFromRemote = async (options: { tournament?: Tournament; remote?: IRemote }) => {
    const { tournament, remote } = options;

    const pullSource = remote?.identifier ?? tournament?.remote?.[0]?.identifier;

    if (!pullSource) {
        throw new Error("No remote source");
    }

    const newTournament = await pull(pullSource);
    if (newTournament?.error) {
        throw new Error(newTournament.error);
    }

    if (tournament && newTournament) {
        tournament.name = newTournament.tournament.name;
        tournament.config = newTournament.tournament.config;
        tournament.phases = newTournament.tournament.phases;
        return tournament;
    }
};

export default {
    share,
    pull: pullFromRemote,
    fromShare,
    toShare,
    getShareLink,
    accessTokenToAccount,
};
