import { article, Scopes} from '../models/test/index'
const {where, pagination, fuzzyQuery, include, order, it, itField} = Scopes



/*
* where 子句简写包括：
* 1. 字符串
* 2. 多条件
* 3. 默认值
* 4. 别名
* 5. 可选项
* 6. Op
* */




export default {
  // 实例方法
  findOne: article.findOne('id', ['uid >', 2]),
  // {where: {id: d.id, uid: {  '>': 2}}}
  mock: article.mock(2, {
    title: '@ctitle',
    summary: '@csentence ',
    content: '@cparagraph '
  }),

  // where
  str: article.findAll('id'),
  multiple: article.findAll('id', 'uid'),

  // scopes
  fuzzyQuery: article.scope(fuzzyQuery('title')).findAll(),

  // 实例的选项对象
  raw: article.raw('hot').increment('id'),
  method: article.method('post').findOne('id'),

  /* 过程 */
  process: article.process(async function (d) {
    return await this.rawFindOne('id')
  }),
  processMethodPost: article.process('post', async function (d) {
    return await this.rawFindOne('id')
  }),

  processRaw: article.process(async function (d) {
    return await this.raw('hot').rawIncrement('id')
  }),
}
