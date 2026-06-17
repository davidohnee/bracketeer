import type { IRemote, Tournament } from "@/types/tournament";
import {
    findRemoteWithMode,
    getIdentifierFragments,
    getModeFromIdentifier,
    getShareLink,
    type AccountResolver,
    type IdentifierComponents,
    type Import,
    type IShareClient,
} from "..";
import type { Account } from "@/types/accounts";
import { gistShare } from "./gist";
import { Notifications } from "@/components/notifications/createNotification";
import { deepCopy } from "@/helpers/common";

interface GistIdentifierComponents extends IdentifierComponents {
    mode: "gist";
    author: string;
    tag: string;
}

interface GistShareOptions {
    updateOnly?: boolean;
    account?: Account | null;
    accountResolver?: AccountResolver;
}

const toShare = ({ mode, author, tag }: GistIdentifierComponents) => {
    const gistUrl = `${mode}:${author}:${tag}`;
    const base64 = encodeURIComponent(btoa(gistUrl));
    const link = getShareLink(base64);

    return {
        link,
        identifier: base64,
    };
};

const fromShare = (identifier: string) => {
    const [mode, author, ...data] = getIdentifierFragments(identifier);

    return {
        mode,
        author,
        tag: data.join(":"),
    };
};

const push = async (
    tournament: Tournament,
    options: {
        updateOnly?: boolean;
        remote?: IRemote;
        account: Account;
    },
): Promise<Import> => {
    if (options.updateOnly) {
        if (!findRemoteWithMode(tournament, "gist")) {
            return {
                type: "error",
                error: "not-found",
            };
        }
    }
    if (options.account.type == "gist") {
        return await gistShare.push(tournament, options);
    }
    return {
        type: "error",
        error: "not-supported",
    };
};

const pull = async (remote: IRemote): Promise<Import> => {
    return await gistShare.pull(remote.identifier);
};

const accessTokenToAccount = async (accessToken: string): Promise<Account | null> => {
    return gistShare.accessTokenToAccount(accessToken);
};

const share = async (tournament: Tournament, { account, accountResolver }: GistShareOptions) => {
    const gistRemote = tournament.remote?.find(
        (r) => getModeFromIdentifier(r.identifier) === "gist",
    );

    if (!account) {
        if (gistRemote && accountResolver) {
            account = await accountResolver(gistRemote);
        }

        if (!account) {
            return null;
        }
    }

    const tournamentCopy = deepCopy(tournament);

    const result = await push(tournamentCopy, {
        remote: gistRemote,
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
        return null;
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

const unlink = (tournament: Tournament, remote: IRemote, { account }: GistShareOptions) => {
    if (!tournament.remote || !account) return;

    gistShare.remove(remote.identifier, account).catch((error) => {
        console.error("Error removing shared tournament:", error);
        Notifications.addError("Error unlinking tournament", {
            details: "There was an error unlinking the tournament. Please try again.",
            timeout: 5000,
        });
    });
    tournament.remote.splice(
        tournament.remote.findIndex((r) => r.identifier === remote.identifier),
        1,
    );
};

export default {
    accessTokenToAccount,
    create: share,
    delete: unlink,
    pull,
    fromShare,
    toShare,
} as IShareClient<GistIdentifierComponents, GistShareOptions>;
