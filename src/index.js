import {
  getOp,
  getRequestData,
  mixinScope,
  proxyNames,
  initialCap,
  load,
  loadAll,
  error,
  isObj,
  warn,
  requestMethods
} from './utils'
import Include from "./inclue"
import Scopes from './scopes'


/**
 * Handle.js，
 * 一个基于 koa 和 sequelize 的中间库,
 * 让你只专注于接口逻辑。
 *
 * @constructor
 * @param {Model} model - sequelize 的模型实例
 * @param {object} [options={}] - 选项对象
 * @param {Mock} [options.mock=null] - mock 库，以启用 Handle.prototype.mock 方法
 * @param {function} [options.before(data, ctx, next)] - 全局钩子。before 钩子在数据库操作之前执行。
 * @param {function} [options.after(result, ctx, next)] - 全局钩子。 after 钩子在数据库操作之后执行
 * @param {function} [options.data(err, data, ctx, next)] - 全局钩子。data 钩子可以在返回数据到前端之前和捕获异常之后做一些处理。
 */

function Handle(model, options = {}) {
  if (!(this instanceof Handle)) return new Handle(model, options = {})
  this.model = model
  this.options = options
  this._scopes = []
  this._defaultScopes = []
  this._data = null
  this._method = null
}

Handle.prototype = {
  constructor: Handle,
  scope,
  defaultScope,
  rawScope,
  process,
  transaction,
  mock,
  method,
  __clearScope,
  __internal,
  __process,
  __callHook
}


function method(s) {
  s = s.toLowerCase()
  if (!requestMethods.includes(s)) error('Only the http standard request method is supported (' + requestMethods.join('/') + ')', s)
  this._method = s
  return this
}

/**
 * 组合一个或多个 scope（仅在当前方法上生效）
 *
 * @since 1.0.0
 * @param {object|function} scopes
 * @returns {Handle}
 * @see defaultScope rawScope
 */
function scope (...scopes) {
  this.__clearScope()
  scopes.forEach(scope => {
    if (!isObj(scope) && typeof scope !== 'function') {
      error('Scope must be a function or object.', `${this.model.name}.scope(→...scopes←)`)
    }
  })
  return this
}
/**
 * 清除已添加的方法作用域
 *
 * @returns {Array}
 * @private
 */
function __clearScope () {
  const scopes = this._scopes
  this._scopes = []
  return scopes
}
/**
 * 组合一个或多个实例作用域（作用于实例的每个方法）
 *
 * @since 1.0.0
 * @param {object|function} scopes - 作用域
 * @returns {Handle}
 * @see scope rawScope
 */
function defaultScope (...scopes) {
  scopes.forEach(scope => {
    if (!isObj(scope) && typeof scope !== 'function') {
      error('Scope must be a function or object.', `${this.model.name}.scope(→...scopes←)`)
    }
    this._defaultScopes.push(scope)
  })
  return this
}
/**
 * 组合一个或多个 sequelize 作用域（一层简单的封装）
 *
 * @since 1.0.0
 * @param {object|function} scopes - 要组合的作用域名
 * @returns {Handle}
 * @see defaultScope scope
 */
function rawScope(...scopes) {
  return new Handle(this.model.scope(...scopes), this.options)
}
/**
 * 启用一个过程
 *
 * @since 1.0.0
 * @param {string} [method='get'] - 请求方法
 * @param {asyncFunction} f(data,ctx,next) - 一个 async/await 函数
 * @returns {Function}
 */
function process (method, f) {
  if (!requestMethods.includes(method)) error('Only the http standard request method is supported (' + requestMethods.join('/') + ')', method)

  this.mode = true
  if (typeof method === 'function') [f, method] = [method, 'get']

  return async (ctx, next) => {
    let data = getRequestData(method, ctx)
    try {
      data = this.__callHook('before', data, ctx, next)
      this._data = data
      let result = await f.call(this, data, ctx, next)
      this._data = null
      result = this.__callHook('after', result, ctx, next)
      return ctx.body = this.__callHook('data', result, ctx, next)
    } catch (err) {
      return ctx.body = this.__callHook('data', err, ctx, next)
    }
  }
}
/**
 * 启用一个事务
 *
 * @since 1.0.0
 * @param {string} [method='get'] - 请求方法
 * @param {asyncFunction} f(data,ctx,next, t) - 一个 async/await 函数
 * @returns {Function}
 */
function transaction (method, f) {
  return this.process(method, async function (d, ctx, next) {
    return await this.model.sequelize.transaction(t => f.call(this, d, ctx, next, t))
  })
}
/**
 * 向数据库中批量插入由 mock 生成的随机数据
 *
 * @since 1.0.0
 * @category String
 * @param {object} rule - mock 的生成规则
 * @example
 *
 * // 生成 10 条数据（mockjs 为例）
 * h.mock({
 *  'data|10': [
 *    {
 *      title: '@ctitle',
 *      content: '@cparagraph',
 *    }
 *  ]
 * })
 *
 * @returns {*}
 */
function mock (rule) {
  const Mock = this.options.mock
  if (!Mock) error(
    'Handle.prototype.mock 方法依赖 mock 库，推荐使用 mockjs' +
    '\n npm install mockjs --save' +
    '\n 然后，在 Handle.options.mock = Mock 使用指定的 mock 库'
  )

  return this.bulkCreate(Mock.mock(rule).data, {})
}
function __internal (name, scopes, ...options) {
  return async (ctx, next) => {
    const method = this._method
      || this.options.proxy && this.options.proxy[name] && this.options.proxy[name].method
      || Handle.defaults.proxy[name].method
      || 'get'
    let data = getRequestData(method, ctx)
    this._method = null
    try {
      data = this.__callHook('before', data, ctx, next)
      let opts = getOp(options, data)
      opts = mixinScope(data, opts, this._defaultScopes, scopes)
      console.log(opts)
      opts = [data, opts].slice(-this.model[name].length)
      let result = await this.model[name](...opts)
      result = this.__callHook('after', result, ctx, next)
      return ctx.body = this.__callHook('data', result, ctx, next)
    } catch (err) {
      return ctx.body = this.__callHook('data', err, ctx, next)
    }
  }
}
async function __process (name, scopes, ...options) {
  // if (options == null) [d, options] = [undefined, d]
  let data = this._data
  let opts = getOp(options, data)
  opts = mixinScope(data, opts, this._defaultScopes, scopes)
  opts = [data, opts].slice(-this.model[name].length)
  return  await this.model[name](...opts)
}
function __callHook (name, data, ctx, next) {
  const hook = this.options[name]
  return hook && typeof hook === 'function'
    ? hook(data, ctx, next)
    : data
}

Handle.defaults = {
  proxy: {},
}

for (let method in proxyNames) {
  const value = proxyNames[method]

  value.forEach(name => {

    Handle.defaults.proxy[name] = { method }

    Handle.prototype[name] = function (...args) {
      return this.__internal(name, this.__clearScope(), ...args)
    }

    Handle.prototype['raw' + initialCap(name)] = function (...args) {
      return this.__process(name, this.__clearScope(), ...args)
    }
  })
}

Handle.load = load
Handle.loadAll = loadAll



/**
 * 关联生成器
 *
 * @since 1.0.0
 * @type {Include}
 * @see Include
 */
Handle.Include = new Include()
/**
 * scopes 工具集
 * @type {{Scopes}}
 * @see Scopes
 */
Handle.Scopes = Scopes

export default Handle
