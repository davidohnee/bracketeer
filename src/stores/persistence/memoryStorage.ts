import type { Tournament } from "@/types/tournament";
import type { ITournamentPersistor } from "./tournamentWatcher";

interface IMemoryTournamentPersistor extends ITournamentPersistor {
    memory: Tournament[];
}

export const createMemoryStorage = (): IMemoryTournamentPersistor => {
    const persistor: IMemoryTournamentPersistor = {
        memory: [],
        load: () => {
            console.log("Loading tournaments from memory:", persistor.memory);
            return Promise.resolve(persistor.memory);
        },
        onTournamentsChange: (tournaments) => {
            console.log("Persisting tournaments to memory:", tournaments);
            persistor.memory = tournaments;
        },
    };

    return persistor;
};
