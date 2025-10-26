import type { TeamScore, SetScore } from "@/types/tournament";

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

export const calculateScoresFromSets = (sets: SetScore[]): [number, number] => {
    let team1Score = 0;
    let team2Score = 0;
    
    for (const set of sets) {
        if (set.team1 > set.team2) {
            team1Score++;
        } else if (set.team2 > set.team1) {
            team2Score++;
        }
    }
    
    return [team1Score, team2Score];
};
