<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps<{
    alignment?: "left" | "right"; // default: left
}>();

const expanded = ref(false);

const trueDropdown = ref<HTMLElement | null>(null);
const container = ref<HTMLElement | null>(null);

let trueDropdownRect: DOMRect | null = null;
let containerRect: DOMRect | null = null;

const close = () => {
    expanded.value = false;
};

const open = () => {
    expanded.value = true;
};

const toggle = () => {
    expanded.value = !expanded.value;
};

defineExpose({
    open,
    close,
    toggle,
    isOpen: expanded,
});

watch(expanded, (value) => {
    nextTick(() => {
        if (value && trueDropdown.value && container.value) {
            if (!trueDropdownRect || !containerRect) {
                trueDropdownRect = trueDropdown.value.getBoundingClientRect();
                containerRect = container.value.getBoundingClientRect();
            }

            const top = containerRect.top;
            const bottom = containerRect.bottom;

            const spaceBelow = window.innerHeight - bottom;

            trueDropdown.value.style.left = containerRect.left + "px";
            if (props.alignment === "right") {
                trueDropdown.value.style.left = "auto";
                trueDropdown.value.style.right = window.innerWidth - containerRect.right + "px";
            }

            const enoughSpaceBelow = spaceBelow > trueDropdownRect.height;

            if (enoughSpaceBelow) {
                trueDropdown.value.style.top = bottom + "px";
                trueDropdown.value.style.bottom = "auto";
            } else {
                trueDropdown.value.style.top = "auto";
                trueDropdown.value.style.bottom = window.innerHeight - top + "px";
            }
        }
    });
});

const handleWindowClick = () => {
    expanded.value = false;
};
const handleResize = () => {
    trueDropdownRect = null;
    containerRect = null;
};
onMounted(() => {
    window.addEventListener("click", handleWindowClick);
    window.addEventListener("resize", handleResize);
});
onBeforeUnmount(() => {
    window.removeEventListener("click", handleWindowClick);
    window.removeEventListener("resize", handleResize);
});
</script>
<template>
    <div
        ref="container"
        class="icon-context-menu"
    >
        <div
            class="activator"
            @click.stop="toggle"
        >
            <slot
                name="activator"
                :close="close"
                :open="open"
            ></slot>
        </div>
        <teleport to="#dropdown-target">
            <div
                v-if="expanded"
                ref="trueDropdown"
                class="context-menu"
                @click.stop
            >
                <slot
                    name="context-menu"
                    :close="close"
                    :open="open"
                ></slot>
            </div>
        </teleport>
    </div>
</template>

<style scoped>
.icon-context-menu {
    position: relative;

    .activator {
        cursor: pointer;
    }
}

.context-menu {
    position: absolute;
    left: 0;
    z-index: 100;
    max-width: 20rem;
    max-height: 20rem;
    overflow-y: auto;
    background: var(--color-background);
    border-radius: 1em;
    border: 1px solid var(--color-border);
    box-shadow: var(--fx-box-shadow);
}
</style>
