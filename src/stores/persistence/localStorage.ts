import type { ITournamentPersistor } from "./tournamentWatcher";
import { tournamentFromJson } from "@/helpers";

const LOCAL_STORAGE_KEY = "tournaments";

export const createLocalStorageSync = (): ITournamentPersistor => {
    return {
        load: () => {
            return new Promise((resolve) => {
                const storedTournaments = localStorage.getItem(LOCAL_STORAGE_KEY);
                if (storedTournaments) {
                    resolve(JSON.parse(storedTournaments).map(tournamentFromJson));
                }
                resolve([]);
            });
        },
        onTournamentsChange: (tournaments) => {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tournaments));
        },
    };
};
