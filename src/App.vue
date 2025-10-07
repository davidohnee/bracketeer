<script setup lang="ts">
// remove hash from url
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import NotificationHandler from "./components/notifications/NotificationHandler.vue";
import { useThemeStore } from "./stores/theme";

const router = useRouter();
const theme = useThemeStore();

onMounted(() => {
    const hash = window.location.hash;
    const route = hash.replace("#", "");
    if (route) {
        router.push(route);
        return;
    }

    theme.init();
});
</script>

<template>
    <header>
        <div class="full">
            <RouterLink
                to="/"
                class="nav-link"
            >
                <h3 class="title">
                    <ion-icon name="trophy-outline"></ion-icon>
                    bracketeer
                </h3>
            </RouterLink>
            <nav>
                <RouterLink
                    to="/"
                    class="nav-link"
                >
                    Home
                </RouterLink>
                <RouterLink
                    to="/tournaments"
                    class="nav-link"
                >
                    Tournaments
                </RouterLink>
                <RouterLink
                    to="/settings"
                    class="nav-link"
                >
                    Settings
                </RouterLink>
            </nav>
        </div>
    </header>
    <div class="content">
        <RouterView />
    </div>
    <NotificationHandler />
</template>

<style>
header {
    padding: 1em;
    background-color: var(--color-surface);
    margin-bottom: 4em;
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    justify-content: center;
    border-bottom: 1px solid var(--color-border);

    .full {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    & h3 {
        display: flex;
        align-items: center;
        gap: 0.5em;
        margin: 0.5em 0;
    }

    & nav {
        display: flex;
        gap: 1em;

        & a {
            display: flex;
            align-items: center;
            gap: 0.5em;
            color: var(--color-text-primary);
        }
    }
}

@media (max-width: 440px) {
    header {
        & h3 {
            font-size: 0;

            & ion-icon {
                font-size: 2rem;
            }
        }
    }
}

.matches:has(.match.card) {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(30ch, 1fr));
    gap: 1em;
    padding: 1em;
}

.matches:has(.match.row) {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0em;
    padding: 1em;
}
</style>
