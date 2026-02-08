<script lang="ts" setup>
import { computed, ref } from "vue";
import IconContextMenu from "../IconContextMenu.vue";
import type { IdentifiableString, Tournament } from "@/types/tournament";
import { getCourtType } from "@/helpers/defaults";

const props = defineProps<{
    tournament: Tournament;
    teamFilter: string | undefined;
    courtFilter: number | undefined;
    groupFilter: string | undefined;
}>();

const contextMenu = ref<typeof IconContextMenu>();

defineExpose({
    contextMenu,
});

const emit = defineEmits<{
    (e: "update:teamFilter", teamId: string | undefined): void;
    (e: "update:courtFilter", courtId: number | undefined): void;
    (e: "update:groupFilter", groupId: string | undefined): void;
}>();

const teamFilter = computed({
    get() {
        return props.teamFilter;
    },
    set(value) {
        emit("update:teamFilter", value);
    },
});
const courtFilter = computed({
    get() {
        return props.courtFilter;
    },
    set(value) {
        emit("update:courtFilter", value);
    },
});
const groupFilter = computed({
    get() {
        return props.groupFilter;
    },
    set(value) {
        emit("update:groupFilter", value);
    },
});

const allGroups = computed(() => {
    const groupsInPhases: {
        phase: string;
        groups: IdentifiableString[];
    }[] = [];
    for (const phase of props.tournament.phases) {
        if (phase.type === "group" && phase.groups) {
            groupsInPhases.push({
                phase: phase.id,
                groups: phase.groups.map((group) => ({
                    id: `${phase.id}.${group.id}`,
                    name: group.name,
                })),
            });
        }
    }
    // if only one phase with groups, return just the groups
    if (groupsInPhases.length === 1) {
        return groupsInPhases[0]!.groups;
    }
    // else add the phase name as prefix
    const all: IdentifiableString[] = [];
    for (const phase of groupsInPhases) {
        for (const group of phase.groups) {
            all.push({
                id: group.id,
                name: `${phase.phase} - ${group.name}`,
            });
        }
    }
    return all;
});
</script>
<template>
    <IconContextMenu
        alignment="right"
        ref="contextMenu"
    >
        <template #activator>
            <div class="icon">
                <ion-icon name="filter"></ion-icon>
            </div>
        </template>
        <template v-slot:context-menu>
            <div class="filter-menu">
                <div class="field">
                    <label
                        class="text-sm text-muted"
                        for="team-filter"
                    >
                        Filter by team
                    </label>
                    <select
                        v-model="teamFilter"
                        id="team-filter"
                        name="team-filter"
                    >
                        <option
                            :value="undefined"
                            selected
                        >
                            All teams
                        </option>
                        <hr />
                        <option
                            v-for="team in props.tournament.teams"
                            :key="team.id"
                            :value="team.id"
                        >
                            {{ team.name }}
                        </option>
                    </select>
                </div>
                <div class="field">
                    <label
                        class="text-sm text-muted"
                        for="court-filter"
                    >
                        Filter by {{ getCourtType(props.tournament.config.sport, false, false) }}
                    </label>
                    <select
                        v-model="courtFilter"
                        id="court-filter"
                        name="court-filter"
                    >
                        <option
                            :value="undefined"
                            selected
                        >
                            All {{ getCourtType(props.tournament.config.sport, true, false) }}
                        </option>
                        <hr />
                        <option
                            v-for="i in props.tournament.config.courts"
                            :key="i"
                            :value="i"
                        >
                            {{ getCourtType(props.tournament.config.sport, false, true) }} {{ i }}
                        </option>
                    </select>
                </div>
                <div
                    class="field"
                    v-if="allGroups.length > 0"
                >
                    <label
                        class="text-sm text-muted"
                        for="group-filter"
                    >
                        Filter by group
                    </label>
                    <select
                        v-model="groupFilter"
                        id="group-filter"
                        name="group-filter"
                    >
                        <option
                            :value="undefined"
                            selected
                        >
                            All groups
                        </option>
                        <hr />
                        <option
                            v-for="group in allGroups"
                            :key="group.id"
                            :value="group.id"
                        >
                            {{ group.name }}
                        </option>
                    </select>
                </div>
            </div>
        </template>
    </IconContextMenu>
</template>

<style scoped>
.icon {
    display: flex;
    align-items: center;
    justify-content: center;
}

.filter-menu {
    padding: 1em;
    display: flex;
    flex-direction: column;
    gap: 1em;
}

select {
    max-width: 25ch;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
}
</style>
