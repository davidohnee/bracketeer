<template>
    <h1>Design System</h1>
    <div class="design-system">
        <div class="typography card">
            <div class="card-header">
                <h3>Typography</h3>
            </div>
            <div class="font">
                <p class="font-name">Sen - <strong>Regular</strong></p>
                <p>
                    ABCDEFGHIJKLMNOPQRSTUVWXYZ
                    <br />
                    abcdefghijklmnopqrstuvwxyz
                    <br />
                    123456789
                </p>
            </div>
            <div class="font">
                <p class="font-name">Sen - <strong>Bold</strong></p>
                <strong>
                    <p>
                        ABCDEFGHIJKLMNOPQRSTUVWXYZ
                        <br />
                        abcdefghijklmnopqrstuvwxyz
                        <br />
                        123456789
                    </p>
                </strong>
            </div>
            <h1>Heading 1</h1>
            <h2>Heading 2</h2>
            <h3>Heading 3</h3>
            <p>Paragraph</p>
        </div>
        <div class="colours card">
            <div class="card-header">
                <h3>Colours</h3>
            </div>
            <h3>Text</h3>
            <div class="color">
                <p>Primary</p>
                <div
                    class="swatch"
                    style="--c: var(--color-text-primary)"
                ></div>
            </div>
            <div class="color">
                <p>Secondary</p>
                <div
                    class="swatch"
                    style="--c: var(--color-text-secondary)"
                ></div>
            </div>
            <h3>Background</h3>
            <div class="color">
                <p>Background</p>
                <div
                    class="swatch"
                    style="--c: var(--color-background)"
                ></div>
            </div>
            <div class="color">
                <p>Surface</p>
                <div
                    class="swatch"
                    style="--c: var(--color-surface)"
                ></div>
            </div>
            <h3>Primary</h3>
            <div class="color">
                <p>Primary</p>
                <div
                    class="swatch"
                    style="--c: var(--color-primary)"
                ></div>
            </div>

            <div class="color">
                <p>Hover</p>
                <div
                    class="swatch"
                    style="--c: var(--color-primary-hover)"
                ></div>
            </div>
            <div class="color">
                <p>Inverse</p>
                <div
                    class="swatch"
                    style="--c: var(--color-primary-inverse)"
                ></div>
            </div>
            <h3>Colours</h3>
            <div
                class="color"
                v-for="color in ['green', 'red', 'blue', 'yellow', 'grey']"
            >
                <p>{{ color }}</p>
                <div
                    class="swatch"
                    :style="`--c: var(--color-brand-${color})`"
                ></div>
            </div>
            <h3>Other</h3>
            <div class="color">
                <p>Border</p>
                <div
                    class="swatch"
                    style="--c: var(--color-border)"
                ></div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.design-system {
    display: grid;
    gap: 1em;
}

.card-header {
    display: flex;
    gap: 1em;
    align-items: last baseline;
    color: var(--color-primary);
    border-bottom: 3px solid var(--color-primary);

    & h3 {
        margin: 0;
        text-transform: uppercase;
    }
    & p {
        margin: 0;
    }
}

.font {
    display: grid;
    grid-template-columns: 20ch 1fr;
    gap: 1em;

    border-bottom: 1px solid var(--color-border);
}

.color {
    display: grid;
    grid-template-columns: 20ch 1fr;
    gap: 1em;
    align-items: center;

    border-bottom: 1px solid var(--color-border);

    & p {
        text-transform: capitalize;
    }
}

.swatch {
    width: 2em;
    height: 2em;
    border-radius: 1000vmax;
    background-color: var(--c);
    border: 2px solid var(--color-border);
}
</style>
