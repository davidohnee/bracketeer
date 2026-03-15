<script setup lang="ts">
import type { GroupTournamentPhase, ITournamentPhase } from "@/types/tournament";
import { computed } from "vue";

const props = defineProps<{
    modelValue: number | undefined;
    hideValue?: boolean;
    readonly?: boolean;
    previousPhase?: ITournamentPhase | null;
}>();

const emit = defineEmits<(e: "update:modelValue", value: number | undefined) => void>();

const value = computed({
    get() {
        return props.modelValue;
    },
    set(value) {
        emit("update:modelValue", value);
    },
});

const valueValid = computed(() => {
    if (props.modelValue === undefined) return true;

    if (props.modelValue % 2 === 0) return true;

    if (props.modelValue === 1) return true;

    return false;
});

interface IGroupPromotionValidationResult {
    valid: boolean;
    suggestedTeamCount?: number;
}
interface GroupPromotionValidationResultValid extends IGroupPromotionValidationResult {
    valid: true;
}
interface GroupPromotionValidationResultInvalid extends IGroupPromotionValidationResult {
    valid: false;
    suggestedTeamCount: number;
}
type GroupPromotionValidationResult =
    | GroupPromotionValidationResultValid
    | GroupPromotionValidationResultInvalid;

const groupPromotionPossible = computed((): GroupPromotionValidationResult => {
    if (!props.previousPhase) return { valid: true };
    if (props.modelValue === undefined) return { valid: true };
    if (props.previousPhase.type !== "group") return { valid: true };

    const groupPhase = props.previousPhase as GroupTournamentPhase;

    const groupCount = groupPhase.groups?.length ?? 1;
    if (groupCount <= 1) return { valid: true };

    if (props.modelValue % groupCount === 0) return { valid: true };

    const suggestedTeamCount = Math.round(props.modelValue / groupCount) * groupCount;

    return { valid: false, suggestedTeamCount };
});

const maxValue = computed(() => {
    if (!props.previousPhase) return undefined;
    if (props.previousPhase.type !== "group") return undefined;

    const groupPhase = props.previousPhase as GroupTournamentPhase;

    return groupPhase.groups?.reduce((max, group) => {
        return max + (group.teams?.length ?? 0);
    }, 0);
});
</script>

<template>
    <div class="connector">
        <div class="field small">
            <input
                v-if="!props.hideValue"
                type="number"
                v-model="value"
                @input="$emit('update:modelValue', value)"
                :class="{ 'hidden-value': props.hideValue }"
                :disabled="readonly"
                title="# of teams to proceed"
                :aria-invalid="!valueValid"
                :max="maxValue"
            />
            <span
                v-if="!props.hideValue && !valueValid"
                class="error-description"
            >
                Must be an even number or 1
            </span>
            <span
                v-else-if="!props.hideValue && !groupPromotionPossible.valid"
                class="error-description"
            >
                Invalid team count. Must be a multiple of the number of groups in the previous phase
                (e.g., {{ groupPromotionPossible.suggestedTeamCount }}).
            </span>
        </div>
    </div>
</template>
<style scoped>
.connector {
    width: 24ch;
    height: 1px;
    z-index: 1;
    flex-shrink: 0;
    flex-grow: 1;
    background: var(--color-text-secondary);
    position: relative;

    .field {
        position: absolute;
        top: 0%;
        left: 50%;
        translate: -50% -50%;

        & input {
            width: 5ch;
        }
    }

    .error-description {
        position: fixed;
        top: 120%;
        left: -100%;
        width: 300%;
    }
}
</style>
