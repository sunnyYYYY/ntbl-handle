import Router from 'koa-router'


const router = new Router

router.prefix('/api/v1')

import where from './controllers/where'

router
  .get('/where/findAll', where.findAll)
  .post('/where/create', where.create)



export default router
