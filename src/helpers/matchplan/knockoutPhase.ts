import type { Match, Ref, Tournament, TournamentRound } from "@/types/tournament";
import { getLastMatchOf } from "..";
import { generateId } from "../id";
import { ALPHABET } from "../common";
import { generateTables } from "../tables";

export const generateKnockoutBracket = (tournament: Tournament): TournamentRound[] => {
    const rounds: TournamentRound[] = [];
    const knockoutTeamCount = tournament.config.knockoutTeams;
    const lastGroupPhaseMatchDate = getLastMatchOf({
        matches: tournament.groupPhase,
    }).date;
    const roundDuration = tournament.config.matchDuration + tournament.config.knockoutBreakDuration;

    let progressingTeams = Array.from({ length: knockoutTeamCount }, (_, i) => `Place ${i + 1}`);

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

        startTime.setMinutes(startTime.getMinutes() + roundDuration);

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

export const updateKnockoutMatches = (tournament: Tournament) => {
    const knockout = tournament.knockoutPhase;

    if (!knockout) return;

    // group phase completed?
    const groupPhase = tournament.groupPhase;
    if (!groupPhase) return;
    const groupPhaseCompleted = groupPhase.every((match) => match.status === "completed");
    if (!groupPhaseCompleted) return;

    const table: Ref[] = generateTables(tournament)[0].teams.map((x) => ({
        id: x.team.id,
    }));

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
