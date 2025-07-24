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

export interface MatchRound extends IdentifiableString {
    index?: number;
}

export interface Match {
    id: string;
    court: number | null;
    teams: [MatchTeam, MatchTeam];
    date: Date;
    status: MatchStatus;
    round?: MatchRound;
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

export interface TournamentConfigV2 {
    courts: number;
    matchDuration: number;
    breakDuration: number;
    knockoutBreakDuration: number;
    startTime: Date;
    sport: string;
}

export interface TournamentConfigV1 extends TournamentConfigV2 {
    rounds: number;
    knockoutTeams: number;
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
    config: TournamentConfigV1;
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
    config: TournamentConfigV1;
    remote?: IRemote[];
}

export interface ITournamentPhase {
    id: string;
    name: string;
    type: "group" | "knockout";
    teamCount?: number;
}

export interface GroupTournamentPhase extends ITournamentPhase {
    type: "group";
    groups?: Group[];
    matches: Match[];
    rounds: number;
}

export interface KnockoutTournamentPhase extends ITournamentPhase {
    type: "knockout";
    rounds: TournamentRound[];
}

export type TournamentPhase = GroupTournamentPhase | KnockoutTournamentPhase;

export interface TournamentV3 {
    id: string;
    version: 3;
    name: string;
    teams: Team[];

    phases: TournamentPhase[];

    config: TournamentConfigV2;
    remote?: IRemote[];
}

export type TournamentConfig = TournamentConfigV2;

export type LatestTournament = TournamentV3;
export type AnyTournament = TournamentV1 | TournamentV2 | TournamentV3;
export type Tournament = LatestTournament;
