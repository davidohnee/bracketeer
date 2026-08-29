import type { Tournament } from "@/types/tournament";
import type { ITournamentPersistor } from "./tournamentWatcher";

interface IMemoryTournamentPersistor extends ITournamentPersistor {
    memory: Tournament[];
}

export const createMemoryStorage = (): IMemoryTournamentPersistor => {
    const persistor: IMemoryTournamentPersistor = {
        memory: [],
        load: () => {
            return Promise.resolve(persistor.memory);
        },
        onTournamentsChange: (tournaments) => {
            persistor.memory = tournaments;
        },
    };

    return persistor;
};
