import fs from 'fs'
import path from 'path'
import mkdirp from 'mkdirp'
import jwt from 'jsonwebtoken'
import tokenConfig from "../config/token.config"

/**
 * 开启分页查询
 * page - 页数
 * count - 每页的数量
 *
 * @param {object} d - request body data
 * @param {number} [defaultCount=5] -每页的默认数量
 * @param {number} [defaultPage=0] - 默认从第 0 页开始
 * @returns {Object}
 */
export let pagination = (defaultCount = 5, defaultPage = 0) => {
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
 * 开启可选的忽略字符
 *
 * @param {object} maps - 接受一个由 {忽略字段: 布尔值} 组成的映射。
 * @returns {{attributes: {exclude: Array}}}
 *
 * @example
 *
 * // 只当 d.content 为 true 时，content 字段才会被加入了忽略列表中
 * Handle.Options.exclude({
   *  content: d.content
   * })
 *
 */
export let exclude = maps => {
  const result = []

  for (let key in maps) {
    if (!maps[key]) result.push(key)
  }

  return {
    attributes: {
      exclude: result
    }
  }
}

/**
 * 当 id 小于等于 0 时, 查询所有用户
 * 当 id 大于 0 时, 查询指定 id 用户,
 * 当 id 不存在, 查询当前用户
 * @param d
 * @returns {*}
 */
export let findUid = d => ({
  where: d.user_id
    ? d.user_id > 0 && {uid: d.user_id}
    : {uid: d.uid}
})

/**
 *
 * @param d
 * @returns {*|{d: *}}
 */

export let findId = d => ({
  where: d.id && {id: d.id}
})




/**
 * 返回关联查询数据的数量
 * @param {string} o - 数据集
 * @param {string} ...keys - 关联查询的 key
 * @returns {*}
 */
export let setCount = (o, ...keys) => {
  if (!Array.isArray(o)) o = [o]
  o.forEach(e => keys.forEach(key => e.setDataValue(key, e[key].length)))
  return o
}



export let articleOtimization = (o, uid) => {
  o = o.toJSON()
  return Object.assign(o, {
    liked: !!~o.likes.findIndex(e => e.uid === uid),
    stared: !!~o.stars.findIndex(e => e.uid === uid),
    likes: o.likes.length,
    stars: o.stars.length,
  })
}

export let send = (err, data, ctx) => {
  // 异常
  if (err) {
    console.log('err ->', err)
    ctx.status = err.status || 500
    data = {error: err.errors || err.message || err}
  }

  // 更新
  if (Array.isArray(data) && data.length === 1 && typeof data[0] === 'number') {
    data = data[0]
  }
  return data
}














export let tokenSign = data => jwt.sign({
  data,
  exp: Date.now() + tokenConfig.exp
}, tokenConfig.privateKey, {algorithm: tokenConfig.algorithm})

export let tokenVerify = data => {
  let result = jwt.verify(data, tokenConfig.publicKey, {algorithm: tokenConfig.algorithm}) || {}
  let {exp = 0} = result
  let currentDate = Date.now()
  return currentDate <= exp ? result.data : {}
}

export let updateFile = (basePath, files) => {
  mkdirp.sync(basePath)
  const filePaths = []
  for (let key in files) {
    const file = files[key]
    const ext = file.name.split('.').pop()
    const filename = len ? `${Math.random().toString(32).substr(2)}.${ext}` : file.name
    const filePath = path.join(basePath, filename)
    const reader = fs.createReadStream(file.path)
    const writer = fs.createWriteStream(filePath)
    reader.pipe(writer)
    filePaths.push(filePath)
  }

  return filePaths
}
