import type { GroupTournamentPhase, Table, TeamScore } from "@/types/tournament";
import { calculateTeamPoints } from "./scoring";

export const generateTables = (forPhase: GroupTournamentPhase): Table[] => {
    const table: { [key: string]: TeamScore } = {};
    const matches = forPhase.matches;

    for (let j = 0; j < matches.length; j++) {
        const match = matches[j];

        for (let i = 0; i < match.teams.length; i++) {
            const teamRef = match.teams[i].ref!;

            if (!table[teamRef.id]) {
                table[teamRef.id] = {
                    team: teamRef,
                    wins: 0,
                    losses: 0,
                    draws: 0,
                    points: { for: 0, against: 0 },
                };
            }
            const team = table[teamRef.id];
            team.points.for += match.teams[i].score;
            team.points.against += match.teams[1 - i].score;

            if (match.status == "scheduled") continue;

            if (match.teams[i].score > match.teams[1 - i].score) {
                team.wins++;
            } else if (match.teams[i].score < match.teams[1 - i].score) {
                team.losses++;
            } else {
                team.draws++;
            }
        }
    }

    const teamScores = Object.values(table);
    teamScores.sort((a, b) => {
        if (calculateTeamPoints(b) !== calculateTeamPoints(a)) {
            return calculateTeamPoints(b) - calculateTeamPoints(a);
        }
        if (a.points.for !== b.points.for) {
            return b.points.for - a.points.for;
        }
        if (a.points.against !== b.points.against) {
            return a.points.against - b.points.against;
        }
        if (a.draws !== b.draws) {
            return b.draws - a.draws;
        }
        return a.team.id.localeCompare(b.team.id, undefined, {
            numeric: true,
        });
    });

    const groups = forPhase.groups;
    if (!groups) {
        return [
            {
                teams: teamScores,
            },
        ];
    }

    const tables: Table[] = [];
    for (const group of groups) {
        const groupTable: Table = {
            group: group,
            teams: teamScores.filter((team) => group.teams.find((x) => x.id == team.team.id)),
        };
        tables.push(groupTable);
    }
    return tables;
};
