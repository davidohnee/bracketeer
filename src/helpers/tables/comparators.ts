import type { ComparatorKey, Match, TeamScore } from "@/types/tournament";
import { calculateTeamPoints } from "../scoring";

type ComparatorOptions = {
    a: TeamScore;
    b: TeamScore;
    matches: Match[];
};
type Comparator = (options: ComparatorOptions) => number;

export const COMPARATORS: Record<ComparatorKey, Comparator> = {
    points: ({ a, b }: ComparatorOptions) => calculateTeamPoints(b) - calculateTeamPoints(a),
    directEncounter: ({ a, b, matches }: ComparatorOptions) => {
        const headToHeadMatches = matches.filter(
            (match) =>
                match.teams.some((team) => team.ref?.id === a.team.id) &&
                match.teams.some((team) => team.ref?.id === b.team.id),
        );

        if (headToHeadMatches.length === 0) return 0;

        // NOT the team with more score; but rather the team that won more matches h2h
        const aHeadToHeadPoints = headToHeadMatches.reduce((acc, match) => {
            const aTeam = match.teams.find((team) => team.ref?.id === a.team.id);
            const bTeam = match.teams.find((team) => team.ref?.id === b.team.id);
            if (!aTeam || !bTeam) return acc;

            if (aTeam.score > bTeam.score) {
                return acc + 1;
            } else if (aTeam.score < bTeam.score) {
                return acc - 1;
            } else {
                return acc;
            }
        }, 0);

        // A negative value indicates that a should come before b.
        return -aHeadToHeadPoints;
    },
    difference: ({ a, b }: ComparatorOptions) =>
        b.points.for - b.points.against - (a.points.for - a.points.against),
    pointsFor: ({ a, b }: ComparatorOptions) => b.points.for - a.points.for,
    pointsAgainst: ({ a, b }: ComparatorOptions) => a.points.against - b.points.against,
    draws: ({ a, b }: ComparatorOptions) => b.draws - a.draws,
} as const;
