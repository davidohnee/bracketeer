import type {
    GroupTournamentPhase,
    Match,
    Ref,
    Team,
    Tournament,
    TournamentPhase,
} from "@/types/tournament";
import { generateTables } from "./tables";

export const allMatches = (phase?: TournamentPhase) => {
    const matches: Match[] = [];

    if (!phase) return matches;

    if (phase.type === "group") {
        matches.push(...phase.matches);
    } else if (phase.type === "knockout") {
        for (const round of phase.rounds) {
            matches.push(...round.matches);
        }
    }

    return matches;
};

export const rankedTeams = (phase: TournamentPhase): Ref[] => {
    const rankedTeams: Ref[] = [];

    if (phase.type === "group") {
        const tables = generateTables(phase);
        const teamsPerTable = tables[0]?.teams.length || 0;

        for (let i = 0; i < teamsPerTable; i++) {
            for (const table of tables) {
                if (table.teams[i]) {
                    rankedTeams.push(table.teams[i].team);
                }
            }
        }
    }

    if (phase.type === "knockout") {
        for (let i = phase.rounds.length - 1; i >= 0; i--) {
            const round = phase.rounds[i];
            // for each match in round, 1st winner
            // then for each match in round loser
            const winners = [];
            const losers = [];
            for (const match of round.matches) {
                if (match.status === "scheduled") {
                    winners.push(match.teams[0].ref!);
                } else {
                    const team1 = match.teams[0].ref!;
                    const team2 = match.teams[1].ref!;

                    if (match.teams[0].score > match.teams[1].score) {
                        winners.push(team1);
                        losers.push(team2);
                    } else if (match.teams[0].score < match.teams[1].score) {
                        winners.push(team2);
                        losers.push(team1);
                    }
                }
            }
            rankedTeams.push(...winners, ...losers);
        }
    }

    return rankedTeams;
};
