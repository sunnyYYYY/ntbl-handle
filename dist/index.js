/**
 * Handle.js，
 * 一个基于 koa 和 sequelize 的中间库,
 * 让你只专注于接口逻辑。
 *
 * @constructor
 * @param {Model} model - sequelize 的模型对象
 * @param {Object} options - 选项对象
 * @param {Function} options.before(data, ctx, next) - 全局钩子。在数据库操作之前调用，接受前端传来的数据对象 data。
 * @param {Function} options.after(data, ctx, next) - 全局钩子。在数据库操作之后调用，接受数据库返回数据对象 data
 * @param {Function} options.error(err) - 全局钩子，接受错误对象 err。捕捉钩子抛出和数据库操作的异常
 */
export default class Handle {
  constructor (model, options = {}) {
    this.model = model
    this.options = options
    this._proxyFuncs = {
      get: ['findOne', 'findAll', 'findById', 'findOrCreate', 'findAndCountAll', 'findAndCount', 'findCreateFind', 'count', 'max', 'min', 'sun'],
      post: ['create', 'bulkCreate', 'update', 'destroy', 'increment', 'decrement']
    }
    this.__init(this._proxyFuncs)
  }

  /**
   * 指定一个作用域，返回一个新的实例
   * @param {string} args - 多个作用域
   * @returns {Handle}
   */
  scope (...args) {
    return new Handle(this.model(...args), this.options)
  }

  /**
   * 根据查询结果，如果存在则删除，不存在则创建
   * @param o
   * @param after
   * @param before
   * @returns {Function}
   */
  toggle (...args) {
    return async (ctx, next) => await this.findOneRaw(...args)(ctx, next)
      ? await this.destroy(...args)(ctx, next)
      : await this.create(...args)(ctx, next)
  }

  /**
   * 实例化，批量生成方法
   *
   * @param map
   * @private
   */
  __init (map) {
    for (let method in map) {
      map[method].forEach(funcName => {
        Handle.prototype[funcName] = (...args) => this.__base(true, method, funcName, ...args)
        Handle.prototype[funcName + 'Raw'] = (...args) => this.__base(false, method, funcName, ...args)
      })
    }
  }
  /**
   *
   * @param {Boolean} isRaw - 如何代理数据库返回数据，通过 ctx.body 或 return
   * @param {string} method - http 请求方法
   * @param {string} funcName - sequelize 模型对象上的方法名
   * @param {string|Array|Function} - o 模型方法的选项
   * @param {Function} after - 局部钩子, 在全局钩子 after 之前调用
   * @param {Function} before - 局部钩子，在全局钩子 before 之前调用
   * @returns {*}
   * @private
   */
  __base (isRaw, method, funcName, o, after, before) {
    const {
      before: globalBefore,
      after: globalAfter,
      error: globalError } = this.options
    return async (ctx, next) => {
      let d = getRequestData(method, ctx)
      let result
      try {
        // before 钩子
        typeof before === 'function'       && (d = before(d, ctx, next))
        typeof globalBefore === 'function' && (d = globalBefore(d, ctx, next))
        // 获取模型方法的选项
        let op = getOp(o, d, ctx, next)
        // 根据模型方法参数个数生成参数对象
        const func = this.model[funcName].bind(this.model)
        let len = func.length
        op = len === 1 ? [op] : len === 2 ? [d, op] : []
        // 数据库操作
        result = await func(...op)
        typeof after === 'function'         && (result = after(result, ctx, next))
        typeof globalAfter === 'function'   && (result = globalAfter(result, ctx, next))
        // 代理模式
        if (isRaw) ctx.body = result
        else return result
      } catch (e) {
        let err = e
        typeof globalError === 'function' && (err = await globalError(e))
        if (isRaw) ctx.body = err
        else return err
      }
    }
  }
}
function getOp(o, data, ctx, next) {
  if (typeof o === 'string') o = [o]

  if (Array.isArray(o)) {
    return {
      where: o.reduce((ret, res) => {
        if (typeof res === 'string') ret[res] = data[res]
        if (Array.isArray(res)) ret[res[0]] = res[1]
        return ret
      }, {})
    }
  }
  else if (typeof o === 'function') return o(data, ctx, next)
  return {}
}
function getRequestData(method, ctx) {
  return method === 'get' ? ctx.query
    : method === 'post' ? ctx.request.body
      : {}
}
