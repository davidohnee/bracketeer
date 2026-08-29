import type { IRemote, Tournament } from "@/types/tournament";
import {
    getIdentifierFragments,
    getShareLink,
    type IdentifierComponents,
    type Import,
    type IShareClient,
} from "..";
import { createPullSync as createP2PPullSync } from "./pullSync";
import { ref } from "vue";
import type { PeerIdType } from "./common";
import { generateSecureId } from "@/helpers/id";
import { writeSessionPeerId } from "./pushSync";

interface P2PIdentifierComponents extends IdentifierComponents {
    mode: "p2p";
    type: PeerIdType;
    peerId: string;
}

interface P2PShareOptions {
    type: PeerIdType;
}

const toShare = ({ mode, type, peerId }: P2PIdentifierComponents) => {
    const p2pUrl = `${mode}:${type}:${peerId}`;
    const base64 = encodeURIComponent(btoa(p2pUrl));
    const link = getShareLink(base64);

    return {
        link,
        identifier: base64,
    };
};

const fromShare = (identifier: string) => {
    const [mode, type, peerId] = getIdentifierFragments(identifier);

    return {
        mode,
        type,
        peerId: peerId,
    };
};

const pull = async (remote: IRemote): Promise<Import> => {
    const tournament = ref<Tournament | null>(null);
    const pullSync = createP2PPullSync(tournament);

    try {
        return await pullSync.pull(remote.identifier);
    } finally {
        pullSync.stop();
    }
};

const create = async (
    tournament: Tournament,
    { type }: P2PShareOptions,
): Promise<Import | false> => {
    const peerId = generateSecureId();
    const identifierComponents: P2PIdentifierComponents = {
        mode: "p2p",
        type,
        peerId,
    };
    const { link, identifier } = toShare(identifierComponents);
    if (type === "session") {
        writeSessionPeerId(peerId);
    }

    tournament.remote ??= [];
    tournament.remote.push({
        identifier,
        pushDate: new Date(),
    });

    return {
        type: "success",
        link,
        identifier,
        date: new Date(),
        tournament,
    };
};

const unlink = (tournament: Tournament, remote: IRemote) => {
    tournament.remote?.splice(
        tournament.remote.findIndex((r) => r.identifier === remote.identifier),
        1,
    );
};

export default {
    accessTokenToAccount: async () => null,
    create,
    delete: unlink,
    pull,
    fromShare,
    toShare,
} as IShareClient<P2PIdentifierComponents, P2PShareOptions>;
