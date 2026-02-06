import type { Tournament } from "@/types/tournament";
import gistClient from "@/gistClient";
import { toShare, fromShare, type Import } from ".";
import { tournamentFromJson } from "@/helpers";
import { deepCopy } from "@/helpers/common";

const push = async (tournament: Tournament, isPublic: boolean = false) => {
    const name = `${tournament.name}.bra`;
    const options = {
        filename: tournament.name,
        isPublic,
    };

    let jdata: {
        id: string;
        owner: { login: string };
        files: Record<string, { raw_url: string }>;
    };

    const copy = deepCopy(tournament);
    delete copy.remote;

    if (tournament.remote?.length) {
        const remote = tournament.remote[0]!.identifier;
        const { tag } = fromShare(remote);
        const [gist] = tag.split(":");
        jdata = await gistClient.update({ [name]: copy }, options, gist!);
    } else {
        jdata = await gistClient.save({ [name]: copy }, options);
    }

    if (!jdata) {
        return { error: "not-allowed" } as Import;
    }

    const file = jdata.files[name]!;
    const rawUrl = file.raw_url;
    // "https://gist.githubusercontent.com/{user}/{gist}/raw/{file}/{filename}"
    // gist:{user}:{gist}:{filename}
    const gistId = jdata.id;
    const user = jdata.owner.login;
    const fileName = rawUrl.split("/raw/")[1]!.split("/")[0];

    const { identifier, link } = toShare("gist", user, `${gistId}:${fileName}`);

    if (tournament.remote?.length) {
        tournament.remote[0]!.pushDate = new Date();
    } else {
        tournament.remote = [
            {
                identifier,
                pushDate: new Date(),
            },
        ];
    }

    return { author: jdata.owner.login, tournament, link } as Import;
};

const pull = async (identifier: string) => {
    const { mode, author, tag } = fromShare(identifier);
    if (!author || !tag) return;

    if (mode === "gist") {
        const [gist] = tag.split(":");
        const url = `https://gist.githubusercontent.com/${author}/${gist}/raw/`;

        const res = await fetch(url);

        if (res.status == 404) {
            return { error: "not-found" } as Import;
        } else if (res.status == 403) {
            return { error: "not-allowed" } as Import;
        }

        const jdata = await res.json();

        return {
            author,
            tournament: tournamentFromJson(jdata),
            link: toShare(mode, author, tag).link,
        } as Import;
    }
    return { error: "not-found" } as Import;
};

export const gistShare = { push, pull };
