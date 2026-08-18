import type { Tournament } from "@/types/tournament";

export type TournamentChangedHandler = (tournament: Tournament) => void;
export type TournamentsChangedHandler = (tournaments: Tournament[]) => void;

export interface ITournamentWatcher {
    onTournamentChange?: TournamentChangedHandler;
    onTournamentDeleted?: TournamentChangedHandler;
    onTournamentsChange?: TournamentsChangedHandler;
}

export interface ITournamentPersistor extends ITournamentWatcher {
    load: () => Promise<Tournament[]>;
}
