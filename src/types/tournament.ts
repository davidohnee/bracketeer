export interface Player {
    id: string;
    name: string;
}

export interface Team {
    id: string;
    name: string;
    players?: Player[];
}

export interface TeamScore {
    team: StaticTeamRef;
    wins: number;
    losses: number;
    draws: number;
    points: {
        for: number;
        against: number;
    };
}

export type StaticTeamRef = {
    id: string;
};

export type DynamicTeamRef = {
    placement: number;
    type: "winner" | "loser" | "league";
    fromRound?: number;
};

export type MatchTeam = {
    ref?: StaticTeamRef;
    score: number;
    link?: DynamicTeamRef;
};

export interface Match {
    id: string;
    court: string;
    teams: [MatchTeam, MatchTeam];
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
