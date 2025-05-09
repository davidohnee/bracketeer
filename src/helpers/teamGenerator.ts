import type { Team } from "@/types/tournament";
import { generateId } from "./id";

export const generateNTeams = (n: number): Team[] => {
    const teams: Team[] = [];
    for (let i = 1; i <= n; i++) {
        teams.push({
            id: generateId(),
            name: `Team ${i}`,
            players: [],
        });
    }
    return teams;
};
