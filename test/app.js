const Koa = require('koa')
const body = require('koa-body')
const Router = require('koa-router')

const app = new Koa()
const router = new Router()

app
  .use(body())
  .use(router.routes(), router.allowedMethods())
  .listen(3000)

module.exports = app