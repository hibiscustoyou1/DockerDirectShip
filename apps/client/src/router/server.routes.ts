// apps/client/src/router/server.routes.ts
const routes = {
  path: '/servers',
  name: 'ServerList',
  component: () => import('@/views/ServerList.vue'),
}

export default routes
