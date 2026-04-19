<script setup lang="ts">
import { GITHUB_LINK, GITHUB_USER } from "@/helpers/common";

const website = "https://davidohnee.com";
</script>

<template>
    <div class="body-container">
        <section>
            <h1>bracketeer</h1>
            <p class="lead">
                The sidekick that levels up your game nights from casual to championship.
            </p>
            <div class="row mobile-stack">
                <router-link :to="{ name: '/tournaments' }">
                    <button class="secondary">
                        <ion-icon name="search-outline"></ion-icon>
                        Browse My Tournaments
                    </button>
                </router-link>
                <router-link :to="{ name: '/create' }">
                    <button>
                        <ion-icon name="add-outline"></ion-icon>
                        Create Tournament
                    </button>
                </router-link>
            </div>
        </section>
        <section>
            <div class="col">
                <h1>Run tournaments like a pro &mdash; in seconds.</h1>
                <p>
                    Instantly generate match plans, update scores live, and keep your tournament
                    running smooth with a clean, modern interface built for speed. bracketeer
                    doesn't just look good &mdash; it works everywhere, from mobile to desktop, with
                    a premium, responsive design that feels as good as it looks.
                </p>
            </div>
            <div class="col">
                <ion-icon name="trophy-outline"></ion-icon>
            </div>
        </section>
        <section>
            <div class="col">
                <ion-icon name="share-outline"></ion-icon>
            </div>
            <div class="col">
                <h1>Score, share, and celebrate</h1>
                <p>
                    Share the tournament via link or QR code & track the tournament on any device!
                </p>
            </div>
        </section>

        <section>
            <div class="col">
                <h1>Built for you and your friends</h1>
                <p>
                    bracketeer is designed for you and your friends. Whether you're a casual gamer
                    or a competitive player, bracketeer offers you the platform to create and manage
                    tournaments with ease.
                </p>
            </div>
            <div class="col">
                <ion-icon name="people-outline"></ion-icon>
            </div>
        </section>
        <section>
            <div class="col">
                <ion-icon name="shield-checkmark-outline"></ion-icon>
            </div>
            <div class="col">
                <h1>No fees.<br />No sign-ups. <br />No nonsense.</h1>
                <p>
                    bracketeer is 100% free, fully open-source, and respects your privacy &mdash;
                    your data stays on your device unless you decide to share it.
                </p>
            </div>
        </section>
    </div>
    <div class="footer">
        <div class="row text-muted">
            <p class="left">
                <span>
                    <strong>bracketeer</strong> © 2025&ndash;{{ new Date().getFullYear() }}
                </span>
                <span
                    >made with ❤️ by
                    <a
                        :href="website"
                        target="_blank"
                    >
                        {{ GITHUB_USER }}
                    </a>
                </span>
            </p>
            <div class="end row">
                <a
                    :href="GITHUB_LINK"
                    target="_blank"
                >
                    <ion-icon name="logo-github"></ion-icon>
                </a>
            </div>
        </div>
    </div>
</template>

<style scoped>
.row {
    display: flex;
    flex-direction: row;
    gap: 1em;

    .end {
        margin-left: auto;
    }
}

section:first-child {
    margin-top: 0;
}

section {
    margin: 10em 0;
    background: unset;

    &:nth-child(even) {
        background: linear-gradient(
            to bottom left,
            var(--color-primary),
            color-mix(in srgb, var(--color-primary) 70%, black)
        );
        color: var(--color-primary-inverse);
        padding: 4em;
        border-radius: 1em;

        @media (max-width: 768px) {
            padding: 1em;
        }
    }

    &:has(.col) {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        align-items: center;
        justify-items: center;

        & ion-icon {
            font-size: 10rem;
            margin: 0 auto;
        }

        @media (max-width: 768px) {
            &:nth-child(even) {
                display: flex;
                flex-direction: column-reverse;
            }

            & ion-icon {
                font-size: 5rem;
            }
        }
    }
}

.lead {
    font-size: 1.2rem;
    margin-bottom: 2em;
}

.footer .row {
    align-items: center;

    & a:has(ion-icon) {
        color: unset;
    }

    .left {
        display: flex;
        align-items: center;

        > span:last-child:before {
            content: "|";
            margin: 0 0.5em;
        }
    }
}

@media (max-width: 768px) {
    .footer {
        padding: 1em;
    }

    section {
        margin: 5em 0;
    }

    .footer .row .left {
        flex-direction: column;
        align-items: flex-start;

        > span:last-child:before {
            content: unset;
        }
    }

    .row.mobile-stack {
        flex-direction: column;

        & button {
            width: 100%;
        }
    }
}
</style>
