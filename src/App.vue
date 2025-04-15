<template>
    <header>
        <div class="full">
            <h2 class="title">
                <ion-icon name="trophy-outline"></ion-icon>
                bracketeer
            </h2>
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
            </nav>
        </div>
    </header>
    <div class="content">
        <RouterView />
    </div>
</template>

<style>
.table {
    width: 100%;
}

header {
    padding: 1em;
    background-color: var(--color-background);
    place-items: center;
    margin-bottom: 5em;
    position: sticky;
    top: 0;
    z-index: 10;
    border-bottom: 1px solid var(--color-border);

    .full {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    & h2 {
        display: flex;
        align-items: center;
        gap: 0.5em;
    }

    & nav {
        display: flex;
        gap: 1em;

        & a {
            display: flex;
            align-items: center;
            gap: 0.5em;
            color: var(--color-foreground);
        }
    }
}

.matches {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(30ch, 1fr));
    gap: 1em;
    padding: 1em;
}
</style>
