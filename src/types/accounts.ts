export interface IAccount {
    type: "gist";
    id: string;
    displayName: string;
}

export interface GistAccount extends IAccount {
    type: "gist";
    accessToken: string;
}

export type Account = GistAccount;
