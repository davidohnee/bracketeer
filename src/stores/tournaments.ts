import { defineStore } from "pinia";
import type { Tournament, TournamentConfig } from "../types/tournament";
import { ref, watch } from "vue";
import {
    generateGroupPhase,
    generateKnockoutBracket,
    getLastMatchOf,
} from "../helpers";

// You can name the return value of `defineStore()` anything you want,
// but it's best to use the name of the store and surround it with `use`
// and `Store` (e.g. `useUserStore`, `useCartStore`, `useProductStore`)
// the first argument is a unique id of the store across your application
export const useTournamentsStore = defineStore("tournaments", () => {
    const tournaments = ref<Tournament[]>([]);

    watch(
        tournaments,
        (newTournaments) => {
            // Save to local storage whenever tournaments change
            localStorage.setItem("tournaments", JSON.stringify(newTournaments));
        },
        { deep: true }
    );
    // Load tournaments from local storage on initial load
    const storedTournaments = localStorage.getItem("tournaments");
    if (storedTournaments) {
        tournaments.value = JSON.parse(storedTournaments).map(
            (tournament: Tournament) => ({
                ...tournament,
                groupPhase: tournament.groupPhase.map((round) => ({
                    ...round,
                    matches: round.matches.map((match) => ({
                        ...match,
                        date: new Date(match.date),
                    })),
                })),
                knockoutPhase: tournament.knockoutPhase.map((round) => ({
                    ...round,
                    matches: round.matches.map((match) => ({
                        ...match,
                        date: new Date(match.date),
                    })),
                })),
            })
        );
    }

    function add(tournament: Tournament) {
        tournaments.value.push(tournament);
    }

    function remove(tournamentId: string) {
        tournaments.value = tournaments.value.filter(
            (t) => t.id !== tournamentId
        );
    }

    function update(updatedTournament: Tournament) {
        const index = tournaments.value.findIndex(
            (t) => t.id === updatedTournament.id
        );
        if (index !== -1) {
            tournaments.value[index] = updatedTournament;
        }
    }

    function create(teamCount: number, config: TournamentConfig) {
        const teams = Array.from({ length: teamCount }, (_, i) => ({
            id: crypto.randomUUID(),
            name: `Team ${i + 1}`,
        }));
        const groupPhase = generateGroupPhase(teams, config);

        const tournament: Tournament = {
            id: crypto.randomUUID(),
            name: `Tournament ${tournaments.value.length + 1}`,
            teams: teams,
            groupPhase: groupPhase,
            knockoutPhase: generateKnockoutBracket(
                config,
                getLastMatchOf(groupPhase).date
            ),
            config,
        };
        add(tournament);
    }

    return {
        all: tournaments,
        create,
        add,
        remove,
        update,
    };
});
