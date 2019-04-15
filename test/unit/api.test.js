import { get, post } from '../utils'
import { expect } from 'chai'

describe('where 子句简写', () => {

  it('字符串',  async () => {
      const { body } = await get('/where/str', { id: 1 })
      expect(body.length).equal(1)
  })

  it('多条件',  async () => {
    const { body } = await get('/where/multiple', { id: 1, uid: 3})
    expect(body.length).equal(1)
  })

  it('默认值',  async () => {
    const { body } = await get('/where/str', { id: 1 })
    expect(body).not.equal([])
  })

  it('别名',  async () => {
    const { body } = await get('/where/str', { id: 1 })
    expect(body).not.equal([])
  })

  it('可选项',  async () => {
    const { body } = await get('/where/str', { id: 1 })
    expect(body).not.equal([])
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


describe('Mock', () => {
  it('批量添加数据', async () => {
    const { body } = await get('/mock')
    expect(body.length).equal(2)
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
