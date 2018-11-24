import Router from 'koa-router'


const router = new Router

router.prefix('/test')

import where from './controllers/where'

router
  .get('/where/str', where.str)
  .get('/where/multiple', where.multiple)
  .get('/article/init', where.init)
  .get('/mode/raw', where.rawMode)

export default router
