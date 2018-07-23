
# Handle.js

Handle.js，一个基于 koa 和 sequelize 的中间库，让你只专注于接口逻辑。

Handle.js 的接口看起来像这样：

```javaScript
import {project} from '../models/db'
import Handle from '../service/handle'

const handle = new Handle(project)


export default {
  findAll: handle.findAll(),
  create: handle.create(),
  update: handle.update('id'),
  remove: handle.destroy('id')
}    
  
```

一组简单的增删改查，就这多，Handle.js 让你不必重复敲代码，你只需要设计你接口逻辑即可。 它看起来如此简单，但却能满足你所有复杂接口的实现。


# 例子

```javaScript

import Handle from './Handle'
const handle = new Handle('sequelize 模型对象', '选项')

/** ------------- where 快捷方式 -------------*/

/**
 * 通过 id 查询，相当于：
 * where: {
 *  id: d.id  // 'd' 是前端传入的数据
 * }
 */

handle.findAll('id')

/**
 * 通过 id 和 name 查询（必须同时成立）
 */
handle.findAll(['id', 'name'])

/**
 * 指定值，相当于
 * where: {
 *  name: '苹果'
 * }
 */
handle.findAll([['name', '苹果']])

/**
 * 任意组合
 */

handle.findAll([['name', '香蕉'], 'price'])

/** ------------- 选项函数-------------*/


/**
 * 这种写法支持所有合法的 sequelize 选项
 * 接受前端传入的数据 d
 * 必须返回一个（选项）对象
 *
 */
handle.findAll(d => ({
  // ...
}))

/**
 * 可以通过对象操作符以函数的形式任意组合选项对象（可复用性）
 */
handle.findAll(d => ({
  where: {},
  ...pagination
}))

function pagination ({count = 5, page = 0}) {
  return {
    limit: count,
    offset: page * count
  }
}

/**
 * 通过 Object.assign 可实现条件性的可选参数（不必在选项函数中写 if else 语句）
 */

handle.findAll(d => ({
    where: Object.assign({},
      {name: d.name},     // 必选参数会覆盖默认行为
      d.id && {id: d.id}  // 可选参数
    )
  }))

/** ------------- 数据钩子 -------------*/


/**
 * 此钩子，在数据库返回的数据之后，ctx.body 方法之前执行
 * 接受数据库返回的数据 d, 上下文 ctx, 流程退出 next
 */
handle.findAll('name', d => d.map(e => ({name: e.name})))

/**
 * 此钩子，在接受到前端数据之后，数据库查询之前执行
 * 接受数据库返回的数据 d, 上下文 ctx, 流程退出 next
 */

handle.findAll(d => ({
  where: {
    id: d.tableId
  }
}), null, d => {
  d.tableId = d.id
  // 虽然要求返回新的数据对象，但因为对象引用，可不写
})


/** ------------- 其他 -------------*/

// 这是 handle 的内置方法，如果数据存在则删除，不存在则创建
handle.toggle()
// 对 sequelize 作用域的封装
// 关于 scope 和可复用的选项函数之间的区别
// scope 具有链式的相互声明，适用于模型和数据过滤
// 选项函数，具有强大的可操作性，适用于复杂的查询逻辑
handle.scope()
// 对 sequelize 事务的封装
// 减少一半代码，让你只关心事务部分
handle.transaction()
```

# 方法一览

Handle.js 支持所有与数据库相关操作的方法

- get
  - findOne 
  - findAll 
  - findById 
  - findOrCreate 
  - findAndCountAll 
  - findAndCount 
  - findCreateFind 
  - count 
  - max 
  - min 
  - sun
- post
  - create
  - bulkCreate
  - update
  - destroy
  - increment
  - decrement

所有方法都有对应的 Raw 方法（findOneRaw 等等）, Raw 方法返回数据，而不像标准方法把数据通过 ctx.body 发送到前端。  




# 作者的话

这个库我只在个人项目中使用过，不建议用在正式项目中。