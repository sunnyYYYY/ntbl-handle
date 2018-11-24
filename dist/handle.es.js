/*!
 * handle v1.0.0
 * (c) 2017-2018 Sunny
 * Released under the MIT License.
 */
import _merge from 'merge';
import path from 'path';
import chalk from 'chalk';
import { Op } from 'sequelize';
import escapeStringRegexp from 'escape-string-regexp';
import glob from 'glob';

const PATTERN_IDENTIFIER = /[A-Za-z_][A-Za-z0-9_]*/;

let requestMethods = ['get', 'head', 'put', 'delete', 'post', 'options'];

let isObj = value => Object.prototype.toString.call(value) === '[object Object]';
let noop = () => {};
let error = (msg, msg2 = '') => {
  console.error(chalk.bgRed(' ERROR ') + ' ' + chalk.red(msg) + (msg2 ? ' ☞ ' +  chalk.gray(msg2) : ''));
  process.exit(1);
};

let load = (sequelize, dir, options) => {
  if (typeof dir !== 'string') {
    error('dir must be a string.', 'load(sequelize, →dir←, options)');
  }

  try {
    return new Handle(sequelize.import(dir), options)
  } catch (e) {

    if (load.length === 1) {
      error('You may not have passed in the Sequelie instance, it imports the model using import.');
    }

    error('Please check the path, it may be wrong.', dir);
  }
};

let loadAll = function (sequelize, dir, options = {}) {

  if (typeof dir !== 'string') {
    error('dir must be a string.', 'load(sequelize, →dir←, options)');
  }

  const { rule = '/**/!(index|_)*.js' } = options;
  return glob
    .sync(path.join(dir, rule))
    .reduce((ret, file) => {
      ret[path.parse(file).name] = this.load(sequelize, file, options);
      return ret
    }, {})
};


/**
 * 生成模型方法的选项对象，支持 where 子句的快捷写法
 *
 * @param {string|array|function} o - 生成数据
 * @param {object} data - request body data
 * @returns object
 * @private
 */
let getOp = (o, data) => {
  if (typeof o === 'string') o = [o];
  else if (typeof o === 'function') return o(data)

  if (Array.isArray(o)) {
    return {
      where: o.reduce((ret, res) => {
        if (typeof res === 'string') parseSign(res, '@' + res, ret, data);
        else if (Array.isArray(res)) parseSign(res[0], res[1], ret, data);
        return ret
      }, {})
    }
  }

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
  method = method.toLowerCase();
  console.log(method);
  return method === 'get' ? ctx.query
    : method === 'post' ? ctx.request.body
      : {}
};


/**
 * 混合作用域
 *
 * @param d
 * @param target
 * @param defaultScope
 * @param scopes
 * @returns {*}
 * @private
 */
let mixinScope = (d, target, defaultScope, scopes) => {
  let scopesAll = defaultScope.concat(scopes);
  if (!scopesAll.length) return target
  let result = scopesAll.map(scope => {
    let res = typeof scope === 'function' ? scope(d) : scope;
    if (typeof res === 'function') res = scope()(d);
    return res
  });
  return _merge.recursive(true, target, ...result)
};

/**
 * 首字母大写
 *
 * @param str
 * @returns {string}
 * @private
 */
let initialCap = str => str[0].toUpperCase() + str.substring(1);

/**
 * 需要被代理的方法名对象
 *
 * @type {{get: string[], post: string[]}}
 * @private
 */
let proxyNames = {
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


function parseSign (a, b, source, target) {
  let key = a.match(PATTERN_IDENTIFIER);
  let optionKey = key;
  let value = b;
  key = key && key[0];

  // 别名
  if (typeof b === 'string' && /^@/.test(b)) {
    optionKey = b.match(PATTERN_IDENTIFIER)[0];
    value = target[optionKey];
  }

  // 可选项
  if (/^!/.test(a) && target[optionKey] == null) return

  // Op

  let opTag = {
    '>': 'gt',
    '>=': 'gte',
    '<': 'lt',
    '<=': 'lte',
    '!=': 'ne',
    '=': 'and',
    '$and': 'and',
    '$or': 'or',
    '$gt': 'gt',
    '$gte': 'gte',
    '$lt': 'lt',
    '$lte': 'lte',
    '$ne': 'ne',
    '$eq': 'eq',
    '$not': 'not',
    '$between': 'between',
    '$notBetween': 'notBetween',
    '$in': 'in',
    '$notIn': 'notIn',
    '$like': 'like',
    '$notLike': 'notLike',
    '$iLike': 'iLike',
    '$regexp': 'regexp',
    '$iRegexp': 'iRegexp',
    '$notIRegexp': 'notIRegexp',
    '$overlap': 'overlap',
    '$contains': 'contains',
    '$contained': 'contained',
    '$any': 'any',
    '$col': 'col',
  };
  let argMatch = a.match(new RegExp('(' + Object.keys(opTag).map(arg => escapeStringRegexp(arg)).join('|') +
    ')'));
  let arg = opTag[argMatch ? argMatch[0] : '='];

  if (arg === 'and') {
    if (!source[key]) source[key] = [];
    source[key] = value;
  }
  else {
    if (!source[key]) source[key] = {};
    source[key][Op[arg]] = value;
  }
}

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
      return {include: ret}
    })(args)

  }
}

/**
 * where 子句简写支持
 *
 * @param options {string|array|object|function}
 * @returns {function(*=): {where}}
 */
let where = options => d => getOp(options, d);


let z = value => Array.isArray(value) ? value : [value];
let m = (f, d) => z(f).filter(f => f => typeof f === 'function').map(f => f(d));
let p = d => filed => {
  if (typeof filed === 'string') return d[filed]
  if (Array.isArray(filed)) return d[filed[0]] === filed[1]
  if (typeof filed === 'function') filed(d);
};

/**
 * 前置条件
 *
 * @param fields
 * @param f1
 * @param f2
 * @returns {function(*=): *}
 */
let it = (fields, f1 = noop, f2 = noop) => d => _merge.recursive(true, ...(z(fields).every(p(d)) ? m(f1, d) : m(f2, d)));

/**
 * 右模糊匹配
 *
 * @param field
 * @param key
 * @returns {function(*): (*|{where: {[p: string]: undefined}})}
 */
let fuzzyQueryRight = (field = 'name', key) => {
  if (key == null) key = field;
  return d => d[key] && {
    where: {
      [field]: {
        'like': `${d[key]}%`
      }
    }
  }
};


/**
 * 左模糊匹配
 *
 * @param field
 * @param key
 * @returns {function(*): (*|{where: {[p: string]: undefined}})}
 */
let fuzzyQueryLeft = (field = 'name', key) => {
  if (key == null) key = field;
  return d => d[key] && {
    where: {
      [field]: {
        'like': `%${d[key]}`
      }
    }
  }
};

/**
 * 模糊匹配
 *
 * @param field
 * @param key
 * @returns {function(*): (*|{where: {[p: string]: undefined}})}
 */
let fuzzyQuery = (field = 'name', key) => {
  if (key == null) key = field;
  return d => d[key] && {
    where: {
      [field]: {
        'like': `%${d[key]}%`
      }
    }
  }
};


/**
 * 分页查询
 *
 * @param {object} d - request body data
 * @param {number} [defaultCount=5] -每页的默认数量
 * @param {number} [defaultPage=0] - 默认从第 0 页开始
 * @returns {Object}
 */
let pagination = (defaultCount = 5, defaultPage = 0) => {
  return d => {
    const count = ~~d.count || defaultCount;
    const page = ~~d.page || defaultPage;
    return {
      limit: count,
      offset: page * count
    }
  }
};

/**
 * 关联
 *
 * @param args
 * @returns {function(*): {include: *[]}}
 */
let includes = (...args) => d => ({include: args});


/**
 * 排序
 *
 * @param value
 * @returns {function(*): {order: *}}
 */
let order = value => d => ({order: value});

/**
 * 深度合并多个对象或函数
 *
 * @param args
 * @returns {function(*=): *}
 */
let merge = (...args) =>  d =>  _merge.recursive(true, d, ...args.map(f => typeof f === 'function' ? f(d) : f));


// /**
//  * 设置或修改 d 对象 (用法和 where 一致)
//  *
//  * @param keys
//  * @returns {function(*=): any}
//  */
// let set = (...keys) => d => Object.assign(d, superNormalize(d, keys, value => value != null))
//
// /**
//  * 删除 d 对象的字段
//  *
//  * @param args
//  * @returns {function(*): void}
//  */
// let del = (...args) => d => args.forEach(filed => filed in d && delete d[filed])



var Scopes = {
  where,
  fuzzyQueryRight,
  fuzzyQueryLeft,
  fuzzyQuery,
  it,
  pagination,
  merge,
  includes,
  order
};

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
  this.model = model;
  this.options = options;
  this._scopes = [];
  this._defaultScopes = [];
  this._data = null;
  this._method = null;
}

Handle.prototype = {
  constructor: Handle,
  scope,
  defaultScope,
  rawScope,
  process: process$1,
  transaction,
  mock,
  method,
  __clearScope,
  __internal,
  __process,
  __callHook
};


function method(s) {
  s = s.toLowerCase();
  if (!requestMethods.includes(s)) error('Only the http standard request method is supported (' + requestMethods.join('/') + ')', s);
  this._method = s;
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
  this.__clearScope();
  scopes.forEach(scope => {
    if (!isObj(scope) && typeof scope !== 'function') {
      error('Scope must be a function or object.', `${this.model.name}.scope(→...scopes←)`);
    }
  });
  return this
}
/**
 * 清除已添加的方法作用域
 *
 * @returns {Array}
 * @private
 */
function __clearScope () {
  const scopes = this._scopes;
  this._scopes = [];
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
      error('Scope must be a function or object.', `${this.model.name}.scope(→...scopes←)`);
    }
    this._defaultScopes.push(scope);
  });
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
function process$1 (method, f) {
  if (!requestMethods.includes(method)) error('Only the http standard request method is supported (' + requestMethods.join('/') + ')', method);

  this.mode = true;
  if (typeof method === 'function') [f, method] = [method, 'get'];

  return async (ctx, next) => {
    let data = getRequestData(method, ctx);
    try {
      data = this.__callHook('before', data, ctx, next);
      this._data = data;
      let result = await f.call(this, data, ctx, next);
      this._data = null;
      result = this.__callHook('after', result, ctx, next);
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
  const Mock = this.options.mock;
  if (!Mock) error(
    'Handle.prototype.mock 方法依赖 mock 库，推荐使用 mockjs' +
    '\n npm install mockjs --save' +
    '\n 然后，在 Handle.options.mock = Mock 使用指定的 mock 库'
  );

  return this.bulkCreate(Mock.mock(rule).data, {})
}
function __internal (name, scopes, ...options) {
  return async (ctx, next) => {
    const method = this._method
      || this.options.proxy && this.options.proxy[name] && this.options.proxy[name].method
      || Handle.defaults.proxy[name].method
      || 'get';
    let data = getRequestData(method, ctx);
    this._method = null;
    try {
      data = this.__callHook('before', data, ctx, next);
      let opts = getOp(options, data);
      opts = mixinScope(data, opts, this._defaultScopes, scopes);
      console.log(opts);
      opts = [data, opts].slice(-this.model[name].length);
      let result = await this.model[name](...opts);
      result = this.__callHook('after', result, ctx, next);
      return ctx.body = this.__callHook('data', result, ctx, next)
    } catch (err) {
      return ctx.body = this.__callHook('data', err, ctx, next)
    }
  }
}
async function __process (name, scopes, ...options) {
  // if (options == null) [d, options] = [undefined, d]
  let data = this._data;
  let opts = getOp(options, data);
  opts = mixinScope(data, opts, this._defaultScopes, scopes);
  opts = [data, opts].slice(-this.model[name].length);
  return  await this.model[name](...opts)
}
function __callHook (name, data, ctx, next) {
  const hook = this.options[name];
  return hook && typeof hook === 'function'
    ? hook(data, ctx, next)
    : data
}

Handle.defaults = {
  proxy: {},
};

for (let method in proxyNames) {
  const value = proxyNames[method];

  value.forEach(name => {

    Handle.defaults.proxy[name] = { method };

    Handle.prototype[name] = function (...args) {
      return this.__internal(name, this.__clearScope(), ...args)
    };

    Handle.prototype['raw' + initialCap(name)] = function (...args) {
      return this.__process(name, this.__clearScope(), ...args)
    };
  });
}

Handle.load = load;
Handle.loadAll = loadAll;



/**
 * 关联生成器
 *
 * @since 1.0.0
 * @type {Include}
 * @see Include
 */
Handle.Include = new Include();
/**
 * scopes 工具集
 * @type {{Scopes}}
 * @see Scopes
 */
Handle.Scopes = Scopes;

export default Handle;
