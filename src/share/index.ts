import type { Tournament } from "@/types/tournament";
import { gistShare } from "./gist";

interface IImportResult {
    author?: string;
    tournament?: Tournament;
    link?: string;
    error?: "not-found" | "not-allowed";
}

interface IImportSuccess extends IImportResult {
    author: string;
    tournament: Tournament;
    link: string;
    date: Date;
}

interface IImportError extends IImportResult {
    error: "not-found" | "not-allowed";
}

export type Import = IImportSuccess | IImportError;

export const getShareLink = (identifier: string) => {
    const base = window.location.origin;
    return `${base}/s/${identifier}`;
};

export const toShare = (mode: "gist", author: string, tag: string) => {
    const gistUrl = `${mode}:${author}:${tag}`;
    const base64 = btoa(gistUrl);
    const link = getShareLink(base64);

    return {
        link,
        identifier: base64,
    };
};

export const fromShare = (identifier: string) => {
    const str = atob(identifier);
    const [mode, author, ...data] = str.split(":");

    return {
        mode,
        author,
        tag: data.join(":"),
    };
};

export const push = async (tournament: Tournament, isPublic: boolean = false) => {
    return await gistShare.push(tournament, isPublic);
};

export const pull = async (identifier: string) => {
    const { mode } = fromShare(identifier);
    if (mode === "gist") {
        return await gistShare.pull(identifier);
    }
    return { error: "not-found" } as Import;
};
