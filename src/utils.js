/**
 * 生成模型方法的选项对象，为了支持 where 子句的快捷写法
 *

 * @param {string|array|object|function} o - 生成数据
 * @param {object} data - request body data
 * @param ctx
 * @param next
 * @returns {*}
 * @private
 */
export let getOp = (o, data, ctx, next) => {
  if (typeof o === 'string') o = [o]

  if (Array.isArray(o)) {
    return {
      where: o.reduce((ret, res) => {
        if (typeof res === 'string') ret[res] = data[res]
        if (Array.isArray(res)) ret[res[0]] = /^@/.test(res[1]) ? data[res[1].slice(1)] : res[1]
        return ret
      }, {})
    }
  }
  else if (typeof o === 'function') return o(data, ctx, next)
  return o || {}
}


/**
 * 返回 get 或 post 请求的 request body data
 *
 * @param {string} method - 请求方法
 * @param ctx
 * @returns {{}}
 * @private
 */
export let getRequestData = (method, ctx) => {
  return method === 'get' ? ctx.query
    : method === 'post' ? ctx.request.body
      : {}
}

import merge from 'merge'

export let mixinScope = (d, target, defaultScope, scopes) => {
  let scopesAll = defaultScope.concat(scopes)
  if (!scopesAll.length) return target
  let result = scopesAll.map(scope => {
    let res = typeof scope === 'function' ? scope(d) : scope
    if (typeof res === 'function') res = scope()(d)
    return res
  })
  return merge.recursive(true, target, ...result)
}


/**
 * 需要被代理的方法名对象
 *
 * @type {{get: string[], post: string[]}}
 * @private
 */
export let getProxyFunNames = {
  get: [
    'findOne',
    'findAll',
    'findById',
    'findOrCreate',
    'findAndCountAll',
    'findAndCount',
    'findCreateFind',
    'count',
    'max',
    'min',
    'sun'
  ],

  post: [
    'create',
    'bulkCreate',
    'update',
    'destroy',
    'increment',
    'decrement'
  ]
}



