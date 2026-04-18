import { defineStore } from "pinia";
import type { Tournament, TournamentConfig } from "../types/tournament";
import { computed, ref, watch } from "vue";
import { tournamentFromJson } from "@/helpers";
import { generateKnockoutBrackets } from "@/helpers/matchplan/knockoutPhase";
import { generateGroupPhases } from "@/helpers/matchplan/groupPhase";
import { generateNTeams } from "@/helpers/teamGenerator";
import { throttle } from "lodash";

const LOCAL_STORAGE_KEY = "tournaments";

export const useTournamentsStore = defineStore(LOCAL_STORAGE_KEY, () => {
    const tournaments = ref<Tournament[]>([]);

    const throttlingEnabled = ref(true);
    const _syncToLocalStorage = () =>
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tournaments.value));
    const _throttledSyncToLocalStorage = throttle(() => {
        _syncToLocalStorage();
    }, 300);
    const syncToLocalStorage = computed(() => {
        if (!throttlingEnabled.value) {
            return _syncToLocalStorage;
        }
        return _throttledSyncToLocalStorage;
    });

    watch(tournaments, () => syncToLocalStorage.value(), { deep: true });
    // Load tournaments from local storage on initial load
    const storedTournaments = localStorage.getItem(LOCAL_STORAGE_KEY);
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
            tournaments.value[index].config = updatedTournament.config;
            tournaments.value[index].name = updatedTournament.name;
            tournaments.value[index].phases = updatedTournament.phases;
            tournaments.value[index].remote = updatedTournament.remote;
            tournaments.value[index].teams = updatedTournament.teams;
            tournaments.value[index].version = updatedTournament.version;
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
        const parseTournament = (raw: string) => {
            try {
                const tournament = tournamentFromJson(JSON.parse(raw));
                return tournament;
            } catch (error) {
                throw new Error(`Error parsing file ${error}`);
            }
        };

        const onUpload = async (files: FileList | null) => {
            if (!files) {
                throw new Error("No file selected");
            }

            const promises = [] as Promise<Tournament>[];
            for (const file of Array.from(files)) {
                promises.push(file.text().then(parseTournament));
            }

            return await Promise.all(promises);
        };

        return new Promise<Tournament[]>((resolve, reject) => {
            const element = document.createElement("input");
            element.type = "file";
            element.accept = "application/json";
            element.multiple = true;
            element.onchange = () => onUpload(element.files).then(resolve).catch(reject);
            element.click();
        });
    };

    const addFromUpload = async () => {
        const tournaments = await uploadTournaments();
        tournaments.forEach((x) => add(x));
    };

    return {
        all: tournaments,
        create,
        add,
        remove,
        update,
        deleteTournament,
        getTournamentById,
        download,
        addFromUpload,
        disableThrottling: () => {
            console.warn("Disabling throttling for tournaments store");
            throttlingEnabled.value = false;
        },
        enableThrottling: () => {
            console.info("Enabling throttling for tournaments store");
            throttlingEnabled.value = true;
        },
    };
});
