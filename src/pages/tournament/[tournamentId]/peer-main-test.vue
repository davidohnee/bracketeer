<script setup lang="ts">
import { onMounted, ref, toRaw, watch } from "vue";
import diff from "microdiff";
import type { Tournament } from "@/types/tournament";
import Peer, { type DataConnection } from "peerjs";
import { useTournamentsStore } from "@/stores/tournaments";
import { migrateTournament } from "@/helpers/migration";

const props = defineProps<{
    tournament: Tournament;
}>();

const peer = ref<Peer | null>(null);
const peerId = ref("");
const connections = ref<DataConnection[]>([]);

const onUpdate = (diff: unknown) => {
    console.log("Sending update to clients:", diff);
    connections.value.forEach((conn) => {
        if (conn.open) {
            conn.send({
                type: "diff",
                data: diff,
            });
        }
    });
};

onMounted(() => {
    peerId.value = sessionStorage.getItem("peerId") || "";

    if (peerId.value) {
        peer.value = new Peer(peerId.value);
    } else {
        peer.value = new Peer();
    }

    peer.value!.on("open", (id) => {
        console.log("Peer ID:", id);
        peerId.value = id;
        sessionStorage.setItem("peerId", id);
    });

    peer.value!.on("connection", (conn) => {
        conn.on("open", () => {
            connections.value.push(conn);
            conn.send({
                type: "full",
                data: toRaw(tournament),
            });
        });

        conn.on("close", () => {
            connections.value = connections.value.filter(
                (c) => c.connectionId !== conn.connectionId,
            );
        });
    });
});

const tournaments = useTournamentsStore();
const tournament = tournaments.getTournamentById(props.tournament.id)!;

const tournamentAsString = () => JSON.stringify(tournament, null, 4);

const editableTournament = ref(tournamentAsString());
const changed = ref(false);

watch(
    () => tournament.id,
    () => {
        editableTournament.value = tournamentAsString();
    },
);

const save = () => {
    try {
        const newTournament = migrateTournament(JSON.parse(editableTournament.value));
        const difference = diff(tournament, newTournament);
        onUpdate(difference);
        Object.assign(tournament, newTournament);
        changed.value = false;
    } catch (error) {
        console.error("Invalid format:", error);
    }
};
</script>
<template>
    <div class="peer-test">
        <h1>Peer MAIN</h1>
        <p>Your Peer ID: {{ peerId }}</p>
        <button @click="onUpdate">Send Update to Clients</button>
        <div>
            <h2>Connected Peers:</h2>
            <ul>
                <li
                    v-for="conn in connections"
                    :key="conn.connectionId"
                >
                    {{ conn.peer }}
                </li>
            </ul>
        </div>
    </div>
    <div class="form">
        <textarea
            rows="25"
            v-model="editableTournament"
            @change="changed = true"
        ></textarea>
        <button
            :disabled="!changed"
            @click="save"
        >
            Save
        </button>
    </div>
</template>
<style scoped>
textarea {
    font-family: "Consolas", "Courier New", Courier, monospace;
    font-size: 1rem;
    resize: none;
    min-width: 70ch;
}
</style>
