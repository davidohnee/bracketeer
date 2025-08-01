import type { RichMatch, Tournament } from "@/types/tournament";

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
