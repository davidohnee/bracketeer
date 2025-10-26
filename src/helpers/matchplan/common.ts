import type { Match, Ref } from "@/types/tournament";

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
export const earliestFreeSlot = (
    scheduledMatches: Match[],
    earliestTime: Date,
    timeDelta: number,
    teams: Ref[],
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
                    (team.ref?.id === teams[0]!.id || team.ref?.id === teams[1]!.id) &&
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
