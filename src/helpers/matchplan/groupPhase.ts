import type { Match, Ref, Tournament, TournamentRound } from "@/types/tournament";
import { generateId } from "../id";
import { chunks } from "../common";
import { earliestFreeSlot } from "./common";
import { roundRobin } from "../roundRobin";

const createBalanceRound = (allMatches: Match[], tournament: Tournament): Match[] | null => {
    const rounds = [...new Set(allMatches.map((match) => match.round!.id))];
    const teamsMissing = rounds.flatMap((round) =>
        tournament.teams.filter(
            (t) =>
                !allMatches
                    .filter((match) => match.round!.id === round)
                    .some((match) => match.teams.some((team) => team.ref?.id === t.id)),
        ),
    );

    if (teamsMissing.length === 0) {
        return null;
    }

    const round: TournamentRound = {
        id: generateId(),
        name: `Balance Round`,
        matches: [],
    };

    for (const matchup of chunks(teamsMissing, 2)) {
        const team1 = matchup[0];
        const team2 = matchup[1];

        const { time, court } = earliestFreeSlot(
            [...allMatches, ...round.matches],
            tournament.config.startTime,
            tournament.config.matchDuration + tournament.config.breakDuration,
            [team1, team2],
            tournament.config.courts,
        );

        const match: Match = {
            id: generateId(),
            court,
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
            date: time,
            status: "scheduled",
            round: {
                id: round.id,
                name: round.name,
            },
        };
        round.matches.push(match);
    }

    return round.matches;
};

export const generateGroupPhase = (tournament: Tournament): Match[] => {
    const scheduledMatches: Match[] = [];
    const shuffledTeams = tournament.teams.sort(() => Math.random() - 0.5);

    const roundDuration = tournament.config.matchDuration + tournament.config.breakDuration;

    const draw = roundRobin(shuffledTeams);

    for (let i = 0; i < tournament.config.rounds; i++) {
        const matchI = i % draw.length;
        const matchPairs = draw[matchI];
        const roundId = generateId();

        for (let j = 0; j < matchPairs.length; j++) {
            const team1 = matchPairs[j][0];
            const team2 = matchPairs[j][1];

            const slot = earliestFreeSlot(
                scheduledMatches,
                tournament.config.startTime,
                roundDuration,
                [team1!, team2!],
                tournament.config.courts,
            );
            const { time, court } = slot;

            const matchObj: Match = {
                id: generateId(),
                court,
                teams: [
                    {
                        ref: team1 as Ref,
                        score: 0,
                    },
                    {
                        ref: team2 as Ref,
                        score: 0,
                    },
                ],
                date: time,
                status: "scheduled",
                round: {
                    id: roundId,
                    name: `Round ${i + 1}`,
                },
            };
            scheduledMatches.push(matchObj);
        }
    }

    const balanceRound = createBalanceRound(scheduledMatches, tournament);
    if (balanceRound) {
        scheduledMatches.push(...balanceRound);
    }

    return scheduledMatches;
};
