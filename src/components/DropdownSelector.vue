<script lang="ts" setup>
import { computed, nextTick, ref, watch } from "vue";

const props = defineProps<{
    modelValue: string;
    options: string[];
}>();

const expanded = ref(false);
const emit = defineEmits<{
    (e: "update:modelValue", value: string): void;
}>();

const selectedValue = computed({
    get() {
        return props.modelValue;
    },
    set(value) {
        emit("update:modelValue", value);
    },
});

const select = (value: string) => {
    selectedValue.value = value;
    expanded.value = false;
};

const trueDropdown = ref<HTMLElement | null>(null);
const container = ref<HTMLElement | null>(null);
watch(expanded, (value) => {
    nextTick(() => {
        if (value && trueDropdown.value && container.value) {
            const rect = trueDropdown.value.getBoundingClientRect();
            const containerRect = container.value.getBoundingClientRect();

            const top = containerRect.top;
            const bottom = containerRect.bottom;

            const spaceBelow = window.innerHeight - bottom;

            trueDropdown.value.style.left = containerRect.left + "px";

            const enoughSpaceBelow = spaceBelow > rect.height;

            if (enoughSpaceBelow) {
                trueDropdown.value.style.top = bottom + "px";
                trueDropdown.value.style.bottom = "auto";
            } else {
                trueDropdown.value.style.top = "auto";
                trueDropdown.value.style.bottom = top - rect.height + "px";
            }
        }
    });
});

window.addEventListener("click", () => {
    expanded.value = false;
});
</script>
<template>
    <div
        ref="container"
        class="dropdown"
    >
        <div
            class="dropdown__selected"
            @click.stop="expanded = !expanded"
        >
            <div class="flex flex-row gap-2">
                <strong>{{ selectedValue }}</strong>
            </div>
            <ion-icon
                name="chevron-down"
                class="dropdown__icon"
            ></ion-icon>
        </div>
        <teleport to="#dropdown-target">
            <div
                v-if="expanded"
                ref="trueDropdown"
                class="dropdown__options"
            >
                <div
                    v-for="option in options"
                    :key="option"
                    class="dropdown__option"
                    @click.stop="select(option)"
                >
                    <span :class="selectedValue == option ? 'selected' : ''">
                        {{ option }}
                    </span>
                    <ion-icon
                        v-if="selectedValue == option"
                        name="checkmark"
                    ></ion-icon>
                </div>
            </div>
        </teleport>
    </div>
</template>

<style scoped>
.dropdown {
    position: relative;
    display: inline-block;
    width: 100%;
    height: 100%;

    .dropdown__selected {
        cursor: pointer;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        gap: 1em;
    }
}

.dropdown__options {
    position: absolute;
    left: 0;
    z-index: 100;
    max-width: 20rem;
    max-height: 20rem;
    overflow-y: auto;
    background: var(--color-surface);
    border-radius: 1em;
    border: 1px solid var(--color-border);
    box-shadow: var(--fx-box-shadow);

    .dropdown__option {
        cursor: pointer;
        padding: 0.5rem;
        transition: all 0.2s ease-in-out;
        display: grid;
        grid-template-columns: 1fr 20px;
        gap: 0.5rem;
        align-items: center;

        &:hover {
            background: var(--color-surface-hover);
        }

        .selected {
            font-weight: var(--typography-fontWeight-bold);
        }
    }
}
</style>
