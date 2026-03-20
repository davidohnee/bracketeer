import {
    COMPARATOR_KEYS,
    type ComparatorOrder,
    type GroupTournamentPhase,
    type Table,
    type TeamScore,
} from "@/types/tournament";
import { COMPARATORS } from "./comparators";

export const generateTables = (forPhase: GroupTournamentPhase): Table[] => {
    const table: { [key: string]: TeamScore } = {};
    const matches = forPhase.matches;

    for (const match of matches) {
        for (let i = 0; i < match.teams.length; i++) {
            const teamRef = match.teams[i].ref!;

            table[teamRef.id] ??= {
                team: teamRef,
                wins: 0,
                losses: 0,
                draws: 0,
                points: { for: 0, against: 0 },
            };

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

    const comparatorOrder: ComparatorOrder = forPhase.tieBreakers || [...COMPARATOR_KEYS];

    const teamScores = Object.values(table);
    teamScores.sort((a, b) => {
        for (const key of comparatorOrder) {
            const comparator = COMPARATORS[key];
            const result = comparator({ a, b, matches });
            if (result !== 0) return result;
        }
        return 0;
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
