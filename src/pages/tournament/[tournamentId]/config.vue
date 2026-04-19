<script setup lang="ts">
import type { Tournament } from "@/types/tournament";
import SettingsView from "@/views/SettingsView.vue";

definePage({
    redirect: (from) => ({
        name: "/tournament/[tournamentId]/config/edit/plan",
        params: {
            // @ts-expect-error missing typing
            tournamentId: from.params.tournamentId,
        },
    }),
});

const base = "/tournament/[tournamentId]/config";
const structure = [
    {
        title: "Edit",
        children: [
            {
                title: "Match Plan",
                route: "/edit/plan",
            },
            {
                title: "Teams",
                route: "/edit/teams",
            },
            {
                title: "Danger Zone",
                route: "/edit/danger",
            },
        ],
    },
    {
        title: "Share",
        children: [
            {
                title: "GitHub Gists",
                route: "/share/gists",
            },
        ],
    },
    {
        title: "Advanced",
        children: [
            {
                title: "Edit as JSON",
                route: "/advanced/edit",
            },
            {
                title: "Debug",
                route: "/advanced/debug",
            },
        ],
    },
];

defineProps<{
    tournament: Tournament;
}>();
</script>

<template>
    <div class="config">
        <SettingsView
            :navigation="structure"
            :base="base"
            on="surface"
            layout="compact"
        >
            <template #content>
                <RouterView :tournament="tournament" />
            </template>
        </SettingsView>
    </div>
</template>

<style scoped>
.config {
    padding: var(--spacing-m);
    width: calc(100% - var(--spacing-gutter));
}
</style>
