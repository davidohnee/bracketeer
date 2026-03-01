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
import { ALPHABET, nextPowerOfTwo, ROUND_NAME } from "../common";
import { allMatches, previousPhase, rankedTeams } from "../phase";

const getPlacement = (fromPhase: TournamentPhase, placement: number): string => {
    if (fromPhase.type === "group") {
        const groupCount = fromPhase.groups?.length || 0;

        if (groupCount > 0) {
            const groupRank = Math.floor(placement / groupCount);
            const inGroup = placement % groupCount;

            return ALPHABET[inGroup]! + (groupRank + 1);
        }

        return String(placement + 1);
    }

    return ALPHABET[placement]!;
};

export const hasByes = (nextPhase: KnockoutTournamentPhase, tournament: Tournament): boolean => {
    const knockoutTeamCount = nextPhase.teamCount ?? tournament.teams.length;
    const powerOfTwo = nextPowerOfTwo(knockoutTeamCount);

    return powerOfTwo !== knockoutTeamCount;
};

/**
 * determines, how many teams will progress in total; how many of them will have to play an additional play-in round and how many will get a bye in the first round
 * bye will be 0 if the number of teams is already a power of two, otherwise it will be the difference between the next power of two and the actual team count
 * play-in teams will be the number of teams that will have to play an additional play-in round; i.e. the difference between the actual team count and the next lower power of two, multiplied by 2 (since each match has two teams)
 * total teams will be the number of teams that will progress to the next phase
 */
export const getProgression = (
    nextPhase: KnockoutTournamentPhase,
    tournament: Tournament,
): { bye: number; playIn: number; total: number } => {
    const progressTeams = nextPhase.teamCount ?? tournament.teams.length;
    const powerOfTwo = nextPowerOfTwo(progressTeams);

    const byes = powerOfTwo - progressTeams;
    const playInTeams = (progressTeams - powerOfTwo / 2) * 2;

    return {
        bye: Math.max(byes, 0),
        playIn: Math.max(playInTeams, 0),
        total: Math.max(progressTeams, 0),
    };
};

export const generateKnockoutBracket = (
    phase: KnockoutTournamentPhase,
    tournament: Tournament,
): TournamentRound[] => {
    const rounds: TournamentRound[] = [];
    const knockoutTeamCount = phase.teamCount ?? tournament.teams.length;
    const roundDuration = tournament.config.matchDuration + tournament.config.knockoutBreakDuration;
    const previous = previousPhase(tournament, phase);
    const startTime = new Date(getPreviousPhaseEndDate(tournament, phase));

    const powerOfTwo = nextPowerOfTwo(knockoutTeamCount);
    const byes = powerOfTwo - knockoutTeamCount;
    const teamFromPhase = previous ?? phase;

    let roundNumber = 1;

    if (hasByes(phase, tournament)) {
        const playInMatchCount = knockoutTeamCount - powerOfTwo / 2;
        const playInTeamCount = playInMatchCount * 2;
        const playInSlots = buildLeagueSlots(byes, playInTeamCount);

        startTime.setMinutes(startTime.getMinutes() + roundDuration);

        rounds.push({
            id: generateId(),
            name: "Play-in",
            matches: createRoundMatches({
                teamFromPhase,
                slots: playInSlots,
                roundNumber,
                startTime,
                roundDuration,
                courts: tournament.config.courts,
            }),
        });

        roundNumber++;

        const mixedSlots = [...buildLeagueSlots(0, byes), ...buildWinnerSlots(playInMatchCount)];

        startTime.setMinutes(startTime.getMinutes() + roundDuration);

        rounds.push({
            id: generateId(),
            name: ROUND_NAME[powerOfTwo / 2] || `Round ${roundNumber}`,
            matches: createRoundMatches({
                teamFromPhase,
                slots: mixedSlots,
                roundNumber,
                startTime,
                roundDuration,
                courts: tournament.config.courts,
            }),
        });

        roundNumber++;

        let teamsInRound = powerOfTwo / 4;

        while (teamsInRound > 1) {
            startTime.setMinutes(startTime.getMinutes() + roundDuration);

            rounds.push({
                id: generateId(),
                name: ROUND_NAME[teamsInRound] || `Round ${roundNumber}`,
                matches: createRoundMatches({
                    teamFromPhase: phase,
                    slots: buildWinnerSlots(teamsInRound),
                    roundNumber,
                    startTime,
                    roundDuration,
                    courts: tournament.config.courts,
                }),
            });

            teamsInRound /= 2;
            roundNumber++;
        }
    } else {
        let teamsInRound = knockoutTeamCount;

        while (teamsInRound > 1) {
            const isFirstRound = teamsInRound === knockoutTeamCount;

            startTime.setMinutes(startTime.getMinutes() + roundDuration);

            rounds.push({
                id: generateId(),
                name: ROUND_NAME[teamsInRound] || `Round ${roundNumber}`,
                matches: createRoundMatches({
                    teamFromPhase: isFirstRound ? teamFromPhase : phase,
                    slots: isFirstRound
                        ? buildLeagueSlots(0, teamsInRound)
                        : buildWinnerSlots(teamsInRound),
                    roundNumber,
                    startTime,
                    roundDuration,
                    courts: tournament.config.courts,
                }),
            });

            teamsInRound /= 2;
            roundNumber++;
        }
    }

    return insertThirdPlacePlayoff(rounds, startTime, roundDuration);
};

const getPreviousPhaseEndDate = (tournament: Tournament, phase: TournamentPhase): Date => {
    const phaseI = tournament.phases.findIndex((p) => p.id === phase.id);

    if (phaseI > 0) {
        return (
            getLastMatchOf({
                phase: tournament.phases[phaseI - 1],
            })?.date ?? tournament.config.startTime
        );
    }

    return tournament.config.startTime;
};

type RoundMatchConfig = {
    teamFromPhase: TournamentPhase;
    slots: RoundSlot[];
    roundNumber: number;
    startTime: Date;
    roundDuration: number;
    courts: number;
};

const createRoundMatches = ({
    teamFromPhase,
    slots,
    roundNumber,
    startTime,
    roundDuration,
    courts,
}: RoundMatchConfig): Match[] => {
    const matches: Match[] = [];
    let court = 1;
    const pairCount = slots.length / 2;

    for (let i = 0; i < pairCount; i++) {
        if (court > courts) {
            court = 1;
            startTime.setMinutes(startTime.getMinutes() + roundDuration);
        }

        matches.push(
            createKnockoutMatch({
                teamFromPhase,
                slot: slots[i]!,
                oppositeSlot: slots[slots.length - 1 - i]!,
                roundNumber,
                court: court++,
                date: new Date(startTime),
            }),
        );
    }

    return matches;
};

type KnockoutMatchConfig = {
    teamFromPhase: TournamentPhase;
    slot: RoundSlot;
    oppositeSlot: RoundSlot;
    roundNumber: number;
    court: number;
    date: Date;
};

const createKnockoutMatch = ({
    teamFromPhase,
    slot,
    oppositeSlot,
    roundNumber,
    court,
    date,
}: KnockoutMatchConfig): Match => {
    return {
        id: generateId(),
        court,
        teams: [
            {
                link: buildRoundLink(teamFromPhase, slot, roundNumber),
                score: 0,
            },
            {
                link: buildRoundLink(teamFromPhase, oppositeSlot, roundNumber),
                score: 0,
            },
        ],
        date,
        status: "scheduled",
    };
};

type RoundSlot = {
    type: "league" | "winner";
    placement: number;
};

const buildLeagueSlots = (start: number, count: number): RoundSlot[] =>
    Array.from({ length: count }, (_, i) => ({
        type: "league",
        placement: start + i,
    }));

const buildWinnerSlots = (count: number): RoundSlot[] =>
    Array.from({ length: count }, (_, i) => ({
        type: "winner",
        placement: i,
    }));

const buildRoundLink = (teamFromPhase: TournamentPhase, slot: RoundSlot, roundNumber: number) => {
    const label =
        slot.type === "league"
            ? getPlacement(teamFromPhase, slot.placement)
            : ALPHABET[slot.placement]!;

    return {
        placement: slot.placement,
        label,
        type: slot.type,
        fromRound: slot.type === "winner" ? roundNumber - 2 : undefined,
    };
};

const insertThirdPlacePlayoff = (
    rounds: TournamentRound[],
    startTime: Date,
    roundDuration: number,
): TournamentRound[] => {
    // if there is no final round or there is only one round (i.e. two teams),
    // we don't need a third place playoff
    if (rounds.length <= 1) {
        return rounds;
    }

    const finalRound = rounds.pop()!;

    startTime.setMinutes(startTime.getMinutes() + roundDuration);

    const thirdPlaceMatch: Match = {
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
        date: finalRound.matches[0]!.date,
        status: "scheduled",
    };

    rounds.push(
        {
            id: generateId(),
            name: "3rd Place Playoff",
            matches: [thirdPlaceMatch],
        },
        finalRound,
    );

    rounds.at(-1)!.matches[0]!.date = startTime;

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

    const table = resolveInitialTable(tournament, phase);

    if (!table) return;

    const roundWinners: Ref[][] = [];
    const roundLosers: Ref[][] = [];

    for (let i = 0; i < knockout.length; i++) {
        const round = knockout[i]!;

        if (!roundHasUnifiedStatus(round)) return;

        const winners: Ref[] = [];
        const losers: Ref[] = [];
        roundWinners.push(winners);
        roundLosers.push(losers);

        const roundRefIndex = round.matches[0]!.teams[0].link?.fromRound ?? i - 1;
        const prevRoundWinners = i === 0 ? [] : roundWinners[roundRefIndex]!;
        const prevRoundLosers = i === 0 ? [] : roundLosers[roundRefIndex]!;

        for (const match of round.matches) {
            updateRoundResults(match, winners, losers);
            updateScheduledMatchTeams(match, table, prevRoundWinners, prevRoundLosers);
        }
    }
};

const resolveInitialTable = (
    tournament: Tournament,
    phase: KnockoutTournamentPhase,
): Ref[] | null => {
    const previous = previousPhase(tournament, phase);

    if (!previous) {
        return tournament.teams;
    }

    if (allMatches(previous).some((match) => match.status !== "completed")) {
        return null;
    }

    return rankedTeams(previous);
};

const roundHasUnifiedStatus = (round: TournamentRound): boolean => {
    const firstState = round.matches[0]!.status;

    return !round.matches.some((match) => match.status !== firstState);
};

const updateRoundResults = (match: Match, winners: Ref[], losers: Ref[]) => {
    if (match.status !== "completed") return;

    const team1 = match.teams[0].ref!;
    const team2 = match.teams[1].ref!;

    if (match.teams[0].score > match.teams[1].score) {
        winners.push(team1);
        losers.push(team2);
    } else if (match.teams[0].score < match.teams[1].score) {
        winners.push(team2);
        losers.push(team1);
    }
};

const updateScheduledMatchTeams = (
    match: Match,
    table: Ref[],
    prevRoundWinners: Ref[],
    prevRoundLosers: Ref[],
) => {
    if (match.status !== "scheduled") return;

    for (let i = 0; i < match.teams.length; i++) {
        const link = match.teams[i]!.link!;

        if (link.type === "winner") {
            match.teams[i] = {
                ...match.teams[i]!,
                ref: prevRoundWinners[link.placement],
            };
        } else if (link.type === "loser") {
            match.teams[i] = {
                ...match.teams[i]!,
                ref: prevRoundLosers[link.placement],
            };
        } else if (link.type === "league") {
            match.teams[i] = {
                ...match.teams[i]!,
                ref: table[link.placement],
            };
        }
    }
};
