<script setup lang="ts">
import MarkdownRender from "@/components/MarkdownRender.vue";
import { makeOrdinal } from "@/helpers/common";
import { getProgression, hasByes } from "@/helpers/matchplan/knockoutPhase";
import {
    COMPARATOR_KEYS,
    TIE_BREAKER_LABELS,
    type GroupTournamentPhase,
    type KnockoutTournamentPhase,
    type Tournament,
    type TournamentPhase,
} from "@/types/tournament";

const props = defineProps<{
    tournament: Tournament;
}>();

type Facts = {
    facts: string[];
    progression?: {
        facts: string[];
        tieBreakers: string[];
    };
    rounds?: string[];
};

const knockoutPhaseFacts = (phase: KnockoutTournamentPhase) => {
    const facts: Facts = {
        facts: [],
        rounds: phase.rounds.map((x) => x.name),
    };

    facts.facts.push(
        "The knockout phase bracket is set based on team rankings.",
        "Teams are placed according to their results in the league phase.",
        "Higher-ranked teams face lower-ranked teams in the early rounds.",
        "The top two teams from the league stage can only meet in the final.",
    );

    return facts;
};

const groupPhaseFacts = (phase: GroupTournamentPhase, nextPhase?: KnockoutTournamentPhase) => {
    const facts: Facts = {
        facts: [],
    };

    if (phase.groups?.length) {
        facts.facts.push(
            `Teams will be divided into **${phase.groups.length}** groups of **${phase.groups[0].teams.length}**.`,
        );
    } else {
        facts.facts.push(
            `All teams will participate in a single league competition.`,
            `All teams are ranked together.`,
        );
    }

    facts.facts.push(`Each team will play **${phase.rounds}** matches during the ${phase.name}.`);

    if (nextPhase) {
        const progression = getProgression(nextPhase, props.tournament);

        const groupCount = phase.groups?.length ?? 1;

        const playInPerGroup = progression.playIn / groupCount;
        const byePerGroup = progression.bye / groupCount;
        const progressionPerGroup = progression.total / groupCount;

        facts.progression = {
            facts: [],
            tieBreakers: (phase.tieBreakers ?? COMPARATOR_KEYS).map((x) => TIE_BREAKER_LABELS[x]),
        };

        const perGroup = phase.groups?.length ? " in each group" : "";

        if (hasByes(nextPhase, props.tournament)) {
            const byeRound = nextPhase.rounds[1];
            const playInPlaces = [...Array.from({ length: byePerGroup }).keys()]
                .map((x) => playInPerGroup + x + 1)
                .map(makeOrdinal);

            facts.progression.facts.push(
                `Top **${byePerGroup}** teams${perGroup} progress directly to the ${byeRound.name}`,
                `Teams placed **${playInPlaces.join(", ")}** play a play-in`,
            );
        } else {
            const nextRound = nextPhase.rounds[0];
            facts.progression.facts.push(
                `Top **${progressionPerGroup}** teams${perGroup} progress to ${nextRound.name}`,
            );
        }
    }
    return facts;
};

const generateDescription = (phase: TournamentPhase, nextTournamentPhase?: TournamentPhase) => {
    let output = "";

    const unorderedList = (items: string[]) => "- " + items.join("\n- ");

    const orderedList = (items: string[]) =>
        [...items.entries()].map(([i, v]) => `${i + 1}. ${v}`).join("\n");

    if (phase.type === "group") {
        const nextPhase = nextTournamentPhase?.type == "knockout" ? nextTournamentPhase : undefined;
        const facts = groupPhaseFacts(phase, nextPhase);
        output += unorderedList(facts.facts);

        if (facts.progression) {
            output += "\n#### How are teams ranked?";
            output +=
                "\nThe following criteria are applied, in this order, to determine the rankings:";
            output += "\n" + orderedList(facts.progression.tieBreakers);
            output += "\n#### Who progresses?";
            output += "\n" + unorderedList(facts.progression.facts);
        }
    } else if (phase.type === "knockout") {
        const facts = knockoutPhaseFacts(phase);
        output += "\n" + unorderedList(facts.facts);
        output += "\n#### Rounds";
        if (facts.rounds) {
            output +=
                "\nEach match is a direct elimination fixture. The winning team advances to the next round, while the losing team is eliminated from the tournament.";
            output += "\n" + unorderedList(facts.rounds);
        }
    }

    return output;
};
</script>
<template>
    <div class="about">
        <p>All you need to know about {{ tournament.name }}.</p>
        <div
            class="phase"
            v-for="(phase, index) in tournament.phases"
            :key="phase.id"
        >
            <h2>{{ phase.name }}</h2>
            <MarkdownRender :source="generateDescription(phase, tournament.phases[index + 1])" />
        </div>
    </div>
</template>
<style scoped>
.about {
    padding: 1em;

    & h2 {
        margin-top: 1.5em;
    }
}
</style>
