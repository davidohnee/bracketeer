export interface Player {
    id: string;
    name: string;
}

export interface Team {
    id?: string;
    name: string;
    players?: Player[];
}

export interface TeamScore {
    team: Team;
    wins: number;
    losses: number;
    draws: number;
    points: {
        for: number;
        against: number;
    };
}

export interface Match {
    id: string;
    court: string;
    team1: Team;
    team2: Team;
    score1: number;
    score2: number;
    date: Date;
    status: "scheduled" | "in-progress" | "completed";
}

export interface TournamentRound {
    id: string;
    name: string;
    matches: Match[];
}

export interface TournamentConfig {
    rounds: number;
    knockoutTeams: number;
    courts: number;
    matchDuration: number;
    breakDuration: number;
    knockoutBreakDuration: number;
    startTime: Date;
}

export interface Tournament {
    id: string;
    name: string;
    teams: Team[];
    groupPhase: TournamentRound[];
    knockoutPhase: TournamentRound[];
    config: TournamentConfig;
}
