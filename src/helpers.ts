import type {
    Match,
    StaticTeamRef,
    Team,
    TeamScore,
    Tournament,
    TournamentConfig,
    TournamentRound,
} from "./types/tournament";

export const generateId = () => {
    return Math.random().toString(36).substring(2, 15);
};

export const tournamentFromJson = (tournament: Tournament) => ({
    ...tournament,
    groupPhase: tournament.groupPhase.map((round) => ({
        ...round,
        matches: round.matches.map((match) => ({
            ...match,
            date: new Date(match.date),
        })),
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

export const generateTable = (tournament: Tournament): TeamScore[] => {
    const table: { [key: string]: TeamScore } = {};
    const matches = tournament.groupPhase.flatMap((round) => round.matches);

    for (let j = 0; j < matches.length; j++) {
        const match = matches[j];

        for (let i = 0; i < match.teams.length; i++) {
            const teamRef = match.teams[i].ref!;

            if (!table[teamRef.id]) {
                table[teamRef.id] = {
                    team: teamRef,
                    wins: 0,
                    losses: 0,
                    draws: 0,
                    points: { for: 0, against: 0 },
                };
            }
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

    const teamScores = Object.values(table);
    teamScores.sort((a, b) => {
        if (calculateTeamPoints(b) !== calculateTeamPoints(a)) {
            return calculateTeamPoints(b) - calculateTeamPoints(a);
        }
        if (a.points.for !== b.points.for) {
            return b.points.for - a.points.for;
        }
        if (a.points.against !== b.points.against) {
            return a.points.against - b.points.against;
        }
        if (a.draws !== b.draws) {
            return b.draws - a.draws;
        }
        return a.team.id.localeCompare(b.team.id, undefined, {
            numeric: true,
        });
    });
    return teamScores;
};

export const getCourtName = (courtNumber: number | null): string =>
    courtNumber ? `Court ${courtNumber}` : "N/A";

export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const rotate = <T>(n: number, xs: T[]) => [
    ...xs.slice(xs.length - (n % xs.length)),
    ...xs.slice(0, xs.length - (n % xs.length)),
];

const BYE = Symbol();

const roundRobin = <T>(teams: T[]): T[][][] => {
    const ts = teams as (T | Symbol)[];
    const all = ts.concat(ts.length % 2 == 0 ? [] : [BYE])
    const rest = all.slice(0, -1)
    return rest
        .map((_, i) => rotate(i + 1, fold([...rotate(i, rest), all.at(-1)])))
        .map((b) => b.filter(([a, b]) => a !== BYE && b !== BYE))
        .map((b, i) => (i % 2 == 0 ? b : b.map(([a, b]) => [b, a]))) as T[][][];
}

const fold = <T>(xs: T[]) =>
    xs.slice(0, Math.ceil(xs.length / 2)).map((x, i) => [x, xs[xs.length - i - 1]]);

/**
 * find the earliest time slot for two teams to play a match on a specific court
 *
 * @param scheduledMatches - array of matches already scheduled
 * @param earliestTime - earliest time to start the match
 * @param timeDelta - time delta between matches
 * @param teams - array of teams to play the match
 * @param court - court to play the match on
 * @returns - earliest time slot for the match
 */
const earliestFreeSlot = (
    scheduledMatches: Match[],
    earliestTime: Date,
    timeDelta: number,
    teams: StaticTeamRef[],
    courtCount: number,
): { time: Date; court: number } => {
    const matchTime = new Date(earliestTime);
    let court = 1;
    const courts = Array.from({ length: courtCount }, (_, i) => i + 1);

    const increaseTime = (time: Date, delta: number) => {
        time.setMinutes(time.getMinutes() + delta);
        return time;
    };

    const isNotPossible = (time: Date) => {
        if (scheduledMatches.length === 0) {
            return false;
        }

        // get lowest free court
        court = courts.find(
            (court) =>
                !scheduledMatches.some(
                    (match) => match.court === court && time.getTime() == match.date.getTime(),
                ),
        )!;
        if (!court) {
            return true;
        }

        const isTeamOccupied = scheduledMatches.some((match) =>
            match.teams.some(
                (team) =>
                    (team.ref?.id === teams[0].id || team.ref?.id === teams[1].id) &&
                    time.getTime() == match.date.getTime(),
            ),
        );
        return isTeamOccupied;
    };

    for (let i = 0; i < 100; i++) {
        if (!isNotPossible(matchTime)) {
            break;
        }
        increaseTime(matchTime, timeDelta);
    }

    return { time: matchTime, court };
};

export const generateGroupPhase = (teams: Team[], config: TournamentConfig): TournamentRound[] => {
    const rounds: TournamentRound[] = [];
    const shuffledTeams = teams.sort(() => Math.random() - 0.5);

    const roundDuration = config.matchDuration + config.breakDuration;

    const matches = roundRobin(shuffledTeams);

    for (let i = 0; i < config.rounds; i++) {
        const matchI = i % matches.length;
        const matchPairs = matches[matchI];

        const match: Match[] = [];
        for (let j = 0; j < matchPairs.length; j++) {
            const team1 = matchPairs[j][0];
            const team2 = matchPairs[j][1];

            const slot = earliestFreeSlot(
                [...rounds.flatMap((round) => round.matches), ...match],
                config.startTime,
                roundDuration,
                [team1!, team2!],
                config.courts,
            );
            const { time, court } = slot;

            const matchObj: Match = {
                id: generateId(),
                court,
                teams: [
                    {
                        ref: team1 as StaticTeamRef,
                        score: 0,
                    },
                    {
                        ref: team2 as StaticTeamRef,
                        score: 0,
                    },
                ],
                date: time,
                status: "scheduled",
            };
            match.push(matchObj);
        }
        rounds.push({
            id: generateId(),
            name: `Round ${i + 1}`,
            matches: match,
        });
    }

    return rounds;
};

export const generateRound = (
    teams: Team[],
    previousRounds: TournamentRound[] | null = null,
): Match[] => {
    if (!previousRounds) {
        previousRounds = [];
    }

    const choices = Array.from(
        { length: teams.length / 2 },
        (_, index) => index + teams.length / 2,
    );

    const matches: Match[] = [];
    for (let i = 0; i < teams.length / 2; i++) {
        const team1 = teams[i];

        // random team 2, but not the same as team 1 and not same matchup in previous rounds
        let team2: Team | undefined = undefined;
        let j = Math.floor(Math.random() * choices.length);

        let x = 0;

        while ((choices.length > 0, x < 100)) {
            x++;
            team2 = teams[j];
            // previous round contains the match
            if (
                !previousRounds.some((round) =>
                    round.matches.some(
                        (match) =>
                            match.teams.find((t) => t.ref!.id === team1.id) &&
                            match.teams.find((t) => t.ref!.id === team2!.id),
                    ),
                )
            ) {
                choices.splice(j, 1);
                break;
            }
            j = (j + 1) % choices.length;
        }

        const match: Match = {
            id: generateId(),
            court: null,
            teams: [
                {
                    ref: team1,
                    score: 0,
                },
                {
                    ref: team2,
                    score: 0,
                },
            ],
            date: new Date(),
            status: "scheduled",
        };
        matches.push(match);
    }

    return matches;
};

export const getLastMatchOf = (rounds: TournamentRound[]): Match => {
    const matchComparator = (a: Match, b: Match) => a.date.getTime() - b.date.getTime();

    const sorted = rounds.flatMap((round) => round.matches).sort(matchComparator);
    const last = sorted[sorted.length - 1];
    return last;
};

export const generateKnockoutBracket = (
    config: TournamentConfig,
    lastGroupPhaseMatchDate: Date,
    table: TeamScore[] = [],
): TournamentRound[] => {
    const rounds: TournamentRound[] = [];
    const knockoutTeamCount = config.knockoutTeams;

    let progressingTeams = Array.from({ length: knockoutTeamCount }, (_, i) =>
        table.length ? table[i] : `Place ${i + 1}`,
    );

    let teamsInRound = progressingTeams.length;
    let roundNumber = 1;

    const ROUND_NAME = {
        16: "Round of 16",
        8: "Quarter Finals",
        4: "Semi Finals",
        2: "Final",
    };

    const startTime = new Date(lastGroupPhaseMatchDate);

    while (teamsInRound > 1) {
        const matches: Match[] = [];
        let court = 1;

        startTime.setMinutes(
            startTime.getMinutes() + config.matchDuration + config.knockoutBreakDuration,
        );

        for (let i = 0; i < teamsInRound / 2; i++) {
            const match: Match = {
                id: generateId(),
                court: court++,
                teams: [
                    {
                        link: {
                            placement: i,
                            type: roundNumber == 1 ? "league" : "winner",
                            fromRound: roundNumber - 2,
                        },
                        score: 0,
                    },
                    {
                        link: {
                            placement: progressingTeams.length - 1 - i,
                            type: roundNumber == 1 ? "league" : "winner",
                            fromRound: roundNumber - 2,
                        },
                        score: 0,
                    },
                ],
                date: new Date(startTime),
                status: "scheduled",
            };
            matches.push(match);
        }

        rounds.push({
            id: generateId(),
            name: (ROUND_NAME as Record<number, string>)[teamsInRound] || `Round ${roundNumber}`,
            matches,
        });

        teamsInRound /= 2;
        // progressingTeams = winner 1 vs winner -1, winner 2 vs winner -2
        progressingTeams = Array.from({ length: teamsInRound }, (_, i) => `Winner ${ALPHABET[i]}`);

        roundNumber++;
    }

    const finalRound = rounds.pop()!;

    startTime.setMinutes(
        startTime.getMinutes() + config.matchDuration + config.knockoutBreakDuration,
    );

    // Add the final match
    const finalMatch: Match = {
        id: generateId(),
        court: 1,
        teams: [
            {
                link: {
                    type: "loser",
                    placement: 0,
                },
                score: 0,
            },
            {
                link: {
                    type: "loser",
                    placement: 1,
                },
                score: 0,
            },
        ],
        date: finalRound.matches[0].date,
        status: "scheduled",
    };
    rounds.push({
        id: generateId(),
        name: "3rd Place Playoff",
        matches: [finalMatch],
    });
    rounds.push(finalRound);
    rounds[rounds.length - 1].matches[0].date = startTime;

    return rounds;
};

export const generateNTeams = (n: number): Team[] => {
    const teams: Team[] = [];
    for (let i = 1; i <= n; i++) {
        teams.push({
            id: generateId(),
            name: `Team ${i}`,
            players: [
                {
                    id: generateId(),
                    name: `Player ${i}A`,
                },
                {
                    id: generateId(),
                    name: `Player ${i}B`,
                },
            ],
        });
    }
    return teams;
};

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

export const randomiseGroupPhaseResults = (tournament: Tournament) => {
    // random number of rounds played
    const rounds = tournament.groupPhase;
    // const randomRounds = Math.floor(Math.random() * rounds.length) + 1;
    for (let i = 0; i < rounds.length; i++) {
        const round = rounds[i];
        for (const match of round.matches) {
            for (let j = 0; j < match.teams.length; j++) {
                const team = match.teams[j];
                team.score = Math.floor(Math.random() * 10);
            }
            match.status = "completed";
        }
    }
};

export const updateKnockoutMatches = (tournament: Tournament) => {
    const knockout = tournament.knockoutPhase;

    if (!knockout) return;

    // group phase completed?
    const groupPhase = tournament.groupPhase;
    if (!groupPhase) return;
    const groupPhaseCompleted = groupPhase.every((round) =>
        round.matches.every((match) => match.status === "completed"),
    );
    if (!groupPhaseCompleted) return;

    const table: StaticTeamRef[] = generateTable(tournament).map((x) => ({
        id: x.team.id,
    }));

    const roundWinners: StaticTeamRef[][] = [];
    const roundLosers: StaticTeamRef[][] = [];
    for (let i = 0; i < knockout.length; i++) {
        const round = knockout[i];
        const winners: StaticTeamRef[] = [];
        const losers: StaticTeamRef[] = [];
        roundWinners.push(winners);
        roundLosers.push(losers);

        // not all matches the same status
        const firstState = round.matches[0].status;
        if (round.matches.some((match) => match.status !== firstState)) return;

        const roundRefIndex = round.matches[0].teams[0].link?.fromRound ?? i - 1;
        const prevRoundWinners = i === 0 ? [] : roundWinners[roundRefIndex];
        const prevRoundLosers = i === 0 ? [] : roundLosers[roundRefIndex];

        for (const match of round.matches) {
            if (match.status === "completed") {
                const team1 = match.teams[0].ref!;
                const team2 = match.teams[1].ref!;

                if (match.teams[0].score > match.teams[1].score) {
                    winners.push(team1);
                    losers.push(team2);
                } else if (match.teams[0].score < match.teams[1].score) {
                    winners.push(team2);
                    losers.push(team1);
                }
            }

            if (match.status === "scheduled") {
                const team1 = match.teams[0].link!;
                const team2 = match.teams[1].link!;

                if (team1.type === "winner") {
                    match.teams[0] = {
                        ...match.teams[0],
                        ref: prevRoundWinners[team1.placement],
                    };
                } else if (team1.type === "loser") {
                    match.teams[0] = {
                        ...match.teams[0],
                        ref: prevRoundLosers[team1.placement],
                    };
                } else if (team1.type === "league") {
                    match.teams[0] = {
                        ...match.teams[0],
                        ref: table[team1.placement],
                    };
                }

                if (team2.type === "winner") {
                    match.teams[1] = {
                        ...match.teams[1],
                        ref: prevRoundWinners[team2.placement],
                    };
                } else if (team2.type === "loser") {
                    match.teams[1] = {
                        ...match.teams[1],
                        ref: prevRoundLosers[team2.placement],
                    };
                } else if (team2.type === "league") {
                    match.teams[1] = {
                        ...match.teams[1],
                        ref: table[team2.placement],
                    };
                }
            }
        }
    }
};
