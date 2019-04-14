/*!
 * handle v0.0.5
 * (c) 2017-2019 Sunny
 * Released under the MIT License.
 */
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var merge = _interopDefault(require('merge'));
var path = _interopDefault(require('path'));
var chalk = _interopDefault(require('chalk'));
var escapeStringRegexp = _interopDefault(require('escape-string-regexp'));
var glob = _interopDefault(require('glob'));
var Mock = _interopDefault(require('mockjs'));

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

    error(e);
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
      const name = path.parse(file).name;
      ret[name] = this.load(sequelize, file, options);
      ret['_' + name] = ret[name].model;
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
 * @returns object
 * @private
 */
let mixinScope = (d, target, defaultScope, scopes) => {
  let scopesAll = defaultScope.concat(scopes);
  if (!scopesAll.length) return target
  let result = scopesAll.map(scope => {
    if (isObj(scope)) return scope
    let res = scope(d);
    if (typeof res === 'function') res = scope()(d);
    else res = scope(d);
    return res
  });
  return merge.recursive(true, target, ...result)
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
 * 对象路径查询，避免臃长的 &&
 *
 * @param {array|object} o - 需要查询的对象
 * @param {string} path -  路径
 * @param defaultValue - 当未查询到提供的默认值
 * @returns {*}
 * @private
 * @example
 *
 * data = {
 *   a: {
 *     b: [1, 2, 3, {
 *       c: 10
 *     }]
 *   }
 * }
 *
 * tailspin(data, 'a.b.3.c')  // 10
 * tailspin(data, 'a.d')      // undefined
 * tailspin(data, 'a.d', 3)   // 3，提供默认值
 */
let tailspin = (o, path$$1, defaultValue) => {
  const args = path$$1.match(/[^\.\[\]]+/g);
  if (args) {
    try {
      return args
        .map(arg => Object.is(Number(arg), NaN) ? arg : Number(arg))
        .reduce((ret, res) => ret[res], o) || defaultValue
    } catch (e) {
      return defaultValue
    }
  }

  return defaultValue
};


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
  if (typeof b === 'function') b = b(target);
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
    source[key][arg] = value;
  }
}

const maps = {};

/**
 * 通过 add 添加模型的基本 include，然后由 create 指定层级关系，并生成复杂的关联查询。
 * @module Handle.Include
 */

/**
 * 添加一个 include
 * @param {string} name - include 的名称
 * @param {object|function} f - 一个返回 include 数据的方法，如果为对象，则简单的封装成一个函数
 * @returns {Include}
 */
function add (name, f) {
  if (typeof f !== 'function') f = () => f;
  maps[name] = f.bind(maps);
  return this
}

/**
 * 移除一个 include
 * @param {string} name - include 的名称
 * @returns {boolean}
 */
function remove (name) {
  return delete maps[name]
}

/**
 * 获取一个 include
 * @param {string} name - include 的名称
 * @returns {*}
 */
function get (name) {
  return maps[name]
}

/**
 * 组合 include 生成更复杂的 include
 * @param {...args} scopes - 指定的层级关系
 * @returns {Array}
 */
function create (...args) {
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


var Include = {
  add,
  remove,
  get,
  create
};

/**
 * Scopes 工具集
 * @module Handle.Scopes
 */

/**
 * where 子句简写支持
 * @param options {string|array|object|function}
 */
let where = (...options) => d => getOp(options, d);


/**
 * 分页
 * @param {number} [defaultCount=5] -每页的默认数量
 * @param {number} [defaultPage=0] - 默认从第 0 页开始
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
 * 模糊查询
 * @param field
 */
let fuzzyQuery = (field = 'name') => where([`${field} $like`, d => `%${d[field]}%`]);


/**
 * 左模糊查询
 * @param field
 */
let fuzzyQueryLeft = (field = 'name') => where([`${field} $like`, d => `%${d[field]}`]);

/**
 * 右模糊查询
 * @param field
 */
let fuzzyQueryRight = (field = 'name') => where([`${field} $like`, d => `${d[field]}%`]);


/**
 * 添加关联
 * @param args
 */
let include = (...args) => d => ({include: args});

/**
 * 添加排序
 * @param args
 */
let order = (...args) => d => ({order: args});

/**
 * 移除 request data 中的字段
 *
 * @param keys
 */
let remove$1 = (...keys) => d => {
  keys.forEach(key => {
    if (key in d) delete d[key];
  });

  return {}
};


/**
 * 设置 request data 中的字段
 *
 * @param key
 * @param value
 */
let set = (key, value) => d => {
  d[key] = value;
  return {}
};


/**
 * 将多个选项函数返回的选项对象或选项对象合并为一个
 *
 * @param funcs
 */
let merge$1 = (...funcs) => d => merge.recursive(true, {}, ...(funcs.map(f => typeof f === 'function' ? f(d) : f)));


function wrapper (v) {
  return Array.isArray(v) ? v : [v]
}

/**
 * 单条件测试，相当于把语法结构中 if 语句变成了函数的写法
 *
 * @param {string|function} condition - 用于 request data 的条件
 * @param {array|object|function} f1 - 测试成功时执行
 * @param {array|object|function} [f2] - 测试失败时执行
 */
let it = (condition, f1, f2 = noop) => d => (typeof condition === 'boolean' ? condition : typeof condition === 'function' ? condition(d): d[condition]) ? merge$1(...wrapper(f1))(d) : merge$1(...wrapper(f2))(d);


/**
 *
 * it 的反向版本
 *
 * @param {string|function} condition - 用于 request data 的条件
 * @param {array|function} f1 - 测试失败时执行
 * @param {array|function} [f2] - 测试成功时执行
 */
let not = (condition, f1, f2 = noop) => it(condition, f2, f1);


/**
 *
 * 测试指定字段的多个值（相当于语句结构中的 switch）
 *
 * @param field
 * @param conditions
 * @example
 * itField('sort', {
 *  'name': f1,           // 当 d.sort = 'name' 时执行
 *  'age': [f2, f3],      // 当 d.sort = 'age'  时执行
 *  'height': f4          // 当 d.sort = 'height' 时执行
 * })
 */
let itField = (field, conditions) => d => {
  const condition = d[field];
  return it(true, conditions[condition])(d)
};

var Scopes = {
  where,
  fuzzyQuery,
  fuzzyQueryLeft,
  fuzzyQueryRight,
  include,
  order,
  pagination,
  remove: remove$1,
  set,
  it,
  itField,
  not,
  merge: merge$1
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
  this.defaultScopes = [];
  this._data = null;

  this.__reset();
}

Handle.prototype = {
  constructor: Handle,
  method,
  raw,
  scope,
  defaultScope,
  rawScope,
  process: process$1,
  transaction,
  mock,
  __internal,
  __process,
  __reset,
  __callHook
};


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
  name = name.toLowerCase();
  if (!requestMethods.includes(name)) error('Only the http standard request method is supported (' + requestMethods.join('/') + ')', name);
  this._opts.method = name;
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
  this._opts.rawData = data;
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
      error('Scope must be a function or object.', `${this.model.name}.scope(→...scopes←)`);
    }
    this._opts.scopes.push(scope);
  });
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
      error('Scope must be a function or object.', `${this.model.name}.scope(→...scopes←)`);
    }
    this.defaultScopes.push(scope);
  });
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
function process$1 (method, f) {

  if (typeof method === 'function') [f, method] = [method, 'get'];

  if (!requestMethods.includes(method)) error('Only the http standard request method is supported (' + requestMethods.join('/') + ')', method);

  return async (ctx, next) => {
    let data = getRequestData(method, ctx);
    try {
      data = this.__callHook('before', data, ctx, next);
      this._data = data;
      let result = await f.call(this, data, ctx, next);
      this._data = null;
      result = this.__callHook('after', result, ctx, next);
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
/**
 * 向数据库中批量插入由 mock 生成的随机数据
 * @memberOf Handle
 * @instance
 * @param {mock} [count=1] - 几条数据
 * @param {object} rule - mock 的生成规则
 * @example
 *
 * // 批量向 article 表中插入 20 条数据
 * article.mock(20, {
 *   title: '@ctitle',
 *   content: '@cparagraph'
 * })
 *
 *
 * @returns {*}
 */
function mock (count, rule) {
  if (isObj(count)) [count, rule] = [1, count];
  return this.raw(Mock.mock({[`data|${count}`]: [rule]}).data).bulkCreate()
}



function __internal (name, ...options) {
  let {defaultScopes} = this;
  let {method, rawData, scopes} = this.__reset();

  return async (ctx, next) => {
    // 获取请求方法
    const requestMethod = method
      || tailspin(this, `options.proxy.${name}.method`)
      || tailspin(Handle, `defaults.proxy.${name}.method`)
      || 'get';
    
    // 获取数据
    let data = getRequestData(requestMethod, ctx);

    try {
      data = this.__callHook('before', data, ctx, next);
      // where 子句简写解析
      let opts = getOp(options, data);
      // 混合作用域
      opts = mixinScope(data, opts, defaultScopes, scopes);
      // 原生数据
      if (rawData) {
        data = typeof rawData === 'function' ? rawData(data) : rawData;
      }
      // 生成调用方法的参数
      opts = [data, opts].slice(-this.model[name].length);
      // 调用方法
      let result = await this.model[name](...opts);

      result = this.__callHook('after', result, ctx, next);
      return ctx.body = this.__callHook('data', null, result, ctx, next)
    } catch (err) {
      return ctx.body = this.__callHook('data', err, ctx, next)
    }
  }
}
async function __process (name, ...options) {

  let {defaultScopes} = this;
  let {rawData, scopes} = this.__reset();

  let data = this._data;
  let opts = getOp(options, data);
  opts = mixinScope(data, opts, defaultScopes, scopes);
  if (rawData) {
    data = typeof rawData === 'function' ? rawData(data) : rawData;
  }
  console.log(opts);
  opts = [data, opts].slice(-this.model[name].length);
  return  await this.model[name](...opts)
}

function __reset() {
  let _opts = this._opts;
  this._opts = {
    scopes: [],
  };

  if (_opts) {
    _opts = merge.recursive(true, {}, _opts);
  }

  return _opts
}
function __callHook (name, ...args) {
  const hook = this.options[name];
  return hook && typeof hook === 'function'
    ? hook(...args)
    : args.length === 3 ? args[0] : args[1]
}

Handle.defaults = {
  proxy: {},
};

for (let method in proxyNames) {
  const value = proxyNames[method];
  value.forEach(name => {

    Handle.defaults.proxy[name] = { method };

    Handle.prototype[name] = function (...args) {
      return this.__internal(name, ...args)
    };

    Handle.prototype['raw' + initialCap(name)] = function (...args) {
      return this.__process(name, ...args)
    };
  });
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
Handle.load = load;
/**
 * @memberOf Handle
 * @static
 * @param {sequelize} sequelize - Sequelieze 实例
 * @param {string} dir - 文件路径
 * @param {object} [options={}] - 实例化时的选项对象
 * @param {object} [options.rule=''\**\!(index|_)*.js''] - 匹配规则，支持 glob 语法
 * @returns {{filename: handle}}
 */
Handle.loadAll = loadAll;



/**
 * 关联查询的辅助对象
 * @type {Include}
 * @see Include
 */
Handle.Include = Include;
/**
 *
 * scopes 工具集
 * @type {{Scopes}}
 * @see Scopes
 */
Handle.Scopes = Scopes;

module.exports = Handle;
