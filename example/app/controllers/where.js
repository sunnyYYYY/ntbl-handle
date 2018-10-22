import {Article} from '../models/test'
import Handle from '../service/handle.es'

const article = new Handle(Article)

export default {
  findAll: article.findAll(),
  create: article.process(async function (d) {
    const res = await this.rawCreate({title: '测试'}, {})
    console.log(res)
    return res
  })
}


