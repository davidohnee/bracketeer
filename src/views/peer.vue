<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import Peer from "peerjs";
import type { Tournament } from "@/types/tournament";
import TournamentLayout from "@/layouts/TournamentLayout.vue";
import { useRoute } from "vue-router";

const route = useRoute();
const peer = new Peer();
const peerId = computed(() => ("id" in route.params ? (route.params.id as string) : ""));

const tournament = ref<Tournament>();

type Change = {
    type: "CREATE" | "REMOVE" | "CHANGE";
    path: string[];
    value?: unknown;
};

const connectToPeer = () => {
    const conn = peer.connect(peerId.value);
    conn.on("open", () => {
        console.log("Connection opened with peer:", peerId.value);
        conn.send("I'm a client!");

        conn.on("data", (data) => {
            const message = data as { type: "full" | "diff"; data: unknown };
            if (message.type == "full") {
                tournament.value = message.data as Tournament;
                console.log("Received full tournament data:", tournament.value);
            } else if (message.type == "diff") {
                for (const change of message.data as Change[]) {
                    if (change.type === "REMOVE") {
                        let target = tournament.value as unknown as Record<string, unknown>;
                        for (let i = 0; i < change.path.length - 1; i++) {
                            target = target[change.path[i]] as Record<string, unknown>;
                        }
                        delete target[change.path[change.path.length - 1]];
                    } else if (change.type === "CREATE" || change.type === "CHANGE") {
                        let target = tournament.value as unknown as Record<string, unknown>;
                        for (let i = 0; i < change.path.length - 1; i++) {
                            if (!target[change.path[i]]) {
                                target[change.path[i]] = {};
                            }
                            target = target[change.path[i]] as Record<string, unknown>;
                        }
                        target[change.path[change.path.length - 1]] = change.value;
                    }
                }
            }
        });
    });

    conn.on("error", (err) => {
        console.error("Connection error:", err);

        reconnect();
    });

    conn.on("close", () => {
        console.warn("Connection closed with peer:", peerId.value);

        reconnect();
    });
};

const reconnect = () => {
    setTimeout(() => {
        console.log("Attempting to reconnect...");
        connectToPeer();
    }, 1000);
};

onMounted(() => {
    peer.on("open", () => {
        connectToPeer();
    });
});
</script>
<template>
    <TournamentLayout
        v-if="tournament"
        class="tournament"
        v-model="tournament"
        :tabs="['table', 'knockout', 'matches', 'live', 'about']"
        readonly
    />
</template>
