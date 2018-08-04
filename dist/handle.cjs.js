/*!
 * handle v1.0.0
 * (c) 2017-2018 Sunny
 * Released under the MIT License.
 */
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var merge = _interopDefault(require('merge'));

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
let getOp = (o, data, ctx, next) => {
  if (typeof o === 'string') o = [o];

  if (Array.isArray(o)) {
    return {
      where: o.reduce((ret, res) => {
        if (typeof res === 'string') ret[res] = data[res];
        if (Array.isArray(res)) ret[res[0]] = /^@/.test(res[1]) ? data[res[1].slice(1)] : res[1];
        return ret
      }, {})
    }
  }
  else if (typeof o === 'function') return o(data, ctx, next)
  return o || {}
};


/**
 * 返回 get 或 post 请求的 request body data
 *
 * @param {string} method - 请求方法
 * @param ctx
 * @returns {{}}
 * @private
 */
let getRequestData = (method, ctx) => {
  return method === 'get' ? ctx.query
    : method === 'post' ? ctx.request.body
      : {}
};

let mixinScope = (d, target, defaultScope, scopes) => {
  let scopesAll = defaultScope.concat(scopes);
  if (!scopesAll.length) return target
  let result = scopesAll.map(scope => {
    let res = typeof scope === 'function' ? scope(d) : scope;
    if (typeof res === 'function') res = scope()(d);
    return res
  });
  return merge.recursive(true, target, ...result)
};


/**
 * 需要被代理的方法名对象
 *
 * @type {{get: string[], post: string[]}}
 * @private
 */
let getProxyFunNames = {
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
};

/**
 * 关联查询的辅助类，
 * 通过 add 添加模型的基本 include，然后由 create 指定层级关系，并生成复杂的关联查询。
 *
 * @constructor
 *
 */
class Include {
  constructor () {
    this.__maps = {};
  }

  /**
   * 添加一个 include
   *
   * @param {string} name - include 的名称
   * @param {object|function} f - 一个返回 include 数据的方法，如果为对象，则简单的封装成一个函数
   * @returns {Include}
   */
  add (name, f) {
    //TODO: 让关联函数接受 request body data
    const maps = this.__maps;
    if (typeof f !== 'function') f = () => f;
    maps[name] = f.bind(maps);
    return this
  }

  /**
   * 移除一个 include
   * @param {string} name - include 的名称
   * @returns {boolean}
   */
  remove (name) {
    const maps = this.__maps;
    return delete maps[name]
  }

  /**
   * 获取一个 include
   * @param {string} name - include 的名称
   * @returns {*}
   */
  get (name) {
    const maps = this.__maps;
    return maps[name]
  }

  /**
   * 组合 include 生成更复杂的 include
   * @param {...args} scopes - 指定的层级关系
   * @returns {Array}
   */


  create (...args) {
    const maps = this.__maps;
    return (function _create(scopes, ret = []) {
      for (let key in scopes) {
        let value = scopes[key];
        if (typeof value === 'string') ret.push(maps[value]());
        else if (Array.isArray(value)) _create(value, ret);
        else {
          let [_k, _v] = Object.entries(value)[0];
          let d = maps[_k]();
          d.include = [];
          ret.push(d);
          _create(_v, d.include);
        }
      }
      return ret
    })(args)
  }




}

// import Base from './interface'


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
 * @extends Base
 */
class Handle{
  constructor (model, options = {}) {
    // super()
    this.model = model;
    this.options = options;
    // TODO: 方法作用域需要在恰当的时机清空，以保证其他方法不会受到干扰
    this._defaultScopes = [];  // 存放实例作用域的容器
    this._scopes = [];         // 存放方法作用域的容器
    this._data = {};           // 临时保存 request body data (过程方法的 HACK)

    this.__init(getProxyFunNames);
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
    scopes.forEach(scope => this._defaultScopes.push(scope));
    return this
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
    this._scopes = []; // TODO 清空实例作用域的代码，放这里只是用于测试
    scopes.forEach(scope => this._scopes.push(scope));
    return this
  }

  /**
   * 组合一个或多个 sequelize 作用域（一层简单的封装）
   *
   * @since 1.0.0
   * @param {object|function} scopeNames - 要组合的作用域名
   * @returns {Handle}
   * @see defaultScope scope
   */
  rawScope (...scopeNames) {
    return new Handle(this.model.scope(...scopeNames), this.options)
  }


  /**
   * 开始一个过程流程，并结合过程方法（raw*）提供更灵活的空间。
   * 过程的流程处在【获取前端数据】与【返回数据到前端】之间,
   * 过程方法（以 raw 开头的模型方法）专门为过程流程而生，
   * 它不同于快捷方法，过程方法返回从数据库来的数据，并由你决定如何处理。
   * 很合适数据验证、过滤和对数据库多次操作的场景。
   * 全局钩子的行为发生了一些变化，在整个过程流程中只会执行一次。
   * （注意，流程结束时，必须 return 出返回前端的数据）
   *
   * @since 1.0.0
   * @param {string} [method='get'] - 请求方法
   * @param {asyncFunction} f(data,ctx,next) - 一个 async/await 函数
   * @returns {Function}
   */
  process (method, f) {
    if (typeof method === 'function') {f = method; method = 'get';}

    const {
      before: globalBefore,
      after: globalAfter,
      data: globalData
    } = this.options;

    return async (ctx, next) => {
      let data = getRequestData(method, ctx);
      try {
        globalBefore && globalBefore(data, ctx, next);

        // 过程方法内部需用 request body data 处理 where 处理子句简写和作用域
        // 不过，在流程开始后，接受的仍然是正常的 request body data
        // 所以在流程内部无法访问到 data（总体看，这个 hack 可以接受）
        // 见下文 (237行)
        this._data = data;
        let result = await f.call(this, data, ctx, next);
        this._data = {};

        if (globalAfter) result = globalAfter(result, ctx, next);
        return ctx.body = globalData(undefined, result, ctx, next)
      } catch (err) {
        return ctx.body = globalData(err, null, ctx, next)
      }
    }
  }

  /**
   * TODO: 需重写
   */
  toggle (...args) {
    return async (ctx, next) => {
      const result = await this.__base('post', 'findOne', ...args)(ctx, next);
      if (result) {
        await this.__base('post', 'destroy', ...args)(ctx, next);
      } else {
        await this.__base('post', 'create', ...args)(ctx, next);
      }
    }
  }

  /**
   * TODO: 未实现（事务）
   */
  transaction () {}

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
    const Mock = this.options.mock;
    if (!Mock) throw new Error(
      'Handle.prototype.mock 方法依赖 mock 库，推荐使用 mockjs' +
      '\n npm install mockjs --save' +
      '\n 然后，在 Handle.options.mock = Mock 使用指定的 mock 库'
    )

    return this.bulkCreate({}, _ => Mock.mock(rule).data)
  }

  /**
   * 实例化时，批量生成两套方法（快捷方法和过程方法）
   *
   * @param {object} map
   * @private
   */
  __init (map) {
    for (let method in map) {
      map[method].forEach(funcName => {
        // 注意，绝逼不能用箭头函数，之间引起了模型引用错乱的 bug（mnp）
        Handle.prototype[funcName] = function (...args) {
          return this.__base(method, funcName, ...args)
        };
        const rawFuncName = 'raw' + funcName[0].toUpperCase() + funcName.substring(1);
        Handle.prototype[rawFuncName] = function (...args) {
          return this.__processBase(funcName, ...args)
        };
      });
    }
  }

  /**
   * 快捷方法的基本函数
   *
   * @param {string} method - http 请求方法
   * @param {string} funcName - sequelize 模型对象上的方法名
   * @param {string|Array|Function} - o 模型方法的选项
   * @param {Function} after - 局部钩子, 在全局钩子 after 之后调用（不推荐使用，请用过程流程代替）
   * @param {Function} before - 局部钩子，在全局钩子 before 之后调用（不推荐使用，请用过程流程代替）
   * @returns {*}
   * @private
   */

  __base (method, funcName, o, before, after) {
    const {
      before: globalBefore,
      after: globalAfter,
      data: globalData
    } = this.options;

    return async (ctx, next) => {
      let data = getRequestData(method, ctx);
      try {
        if (globalBefore) data = globalBefore(data, ctx, next);
        if(before) data = before(data, ctx, next);
        // 生成模型方法的选项对象并混合作用域
        let op = getOp(o, data, ctx, next);
        op = mixinScope(data, op, this._defaultScopes, this._scopes);
        // 根据模型方法的参数个数生成对应的参数数据
        const func = this.model[funcName];
        let len = func.length;
        op = len === 1 ? [op] : len === 2 ? [data, op] : [];
        // 操作数据库
        let result = await func.apply(this.model, op);

        if (globalAfter) result = globalAfter(result, ctx, next);
        if (after) result = after(result, ctx, next);
        return ctx.body = globalData(undefined, result, ctx, next)
      } catch (err) {
        return ctx.body = globalData(err, null, ctx, next)
      }
    }
  }

  /**
   * 过程方法的基本方法
   *
   * @param {string} funcName - sequelize 模型对象上的方法名
   * @param {object} d - request body data
   * @param {string|Array|Function} - o 模型方法的选项
   * @returns {Promise<void>}
   * @private
   */
  async __processBase(funcName, d, o) {
    if (!o) {o = d; d = null;}
    // 接上（100行）
    // 为什么不用 d？而是迂回。
    // 因为使过程方法的使用和快捷方法一致（除了 create 类的方法）
    // 因为支持了 where 子句简写和作用域，又不能要求每次调用过程方法都必须显式的把 data 传入，所以只好迂回而入。
    // 为什么不包括 create 类的方法，因为在数据插入当数据库之前，你可能会验证和预处理这些数据。
    const data = this._data;
    // 生成模型方法的选项对象并混合作用域
    let op = getOp(o, data);
    op = mixinScope(data, op, this._defaultScopes, this._scopes);
    // 根据...
    op = d ? [d, op] : [op];
    return await this.model[funcName](...op)
  }

}


/**
 * 关联生成器
 *
 * @since 1.0.0
 * @type {Include}
 * @see Include
 */
Handle.Include = new Include();

module.exports = Handle;
