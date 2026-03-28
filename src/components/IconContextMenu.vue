<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps<{
    alignment?: "left" | "right"; // default: left
}>();

const expanded = ref(false);

const trueDropdown = ref<HTMLElement | null>(null);
const container = ref<HTMLElement | null>(null);
let positionUpdateFrame: number | null = null;
let hasScrollListener = false;

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

const updatePosition = () => {
    if (!expanded.value || !trueDropdown.value || !container.value) {
        return;
    }

    const trueDropdownRect = trueDropdown.value.getBoundingClientRect();
    const containerRect = container.value.getBoundingClientRect();

    const top = containerRect.top;
    const bottom = containerRect.bottom;
    const spaceBelow = globalThis.innerHeight - bottom;

    trueDropdown.value.style.left = containerRect.left + "px";
    trueDropdown.value.style.right = "auto";

    if (props.alignment === "right") {
        trueDropdown.value.style.left = "auto";
        trueDropdown.value.style.right = globalThis.innerWidth - containerRect.right + "px";
    }

    const enoughSpaceBelow = spaceBelow > trueDropdownRect.height;

    if (enoughSpaceBelow) {
        trueDropdown.value.style.top = bottom + "px";
        trueDropdown.value.style.bottom = "auto";
    } else {
        trueDropdown.value.style.top = "auto";
        trueDropdown.value.style.bottom = globalThis.innerHeight - top + "px";
    }
};

const schedulePositionUpdate = () => {
    if (positionUpdateFrame !== null) {
        return;
    }

    positionUpdateFrame = globalThis.requestAnimationFrame(() => {
        positionUpdateFrame = null;
        updatePosition();
    });
};

const registerScrollListener = () => {
    if (hasScrollListener) {
        return;
    }

    globalThis.addEventListener("scroll", handleScroll, true);
    hasScrollListener = true;
};

const unregisterScrollListener = () => {
    if (!hasScrollListener) {
        return;
    }

    globalThis.removeEventListener("scroll", handleScroll, true);
    hasScrollListener = false;
};

watch(expanded, (value) => {
    if (value) {
        registerScrollListener();
    } else {
        unregisterScrollListener();
    }

    nextTick(() => {
        if (value) {
            schedulePositionUpdate();
        }
    });
});

const handleWindowClick = () => {
    expanded.value = false;
};
const handleResize = () => {
    schedulePositionUpdate();
};
const handleScroll = () => {
    schedulePositionUpdate();
};
onMounted(() => {
    globalThis.addEventListener("click", handleWindowClick);
    globalThis.addEventListener("resize", handleResize);
});
onBeforeUnmount(() => {
    unregisterScrollListener();

    if (positionUpdateFrame !== null) {
        globalThis.cancelAnimationFrame(positionUpdateFrame);
        positionUpdateFrame = null;
    }

    globalThis.removeEventListener("click", handleWindowClick);
    globalThis.removeEventListener("resize", handleResize);
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
    position: fixed;
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
