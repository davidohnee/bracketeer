import type { TeamScore } from "@/types/tournament";

export const calculateTeamPoints = (teamScore: TeamScore): number => {
    return teamScore.wins * 3 + teamScore.draws;
};

export const calculateDifference = (teamScore: TeamScore): string => {
    const diff = teamScore.points.for - teamScore.points.against;
    if (diff > 0) {
        return `+${diff}`;
    }
    return diff.toString();
};
