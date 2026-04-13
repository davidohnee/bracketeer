<script setup lang="ts">
import type { Tournament } from "@/types/tournament";
import SettingsView from "@/views/SettingsView.vue";

definePage({
    redirect: (from) => ({
        name: "/tournament/[tournamentId]/config/plan",
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
                route: "/plan",
            },
            {
                title: "Teams",
                route: "/teams",
            },
            {
                title: "Danger Zone",
                route: "/danger",
            },
        ],
    },
    {
        title: "Share",
        children: [
            {
                title: "GitHub Gists",
                route: "/gists",
            },
        ],
    },
    {
        title: "Advanced",
        children: [
            {
                title: "Edit as JSON",
                route: "/edit",
            },
            {
                title: "Debug",
                route: "/debug",
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
        >
            <template #content>
                <RouterView :tournament="tournament" />
            </template>
        </SettingsView>
    </div>
</template>

<style scoped>
.config {
    padding: 1em;
    width: calc(100% - 2em);
}
</style>
