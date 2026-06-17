export type P2PChange = {
    type: "CREATE" | "REMOVE" | "CHANGE";
    path: string[];
    value?: unknown;
};

export type PeerIdType = "session" | "random" | "permanent";
