import type {
    TournamentV1,
    TournamentV2,
    AnyTournament,
    LatestTournament,
    TournamentV3,
    TournamentPhase,
} from "@/types/tournament";
import { generateId } from "./id";

export const migrateTournament = (tournament: AnyTournament): LatestTournament => {
    if (!tournament.version) {
        tournament = migrateTournamentV1ToV2(tournament as TournamentV1);
    }
    if (tournament.version === 2) {
        tournament = migrateTournamentV2ToV3(tournament as TournamentV2);
    }
    return migrateFromJson(tournament);
};

const migratePhaseFromJson = (phase: TournamentPhase): TournamentPhase => {
    if (phase.type === "group") {
        return {
            ...phase,
            matches: phase.matches.map((match) => ({
                ...match,
                date: new Date(match.date),
            })),
        };
    } else if (phase.type === "knockout") {
        return {
            ...phase,
            rounds: phase.rounds.map((round) => ({
                ...round,
                matches: round.matches.map((match) => ({
                    ...match,
                    date: new Date(match.date),
                })),
            })),
        };
    }
    return phase;
};

const migrateFromJson = (tournament: LatestTournament): LatestTournament => ({
    ...tournament,
    phases: tournament.phases.map(migratePhaseFromJson),
    config: {
        ...tournament.config,
        startTime: new Date(tournament.config.startTime),
    },
});

const migrateTournamentV1ToV2 = (tournament: TournamentV1): TournamentV2 => {
    return {
        ...tournament,
        version: 2,
        groupPhase: tournament.groupPhase.flatMap((round) => {
            return round.matches.map((match) => {
                return {
                    ...match,
                    round: {
                        ...round,
                        matches: undefined,
                    },
                };
            });
        }),
    };
};

const migrateTournamentV2ToV3 = (tournament: TournamentV2): TournamentV3 => {
    return {
        version: 3,
        id: tournament.id,
        name: tournament.name,
        teams: tournament.teams,
        config: {
            courts: tournament.config.courts,
            matchDuration: tournament.config.matchDuration,
            breakDuration: tournament.config.breakDuration,
            knockoutBreakDuration: tournament.config.knockoutBreakDuration,
            startTime: tournament.config.startTime,
        },
        phases: [
            {
                id: generateId(),
                type: "group",
                name: "Group Phase",
                matches: tournament.groupPhase,
                groups: tournament.groups,
                rounds: tournament.config.rounds,
            },
            {
                id: generateId(),
                type: "knockout",
                name: "Knockout Phase",
                rounds: tournament.knockoutPhase,
                teamCount: tournament.config.knockoutTeams,
            },
        ],
        remote: tournament.remote,
    };
};
