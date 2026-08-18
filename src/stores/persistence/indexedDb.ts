import localforage from "localforage";
import type { ITournamentPeristor } from "./tournamentWatcher";
import { tournamentFromJson } from "@/helpers";
import type { AnyTournament, Tournament } from "@/types/tournament";
import { toRaw } from "vue";

const KEY_PREFIX = "tournament";

const store = localforage.createInstance({
    name: "bracketeer.tournaments",
});

export const createIndexedDbStorage = (): ITournamentPeristor => {
    const key = (tournamentId: string) => `${KEY_PREFIX}.${tournamentId}`;

    return {
        load: async () => {
            const storedTournaments: Tournament[] = [];
            for (const key of await store.keys()) {
                if (!key.startsWith(KEY_PREFIX)) continue;

                const tournament = await store.getItem(key);
                if (tournament) {
                    storedTournaments.push(tournamentFromJson(tournament as AnyTournament));
                }
            }
            return storedTournaments;
        },
        onTournamentChange: (tournament) => {
            store.setItem(key(tournament.id), toRaw(tournament));
        },
        onTournamentDeleted: (tournament) => {
            store.removeItem(key(tournament.id));
        },
    };
};
