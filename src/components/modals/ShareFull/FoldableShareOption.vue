<script setup lang="ts">
import { ref } from "vue";

defineProps<{
    title: string;
    enabled: boolean;
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
            <ion-icon
                v-if="enabled"
                name="checkmark"
            ></ion-icon>
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
