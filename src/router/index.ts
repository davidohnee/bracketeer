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
            path: "/settings",
            name: "settings",
            component: () => import("../views/SettingsView.vue"),
            redirect: { name: "settings.general.about" },
            children: [
                {
                    path: "general/about",
                    name: "settings.general.about",
                    component: () => import("../views/Settings/AboutView.vue"),
                },
                {
                    path: "share/gists",
                    name: "settings.share.gists",
                    component: () => import("../views/Settings/Share/GistsView.vue"),
                },
            ],
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
                    path: ":tournamentId/config",
                    name: "tournament.config",
                    component: () => import("../views/Tournament/Single/ConfigurationView.vue"),
                },
                {
                    path: ":tournamentId/config/teams",
                    name: "tournament.config.teams",
                    component: () => import("../views/Tournament/Single/TeamEditorView.vue"),
                },
                {
                    path: ":tournamentId/config/plan",
                    name: "tournament.config.plan",
                    component: () => import("../views/Tournament/Single/SettingsEditorView.vue"),
                },
                {
                    path: ":tournamentId/matches",
                    name: "tournament.matches",
                    component: () => import("../views/Tournament/Single/MatchesView.vue"),
                },
                {
                    path: ":tournamentId/knockout",
                    name: "tournament.knockout",
                    component: () => import("../views/Tournament/Single/KnockoutView.vue"),
                },
                {
                    path: ":tournamentId/table",
                    name: "tournament.table",
                    component: () => import("../views/Tournament/Single/TableView.vue"),
                },
                {
                    path: ":tournamentId/live",
                    name: "tournament.live",
                    component: () => import("../views/Tournament/Single/LiveView.vue"),
                },
            ],
        },
        {
            path: "/s/:id",
            name: "import",
            component: () => import("@/views/ImportView.vue"),
            redirect: { name: "import.table" },
            children: [
                {
                    path: ":id/matches",
                    name: "import.matches",
                    component: () => import("../views/Viewer/MatchesView.vue"),
                },
                {
                    path: ":id/knockout",
                    name: "import.knockout",
                    component: () => import("../views/Viewer/KnockoutView.vue"),
                },
                {
                    path: ":id/table",
                    name: "import.table",
                    component: () => import("../views/Tournament/Single/TableView.vue"),
                },
                {
                    path: ":id/live",
                    name: "import.live",
                    component: () => import("../views/Viewer/LiveView.vue"),
                },
            ],
        },
        {
            path: "/v/:id",
            name: "view",
            component: () => import("@/views/ViewerView.vue"),
            redirect: { name: "view.table" },
            children: [
                {
                    path: ":id/matches",
                    name: "view.matches",
                    component: () => import("../views/Viewer/MatchesView.vue"),
                },
                {
                    path: ":id/knockout",
                    name: "view.knockout",
                    component: () => import("../views/Viewer/KnockoutView.vue"),
                },
                {
                    path: ":id/table",
                    name: "view.table",
                    component: () => import("../views/Tournament/Single/TableView.vue"),
                },
                {
                    path: ":id/live",
                    name: "view.live",
                    component: () => import("../views/Viewer/LiveView.vue"),
                },
            ],
        },
        {
            path: "/:pathMatch(.*)*",
            name: "not-found",
            component: () => import("../views/NotFoundView.vue"),
        },
    ],
});

export default router;
