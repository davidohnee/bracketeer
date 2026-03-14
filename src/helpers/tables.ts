import type { GroupTournamentPhase, Match, Table, TeamScore } from "@/types/tournament";
import { calculateTeamPoints } from "./scoring";

type ComparatorOptions = {
    a: TeamScore;
    b: TeamScore;
    matches: Match[];
};
type Comparator = (options: ComparatorOptions) => number;
const COMPARATOR_KEYS = [
    "points",
    "directEncounter",
    "difference",
    "pointsFor",
    "pointsAgainst",
    "draws",
] as const;
type ComparatorKey = (typeof COMPARATOR_KEYS)[number];
type ComparatorOrder = ComparatorKey[];

const COMPARATORS: Record<ComparatorKey, Comparator> = {
    points: ({ a, b }: ComparatorOptions) => calculateTeamPoints(b) - calculateTeamPoints(a),
    directEncounter: ({ a, b, matches }: ComparatorOptions) => {
        const match = matches.find((match) => {
            const teamIds = match.teams.map((t) => t.ref?.id);
            return teamIds.includes(a.team.id) && teamIds.includes(b.team.id);
        });
        if (!match || match.status == "scheduled") return 0;

        const aScore = match.teams.find((t) => t.ref?.id == a.team.id)?.score ?? 0;
        const bScore = match.teams.find((t) => t.ref?.id == b.team.id)?.score ?? 0;

        return bScore - aScore;
    },
    difference: ({ a, b }: ComparatorOptions) =>
        b.points.for - b.points.against - (a.points.for - a.points.against),
    pointsFor: ({ a, b }: ComparatorOptions) => b.points.for - a.points.for,
    pointsAgainst: ({ a, b }: ComparatorOptions) => a.points.against - b.points.against,
    draws: ({ a, b }: ComparatorOptions) => b.draws - a.draws,
} as const;

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

    // allow customisation
    const comparatorOrder: ComparatorOrder = [...COMPARATOR_KEYS];

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
