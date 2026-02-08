import type { DynamicTeamRef, Match, MatchStatus, Tournament } from "@/types/tournament";
import { toRaw } from "vue";

export const chunks = <T>(a: T[], size: number) =>
    Array.from(Array.from({ length: Math.ceil(a.length / size) }), (_, i) =>
        a.slice(i * size, i * size + size),
    );

export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const ROUND_NAME: Record<number, string> = {
    16: "Round of 16",
    8: "Quarter-finals",
    4: "Semi-finals",
    2: "Final",
};

export const deepCopy = <T>(item: T): T => structuredClone(toRaw(item));

export const agoString = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (seconds < 60) return "Just now";
    if (minutes == 1) return "1 minute ago";
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours == 1) return "1 hour ago";
    if (hours < 24) return `${hours} hours ago`;
    if (hours < 24 * 7) return `${Math.floor(hours / 24)} days ago`;

    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
};

export const shuffle = <T>(items: T[]): T[] => items.toSorted(() => Math.random() - 0.5);

export const getTournamentStatus = (tournament: Tournament): MatchStatus => {
    const allMatches = tournament.phases.flatMap((phase) => {
        if (phase.type === "group") {
            return phase.matches;
        }
        return phase.rounds.flatMap((round) => round.matches);
    });
    if (!allMatches.some((match) => match.status !== "completed")) {
        return "completed";
    }
    if (allMatches.some((match) => ["in-progress", "completed"].includes(match.status))) {
        return "in-progress";
    }
    return "scheduled";
};

export const capitalise = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Ceils a date to the next minute
 * @param date The date to ceil
 */
export const ceilToNextMinute = (date: Date) => {
    if (date.getSeconds() > 0) {
        date.setMinutes(date.getMinutes() + 1);
        date.setSeconds(0);
    }
    return date;
};

export const localeDateTimeString = (
    date: Date,
    hide: {
        today?: boolean;
        thisYear?: boolean;
    } = { today: true, thisYear: true },
): string => {
    // hide year if it's the current year
    const options: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
        day: "2-digit",
        year: "numeric",
    };
    if (hide.today && date.toDateString() === new Date().toDateString()) {
        options.month = undefined;
        options.day = undefined;
    }
    if (hide.thisYear && date.getFullYear() === new Date().getFullYear()) {
        options.year = undefined;
    }
    return date.toLocaleString(undefined, options);
};

export const formatPlacement = (placement: DynamicTeamRef) => {
    if (placement.type == "league") {
        if (placement.label == null) {
            return `Place ${placement.placement + 1}`;
        }

        return `Place ${placement.label}`;
    }
    const label = { winner: "Winner", loser: "Loser" };

    if (placement.label == null) {
        return `${label[placement.type]} ${ALPHABET[placement.placement]}`;
    }

    return `${label[placement.type]} ${placement.label}`;
};

export const formatCurrentMatchTime = (match: Match, tournament: Tournament): string => {
    const now = new Date();
    const start = match.date;

    if (!start) return "00:00";
    if (start.getTime() > now.getTime()) return "00:00";

    const diff = now.getTime() - start.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes > tournament.config.matchDuration) {
        return "FT";
    }

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};
