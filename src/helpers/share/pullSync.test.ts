import { expect, describe, it } from "vitest";
import { getPullSyncFactory } from "./pullSync";
import { createPullSync as createP2PPullSync } from "./p2p/pullSync";
import { createPullSync as createGistPullSync } from "./gist/pullSync";
import P2PClient from "./p2p";
import GistClient from "./gist";
import { ref } from "vue";

describe("pull sync manager", () => {
    it("should return p2p for p2p identifier", () => {
        const identifier = P2PClient.toShare({
            mode: "p2p",
            type: "permanent",
            peerId: "peer-id",
        });

        const factory = getPullSyncFactory(identifier.identifier);
        expect(factory).toBe(createP2PPullSync);
    });

    it("should return gist for gist identifier", () => {
        const identifier = GistClient.toShare({
            mode: "gist",
            author: "author",
            tag: "tag",
        });

        const factory = getPullSyncFactory(identifier.identifier);
        expect(factory).toBe(createGistPullSync);
    });

    it("should return unsupported for random string", () => {
        const factory = getPullSyncFactory("random");
        const pullSync = factory(ref(null));
        expect(pullSync.error.value).toBe("not-supported");
    });
});
