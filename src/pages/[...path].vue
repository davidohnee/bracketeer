<template>
    <div class="body-container">
        <h1>Page not found</h1>
        <p>The page you are looking for does not exist.</p>
        <div class="row">
            <router-link :to="{ name: '/' }">
                <button>
                    <ion-icon name="home-outline"></ion-icon>
                    Return Home
                </button>
            </router-link>
            <router-link :to="{ name: '/create' }">
                <button>
                    <ion-icon name="add-outline"></ion-icon>
                    Create Tournament
                </button>
            </router-link>
        </div>
    </div>
</template>

<style scoped>
.row {
    display: flex;
    flex-direction: row;
    gap: var(--spacing-m);
}

@media (max-width: 768px) {
    .row {
        flex-direction: column;

        & button {
            width: 100%;
        }
    }
}
</style>
