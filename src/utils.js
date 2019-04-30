import merge from 'assign-deep'
import path from 'path'
import chalk from 'chalk'
import escapeStringRegexp from 'escape-string-regexp'
import Handle from './index'
import glob from 'glob'
import Sequelize from 'sequelize'
const Op = Sequelize.Op

const PATTERN_IDENTIFIER = /[A-Za-z_][A-Za-z0-9_]*/

export let requestMethods = ['get', 'head', 'put', 'delete', 'post', 'options']

export let isObj = value => Object.prototype.toString.call(value) === '[object Object]'
export let noop = () => {}

export let error = (msg, msg2 = '') => {
  console.error(chalk.bgRed(' ERROR ') + ' ' + chalk.red(msg) + (msg2 ? ' ☞ ' +  chalk.gray(msg2) : ''))
  process.exit(1)
}

export let warn = msg => {
  console.error(chalk.bgYellow(' WARN ') + ' ' + chalk.yellow(msg))
}


export let load = (sequelize, dir, options) => {
  if (typeof dir !== 'string') {
    error('dir must be a string.', 'load(sequelize, →dir←, options)')
  }

  try {
    return new Handle(sequelize.import(dir), options)
  } catch (e) {

    if (load.length === 1) {
      error('You may not have passed in the Sequelie instance, it imports the model using import.')
    }

    error(e)
  }
}

export let loadAll = function (sequelize, dir, options = {}) {

  if (typeof dir !== 'string') {
    error('dir must be a string.', 'load(sequelize, →dir←, options)')
  }

  const { rule = '/**/!(index|_)*.js' } = options
  return glob
    .sync(path.join(dir, rule))
    .reduce((ret, file) => {
      const name = path.parse(file).name
      ret[name] = this.load(sequelize, file, options)
      ret._models[name] = ret[name].model
      return ret
    }, {_models: {}})
}


/**
 * 生成模型方法的选项对象，支持 where 子句的快捷写法
 *
 * @param {string|array|function} o - 生成数据
 * @param {object} data - request body data
 * @returns object
 * @private
 */
export let getOp = (o, data) => {
  if (typeof o === 'string') o = [o]
  else if (typeof o === 'function') return o(data)

  if (Array.isArray(o)) {
    return {
      where: o.reduce((ret, res) => {
        if (typeof res === 'string') parseSign(res, '@' + res, ret, data)
        else if (Array.isArray(res)) parseSign(res[0], res[1], ret, data)
        return ret
      }, {})
    }
  }

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
  method = method.toLowerCase()
  return method === 'get' ? ctx.query
    : method === 'post' ? ctx.request.body
      : {}
}


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
export let mixinScope = (d, defaultScope, scopes) => {
  let scopesAll = defaultScope.concat(scopes)
  if (!scopesAll.length) return {}
  let result = scopesAll.map(scope => {
    if (isObj(scope)) return scope
    let res = scope(d)
    if (typeof res === 'function') res = scope()(d)
    else res = scope(d)
    return res
  })
  const opts = merge(...result)
  console.log(opts)
  // dealOp(opts.where)
  return opts

}


function dealOp(where = {}) {
  for (let key in where) {
    const value = where[key]
    if (key.slice(1) in Op) {
      where[Op[key.slice(1)]] = value
      delete where[key]
    }

    if (isObj(value)) dealOp(value)
  }


}

/**
 * 首字母大写
 *
 * @param str
 * @returns {string}
 * @private
 */
export let initialCap = str => str[0].toUpperCase() + str.substring(1)

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
export let tailspin = (o, path, defaultValue) => {
  const args = path.match(/[^\.\[\]]+/g)
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
}


/**
 * 需要被代理的方法名对象
 *
 * @type {{get: string[], post: string[]}}
 * @private
 */
export let proxyNames = {
  get: [
    'findOne',
    'findAll',
    'findOrCreate',
    'findAndCountAll',
    'findAndCount',
    'findCreateFind',
    'count',
    'max',
    'min',
    'sum'
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


function parseSign (a, b, source, target) {
  if (typeof b === 'function') b = b(target)
  let key = a.match(PATTERN_IDENTIFIER)
  let optionKey = key
  let value = b
  key = key && key[0]

  // 别名
  if (typeof b === 'string' && /^@/.test(b)) {
    optionKey = b.match(PATTERN_IDENTIFIER)[0]
    // [HACK] sequelize v5 中会对属性的 undefined 抛出异常
    value = target[optionKey] || new Date
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
    '#and': 'and',
    '#or': 'or',
    '#gt': 'gt',
    '#gte': 'gte',
    '#lt': 'lt',
    '#lte': 'lte',
    '#ne': 'ne',
    '#eq': 'eq',
    '#not': 'not',
    '#between': 'between',
    '#notBetween': 'notBetween',
    '#in': 'in',
    '#notIn': 'notIn',
    '#like': 'like',
    '#notLike': 'notLike',
    '#iLike': 'iLike',
    '#regexp': 'regexp',
    '#iRegexp': 'iRegexp',
    '#notIRegexp': 'notIRegexp',
    '#overlap': 'overlap',
    '#contains': 'contains',
    '#contained': 'contained',
    '#any': 'any',
    '#col': 'col',
  }

  let argMatch = a.match(new RegExp('(' + Object.keys(opTag).map(arg => escapeStringRegexp(arg)).join('|') +
    ')'))

  let arg = opTag[argMatch ? argMatch[0] : '=']
  if (arg === 'and') {
    if (!source[key]) source[key] = []
    source[key] = value
  }
  else {
    if (!source[key]) source[key] = {}
    source[key][Op[arg]] = value
  }
}


