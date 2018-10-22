import {get, post, expect} from '../utils'


describe('user', () => {
  const data = {
    user_name: Math.random().toString(32).substr(2),
    user_password: '123456'
  }

  it('POST /register', async () => {
     await post('/user/register', data)
  })

  it('POST /login', async () => {
    await post('/user/login', data)
  })

  it('GET /detail',  async () => {
    await get('/user/detail')
  })

  it('POST /update', async () => {
    const data = {user_qq: 1517642399}
    await post('/user/update', data, {0: 1})
    await get('/user/detail', null, data)
  })

  it('POST /remove', async () => {
    await post('/user/remove')
  })
})
