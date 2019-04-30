import Router from 'koa-router'
import api from './controllers/api'

const router = new Router

router.prefix('/test')

router
  .get('/where/string', api.string)
  .get('/where/multiple', api.multiple)
  .get('/where/defaultValue', api.defaultValue)
  .get('/where/alias', api.alias)
  .get('/where/option', api.option)
  .get('/where/gt', api.gt)
  .get('/where/like', api.like)
  .get('/where/full', api.full)
  .get('/fuzzyQueryLeft', api.fuzzyQueryLeft)
  .get('/fuzzyQueryRight', api.fuzzyQueryRight)
  .get('/fuzzyQuery', api.fuzzyQuery)
  .get('/pagination', api.pagination)
  .get('/include', api.include)
  .post('/remove', api.remove)
  .post('/set', api.set)
  .get('/it', api.it)
  .get('/not', api.not)
  .get('/scope', api.scope)
  .get('/process', api.process)
  .get('/findOne', api.findOne)
  .get('/findAll', api.findAll)
  .get('/findOrCreate', api.findOrCreate)
  .get('/findAndCountAll', api.findAndCountAll)
  .get('/findAndCount', api.findAndCount)
  .get('/findCreateFind', api.findCreateFind)
  .get('/count', api.count)
  .get('/max', api.max)
  .get('/min', api.min)
  .get('/sum', api.sum)
  .post('/before', api.before)
  .get('/after', api.after)
  .get('/fn', api.fn)

  // .get('/scopes/fuzzyQuery', api.fuzzyQuery)
  // .get('/instance/options/raw', api.raw)
  // .post('/instance/options/method', api.method)
  // .get('/process', api.process)
  // .post('/process/method/post', api.processMethodPost)
  // .get('/process/raw', api.processRaw)





export default router
