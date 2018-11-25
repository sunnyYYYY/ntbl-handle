import Router from 'koa-router'


const router = new Router

router.prefix('/test')

router
  .get('/findOne', api.findOne)
  .get('/mock', api.mock)
  .get('/where/str', api.str)
  .get('/where/multiple', api.multiple)
  .get('/scopes/fuzzyQuery', api.fuzzyQuery)
  .post('/instance/options/raw', api.raw)
  .post('/instance/options/method', api.method)

import api from './controllers/api'



export default router
