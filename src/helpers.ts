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

export const generateGroupPhase = (
    teams: Team[],
    config: TournamentConfig
): TournamentRound[] => {
    const rounds: TournamentRound[] = [];
    const totalRounds = config.rounds;

    let courtIndex = 1;
    let roundStartTime = new Date(config.startTime);
    const roundDuration = config.matchDuration + config.breakDuration;
    for (let i = 0; i < totalRounds; i++) {
        const matches = generateRound(teams, rounds);

        for (let j = 0; j < matches.length; j++) {
            matches[j].court = getCourtName(courtIndex);
            matches[j].date = new Date(roundStartTime);
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
            matches,
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

    const matches: Match[] = [];
    for (let i = 0; i < teams.length / 2; i++) {
        const team1 = teams[i];

        // random team 2, but not the same as team 1 and not same matchup in previous rounds
        let team2: Team;
        let j = i;
        do {
            j =
                Math.floor((Math.random() * teams.length) / 2) +
                teams.length / 2;
            team2 = teams[j];
        } while (
            matches.some((match) => match.team2.id === team2.id) ||
            previousRounds.some((round) =>
                round.matches.some(
                    (match) =>
                        (match.team1.id === team1.id &&
                            match.team2.id === team2.id) ||
                        (match.team1.id === team2.id &&
                            match.team2.id === team1.id)
                )
            )
        );

        const match: Match = {
            id: generateId(),
            court: "",
            team1: team1,
            team2: team2,
            score1: 0,
            score2: 0,
            date: new Date(),
            status: "scheduled",
        };
        matches.push(match);
    }

    return matches;
};

export const generateKnockoutBracket = (
    config: TournamentConfig
): TournamentRound[] => {
    const rounds: TournamentRound[] = [];
    const knockoutTeamCount = config.knockoutTeams;
    let progressingTeams = Array.from(
        { length: knockoutTeamCount },
        (_, i) => `Place ${i + 1}`
    );

    let teamsInRound = progressingTeams.length;
    let roundNumber = 1;

    const ROUND_NAME = {
        16: "Round of 16",
        8: "Quarter Finals",
        4: "Semi Finals",
        2: "Final",
    };

    while (teamsInRound > 1) {
        const matches: Match[] = [];
        let court = 1;

        for (let i = 0; i < teamsInRound / 2; i++) {
            const team1 = progressingTeams[i];
            const team2 = progressingTeams[progressingTeams.length - 1 - i];

            const match: Match = {
                id: generateId(),
                court: getCourtName(court++),
                team1: { name: team1 },
                team2: { name: team2 },
                score1: 0,
                score2: 0,
                date: new Date(),
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

    // Add the final match
    const finalMatch: Match = {
        id: generateId(),
        court: getCourtName(1),
        team1: { name: "Loser A" },
        team2: { name: "Loser B" },
        score1: 0,
        score2: 0,
        date: new Date(),
        status: "scheduled",
    };
    rounds.push({
        id: generateId(),
        name: "3rd Place Playoff",
        matches: [finalMatch],
    });
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
    for (let i = 0; i < randomRounds; i++) {
        const round = rounds[i];
        console.log(round.matches);
        for (const match of round.matches) {
            const score1 = Math.floor(Math.random() * 10);
            const score2 = Math.floor(Math.random() * 10);
            matches.push({ ...match, score1, score2, status: "completed" });
        }
    }
    return matches;
};
