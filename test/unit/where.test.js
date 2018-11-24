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


describe('模式切换', () => {
  it('raw 模式', async () => {
    const { body } = await get('/mode/raw', {id: 1})
    expect(body.length).equal(1)
  })
})