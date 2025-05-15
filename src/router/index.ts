import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: "/",
            name: "home",
            component: () => import("@/views/HomeView.vue"),
        },
        {
            path: "/settings",
            name: "settings",
            component: () => import("@/views/SettingsView.vue"),
            redirect: { name: "settings.general.about" },
            children: [
                {
                    path: "general/about",
                    name: "settings.general.about",
                    component: () => import("@/views/Settings/General/AboutView.vue"),
                },
                {
                    path: "general/appearance",
                    name: "settings.general.appearance",
                    component: () => import("@/views/Settings/General/AppearanceView.vue"),
                },
                {
                    path: "share/gists",
                    name: "settings.share.gists",
                    component: () => import("@/views/Settings/Share/GistsView.vue"),
                },
            ],
        },
        {
            path: "/create",
            name: "create",
            component: () => import("@/views/CreateView.vue"),
        },
        {
            path: "/tournaments",
            name: "tournaments",
            component: () => import("@/views/TournamentListView.vue"),
        },
        {
            path: "/tournaments/:tournamentId",
            name: "tournament",
            component: () => import("@/views/TournamentView.vue"),
            redirect: { name: "tournament.table" },
            children: [
                {
                    path: "config",
                    name: "tournament.config",
                    component: () => import("@/views/Tournament/ConfigureView.vue"),
                },
                {
                    path: "config/teams",
                    name: "tournament.config.teams",
                    component: () => import("@/views/Tournament/TeamEditorView.vue"),
                },
                {
                    path: "config/plan",
                    name: "tournament.config.plan",
                    component: () => import("@/views/Tournament/ConfigureFormatView.vue"),
                },
                {
                    path: "matches",
                    name: "tournament.matches",
                    component: () => import("@/views/Tournament/MatchesView.vue"),
                },
                {
                    path: "knockout",
                    name: "tournament.knockout",
                    component: () => import("@/views/Tournament/KnockoutView.vue"),
                },
                {
                    path: "table",
                    name: "tournament.table",
                    component: () => import("@/views/Tournament/TableView.vue"),
                },
                {
                    path: "live",
                    name: "tournament.live",
                    component: () => import("@/views/Tournament/LiveView.vue"),
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
                    path: "matches",
                    name: "import.matches",
                    component: () => import("@/views/Tournament/MatchesView.vue"),
                },
                {
                    path: "knockout",
                    name: "import.knockout",
                    component: () => import("@/views/Tournament/KnockoutView.vue"),
                },
                {
                    path: "table",
                    name: "import.table",
                    component: () => import("@/views/Tournament/TableView.vue"),
                },
                {
                    path: "live",
                    name: "import.live",
                    component: () => import("@/views/Tournament/LiveView.vue"),
                },
            ],
        },
        {
            path: "/v/:id",
            name: "view",
            component: () => import("@/views/ViewerView.vue"),
            redirect: { name: "viewer.table" },
            children: [
                {
                    path: "matches",
                    name: "viewer.matches",
                    component: () => import("@/views/Tournament/MatchesView.vue"),
                },
                {
                    path: "knockout",
                    name: "viewer.knockout",
                    component: () => import("@/views/Tournament/KnockoutView.vue"),
                },
                {
                    path: "table",
                    name: "viewer.table",
                    component: () => import("@/views/Tournament/TableView.vue"),
                },
                {
                    path: "live",
                    name: "viewer.live",
                    component: () => import("@/views/Tournament/LiveView.vue"),
                },
            ],
        },
        {
            path: "/design-system",
            name: "design-system",
            component: () => import("@/views/DesignSystemView.vue"),
        },
        {
            path: "/:pathMatch(.*)*",
            name: "not-found",
            component: () => import("@/views/NotFoundView.vue"),
        },
    ],
});

export default router;
