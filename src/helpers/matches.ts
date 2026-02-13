import type { RichMatch, Tournament } from "@/types/tournament";
import { localeDateTimeString } from "./common";
import { getCourtName, getTeamName } from ".";

export const tournamentRichMatches = (tournament: Tournament): RichMatch[] => {
    const matches: RichMatch[] = [];

    for (const phase of tournament.phases) {
        if (phase.type === "group") {
            for (const match of phase.matches) {
                matches.push({
                    match,
                    roundName: match.round!.name,
                    phaseName: phase.name,
                    phaseId: phase.id,
                });
            }
        } else if (phase.type === "knockout") {
            for (const round of phase.rounds) {
                for (const match of round.matches) {
                    matches.push({
                        match,
                        roundName: round.name,
                        phaseName: phase.name,
                        phaseId: phase.id,
                    });
                }
            }
        }
    }

    // Sort matches by date
    matches.sort((a, b) => {
        const dateA = a.match.date.getTime();
        const dateB = b.match.date.getTime();
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return a.roundName.localeCompare(b.roundName);
    });
    return matches;
};

export const GROUP_OPTIONS = ["round", "time", "team", "court"] as const;
type GroupMatchesParams = {
    allMatches: RichMatch[];
    tournament: Tournament;
    selectedGroupOption: (typeof GROUP_OPTIONS)[number];
    teamFilter?: string;
    courtFilter?: number;
    groupFilter?: string;
};
const isMatchInGroupFilter = (match: RichMatch, tournament: Tournament, groupValue: string) => {
    const [phaseId, groupId] = groupValue.split(".") as [string, string];
    const phase = tournament.phases.find((p) => p.id === phaseId);
    if (phase?.type !== "group" || !phase.groups) {
        return true;
    }
    const group = phase.groups.find((g) => g.id === groupId);
    return match.match.teams.some((team) => group?.teams?.some((x) => x.id === team.ref?.id));
};

const isMatchIncluded = (
    match: RichMatch,
    tournament: Tournament,
    teamFilter?: string,
    courtFilter?: number,
    groupFilter?: string,
) => {
    if (teamFilter && !match.match.teams.some((team) => team.ref?.id === teamFilter)) {
        return false;
    }
    if (courtFilter && match.match.court !== courtFilter) {
        return false;
    }
    if (groupFilter && !isMatchInGroupFilter(match, tournament, groupFilter)) {
        return false;
    }
    return true;
};

const getGroupingKeys = (
    match: RichMatch,
    tournament: Tournament,
    selectedGroupOption: (typeof GROUP_OPTIONS)[number],
): (string | null)[] => {
    switch (selectedGroupOption) {
        case "round":
            return [`${match.phaseId}.${match.roundName}`];
        case "time":
            return [localeDateTimeString(match.match.date)];
        case "team":
            return [
                getTeamName(tournament, match.match.teams[0].ref?.id),
                getTeamName(tournament, match.match.teams[1].ref?.id),
            ];
        case "court":
            return [getCourtName(tournament.config.sport, match.match.court)];
        default:
            return [];
    }
};

const sortGroupedMatches = (
    groups: Record<string, RichMatch[]>,
    selectedGroupOption: (typeof GROUP_OPTIONS)[number],
) => {
    if (!["team", "court"].includes(selectedGroupOption)) {
        return groups;
    }
    return Object.fromEntries(
        Object.entries(groups).sort((a, b) =>
            a[0].localeCompare(b[0], undefined, { numeric: true }),
        ),
    );
};
export const groupMatches = ({
    allMatches,
    selectedGroupOption,
    teamFilter,
    courtFilter,
    groupFilter,
    tournament,
}: GroupMatchesParams) => {
    // Group matches by the selected option
    const groupedMatches: Record<string, RichMatch[]> = {};

    for (const match of allMatches) {
        if (!isMatchIncluded(match, tournament, teamFilter, courtFilter, groupFilter)) {
            continue;
        }

        for (const key of getGroupingKeys(match, tournament, selectedGroupOption)) {
            if (!key) continue;
            groupedMatches[key] ??= [];
            groupedMatches[key].push(match);
        }
    }

    return sortGroupedMatches(groupedMatches, selectedGroupOption);
};
