import supertest from 'supertest'
import app from '../server'
import chai from 'chai'

const baseUrl = '/api/v1'
const request = supertest.agent(app.callback())


async function test(method, url, data = {}, filed = {}, options = {}) {
  const http = request[method](baseUrl + url)
  const res = await http[method === 'get' ? 'query' : 'send'](data)

  chai.expect(res.body.success).to.true

  if (typeof filed === 'function') {
    return filed(res)
  }

  for (let key in filed) {
    chai.expect(res.body.data[key]).to.deep.equal(filed[key])
  }
}

export const get = async (...args) => await test('get', ...args)
export const post = async (...args) => await test('post', ...args)
export const expect = chai.expect

export default {
  get,
  post,
  expect
}
