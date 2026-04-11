<script setup lang="ts">
definePage({
    redirect: (from) => ({
        name: "/tournament/[tournamentId]/table",
        params: {
            // @ts-expect-error missing typing
            tournamentId: from.params.tournamentId,
        },
    }),
});
</script>
