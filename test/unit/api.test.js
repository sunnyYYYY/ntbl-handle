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
    console.log(body.length)
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

})






describe('Scopes Utils', () => {
  it('fuzzyQuery# 模糊查询', async () => {
    const { body } = await get('/scopes/fuzzyQuery', {title: '的'})
    expect(body.length).equal(1)
  })
})

describe('实例方法选项', () => {
  it('rwa# 原生数据', async () => {
    const data = {
      id: 7
    }
    const oldHot = (await get('/findOne', data)).body.hot
    await get('/instance/options/raw', data)
    const newHot = (await get('/findOne', data)).body.hot
    expect(oldHot + 1).equal(newHot)
  })

  it('method# 设置请求方法', async () => {
    const { body } = await post('/instance/options/method', {id: 7})
    expect(body.id).equal(7)
  })
})


describe('Process', () => {
  it('process', async () => {
    const { body } = await get('/process', {id: 7})
    expect(body.id).equal(7)
  })

  it('post# 提供第一个参数', async () => {
    const { body } = await post('/process/method/post', {id: 7})
    expect(body.id).equal(7)
  })

  it('raw# 原生数据', async () => {
    const data = {
      id: 7
    }
    const oldHot = (await get('/findOne', data)).body.hot
    await get('/process/raw', data)
    const newHot = (await get('/findOne', data)).body.hot
    expect(oldHot + 1).equal(newHot)
  })
})
