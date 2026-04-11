import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { routes as autoRoutes } from "vue-router/auto-routes";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        ...autoRoutes,
        {
            path: "/s/:id",
            name: "import",
            component: () => import("@/views/ImportView.vue"),
            redirect: { name: "import.table" },
            children: [
                {
                    path: "matches",
                    name: "import.matches",
                    component: () => import("@/pages/tournament/[tournamentId]/matches.vue"),
                },
                {
                    path: "knockout",
                    name: "import.knockout",
                    component: () => import("@/pages/tournament/[tournamentId]/knockout.vue"),
                },
                {
                    path: "table",
                    name: "import.table",
                    component: () => import("@/pages/tournament/[tournamentId]/table.vue"),
                },
                {
                    path: "live",
                    name: "import.live",
                    component: () => import("@/pages/tournament/[tournamentId]/live.vue"),
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
                    component: () => import("@/pages/tournament/[tournamentId]/matches.vue"),
                },
                {
                    path: "knockout",
                    name: "viewer.knockout",
                    component: () => import("@/pages/tournament/[tournamentId]/knockout.vue"),
                },
                {
                    path: "table",
                    name: "viewer.table",
                    component: () => import("@/pages/tournament/[tournamentId]/table.vue"),
                },
                {
                    path: "live",
                    name: "viewer.live",
                    component: () => import("@/pages/tournament/[tournamentId]/live.vue"),
                },
            ],
        },
    ] as RouteRecordRaw[],
});

export default router;
