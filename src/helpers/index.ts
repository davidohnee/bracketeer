import type { Match, Tournament, TournamentRound } from "@/types/tournament";
import { migrateTournament } from "./migration";
import { deepCopy } from "./common";

export const tournamentFromJson = migrateTournament;

export const getCourtName = (courtNumber: number | null): string =>
    courtNumber ? `Court ${courtNumber}` : "N/A";

export const getLastMatchOf = ({
    matches,
    rounds,
}: {
    matches?: Match[];
    rounds?: TournamentRound[];
}): Match => {
    const allMatches = matches || rounds?.flatMap((round) => round.matches) || [];

    const matchComparator = (a: Match, b: Match) => a.date.getTime() - b.date.getTime();

    const sorted = allMatches.sort(matchComparator);
    const last = sorted[sorted.length - 1];
    return last;
};

export const randomiseGroupPhaseResults = (tournament: Tournament) => {
    const groupPhase = deepCopy(tournament.groupPhase);
    for (const match of groupPhase) {
        for (let j = 0; j < match.teams.length; j++) {
            const team = match.teams[j];
            team.score = 2;
        }
        match.status = "completed";
    }
    tournament.groupPhase = groupPhase;
};
