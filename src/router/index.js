import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'homePage',
      component: () => import('../views/homePage/index.vue')
    },
    {
      path: '/corr',
      name: 'corr',
      component: () => import('../views/corr/index.vue')
    },
    {
      path: '/time',
      name: 'time',
      component: () => import('../views/time/index.vue')
    },
    {
      path: '/multilayer',
      name: 'multilayer',
      component: () => import('../views/multilayer/index.vue')
    },
    {
      path: '/trade',
      name: 'trade',
      component: () => import('../views/homePage/index.vue')
    }
    // {
    //   path: '/news',
    //   name: 'news',
    //   component: () => import('../views/news/index.vue')
    // },
    // {
    //   path: '/about',
    //   name: 'about',
    //   component: () => import('../views/about/index.vue')
    // },
    // {
    //   path: '/user',
    //   name: 'user',
    //   component: () => import('../views/user/index.vue')
    // },
  ]
})

export default router
