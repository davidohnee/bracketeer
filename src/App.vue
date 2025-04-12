<template>
  <RouterView />
</template>

<style>
.table {
  width: 100%;
}

.matches {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(30ch, 1fr));
  gap: 1em;
  padding: 1em;
}
</style>
