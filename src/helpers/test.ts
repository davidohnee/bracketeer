import type { Tournament } from "@/types/tournament";

export const generateTestTournament = (teamCount: number): Tournament => {
    const teams = Array.from({ length: teamCount }, (_, i) => ({
        id: `team-${i + 1}`,
        name: `Team ${i + 1}`,
    }));

    return {
        id: "test-tournament",
        version: 3,
        name: "Test Tournament",
        teams,
        phases: [],
        config: {
            courts: 2,
            matchDuration: 30,
            breakDuration: 5,
            knockoutBreakDuration: 10,
            startTime: new Date(),
            sport: "test",
        },
    };
};

export const inNHours = (n: number) => {
    const date = new Date();
    date.setHours(date.getHours() + n);
    return date;
};
