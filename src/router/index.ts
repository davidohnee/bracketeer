import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { routes as autoRoutes } from "vue-router/auto-routes";

const VIEWER_TABS = ["matches", "knockout", "table", "live", "about"];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        ...autoRoutes,
        {
            path: "/s/:id",
            name: "/s/[id]",
            component: () => import("@/views/ImportView.vue"),
            redirect: { name: "/s/[id]/table" },
            children: VIEWER_TABS.map((path) => ({
                path,
                name: `/s/[id]/${path}`,
                component: () => import(`@/pages/tournament/[tournamentId]/${path}.vue`),
            })),
        },
        {
            path: "/v/:id",
            name: "/v/[id]",
            component: () => import("@/views/ViewerView.vue"),
            redirect: { name: "/v/[id]/table" },
            children: VIEWER_TABS.map((path) => ({
                path,
                name: `/v/[id]/${path}`,
                component: () => import(`@/pages/tournament/[tournamentId]/${path}.vue`),
            })),
        },
    ] as RouteRecordRaw[],
});

export default router;
