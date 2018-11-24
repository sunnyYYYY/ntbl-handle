import merge from 'merge'
import path from 'path'
import chalk from 'chalk'
import Sequelize, { Op } from 'sequelize'
import escapeStringRegexp from 'escape-string-regexp'
import Handle from './index'
import glob from 'glob'


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

    error('Please check the path, it may be wrong.', dir)
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
      ret[path.parse(file).name] = this.load(sequelize, file, options)
      return ret
    }, {})
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
  console.log(method)
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
 * @returns {*}
 * @private
 */
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
 * 首字母大写
 *
 * @param str
 * @returns {string}
 * @private
 */
export let initialCap = str => str[0].toUpperCase() + str.substring(1)

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


function parseSign (a, b, source, target) {
  let key = a.match(PATTERN_IDENTIFIER)
  let optionKey = key
  let value = b
  key = key && key[0]

  // 别名
  if (typeof b === 'string' && /^@/.test(b)) {
    optionKey = b.match(PATTERN_IDENTIFIER)[0]
    value = target[optionKey]
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


