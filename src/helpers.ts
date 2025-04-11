import type {
    Match,
    Team,
    TeamScore,
    TournamentConfig,
    TournamentRound,
} from "./types/tournament";

export const generateId = () => {
    return Math.random().toString(36).substring(2, 15);
};

export const generateTable = (matches: Match[]): TeamScore[] => {
    const teams: { [key: string]: TeamScore } = {};

    matches.forEach((match) => {
        const team1Id = match.team1.id!;
        const team2Id = match.team2.id!;

        if (!teams[team1Id]) {
            teams[team1Id] = {
                team: match.team1,
                wins: 0,
                losses: 0,
                draws: 0,
                points: { for: 0, against: 0 },
            };
        }

        if (!teams[team2Id]) {
            teams[team2Id] = {
                team: match.team2,
                wins: 0,
                losses: 0,
                draws: 0,
                points: { for: 0, against: 0 },
            };
        }

        teams[team1Id].points.for += match.score1;
        teams[team1Id].points.against += match.score2;

        teams[team2Id].points.for += match.score2;
        teams[team2Id].points.against += match.score1;

        if (match.status == "scheduled") return;

        if (match.score1 > match.score2) {
            teams[team1Id].wins++;
            teams[team2Id].losses++;
        } else if (match.score1 < match.score2) {
            teams[team2Id].wins++;
            teams[team1Id].losses++;
        } else {
            teams[team1Id].draws++;
            teams[team2Id].draws++;
        }
    });

    const teamScores = Object.values(teams);
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
        return a.team.name.localeCompare(b.team.name);
    });
    return teamScores;
};

export const getCourtName = (courtNumber: number): string =>
    `Court ${courtNumber}`;

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const rotate = <T>(n: number, xs: T[]) => [
    ...xs.slice(xs.length - (n % xs.length)),
    ...xs.slice(0, xs.length - (n % xs.length)),
];

const BYE = Symbol();

const roundRobin = <T>(teams: T[], rest = teams.slice(0, -1)) =>
    rest
        .map((_, i) => rotate(i + 1, fold([...rotate(i, rest), teams.at(-1)])))
        .map((b) => b.filter(([a, b]) => a !== BYE && b !== BYE))
        .map((b, i) => (i % 2 == 0 ? b : b.map(([a, b]) => [b, a])));

const fold = <T>(xs: T[]) =>
    xs
        .slice(0, Math.ceil(xs.length / 2))
        .map((x, i) => [x, xs[xs.length - i - 1]]);

export const generateGroupPhase = (
    teams: Team[],
    config: TournamentConfig
): TournamentRound[] => {
    const rounds: TournamentRound[] = [];
    const shuffledTeams = teams.sort(() => Math.random() - 0.5);

    let courtIndex = 1;
    let roundStartTime = new Date(config.startTime);
    const roundDuration = config.matchDuration + config.breakDuration;

    const matches = roundRobin(shuffledTeams);

    for (let i = 0; i < config.rounds; i++) {
        const matchI = i % matches.length;
        const matchPairs = matches[matchI];

        const match: Match[] = [];
        for (let j = 0; j < matchPairs.length; j++) {
            const team1 = matchPairs[j][0];
            const team2 = matchPairs[j][1];
            const matchObj: Match = {
                id: generateId(),
                court: getCourtName(courtIndex),
                team1: team1 as Team,
                team2: team2 as Team,
                score1: 0,
                score2: 0,
                date: new Date(roundStartTime),
                status: "scheduled",
            };
            match.push(matchObj);
            courtIndex++;
            if (courtIndex > config.courts) {
                courtIndex = 1;
                roundStartTime.setMinutes(
                    roundStartTime.getMinutes() + roundDuration
                );
            }
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
    previousRounds: TournamentRound[] | null = null
): Match[] => {
    if (!previousRounds) {
        previousRounds = [];
    }

    let choices = Array.from(
        { length: teams.length / 2 },
        (_, index) => index + teams.length / 2
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
                            (match.team1.id === team1.id &&
                                match.team2.id === team2!.id) ||
                            (match.team1.id === team2!.id &&
                                match.team2.id === team1.id)
                    )
                )
            ) {
                choices.splice(j, 1);
                break;
            }
            j = (j + 1) % choices.length;
        }

        const match: Match = {
            id: generateId(),
            court: "",
            team1: team1,
            team2: team2!,
            score1: 0,
            score2: 0,
            date: new Date(),
            status: "scheduled",
        };
        matches.push(match);
    }

    return matches;
};

export const getLastMatchOf = (rounds: TournamentRound[]): Match => {
    const matchComparator = (a: Match, b: Match) =>
        a.date.getTime() - b.date.getTime();

    const sorted = rounds
        .flatMap((round) => round.matches)
        .sort(matchComparator);
    const last = sorted[sorted.length - 1];
    return last;
};

export const generateKnockoutBracket = (
    config: TournamentConfig,
    lastGroupPhaseMatchDate: Date,
    table: TeamScore[] = []
): TournamentRound[] => {
    const rounds: TournamentRound[] = [];
    const knockoutTeamCount = config.knockoutTeams;

    let progressingTeams = Array.from({ length: knockoutTeamCount }, (_, i) =>
        table.length ? table[i] : `Place ${i + 1}`
    );

    let teamsInRound = progressingTeams.length;
    let roundNumber = 1;

    const ROUND_NAME = {
        16: "Round of 16",
        8: "Quarter Finals",
        4: "Semi Finals",
        2: "Final",
    };

    let startTime = new Date(lastGroupPhaseMatchDate);

    while (teamsInRound > 1) {
        const matches: Match[] = [];
        let court = 1;

        startTime.setMinutes(
            startTime.getMinutes() +
                config.matchDuration +
                config.knockoutBreakDuration
        );

        for (let i = 0; i < teamsInRound / 2; i++) {
            const team1 = progressingTeams[i];
            const team2 = progressingTeams[progressingTeams.length - 1 - i];

            const match: Match = {
                id: generateId(),
                court: getCourtName(court++),
                team1: {
                    name: (team1 as TeamScore).team?.name || (team1 as string),
                },
                team2: {
                    name: (team2 as TeamScore).team?.name || (team2 as string),
                },
                score1: 0,
                score2: 0,
                date: new Date(startTime),
                status: "scheduled",
            };
            matches.push(match);
        }

        rounds.push({
            id: generateId(),
            name: (ROUND_NAME as any)[teamsInRound] || `Round ${roundNumber}`,
            matches,
        });

        teamsInRound /= 2;
        // progressingTeams = winner 1 vs winner -1, winner 2 vs winner -2
        progressingTeams = Array.from(
            { length: teamsInRound },
            (_, i) => `Winner ${ALPHABET[i]}`
        );
        roundNumber++;
    }

    let finalRound = rounds.pop()!;

    startTime.setMinutes(
        startTime.getMinutes() +
            config.matchDuration +
            config.knockoutBreakDuration
    );

    // Add the final match
    const finalMatch: Match = {
        id: generateId(),
        court: getCourtName(1),
        team1: { name: "Loser A" },
        team2: { name: "Loser B" },
        score1: 0,
        score2: 0,
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

export const generateRandomGroupPhaseResults = (
    rounds: TournamentRound[]
): Match[] => {
    // random number of rounds played
    const randomRounds = Math.floor(Math.random() * rounds.length) + 1;
    const matches: Match[] = [];
    for (let i = 0; i < rounds.length; i++) {
        const round = rounds[i];
        for (const match of round.matches) {
            const score1 = Math.floor(Math.random() * 10);
            const score2 = Math.floor(Math.random() * 10);
            matches.push({ ...match, score1, score2, status: "completed" });
        }
    }
    return matches;
};
