import _merge from 'merge'
import {
  isObj,
  getOp,
  noop
} from "./utils"


/**
 * where 子句简写支持
 *
 * @param options {string|array|object|function}
 * @returns {function(*=): {where}}
 */
let where = options => d => getOp(options, d)


/**
 * 分页
 *
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
 * 右模糊查询
 * @param field
 * @returns {function(*=): {where}}
 */
let fuzzyQueryRight = field => where([`${field} $like`, d => `${d.field}`])


/**
 * 左模糊匹配
 *
 * @param field
 * @param key
 * @returns {function(*): (*|{where: {[p: string]: undefined}})}
 */
let fuzzyQueryLeft = (field = 'name', key) => {
  if (key == null) key = field
  return d => d[key] && {
    where: {
      [field]: {
        'like': `%${d[key]}`
      }
    }
  }
}

/**
 * 模糊匹配
 *
 * @param field
 * @param key
 * @returns {function(*): (*|{where: {[p: string]: undefined}})}
 */
let fuzzyQuery = (field = 'name', key) => {
  if (key == null) key = field
  return d => d[key] && {
    where: {
      [field]: {
        'like': `%${d[key]}%`
      }
    }
  }
}



/**
 * 关联
 *
 * @param args
 * @returns {function(*): {include: *[]}}
 */
let includes = (...args) => d => ({include: args})


/**
 * 排序
 *
 * @param value
 * @returns {function(*): {order: *}}
 */
let order = value => d => ({order: value})

/**
 * 深度合并多个对象或函数
 *
 * @param args
 * @returns {function(*=): *}
 */
let merge = (...args) =>  d =>  _merge.recursive(true, d, ...args.map(f => typeof f === 'function' ? f(d) : f))


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



export default {
  where,
  fuzzyQueryRight,
  fuzzyQueryLeft,
  fuzzyQuery,
  it,
  pagination,
  merge,
  includes,
  order
}