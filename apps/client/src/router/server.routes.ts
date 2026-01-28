// apps/client/src/router/server.routes.ts
const routes = [
  {
    path: '/servers',
    name: 'ServerList',
    component: () => import('@/views/ServerList.vue'),
  },
  {
    path: '/servers/:id',
    name: 'ServerDetail',
    component: () => import('@/views/ServerDetail.vue'),
    props: true
  }
]

export default routes
