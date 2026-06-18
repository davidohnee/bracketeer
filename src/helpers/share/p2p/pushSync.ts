import { deepCopy } from "@/helpers/common";
import type { Tournament } from "@/types/tournament";
import { type DataConnection, Peer } from "peerjs";
import { ref, toRaw, watch, type Ref } from "vue";
import diff from "microdiff";
import type { IPushSync } from "../pushSync";
import type { P2PChange } from "./common";
import { generateSecureId } from "@/helpers/id";
import P2PClient from ".";
import { findRemoteIndexWithMode } from "..";

const P2P_TAB_ID_KEY = "p2p.tab-id";
const P2P_LOCK_PREFIX = "p2p.lock.";
const P2P_PEER_PREFIX = "p2p.peer.";
const P2P_LEASE_MS = 15_000;
const P2P_RETRY_MS = 5_000;
const P2P_HEARTBEAT_MS = 5_000;

const temporaryCache: Set<string> = new Set();

const getTabId = () => {
    const existing = sessionStorage.getItem(P2P_TAB_ID_KEY);
    if (existing) {
        return existing;
    }

    const tabId = generateSecureId();
    sessionStorage.setItem(P2P_TAB_ID_KEY, tabId);
    return tabId;
};

const getLockKey = (identifier: string) => `${P2P_LOCK_PREFIX}${identifier}`;

const readLock = (identifier: string) => {
    const raw = localStorage.getItem(getLockKey(identifier));
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as { owner: string; updatedAt: number };
    } catch {
        return null;
    }
};

export const writeSessionPeerId = (identifier: string) => {
    const sessionKey = `${P2P_PEER_PREFIX}${identifier}`;
    localStorage.setItem(sessionKey, new Date().toISOString());
};

const writeLock = (identifier: string, owner: string) => {
    localStorage.setItem(getLockKey(identifier), JSON.stringify({ owner, updatedAt: Date.now() }));
};

const releaseLock = (identifier: string, owner: string) => {
    const lock = readLock(identifier);
    if (lock?.owner !== owner) {
        return false;
    }

    localStorage.removeItem(getLockKey(identifier));
    return true;
};

const isLockExpired = (lock: { owner: string; updatedAt: number } | null) => {
    if (!lock) {
        return true;
    }

    return Date.now() - lock.updatedAt > P2P_LEASE_MS;
};

const attachHostConnection =
    (connections: DataConnection[], tournament: Ref<Tournament | null>) =>
    (connection: DataConnection) => {
        connections.push(connection);

        connection.on("open", () => {
            if (!tournament.value) {
                return;
            }

            connection.send({
                type: "full",
                data: deepCopy(toRaw(tournament.value)),
            });
        });

        const removeConnection = () => {
            const index = connections.findIndex(
                (item) => item.connectionId === connection.connectionId,
            );
            if (index !== -1) {
                connections.splice(index, 1);
            }
        };

        connection.on("close", removeConnection);
        connection.on("error", removeConnection);
    };

export const applyPeerId = (tournament: Ref<Tournament | null>, identifier: string) => {
    if (!tournament.value?.remote) return;
    const i = findRemoteIndexWithMode(tournament.value, "p2p");
    if (i === undefined || i === -1) {
        return;
    }
    tournament.value.remote[i] = {
        identifier,
    };
};

export const getAndApplyPeerId = (tournament: Ref<Tournament | null>, identifier: string) => {
    const { type, peerId } = P2PClient.fromShare(identifier);

    if (type === "session") {
        // check session storage first for peer id with this identifier; if not generate a new one, store it and return it
        const sessionCreated = localStorage.getItem(`${P2P_PEER_PREFIX}${peerId}`);
        if (!sessionCreated) {
            const newSessionId = generateSecureId();
            const newIdentifier = P2PClient.toShare({
                mode: "p2p",
                type,
                peerId: newSessionId,
            }).identifier;
            const newSessionKey = `${P2P_PEER_PREFIX}${newSessionId}`;
            localStorage.setItem(newSessionKey, new Date().toISOString());
            applyPeerId(tournament, newIdentifier);
            return newIdentifier;
        }
        return peerId;
    }
    if (type === "random") {
        if (temporaryCache.has(identifier)) {
            return peerId;
        }

        const newPeerId = generateSecureId();
        const newIdentifier = P2PClient.toShare({
            mode: "p2p",
            type,
            peerId: newPeerId,
        }).identifier;
        applyPeerId(tournament, newIdentifier);
        temporaryCache.add(newIdentifier);
        return newPeerId;
    }
    return peerId;
};

export const createPushSync = (tournament: Ref<Tournament | null>): IPushSync => {
    let peerId = "";
    let remoteIdentifier = "";
    let ownerTabId = getTabId();
    let peer: Peer | null = null;
    let connections: DataConnection[] = [];
    let previousTournament: Tournament | null = null;
    let stopWatching: (() => void) | null = null;
    let heartbeat: ReturnType<typeof setInterval> | null = null;
    let retry: ReturnType<typeof setInterval> | null = null;
    let retryStart: ReturnType<typeof setInterval> | null = null;
    let ownsLock = false;
    let storageListener: ((event: StorageEvent) => void) | null = null;
    const state = ref<"connected" | "connecting" | "disconnected" | "no-lock" | "error">(
        "disconnected",
    );

    const closePeer = () => {
        connections.forEach((connection) => connection.close());
        connections = [];

        if (peer) {
            peer.destroy();
            peer = null;
        }

        if (state.value !== "error") {
            state.value = "disconnected";
        }
    };

    const stopHost = () => {
        stopWatching?.();
        stopWatching = null;
        previousTournament = null;
        if (heartbeat) {
            clearInterval(heartbeat);
            heartbeat = null;
        }
        if (ownsLock) {
            releaseLock(peerId, ownerTabId);
        }
        ownsLock = false;
        closePeer();
    };

    const broadcastDiff = (nextTournament: Tournament) => {
        if (!previousTournament) {
            previousTournament = deepCopy(nextTournament);
            return;
        }

        const changes = diff(previousTournament, nextTournament) as P2PChange[];
        previousTournament = deepCopy(nextTournament);

        if (!changes.length) {
            return;
        }

        connections.forEach((connection) => {
            if (connection.open) {
                connection.send({
                    type: "diff",
                    data: changes,
                });
            }
        });
    };

    const startWatching = () => {
        stopWatching?.();
        previousTournament = tournament.value ? deepCopy(tournament.value) : null;
        state.value = "connected";

        stopWatching = watch(
            tournament,
            (nextTournament) => {
                if (nextTournament) {
                    broadcastDiff(nextTournament);
                }
            },
            { deep: true },
        );
    };

    const renewLock = () => {
        if (ownsLock) {
            writeSessionPeerId(peerId);
            writeLock(peerId, ownerTabId);
        }
    };

    const claimLock = () => {
        const lock = readLock(peerId);
        if (lock && lock.owner !== ownerTabId && !isLockExpired(lock)) {
            return false;
        }

        writeLock(peerId, ownerTabId);
        ownsLock = true;
        return true;
    };

    const startHost = () => {
        if (!peerId || ownsLock) {
            return;
        }

        if (!claimLock()) {
            state.value = "no-lock";
            return;
        }

        state.value = "connecting";

        try {
            peer = new Peer(peerId);
            peer.on("open", startWatching);
            peer.on("connection", attachHostConnection(connections, tournament));
        } catch (error) {
            console.error("Error starting PeerJS host for identifier:", peerId, error);
            state.value = "error";
            return;
        }

        peer.on("error", (err) => {
            console.error("PeerJS host error for identifier:", peerId, err);
            state.value = "error";
            stopHost();
        });

        heartbeat = setInterval(renewLock, P2P_HEARTBEAT_MS);
    };

    const tryBecomeHost = () => {
        if (!peerId || ownsLock) {
            return;
        }

        ownerTabId = getTabId();
        const lock = readLock(peerId);
        if (lock && lock.owner !== ownerTabId && !isLockExpired(lock)) {
            state.value = "no-lock";
            return;
        }
        startHost();
    };

    storageListener = (event: StorageEvent) => {
        if (event.key === getLockKey(peerId) && !ownsLock) {
            tryBecomeHost();
        }
    };

    globalThis.addEventListener("storage", storageListener);
    retry = setInterval(tryBecomeHost, P2P_RETRY_MS);

    const cleanUpSession = () => {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(P2P_LOCK_PREFIX)) {
                const lock = readLock(key.substring(P2P_LOCK_PREFIX.length));
                if (isLockExpired(lock)) {
                    localStorage.removeItem(key);
                }
            }
            if (key?.startsWith(P2P_PEER_PREFIX)) {
                const timestamp = localStorage.getItem(key);
                if (timestamp) {
                    const time = Date.parse(timestamp);
                    if (Number.isNaN(time) || Date.now() - time > P2P_LEASE_MS) {
                        localStorage.removeItem(key);
                    }
                }
            }
        }
    };
    cleanUpSession();

    return {
        start(identifier: string) {
            remoteIdentifier = identifier;
            const newPeerId = getAndApplyPeerId(tournament, identifier);

            if (peerId === newPeerId) {
                tryBecomeHost();
                return;
            }

            stopHost();
            peerId = newPeerId;
            tryBecomeHost();
        },
        stop() {
            stopHost();
            if (retryStart) {
                clearInterval(retryStart);
                retryStart = null;
            }
            if (retry) {
                clearInterval(retry);
                retry = null;
            }
            if (storageListener) {
                globalThis.removeEventListener("storage", storageListener);
                storageListener = null;
            }
        },
        state,
        get id() {
            return remoteIdentifier;
        },
    };
};
