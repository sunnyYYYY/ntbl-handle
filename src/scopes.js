import _merge from 'merge'

let isObject = value => Object.prototype.toString.call(value) === '[object Object]'
let toPairs = obj => [...Object.entries(obj)]
let noop = () => {}
function superNormalize(data, keys, fn) {
  if (typeof keys === 'string') keys = [keys]
  if (isObject(keys[0])) keys = toPairs(keys[0])
  if (Array.isArray(keys)) {
    return keys.reduce((ret, res, i) => {
      let key, value
      if (typeof res === 'string') {
        key = res
        value = data[key]
      } else {
        key = res[0]
        value = res[1][0] === '@' ? data[res[1].slice(1)] : res[1]
      }
      if (fn(value, key, i)) ret[key] = value
      return ret
    }, {})
  }
}


let z = value => Array.isArray(value) ? value : [value]
let m = (f, d) => z(f).filter(f => f => typeof f === 'function').map(f => f(d))
let p = d => filed => {
  if (typeof filed === 'string') return d[filed]
  if (Array.isArray(filed)) return d[filed[0]] === filed[1]
  if (typeof filed === 'function') filed(d)
}

/**
 * 前置测试
 *
 * @param fields
 * @param f1
 * @param f2
 * @returns {function(*=): *}
 */
let it = (fields, f1 = noop, f2 = noop) => d => _merge.recursive(true, ...(z(fields).every(p(d)) ? m(f1, d) : m(f2, d)))

/**
 * 可选字段
 *
 * @param keys
 * @returns {function(*=): {where: (*|void)}}
 */
let option = (...keys) => d => ({where: superNormalize(d, keys, value => value !== undefined)})

/**
 * where 子句简写
 *
 * @param keys
 * @returns {function(*=): {where: (*|void)}}
 */
let where = (...keys) => d => ({where: superNormalize(d, keys, value => true)})

/**
 * 右模糊匹配
 *
 * @param field
 * @param key
 * @returns {function(*): (*|{where: {[p: string]: undefined}})}
 */
let fuzzyQueryRight = (field = 'name', key) => {
  if (key == null) key = field
  return d => d[key] && {
    where: {
      [field]: {
        'like': `${d[key]}%`
      }
    }
  }
}


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
 * 分页查询
 *
 * @param {object} d - request body data
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

/**
 * 设置或修改 d 对象 (用法和 where 一致)
 *
 * @param keys
 * @returns {function(*=): any}
 */
let set = (...keys) => d => Object.assign(d, superNormalize(d, keys, value => value != null))

/**
 * 删除 d 对象的字段
 *
 * @param args
 * @returns {function(*): void}
 */
let del = (...args) => d => args.forEach(filed => filed in d && delete d[filed])


export default {
  it,
  option,
  where,
  fuzzyQuery,
  fuzzyQueryLeft,
  fuzzyQueryRight,
  order,
  includes,
  pagination,
  merge,
  set,
  del
}