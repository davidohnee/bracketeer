<script lang="ts" setup>
import { computed } from "vue";
import IconContextMenu from "../IconContextMenu.vue";
import type { Tournament } from "@/types/tournament";

const props = defineProps<{
    tournament: Tournament;
    teamFilter: string | undefined;
}>();

const emit = defineEmits<{
    (e: "update:teamFilter", teamId: string | undefined): void;
}>();

const teamFilter = computed({
    get() {
        return props.teamFilter;
    },
    set(value) {
        emit("update:teamFilter", value);
    },
});
</script>
<template>
    <IconContextMenu alignment="right">
        <template #activator>
            <div class="icon">
                <ion-icon name="filter"></ion-icon>
            </div>
        </template>
        <template v-slot:context-menu>
            <div class="filter-menu">
                <div class="team-list">
                    <label for="team-filter">Filter by team</label>
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
    padding: 2em;
}
</style>
