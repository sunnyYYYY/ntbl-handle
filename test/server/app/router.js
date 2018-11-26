import Router from 'koa-router'


const router = new Router

router.prefix('/test')

router
  .get('/findOne', api.findOne)
  .get('/mock', api.mock)
  .get('/where/str', api.str)
  .get('/where/multiple', api.multiple)
  .get('/scopes/fuzzyQuery', api.fuzzyQuery)
  .get('/instance/options/raw', api.raw)
  .post('/instance/options/method', api.method)
  .get('/process', api.process)
  .post('/process/method/post', api.processMethodPost)
  .get('/process/raw', api.processRaw)

import api from './controllers/api'



export default router
