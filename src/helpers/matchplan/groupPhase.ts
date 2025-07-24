import type {
    Group,
    GroupTournamentPhase,
    Match,
    Ref,
    Tournament,
    TournamentPhase,
    TournamentRound,
} from "@/types/tournament";
import { generateId } from "../id";
import { chunks, shuffle } from "../common";
import { earliestFreeSlot } from "./common";
import { roundRobin } from "../roundRobin";
import { rankedTeams } from "../phase";

const createBalanceRound = (
    allMatches: Match[],
    teams: Ref[],
    tournament: Tournament,
): Match[] | null => {
    const rounds = [...new Set(allMatches.map((match) => match.round!.id))];
    const teamsMissing = rounds.flatMap((round) =>
        teams.filter(
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

export const generateGroupPhases = (tournament: Tournament): TournamentPhase[] => {
    const phases: TournamentPhase[] = [];

    for (const phase of tournament.phases) {
        if (phase.type === "knockout") {
            phases.push(phase);
        } else if (phase.type === "group") {
            phases.push({
                ...phase,
                matches: generateGroupPhase(phase, tournament),
            });
        }
    }

    return phases;
};

const generateForGroup = (group: Group, rounds: number, tournament: Tournament): Match[] => {
    const shuffledTeams = shuffle(group.teams);
    const newMatches: Match[] = [];
    const draw = roundRobin(shuffledTeams);

    for (let i = 0; i < rounds; i++) {
        const matchI = i % draw.length;
        const matchPairs = draw[matchI];
        const roundId = generateId();

        for (let j = 0; j < matchPairs.length; j++) {
            const team1 = matchPairs[j][0];
            const team2 = matchPairs[j][1];

            const matchObj: Match = {
                id: generateId(),
                court: -1,
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
                date: new Date(0),
                status: "scheduled",
                round: {
                    id: roundId,
                    name: `Round ${i + 1}`,
                    index: i,
                },
            };
            newMatches.push(matchObj);
        }
    }

    const balanceRound = createBalanceRound(newMatches, group.teams, tournament);
    if (balanceRound) {
        newMatches.push(...balanceRound);
    }

    return newMatches;
};

export const generateGroupPhase = (
    phase: GroupTournamentPhase,
    tournament: Tournament,
): Match[] => {
    const phaseI = tournament.phases.findIndex((p) => p.id === phase.id);
    let table: Ref[] = tournament.teams;

    if (phaseI > 0) {
        table = rankedTeams(tournament.phases[phaseI - 1]);
    }

    const shuffledTeams = shuffle(table);

    const groups: Group[] = phase.groups ?? [
        {
            id: generateId(),
            name: "All Teams",
            teams: shuffledTeams,
        },
    ];

    const unscheduledMatches: Match[] = [];
    for (const group of groups) {
        unscheduledMatches.push(...generateForGroup(group, phase.rounds, tournament));
    }

    // schedule
    const roundDuration = tournament.config.matchDuration + tournament.config.breakDuration;
    const scheduledMatches: Match[] = [];

    for (let i = 0; i < phase.rounds; i++) {
        const matches = unscheduledMatches.filter((match) => match.round!.index === i);

        for (const match of matches) {
            const slot = earliestFreeSlot(
                scheduledMatches,
                tournament.config.startTime,
                roundDuration,
                match.teams.map((team) => team.ref!),
                tournament.config.courts,
            );

            if (slot) {
                match.date = slot.time;
                match.court = slot.court;
                scheduledMatches.push(match);
            }
        }
    }

    return scheduledMatches;
};
