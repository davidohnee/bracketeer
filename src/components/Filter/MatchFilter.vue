<script lang="ts" setup>
import { computed, ref } from "vue";
import IconContextMenu from "../IconContextMenu.vue";
import type { Tournament } from "@/types/tournament";

const props = defineProps<{
    tournament: Tournament;
    teamFilter: string | undefined;
}>();

const contextMenu = ref<typeof IconContextMenu>();

defineExpose({
    contextMenu,
});

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
    padding: 1em;
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
