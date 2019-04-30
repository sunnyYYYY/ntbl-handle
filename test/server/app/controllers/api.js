import db from '../models/test'

// 引入独立的函数版本 Scopes 对象
import Handle from  '../../../../dist/handle.es'
const {where, pagination, fuzzyQuery, include, order, it, merge} = Handle.Scopes

function nb () {
  // 使用 merge 函数合并多个工具函数
  return merge(
    where('uid'),
    where('!id'),
    fuzzyQuery('!title'),
    pagination(10),
    order(['createdAt', 'DESC']),
  )
}




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
  like: db.article.where(['title #like', d => `%${d.title}%`]).findAll(),
  // 一个复杂的接口参数逻辑
  full: db.article
    .where('uid')
    .where('!id')
    .where(['!title #like', d => `%${d.title}%`])
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
    .include(db._models.comment)
    .findAll(),

  remove: db.article
    .where('id')
    .remove('hot')
    .update(),

  set: db.article
    .where('id')
    .set('hot', 10)
    .update(),

  it: db.article
    .it('comment', include(db._models.comment))
    .findAll(),

  not: db.article
    .not('comment', include(db._models.comment))
    .findAll(),

  // TODO more 测试
  more: db.article
    .more('comment', {

    })
    .findAll(),
  scope: db.article.scope(nb).findAll(),
}


// 快捷方法
const easy = {
  findOne: db.article.where('id').findOne(),
  findAll: db.article.where('uid').findAll(),
  findOrCreate: db.article.where('id').findOrCreate(),
  findAndCountAll: db.article.where('uid').findAndCountAll(),
  findAndCount: db.article.where('uid').findAndCount(),
  findCreateFind: db.article.where('id').findCreateFind(),
  count: db.article.raw('hot').where('uid').count(),
  max: db.article.raw('hot').where('uid').max(),
  min: db.article.raw('hot').where('uid').min(),
  sum: db.article.raw('hot').where('uid').sum(),
}

// 过程方法
const process = {
  process: db.article.process(async function (d) {
    const {count = 15, page = 0, uid} = d
    return await this.rawFindAll({
      include: [
        {
          // 关联查询文章数据
          model: db._models.comment,
        }
      ],
      // 通过 uid 查询
      where: { uid },
      // 分页
      limit: count,
      offset: page * count
    })
  }),
}






const other = {
  before: db.article
    .before(function (data) {
      const {title} = data
      if (!title) {
        throw new Error('文章标题不能为空')
      }

      if (title.length < 1 || title.length > 25) {
        throw new Error('文章标题不小于 2 个字符且不大于 25 个字符')
      }
      return data
    })
    .create(),

  after: db.article
    .after(function (data) {
      // 仅返回文章的数量
      return data.length
    })
    .where('uid')
    .findAll(),

  fn: db.article
    .scope({
      attributes: [
        [db.sequelize.fn('COUNT', db.sequelize.col('comments.id')), 'commentTotal'],
      ],
      include: {
        all: true
      },
    })
    .where('id')
    .findOne()
}



export default Object.assign(other, utils, easy, process)
