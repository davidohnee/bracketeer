import type { Change } from "@/helpers/history/common";
import type { Tournament } from "@/types/tournament";

export type TournamentChangedHandler = (tournament: Tournament, changes: Change[]) => void;
export type TournamentDeletedHandler = (tournament: Tournament) => void;
export type TournamentsChangedHandler = (tournaments: Tournament[]) => void;

export interface ITournamentWatcher {
    onTournamentChange?: TournamentChangedHandler;
    onTournamentDeleted?: TournamentDeletedHandler;
    onTournamentsChange?: TournamentsChangedHandler;
}

export interface ITournamentPersistor extends ITournamentWatcher {
    load: () => Promise<Tournament[]>;
}
