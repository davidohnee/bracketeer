import type { Match, Tournament, TournamentPhase, TournamentRound } from "@/types/tournament";
import { allMatches } from "./phase";
import { getCourtType } from "./defaults";

export { migrateTournament as tournamentFromJson } from "./migration";

export const getCourtName = (sport: string, courtNumber: number | null): string =>
    courtNumber ? `${getCourtType(sport, false, true)} ${courtNumber}` : "N/A";

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

    const sorted = input.toSorted(matchComparator);
    const last = sorted.at(-1)!;
    return last;
};

export const randomiseGroupPhaseResults = (tournament: Tournament) => {
    for (const phase of tournament.phases) {
        if (phase.type !== "group") continue;

        for (const match of phase.matches) {
            for (const team of match.teams) {
                team.score = Math.floor(Math.random() * 10);
            }
            match.status = "completed";
        }
    }
};

export const getTeamName = (tournament: Tournament, teamId: string | undefined) => {
    const team = tournament.teams.find((team) => team.id === teamId);
    return team ? team.name : null;
};
