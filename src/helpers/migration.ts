import type {
    TournamentV1,
    TournamentV2,
    AnyTournament,
    LatestTournament,
} from "@/types/tournament";

export const migrateTournament = (tournament: AnyTournament): LatestTournament => {
    if (!tournament.version) {
        tournament = migrateTournamentV1ToV2(tournament as TournamentV1);
    }
    return migrateFromJson(tournament);
};

const migrateFromJson = (tournament: LatestTournament): LatestTournament => ({
    ...tournament,
    groupPhase: tournament.groupPhase.map((match) => ({
        ...match,
        date: new Date(match.date),
    })),
    knockoutPhase: tournament.knockoutPhase.map((round) => ({
        ...round,
        matches: round.matches.map((match) => ({
            ...match,
            date: new Date(match.date),
        })),
    })),
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
