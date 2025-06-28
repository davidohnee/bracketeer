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
    team: Ref;
    wins: number;
    losses: number;
    draws: number;
    points: {
        for: number;
        against: number;
    };
}

export interface Table {
    group?: Ref;
    teams: TeamScore[];
}

export type Ref = {
    id: string;
};

export type DynamicTeamRef = {
    placement: number;
    type: "winner" | "loser" | "league";
    fromRound?: number;
};

export type MatchTeam = {
    ref?: Ref;
    score: number;
    link?: DynamicTeamRef;
};

export type MatchStatus = "scheduled" | "in-progress" | "completed";

export interface Match {
    id: string;
    court: number | null;
    teams: [MatchTeam, MatchTeam];
    date: Date;
    status: MatchStatus;
    round?: IdentifiableString;
    group?: IdentifiableString;
}

export interface TournamentRound {
    id: string;
    name: string;
    matches: Match[];
}

export interface IdentifiableString {
    id: string;
    name: string;
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

export interface IRemote {
    identifier: string;
    pushDate?: Date;
}

export interface TournamentV1 {
    id: string;
    name: string;
    teams: Team[];
    groupPhase: TournamentRound[];
    knockoutPhase: TournamentRound[];
    config: TournamentConfig;
    remote?: IRemote[];
    version: undefined;
}

export interface Group {
    id: string;
    name: string;
    teams: Ref[];
}

export interface TournamentV2 {
    id: string;
    version: 2;
    name: string;
    teams: Team[];
    groups?: Group[];
    groupPhase: Match[];
    knockoutPhase: TournamentRound[];
    config: TournamentConfig;
    remote?: IRemote[];
}

export type LatestTournament = TournamentV2;
export type AnyTournament = TournamentV1 | TournamentV2;
export type Tournament = LatestTournament;
