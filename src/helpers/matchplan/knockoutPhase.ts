import type {
    KnockoutTournamentPhase,
    Match,
    Ref,
    Tournament,
    TournamentPhase,
    TournamentRound,
} from "@/types/tournament";
import { getLastMatchOf } from "..";
import { generateId } from "../id";
import { ALPHABET, ROUND_NAME } from "../common";
import { allMatches, previousPhase, rankedTeams } from "../phase";

const getPlacement = (fromPhase: TournamentPhase, placement: number): string => {
    if (fromPhase.type === "group") {
        const groupCount = fromPhase.groups?.length || 0;

        if (groupCount > 0) {
            const groupRank = Math.floor(placement / groupCount);
            const inGroup = placement % groupCount;

            return ALPHABET[inGroup] + (groupRank + 1);
        }

        return String(placement + 1);
    }

    return ALPHABET[placement];
};

export const generateKnockoutBracket = (
    phase: KnockoutTournamentPhase,
    tournament: Tournament,
): TournamentRound[] => {
    const rounds: TournamentRound[] = [];
    const knockoutTeamCount = phase.teamCount ?? tournament.teams.length;
    const phaseI = tournament.phases.findIndex((p) => p.id === phase.id);
    let lastGroupPhaseMatchDate = tournament.config.startTime;

    if (phaseI > 0) {
        lastGroupPhaseMatchDate = getLastMatchOf({
            phase: tournament.phases[phaseI - 1],
        })?.date;
    }

    const roundDuration = tournament.config.matchDuration + tournament.config.knockoutBreakDuration;

    let progressingTeams = Array.from({ length: knockoutTeamCount }, (_, i) => `Place ${i + 1}`);

    let teamsInRound = progressingTeams.length;
    let roundNumber = 1;

    const previous = previousPhase(tournament, phase);

    const startTime = new Date(lastGroupPhaseMatchDate);

    while (teamsInRound > 1) {
        const matches: Match[] = [];
        let court = 1;

        startTime.setMinutes(startTime.getMinutes() + roundDuration);

        for (let i = 0; i < teamsInRound / 2; i++) {
            const teamFromPhase = teamsInRound == knockoutTeamCount ? (previous ?? phase) : phase;

            const match: Match = {
                id: generateId(),
                court: court++,
                teams: [
                    {
                        link: {
                            placement: i,
                            label: getPlacement(teamFromPhase, i),
                            type: roundNumber == 1 ? "league" : "winner",
                            fromRound: roundNumber - 2,
                        },
                        score: 0,
                    },
                    {
                        link: {
                            placement: progressingTeams.length - 1 - i,
                            label: getPlacement(teamFromPhase, progressingTeams.length - 1 - i),
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
            name: ROUND_NAME[teamsInRound] || `Round ${roundNumber}`,
            matches,
        });

        teamsInRound /= 2;
        // progressingTeams = winner 1 vs winner -1, winner 2 vs winner -2
        progressingTeams = Array.from({ length: teamsInRound }, (_, i) => `Winner ${ALPHABET[i]}`);

        roundNumber++;
    }

    const finalRound = rounds.pop()!;

    startTime.setMinutes(startTime.getMinutes() + roundDuration);

    // Add the final match
    const finalMatch: Match = {
        id: generateId(),
        court: 1,
        teams: [
            {
                link: {
                    type: "loser",
                    placement: 0,
                    label: ALPHABET[0],
                },
                score: 0,
            },
            {
                link: {
                    type: "loser",
                    placement: 1,
                    label: ALPHABET[1],
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

export const generateKnockoutBrackets = (tournament: Tournament): TournamentPhase[] => {
    const phases: TournamentPhase[] = [];

    for (const phase of tournament.phases) {
        if (phase.type === "knockout") {
            const knockoutPhase: KnockoutTournamentPhase = {
                ...phase,
                rounds: generateKnockoutBracket(phase, tournament),
                teamCount: phase.teamCount ?? tournament.teams.length,
            };
            phases.push(knockoutPhase);
        } else if (phase.type === "group") {
            phases.push(phase);
        }
    }

    return phases;
};

export const updateKnockoutMatches = (tournament: Tournament) => {
    for (const phase of tournament.phases) {
        if (phase.type === "knockout") {
            updateKnockoutPhase(phase, tournament);
        }
    }
};

const updateKnockoutPhase = (phase: KnockoutTournamentPhase, tournament: Tournament) => {
    const knockout = phase.rounds;

    if (!knockout) return;

    let table: Ref[] = tournament.teams;

    const previous = previousPhase(tournament, phase);

    if (previous) {
        table = rankedTeams(previous);

        if (allMatches(previous).some((match) => match.status !== "completed")) {
            return;
        }
    }

    const roundWinners: Ref[][] = [];
    const roundLosers: Ref[][] = [];
    for (let i = 0; i < knockout.length; i++) {
        const round = knockout[i];
        const winners: Ref[] = [];
        const losers: Ref[] = [];
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
                for (let i = 0; i < match.teams.length; i++) {
                    const link = match.teams[i].link!;

                    if (link.type === "winner") {
                        match.teams[i] = {
                            ...match.teams[i],
                            ref: prevRoundWinners[link.placement],
                        };
                    } else if (link.type === "loser") {
                        match.teams[i] = {
                            ...match.teams[i],
                            ref: prevRoundLosers[link.placement],
                        };
                    } else if (link.type === "league") {
                        match.teams[i] = {
                            ...match.teams[i],
                            ref: table[link.placement],
                        };
                    }
                }
            }
        }
    }
};
