import Koa from 'koa'
import body from 'koa-body'
import koaStatic from 'koa-static'
import session from 'koa-session'
import cors from 'koa-cors'
import compress from 'koa-compress'
import cacheControl from 'koa-cache-control'
import onerror from 'koa-onerror'
import logger from 'koa-logger'
import helmet from 'koa-helmet'

import router from './app/router'

const app = new Koa()
app.keys = ['some secret hurr']

onerror(app)


app
  .use(logger())
  .use(cacheControl({ maxAge: 2592000 }))
  .use(compress())
  .use(cors({ credentials: true }))
  .use(helmet())
  .use(koaStatic(__dirname + '/app/public'))
  .use(session(app))
  .use(body({
    multipart: true,
    formidable: {
        maxFileSize: 200*1024*1024
    }
  }))
  .use(router.routes(), router.allowedMethods())
  .listen(3000)

export default app
