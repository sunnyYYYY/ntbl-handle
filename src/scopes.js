import merge from 'merge'
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
 * @returns {function(*=): {where}}
 */
let where = (...options) => d => getOp(options, d)


/**
 * 分页
 * @param {number} [defaultCount=5] -每页的默认数量
 * @param {number} [defaultPage=0] - 默认从第 0 页开始
 * @returns {Object}
 */
let pagination = (defaultCount = 5, defaultPage = 0) => {
  return d => {
    const count = ~~d.count || defaultCount
    const page = ~~d.page || defaultPage
    return {
      limit: count,
      offset: page * count
    }
  }
}


/**
 * 模糊查询
 * @param field
 * @returns {function(*=): {where}}
 */
let fuzzyQuery = (field = 'name') => where([`${field} $like`, d => `%${d[field]}%`])


/**
 * 左模糊查询
 * @param field
 * @returns {function(*=): {where}}
 */
let fuzzyQueryLeft = (field = 'name') => where([`${field} $like`, d => `%${d[field]}`])

/**
 * 右模糊查询
 * @param field
 * @returns {function(*=): {where}}
 */
let fuzzyQueryRight = (field = 'name') => where([`${field} $like`, d => `${d[field]}%`])

/**
 * 单条件测试，相当于把语法结构中 if 语句变成了函数的写法
 *
 * @param {string|function} condition - 用于 request data 的条件
 * @param {array|function} f1 - 测试成功时执行
 * @param {array|function} [f2] - 测试失败时执行
 */
export let it = (condition, f1, f2 = noop) => d => (typeof condition === 'function' ? condition(d): d[condition]) ? wrapper(f1) : wrapper(f2)


function wrapper(value, d) {
  return merge.recursive(true, {}, ...((Array.isArray(value) ? value : [value]).map(f => f(d))))

}


export default {
  where,
  fuzzyQuery,
  fuzzyQueryLeft,
  fuzzyQueryRight,
  pagination,
  it
}