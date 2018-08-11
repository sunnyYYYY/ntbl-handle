import {getOp, getRequestData, mixinScope, proxyNames, initialCap} from './utils'
import Include from "./inclue"

/**
 * Handle.js，
 * 一个基于 koa 和 sequelize 的中间库,
 * 让你只专注于接口逻辑。
 *
 * @constructor
 * @param {Model} model - sequelize 的模型实例
 * @param {object} [options={}] - 选项对象
 * @param {Mock} [options.mock=null] - mock 库，以启用 Handle.prototype.mock 方法
 * @param {function} [options.before(data, ctx, next)] - 全局钩子。before 钩子在数据库操作之前执行。（注意，全局钩子 before 与快捷方法的 before 函数行为一致，但 before 函数在 全局钩子 before 之后调用，可能会发生覆盖。）
 * @param {function} [options.after(result, ctx, next)] - 全局钩子。 after 钩子在数据库操作之后执行（注意，情况和全局钩子 before 相同）
 * @param {function} [options.data(err, data, ctx, next)] - 全局钩子。data 钩子可以在返回数据到前端之前和捕获异常之后做一些处理。
 */
class Handle {
  constructor (model, options = {}) {
    this.model = model
    this.options = options
    this._scopes = []
    this._defaultScopes = []
    this._data = null
  }

  /**
   * 组合一个或多个方法作用域（仅作用于接下来第一次使用的方法）
   *
   * @since 1.0.0
   * @param {object|function} scopes - 作用域
   * @returns {Handle}
   * @see defaultScope rawScope
   */
  scope (...scopes) {
    this.__clearScope()
    scopes.forEach(scope => this._scopes.push(scope))
    return this
  }

  /**
   * 清除已添加的方法作用域
   *
   * @returns {Array}
   * @private
   */
  __clearScope () {
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

  defaultScope (...scopes) {
    scopes.forEach(scope => this._defaultScopes.push(scope))
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
  rawScope(...scopes) {
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
  process (method, f) {
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

  transaction (method, f) {
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
  mock (rule) {
    const Mock = this.options.mock
    if (!Mock) throw new Error(
      'Handle.prototype.mock 方法依赖 mock 库，推荐使用 mockjs' +
      '\n npm install mockjs --save' +
      '\n 然后，在 Handle.options.mock = Mock 使用指定的 mock 库'
    )

    return this.bulkCreate(Mock.mock(rule).data, {})
  }

  /**
   * 查询数据是否存在，存在则删除，不存在则创建
   *
   * @param args
   * @returns {Function}
   */
  toggle (...args) {
    return this.process(async function (d) {
      const res = await this.rawFindOne(...args)
      return res
        ? this.rawDestroy(...args)
        : this.rawCreate()
    })
  }

  /**
   * 查询数据是否存在，存在则删除，不存在则创建
   *
   * @param args
   * @returns {Promise<*>}
   */
  async rawToggle (...args) {
    const res = await this.rawFindOne(...args)
    return res
      ? this.rawDestroy(...args)
      : this.rawCreate()
  }


  __internal (method, name, scopes, d, options) {
    if (options == null) [d, options] = [undefined, d]
    return async (ctx, next) => {
      let data = getRequestData(method, ctx)
      try {
        data = this.__callHook('before', data, ctx, next)
        let opts = getOp(options, data, ctx, next)
        opts = mixinScope(data, opts, this._defaultScopes, scopes)
        opts = [d || data, opts].slice(-this.model[name].length)
        let result = await this.model[name](...opts)
        result = this.__callHook('after', result, ctx, next)
        return ctx.body = this.__callHook('data', result, ctx, next)
      } catch (err) {
        return ctx.body = this.__callHook('data', err, ctx, next)
      }
    }
  }

  async __process (name, scopes, d, options) {
    if (options == null) [d, options] = [undefined, d]
    let data = this._data
    let opts = getOp(options, data)
    opts = mixinScope(data, opts, this._defaultScopes, scopes)
    opts = [d || data, opts].slice(-this.model[name].length)
    return  await this.model[name](...opts)
  }

  __callHook (name, data, ctx, next) {
    const hook = this.options[name]
    return hook && typeof hook === 'function'
      ? hook(data, ctx, next)
      : data
  }

}


for (let method in proxyNames) {
  const value = proxyNames[method]
  value.forEach(name => {
    Handle.prototype[name] = function (...args) {
      return this.__internal(method, name, this.__clearScope(), ...args)
    }

    Handle.prototype['raw' + initialCap(name)] = function (...args) {
      return this.__process(name, this.__clearScope(), ...args)
    }
  })
}

/**
 * 关联生成器
 *
 * @since 1.0.0
 * @type {Include}
 * @see Include
 */
Handle.Include = new Include()

export default Handle
