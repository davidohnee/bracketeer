import { defineStore } from "pinia";
import type { IRemote, Tournament, TournamentConfig } from "../types/tournament";
import { ref, watch } from "vue";
import { tournamentFromJson } from "@/helpers";

import { pull, push } from "@/share";
import { Notifications } from "@/components/notifications/createNotification";
import { generateKnockoutBrackets } from "@/helpers/matchplan/knockoutPhase";
import { generateGroupPhases } from "@/helpers/matchplan/groupPhase";
import { generateNTeams } from "@/helpers/teamGenerator";
import { throttle } from "lodash";

// You can name the return value of `defineStore()` anything you want,
// but it's best to use the name of the store and surround it with `use`
// and `Store` (e.g. `useUserStore`, `useCartStore`, `useProductStore`)
// the first argument is a unique id of the store across your application
export const useTournamentsStore = defineStore("tournaments", () => {
    const tournaments = ref<Tournament[]>([]);

    const syncToLocalStorage = throttle(() => {
        localStorage.setItem("tournaments", JSON.stringify(tournaments.value));
    }, 300);

    watch(tournaments, syncToLocalStorage, { deep: true });
    // Load tournaments from local storage on initial load
    const storedTournaments = localStorage.getItem("tournaments");
    if (storedTournaments) {
        tournaments.value = JSON.parse(storedTournaments).map(tournamentFromJson);
    }

    function add(tournament: Tournament) {
        tournaments.value.push(tournament);
    }

    function remove(tournamentId: string) {
        tournaments.value = tournaments.value.filter((t) => t.id !== tournamentId);
    }

    function update(updatedTournament: Tournament) {
        const index = tournaments.value.findIndex((t) => t.id === updatedTournament.id);
        if (index !== -1) {
            tournaments.value[index] = updatedTournament;
        }
    }

    function create(teamCount: number, config: TournamentConfig) {
        const teams = generateNTeams(teamCount);
        const tournament: Tournament = {
            version: 3,
            id: crypto.randomUUID(),
            name: `Tournament ${tournaments.value.length + 1}`,
            teams: teams,
            phases: [
                {
                    id: crypto.randomUUID(),
                    type: "group",
                    name: "Group Stage",
                    matches: [],
                    rounds: 3,
                },
                {
                    id: crypto.randomUUID(),
                    type: "knockout",
                    name: "Knockout Stage",
                    rounds: [],
                },
            ],
            config,
        };
        tournament.phases = generateGroupPhases(tournament);
        tournament.phases = generateKnockoutBrackets(tournament);

        add(tournament);
    }

    function deleteTournament(tournamentId: string) {
        tournaments.value = tournaments.value.filter((t) => t.id !== tournamentId);
    }

    const getTournamentById = (id: string) => {
        return tournaments.value.find((t) => t.id === id);
    };

    const share = async (tournament: Tournament, asPublic: boolean = false) => {
        if (!tournament.remote) return;

        const result = await push(tournament, asPublic);
        if (result.tournament) {
            getTournamentById(tournament.id)!.remote = result.tournament.remote;
        } else if (result.error) {
            console.error("Error sharing tournament:", result.error);
            Notifications.addError(
                "Sharing failed",
                "There was an error sharing the tournament. Please try again.",
                5000,
            );
            return;
        }

        Notifications.addSuccess(
            "Tournament shared",
            "The tournament has been shared successfully.",
            5000,
            () => {
                window.open(result.link, "_blank");
            },
            result.link,
        );

        return result.link;
    };

    const download = (tournament: Tournament) => {
        const element = document.createElement("a");
        const file = new Blob([JSON.stringify(tournament, null, 4)], {
            type: "application/json",
        });
        element.href = URL.createObjectURL(file);
        element.download = `${tournament.name}.bracketeer.json`;
        element.click();
    };

    const uploadTournaments = () => {
        return new Promise<Tournament[]>((resolve, reject) => {
            const element = document.createElement("input");
            element.type = "file";
            element.accept = "application/json";
            element.multiple = true;
            element.onchange = async () => {
                if (!element.files) {
                    reject(new Error("No file selected"));
                    return;
                }

                const promises = [] as Promise<Tournament>[];
                for (const file of Array.from(element.files)) {
                    promises.push(
                        new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => {
                                const result = reader.result as string;
                                try {
                                    const tournament = tournamentFromJson(JSON.parse(result));
                                    resolve(tournament);
                                } catch (error) {
                                    reject(error);
                                }
                            };
                            reader.readAsText(file);
                        }),
                    );
                }

                resolve(await Promise.all(promises));
            };
            element.click();
        });
    };

    const addFromUpload = async () => {
        const tournaments = await uploadTournaments();
        tournaments.map((x) => add(x));
    };

    const pullFromRemote = async (options: { tournament?: Tournament; remote?: IRemote }) => {
        const { tournament, remote } = options;

        const pullSource = remote?.identifier ?? tournament?.remote?.[0]?.identifier;

        if (!pullSource) {
            throw new Error("No remote source");
        }

        const newTournament = await pull(pullSource);
        if (newTournament.error) {
            throw new Error(newTournament.error);
        }

        if (tournament) {
            tournament.name = newTournament.tournament.name;
            tournament.config = newTournament.tournament.config;
            tournament.phases = newTournament.tournament.phases;
            return tournament;
        }
    };

    return {
        all: tournaments,
        create,
        add,
        remove,
        update,
        deleteTournament,
        getTournamentById,
        share,
        download,
        addFromUpload,
        pull: pullFromRemote,
    };
});
