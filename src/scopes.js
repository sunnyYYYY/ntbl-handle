import _merge from 'assign-deep'
import {
  isObj,
  getOp,
  noop
} from "./utils"

/**
 * Scopes 工具集
 * @module Handle.Scopes
 */



/**
 * where 子句简写支持
 * @param options {string|array|object|function}
 */
export let where = (...options) => d => getOp(options, d)


/**
 * 分页
 * @param {number} [defaultCount=15] - 每页的默认数量
 * @param {number} [defaultPage=0] - 默认从第 0 页开始
 */
let pagination = (defaultCount = 15, defaultPage = 0) => {
  return d => {
    const count = ~~d.count || defaultCount
    const page = ~~d.page || defaultPage
    return {
      limit: count,
      offset: page * count
    }
  }
}


function fuzzyQueryFileid (field) {
  return field[0] === '!' ? field.slice(1) : field
}


/**
 * 模糊查询
 * @param field
 */
let fuzzyQuery = (field = 'name') => where([`${field} #like`, d => `%${d[fuzzyQueryFileid(field)]}%`])


/**
 * 左模糊查询
 * @param field
 */
let fuzzyQueryLeft = (field = 'name') => where([`${field} #like`, d => `%${d[fuzzyQueryFileid(field)]}`])

/**
 * 右模糊查询
 * @param field
 */
let fuzzyQueryRight = (field = 'name') => where([`${field} #like`, d => `${d[fuzzyQueryFileid(field)]}%`])


/**
 * 添加关联
 * @param args
 */
let include = (...args) => d => ({include: args})

/**
 * 添加排序
 * @param args
 */
let order = (...args) => d => ({order: args})

/**
 * 移除 request data 中的字段
 *
 * @param keys
 */
let remove = (...keys) => d => {
  keys.forEach(key => {
    if (key in d) delete d[key]
  })

  return {}
}


/**
 * 设置 request data 中的字段
 *
 * @param key
 * @param value
 */
let set = (key, value) => d => {
  d[key] = value
  return {}
}


/**
 * 将多个选项函数返回的选项对象或选项对象合并为一个
 *
 * @param funcs
 */
let merge = (...funcs) => d => _merge({}, ...(funcs.map(f => typeof f === 'function' ? f(d) : f)))


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
let it = (condition, f1, f2 = noop) => d => (typeof condition === 'boolean' ? condition : typeof condition === 'function' ? condition(d): d[condition]) ? merge(...wrapper(f1))(d) : merge(...wrapper(f2))(d)


/**
 *
 * it 的反向版本
 *
 * @param {string|function} condition - 用于 request data 的条件
 * @param {array|function} f1 - 测试失败时执行
 * @param {array|function} [f2] - 测试成功时执行
 */
let not = (condition, f1, f2 = noop) => it(condition, f2, f1)


/**
 *
 * 测试指定字段的多个值（相当于语句结构中的 switch）
 *
 * @param field
 * @param conditions
 * @example
 * more('sort', {
 *  'name': f1,           // 当 d.sort = 'name' 时执行
 *  'age': [f2, f3],      // 当 d.sort = 'age'  时执行
 *  'height': f4          // 当 d.sort = 'height' 时执行
 * })
 */
let more = (field, conditions) => d => {
  const condition = d[field]
  return it(true, conditions[condition])(d)
}

export default {
  where,
  fuzzyQuery,
  fuzzyQueryLeft,
  fuzzyQueryRight,
  include,
  order,
  pagination,
  remove,
  set,
  it,
  more,
  not,
  merge
}