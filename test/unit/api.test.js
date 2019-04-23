import path from 'path'
import { get, post } from '../utils'
import { expect } from 'chai'
import Sequelize from '../server/node_modules/sequelize'
import Handle from  '../../dist/handle.es'
import config from '../server/app/config/database.config'

const sequelize = new Sequelize(config)


describe('基础', () => {
  it('实例化', () => {
    const article = Handle(sequelize.import(path.resolve(__dirname,  '../server/app/models/test/article')))
    expect(article.scope).exist
  })

  it('load', () => {
    const article = Handle.load(sequelize, path.resolve(__dirname,  '../server/app/models/test/article'))
    expect(article.scope).exist
  })

  it('loadAll', () => {
    const db = Handle.loadAll(sequelize, path.resolve(__dirname,  '../server/app/models/test'))
    expect(db.article).exist
    expect(db.comment).exist
    expect(db._models).exist
  })
})




describe('工具函数', () => {

  it('where#字符串',  async () => {
      const { body } = await get('/where/string', { uid: 1 })
      expect(body.length).above(0)
  })

  it('where#多条件',  async () => {
    const { body } = await get('/where/multiple', { id: 1, uid: 3})
    expect(body.length).equal(1)
  })

  it('where#默认值',  async () => {
    const { body } = await get('/where/defaultValue')
    expect(body.length).equal(1)
  })

  it('where#别名',  async () => {
    const { body } = await get('/where/alias', { aid: 1 })
    expect(body.length).equal(1)
  })

  it('where#可选项',  async () => {
    const r1 = await get('/where/option', { id: 1 })
    expect(r1.body.length).equal(1)
    const r2 = await get('/where/option', { uid: 1 })
    expect(r2.body.length).above(0)
    const r3 = await get('/where/multiple', { id: 1, uid: 3})
    expect(r3.body.length).equal(1)
  })

  it('where#op gt， 普通简写', async () => {
    const { body } = await get('/where/gt', { id: 2 })
    expect(body.length).above(0)
  })

  it('where#op like, 函数语法', async () => {
    const { body } = await get('/where/like', { title: '她' })
    expect(body.length).above(0)
  })

  it('一个复杂的接口参数逻辑', async () => {
    const { body } = await get('/where/full', {id: 9, uid: 3, title: '她' })
    expect(body.length).equal(1)
  })


  it('左模糊查询', async () => {
    const { body } = await get('/fuzzyQueryLeft', {title: '她' })
    expect(body.length).equal(1)
  })

  it('右模糊查询', async () => {
    const { body } = await get('/fuzzyQueryRight', {title: '她' })
    expect(body.length).equal(0)
  })

  it('模糊查询', async () => {
    const { body } = await get('/fuzzyQuery', {title: '她' })
    expect(body.length).above(1)
  })

  it('分页', async () => {
    const r1 = await get('/pagination')
    expect(r1.body.length).equal(10)

    const r2 = await get('/pagination', {count: 15, page: 1})
    expect(r2.body.length).equal(15)
  })


  it('关联', async () => {
    const { body } = await get('/include', {id: 2})
    expect(body[0].comments.length).not.null
  })

  it('移除 request data 中的指定字段', async () => {
    const r1 = await post('/remove', {id: 2, hot: 100})
    expect(r1.body[0]).equal(1)
    const r2 = await get('/where/option', {id: 2})
    expect(r2.body[0].hot).equal(0)
  })

  it('修改 request data 中的指定字段', async () => {
    const r1 = await post('/set', {id: 3, hot: 200})
    expect(r1.body[0]).equal(1)
    const r2 = await get('/where/option', {id: 3})
    console.log(r2.body[0])
    expect(r2.body[0].hot).equal(10)
  })

  it ('条件分支', async () => {
    const r1 = await get('/it', {id: 2})
    expect(r1.body[0].comments).undefined
    const r2 = await get('/it', {id: 2, comment: true})
    expect(r2.body[0].comments.length).not.null
  })

  it ('反向条件分支', async () => {
    const r1 = await get('/not', {id: 2})
    expect(r1.body[0].comments.length).not.null
    const r2 = await get('/not', {id: 2, comment: true})
    expect(r2.body[0].comments).undefined
  })

  it ('多条件分支', async () => {
    const r1 = await get('/more', {id: 2})
    expect(body[0].comments).not.null
  })

  it ('scope', async () => {
    const r1 = await get('/scope')
    expect(r1.body.length).equal(0)

    const r2 = await get('/scope', {uid: 2})
    expect(r2.body.length).above(0)

    const r3 = await get('/scope', {id: 9, uid: 3, title: '她' })
    expect(r3.body.length).equal(1)
  })
})


describe('快捷方法', () => {
  it('findOne', async () => {
    const { body } = await get('/findOne', {id: 2})
    expect(body).exist
  })

  it('findAll', async () => {
    const { body } = await get('/findAll', {uid: 3})
    expect(body.length).above(0)
  })


  it('findOrCreate', async () => {
    const { body } = await get('/findOrCreate', {id: 3, title: '我的祖国'})
    expect(body.length).above(0)
  })

  it('findAndCountAll', async () => {
    const { body } = await get('/findAndCountAll', {uid: 3, title: '我的祖国'})
    expect(body.count).above(0)
  })

  it('findAndCount', async () => {
    const { body } = await get('/findAndCount', {id: 3})
    expect(body.count).above(0)
  })

  it('findCreateFind', async () => {
    const { body } = await get('/findCreateFind', {id: 3, title: '我的祖国'})
    expect(body[0]).exist
  })

  it('findAndCount', async () => {
    const { body } = await get('/findAndCount', {id: 3})
    expect(body.count).above(0)
  })

  it('count', async () => {
    const { body } = await get('/count', {uid: 2})
    expect(body).above(0)
  })

  it('max', async () => {
    const { body } = await get('/max', {uid: 2})
    expect(body).above(0)
  })

  it('min', async () => {
    const { body } = await get('/min', {uid: 2})
    expect(body).equal(0)
  })

  it('sum', async () => {
    const { body } = await get('/sum', {uid: 2})
    expect(body).above(0)
  })
})

describe('过程方法', () => {

  it('process', async () => {
    const { body } = await get('/process', {uid: 2})
    expect(body.length).above(0)
  })
})

describe('其他', () => {
  it('提供 before 校验数据', async () => {
    const r1 = await post('/before', {title: '我的祖国', uid: 2})
    expect(r1.body.title).equal('我的祖国')

    try {
      await post('/before', {uid: 2})
    } catch (e) {
      expect(e.message).equal('文章标题不能为空')
    }
  })

  it('提供 after 过滤数据', async () => {
    const { body } = await get('/after', {uid: 2})
    expect(body).above(0)
  })
})