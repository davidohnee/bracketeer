import localforage from "localforage";
import type { ITournamentPersistor } from "./tournamentWatcher";
import { tournamentFromJson } from "@/helpers";
import type { AnyTournament } from "@/types/tournament";
import { toRaw } from "vue";

const KEY_PREFIX = "tournament";

const store = localforage.createInstance({
    name: "bracketeer.tournaments",
});

export const createIndexedDbStorage = (): ITournamentPersistor => {
    const key = (tournamentId: string) => `${KEY_PREFIX}.${tournamentId}`;
    const getValue = async (key: string) => {
        if (!key.startsWith(KEY_PREFIX)) return null;

        const item = await store.getItem(key);
        if (item) {
            return tournamentFromJson(item as AnyTournament);
        }
        return null;
    };

    return {
        load: async () => {
            const keys = await store.keys();
            const storedValues = await Promise.all(keys.map((k) => getValue(k)));
            return storedValues.filter((v) => v != null);
        },
        onTournamentChange: (tournament) => {
            void store.setItem(key(tournament.id), toRaw(tournament));
        },
        onTournamentDeleted: (tournament) => {
            void store.removeItem(key(tournament.id));
        },
    };
};
