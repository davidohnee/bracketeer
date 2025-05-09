import type { Match, Tournament, TournamentRound } from "@/types/tournament";
import { migrateTournament } from "./migration";

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
    for (const match of tournament.groupPhase) {
        for (let j = 0; j < match.teams.length; j++) {
            const team = match.teams[j];
            team.score = Math.floor(Math.random() * 10);
        }
        match.status = "completed";
    }
};
