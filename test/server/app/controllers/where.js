import Mock from 'mockjs'
import { article } from '../models/test/index'

article.options.mock = Mock


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
  str: article.findAll('id'),
  multiple: article.findAll('id', 'uid'),
  rawMode: article.process(async function (d) {
    return await this.rawFindAll('id')
  }),
  init: article.mock({
    'data|50': [
      {
        'uid|1-3': 0,
        title: '@ctitle',
        summary: '@csentence',
        content: '@cparagrah'

      }
    ]
  })
}


