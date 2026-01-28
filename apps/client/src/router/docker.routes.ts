// apps/client/src/router/docker.routes.ts
const routes = {
  path: '/images',
  name: 'ImageList',
  component: () => import('@/views/ImageList.vue'),
}

export default routes
