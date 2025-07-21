import type { Match, Tournament, TournamentPhase, TournamentRound } from "@/types/tournament";
import { migrateTournament } from "./migration";
import { allMatches } from "./phase";

export const tournamentFromJson = migrateTournament;

export const getCourtName = (courtNumber: number | null): string =>
    courtNumber ? `Court ${courtNumber}` : "N/A";

export const getLastMatchOf = ({
    matches,
    rounds,
    phase,
}: {
    matches?: Match[];
    rounds?: TournamentRound[];
    phase?: TournamentPhase;
}): Match => {
    const input = matches || rounds?.flatMap((round) => round.matches) || allMatches(phase) || [];

    const matchComparator = (a: Match, b: Match) => a.date.getTime() - b.date.getTime();

    const sorted = input.sort(matchComparator);
    const last = sorted[sorted.length - 1];
    return last;
};

export const randomiseGroupPhaseResults = (tournament: Tournament) => {
    for (const phase of tournament.phases) {
        if (phase.type !== "group") continue;

        for (const match of phase.matches) {
            for (let j = 0; j < match.teams.length; j++) {
                const team = match.teams[j];
                team.score = Math.floor(Math.random() * 10);
            }
            match.status = "completed";
        }
    }
};
