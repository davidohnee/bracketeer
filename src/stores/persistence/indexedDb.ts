import localforage from "localforage";
import type { ITournamentPeristor } from "./tournamentWatcher";
import { tournamentFromJson } from "@/helpers";
import type { AnyTournament } from "@/types/tournament";
import { toRaw } from "vue";

const LOCAL_STORAGE_KEY = "tournaments";

export const createIndexedDbStorage = (): ITournamentPeristor => {
    return {
        load: async () => {
            const storedTournaments: AnyTournament[] | null =
                await localforage.getItem(LOCAL_STORAGE_KEY);
            if (!storedTournaments) {
                return [];
            }
            return storedTournaments.map((x) => tournamentFromJson(x));
        },
        onTournamentChange: (tournament) => {
            console.log("on tournament change", tournament);
        },
        onTournamentsChange: (tournaments) => {
            console.log("on tournaments change");
            localforage.setItem(LOCAL_STORAGE_KEY, toRaw(tournaments));
        },
    };
};
