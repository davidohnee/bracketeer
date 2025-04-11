<template>
  <RouterView />
</template>

<style>
#app {
  background: var(--color-background-secondary);

  & section {
    background: var(--color-background);
  }
}

.table {
  width: 100%;
}

.matches {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1em;
  padding: 1em;
}
</style>
