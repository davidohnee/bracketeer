<script setup lang="ts">
import SettingsView from "@/views/SettingsView.vue";

definePage({
    redirect: "/settings/general/about",
});

const base = "/settings";
const structure = [
    {
        title: "General",
        children: [
            {
                title: "About",
                route: "/general/about",
            },
            {
                title: "Appearance",
                route: "/general/appearance",
            },
        ],
    },
    {
        title: "Share",
        children: [
            {
                title: "Accounts",
                route: "/share/accounts",
            },
        ],
    },
];
</script>

<template>
    <div class="body-container">
        <h1>Settings</h1>
        <SettingsView
            :navigation="structure"
            :base="base"
        />
    </div>
</template>
