import db from '../models/test'




/*
* where 工具方法拥有以下六种用法：
* 1. 字符串
* 2. 多条件
* 3. 默认值
* 4. 别名
* 5. 可选项
* 6. Op
* */

const utils = {
  // 查询用户所有的文章数据
  string: db.article.where('uid').findAll(),
  // 查询用户并且查询文章的数据
  multiple: db.article.where('id', 'uid').findAll(),
  // 查询文章 id 为 1 的数据
  defaultValue: db.article.where(['id', 1]).findAll(),
  // 通过 aid 查询文章的数据
  alias: db.article.where(['id', '@aid']).findAll(),
  // 通过 id 或 uid 查询文章数据
  option: db.article.where('!id', '!uid').findAll(),
  // 查询 id 大于指定数值的文章数据
  gt: db.article.where('id >').findAll(),
  // 模糊查询
  like: db.article.where(['title $like', d => `%${d.title}%`]).findAll(),
  // 一个复杂的接口参数逻辑
  full: db.article
    .where('uid')
    .where('!id')
    .where(['!title $like', d => `%${d.title}%`])
    .findAll(),

  // 模糊查询
  fuzzyQuery: db.article.fuzzyQuery('title').findAll(),
  // 左模糊查询
  fuzzyQueryLeft: db.article.fuzzyQueryLeft('title').findAll(),
  // 右模糊查询
  fuzzyQueryRight: db.article.fuzzyQueryRight('title').findAll(),

  pagination: db.article.pagination(10).findAll(),

  include: db.article
    .where('id')
    .include({model: db.comment})
    .findAll(),

  remove: db.article
    .where('id')
    .remove('hot')
    .update(),
  set: db.article
    .where('id')
    .set('hot', 10)
    .update(),
}







const other = {

  // // 实例的选项对象
  // raw: db.article.raw('hot').increment('id'),
  // method: db.article.method('post').findOne('id'),
  //
  // /* 过程 */
  // process: db.article.process(async function (d) {
  //   return await this.rawFindOne('id')
  // }),
  // processMethodPost: db.article.process('post', async function (d) {
  //   return await this.rawFindOne('id')
  // }),
  //
  // processRaw: db.article.process(async function (d) {
  //   return await this.raw('hot').rawIncrement('id')
  // }),
}



export default Object.assign(other, utils)
