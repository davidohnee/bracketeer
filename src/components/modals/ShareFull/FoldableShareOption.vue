<script setup lang="ts">
import SwitchToggle from "@/components/input/SwitchToggle.vue";
import { ref } from "vue";

defineProps<{
    title: string;
    enabled: boolean;
    configured: boolean;
}>();

const emit = defineEmits<{
    (e: "update:enabled", value: boolean): void;
}>();

const expanded = ref(false);
</script>
<template>
    <div class="option">
        <div
            class="header"
            @click="expanded = !expanded"
        >
            <ion-icon :name="expanded ? 'chevron-down' : 'chevron-forward'"></ion-icon>
            <h3>{{ title }}</h3>
            <SwitchToggle
                @click.stop
                :disabled="!configured"
                :model-value="enabled && configured"
                @update:modelValue="emit('update:enabled', $event)"
            />
        </div>
        <div
            v-show="expanded"
            class="content"
        >
            <slot />
        </div>
    </div>
</template>
<style scoped>
.header {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    cursor: pointer;

    & h3 {
        flex: 1;
        margin: 0;
    }

    & ion-icon {
        transition: transform 0.2s;
    }
}

.option {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-l);
    padding: var(--spacing-m);
}

.content {
    margin-top: var(--spacing-m);
}
</style>
