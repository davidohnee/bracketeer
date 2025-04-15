import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: "/",
            name: "home",
            component: () => import("../views/HomeView.vue"),
        },
        {
            path: "/tournaments",
            name: "tournaments",
            component: () => import("../views/Tournament/ListView.vue"),
        },
        {
            path: "/create",
            name: "create",
            component: () => import("../views/CreatorView/CreatorView.vue"),
        },
        {
            path: "/tournaments/:tournamentId",
            name: "tournament",
            component: () => import("../views/Tournament/SingleView.vue"),
            redirect: { name: "tournament.table" },
            children: [
                {
                    path: "/tournaments/:tournamentId/config",
                    name: "tournament.config",
                    component: () => import("../views/Tournament/Single/ConfigurationView.vue"),
                },
                {
                    path: "/tournaments/:tournamentId/matches",
                    name: "tournament.matches",
                    component: () => import("../views/Tournament/Single/MatchesView.vue"),
                },
                {
                    path: "/tournaments/:tournamentId/knockout",
                    name: "tournament.knockout",
                    component: () => import("../views/Tournament/Single/KnockoutView.vue"),
                },
                {
                    path: "/tournaments/:tournamentId/table",
                    name: "tournament.table",
                    component: () => import("../views/Tournament/Single/TableView.vue"),
                },
            ],
        },
    ],
});

export default router;
