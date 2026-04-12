import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { routes as autoRoutes } from "vue-router/auto-routes";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        ...autoRoutes,
        {
            path: "/s/:id",
            name: "/s/[id]",
            component: () => import("@/views/ImportView.vue"),
            redirect: { name: "/s/[id]/table" },
            children: [
                {
                    path: "matches",
                    name: "/s/[id]/matches",
                    component: () => import("@/pages/tournament/[tournamentId]/matches.vue"),
                },
                {
                    path: "knockout",
                    name: "/s/[id]/knockout",
                    component: () => import("@/pages/tournament/[tournamentId]/knockout.vue"),
                },
                {
                    path: "table",
                    name: "/s/[id]/table",
                    component: () => import("@/pages/tournament/[tournamentId]/table.vue"),
                },
                {
                    path: "live",
                    name: "/s/[id]/live",
                    component: () => import("@/pages/tournament/[tournamentId]/live.vue"),
                },
            ],
        },
        {
            path: "/v/:id",
            name: "/v/[id]",
            component: () => import("@/views/ViewerView.vue"),
            redirect: { name: "/v/[id]/table" },
            children: [
                {
                    path: "matches",
                    name: "/v/[id]/matches",
                    component: () => import("@/pages/tournament/[tournamentId]/matches.vue"),
                },
                {
                    path: "knockout",
                    name: "/v/[id]/knockout",
                    component: () => import("@/pages/tournament/[tournamentId]/knockout.vue"),
                },
                {
                    path: "table",
                    name: "/v/[id]/table",
                    component: () => import("@/pages/tournament/[tournamentId]/table.vue"),
                },
                {
                    path: "live",
                    name: "/v/[id]/live",
                    component: () => import("@/pages/tournament/[tournamentId]/live.vue"),
                },
            ],
        },
    ] as RouteRecordRaw[],
});

export default router;
