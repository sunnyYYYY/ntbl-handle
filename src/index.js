import merge from 'merge'
import Mock from 'mockjs'
import {
  getOp,
  getRequestData,
  mixinScope,
  initialCap,
  load,
  loadAll,
  isObj,
  tailspin,
  error,
  warn,
  proxyNames,
  requestMethods
} from './utils'
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
  this.defaultScopes = []
  this._data = null

  this.__reset()
}

Handle.prototype = {
  constructor: Handle,
  method,
  raw,
  scope,
  defaultScope,
  rawScope,
  process,
  transaction,
  __internal,
  __process,
  __reset,
  __callHook
}


/**
 * 设置调用方法的请求方法
 * @memberOf Handle
 * @instance
 * @param {string} [name='get'] - 请求方法名（支持 6 种标准 http 请求方法，get/head/put/delete/post/options）
 * @returns this
 *
 * @example
 * article
 *  .method('post')
 *  .findAll()
 */
function method(name = 'get') {
  name = name.toLowerCase()
  if (!requestMethods.includes(name)) error('Only the http standard request method is supported (' + requestMethods.join('/') + ')', name)
  this._opts.method = name
  return this
}

/**
 * 设置原生数据，它会替代 request data 用于查询数据库
 * @memberOf Handle
 * @instance
 * @param {all} data
 * @returns this
 * @example
 * article
 *  .raw('hot')
 *  .increment('id')
 */
function raw(data) {
  this._opts.rawData = data
  return this
}


/**
 * 设置一个或多个 scope（注意，此方法仅在当前方法上生效）
 * @memberOf Handle
 * @instance
 * @param {object|function} scopes
 * @returns {Handle}
 * @see defaultScope rawScope
 */
function scope (...scopes) {
  scopes.forEach(scope => {
    if (!isObj(scope) && typeof scope !== 'function') {
      error('Scope must be a function or object.', `${this.model.name}.scope(→...scopes←)`)
    }
    this._opts.scopes.push(scope)
  })
  return this
}


/**
 * 组合一个或多个实例作用域（作用于实例的每个方法）
 * @memberOf Handle
 * @instance
 * @param {object|function} scopes - 作用域
 * @returns {Handle}
 * @see scope rawScope
 */
function defaultScope (...scopes) {
  scopes.forEach(scope => {
    if (!isObj(scope) && typeof scope !== 'function') {
      error('Scope must be a function or object.', `${this.model.name}.scope(→...scopes←)`)
    }
    this.defaultScopes.push(scope)
  })
  return this
}

/**
 * 组合一个或多个 sequelize 作用域（一层简单的封装）
 * @memberOf Handle
 * @param {object|function} scopes - 要组合的作用域名
 * @returns {Handle}
 * @see defaultScope scope
 */
function rawScope(...scopes) {
  return new Handle(this.model.scope(...scopes), this.options)
}

/**
 * 启用一个过程
 * @memberOf Handle
 * @instance
 * @param {string} [method='get'] - 请求方法
 * @param {asyncFunction} f(data,ctx,next) - 一个 async/await 函数
 * @returns {Function}
 */
function process (method, f) {

  if (typeof method === 'function') [f, method] = [method, 'get']

  if (!requestMethods.includes(method)) error('Only the http standard request method is supported (' + requestMethods.join('/') + ')', method)

  return async (ctx, next) => {
    let data = getRequestData(method, ctx)
    try {
      data = this.__callHook('before', data, ctx, next)
      this._data = data
      let result = await f.call(this, data, ctx, next)
      this._data = null
      result = this.__callHook('after', result, ctx, next)
      return ctx.body = this.__callHook('data', null, result, ctx, next)
    } catch (err) {
      return ctx.body = this.__callHook('data', err, null, ctx, next)
    }
  }
}

/**
 * 启用一个事务
 * @memberOf Handle
 * @instance
 * @param {string} [method='get'] - 请求方法
 * @param {asyncFunction} f(data,ctx,next, t) - 一个 async/await 函数
 * @returns {Function}
 */
function transaction (method, f) {
  return this.process(method, async function (d, ctx, next) {
    return await this.model.sequelize.transaction(t => f.call(this, d, ctx, next, t))
  })
}


function __internal (name, ...options) {
  let { defaultScopes } = this
  // 在闭包中保存当前方法的请求方法、原生数据和作用域
  // 然后重置它们的容器，以便收集下次调用时传入的新数据
  let { method, rawData, scopes } = this.__reset()

  return async (ctx, next) => {
    // 获取请求方法
    const requestMethod = method
      || tailspin(this, `options.proxy.${name}.method`)
      || tailspin(Handle, `defaults.proxy.${name}.method`)
      || 'get'

    // 获取数据
    let data = getRequestData(requestMethod, ctx)

    try {
      data = this.__callHook('before', data, ctx, next)
      // 混合作用域
      let opts = mixinScope(data, defaultScopes, scopes)
      // 原生数据
      if (rawData) {
        data = typeof rawData === 'function' ? rawData(data) : rawData
      }
      // 生成调用方法的参数
      opts = [data, opts].slice(-this.model[name].length)
      // 调用方法
      let result = await this.model[name](...opts)

      result = this.__callHook('after', result, ctx, next)
      return ctx.body = this.__callHook('data', null, result, ctx, next)
    } catch (err) {
      return ctx.body = this.__callHook('data', err, ctx, next)
    }
  }
}


async function __process (name, ...options) {

  let {defaultScopes} = this
  let {rawData, scopes} = this.__reset()

  let data = this._data
  let opts = mixinScope(data, defaultScopes, scopes)
  if (rawData) {
    data = typeof rawData === 'function' ? rawData(data) : rawData
  }
  opts = [data, opts].slice(-this.model[name].length)
  return  await this.model[name](...opts)
}

function __reset() {
  let _opts = this._opts
  this._opts = {
    scopes: [],,
  }

  if (_opts) {
    _opts = merge.recursive(true, {}, _opts)
  }

  return _opts
}

function __callHook (name, ...args) {
  // 获取钩子函数
  const hook = this.options[name]

  return hook && typeof hook === 'function'
    ? hook(...args)
    // TODO #1
    : args.length === 3 ? args[0] : args[1]
}

Handle.defaults = {
  proxy: {},
}


// 在原型上挂载快捷和过程方法
for (let method in proxyNames) {
  proxyNames[method].forEach(name => {
    // 设置每个快捷方法的默认请求方法
    Handle.defaults.proxy[name] = { method }

    // 快捷方法
    Handle.prototype[name] = function (...args) {
      return this.__internal(name, ...args)
    }

    // 过程方法
    Handle.prototype['raw' + initialCap(name)] = function (...args) {
      return this.__process(name, ...args)
    }
  })
}







/**
 *
 * @memberOf Handle
 * @static
 * @param {sequelize} sequelize - Sequelieze 实例
 * @param {string} dir - 文件路径
 * @param {object} [options={}] - 实例化时的选项对象
 * @returns {handle}
 */
Handle.load = load
/**
 * @memberOf Handle
 * @static
 * @param {sequelize} sequelize - Sequelieze 实例
 * @param {string} dir - 文件路径
 * @param {object} [options={}] - 实例化时的选项对象
 * @param {object} [options.rule=''\**\!(index|_)*.js''] - 匹配规则，支持 glob 语法
 * @returns {{filename: handle}}
 */
Handle.loadAll = loadAll



/**
 *
 * scopes 工具集
 * @type {{Scopes}}
 * @see Scopes
 */
Handle.Scopes = Scopes

export default Handle
