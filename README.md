# Handle.js

Handle，一个基于 koa 和 sequelize 的中间库，让你只专注于接口逻辑。

[![GitHub](https://img.shields.io/badge/GitHub-yeshimei-green.svg)](https://github.com/yeshimei/Handle.js) [![npm](https://img.shields.io/badge/npm-v0.0.2-blue.svg)](https://www.npmjs.com/package/handle.js) [![MIT](https://img.shields.io/npm/l/express.svg)](https://github.com/yeshimei/Handle.js)

[API Documentation](https://yeshimei.github.io/Handle.js/)

## Installation

```
npm i handle.js --save
```

## Usage

```javascript
import Handle from 'handle.js'
// 导入 sequelize 模型
import { article } from '../models/db'

// 把 article 传入 Handle，并实例化
const article = new Handle(article)

// 生成一个查询当前模型所有数据的 koa 中间件
const find = article.findAll()

// 绑定到路由
router.get('/article/find', find)
```

## 核心

handle 本质上只是一个包装了接口逻辑中获取数据、try catch 语句和调用 sequelize 接口的容器，在此基础上提供了两套调用方法——快捷方法和过程方法，分别用于单步与多步操作处理。

快捷方法返回一个 async 函数，可挂载至路由。

```javascript
// article 是 Handle 的实例
// 这个接口会返回 article 模型的所有数据
router.get('/article/find', article.findAll())
```

在内部它直接调用 `ctx.body` 向前端返回数据并结束调用，只访问一次数据库。

过程方法返回数据（注意，不是 async 函数），一般需要结合 `process` 包装函数使用。

```javascript
// 由于内部绑定实例的 this 到了回调函数，所以不推荐使用箭头函数
const find = artcile.process(async function (d) {
    return await this.rawFindAll()
})

router.get('article/find', find)
```

以上两段代码做了同样的事情。过程方法 和 `process` 其实只是上述提到过的 Handle 原理的拆分，快捷方法负责 sequelize 调用，`process` 负责获取数据和 try catch。如此一来，你就能在 `process` 多次访问数据库，并且轻松过滤、重组和整合数据。

```javascript
const find = artcile.process(async function (d) {
    // 查询用户
    const userData = await u, findOne(['username', 'password'])
    // 查询当前用户的文章
    const result = await this.rawFindAll([['id', userData.id]])
    // 仅返回被推荐的文章
    return result.filter(e => e.type === 'recommend')
})
```

当然，你可以通过关联和 where 子句把三步合成一步，但这个例子强有力的证实了 `process` 应该干些什么。

> 在旧版本中，并没过程方法，每个快捷方法都额外接受两个回调函数，一个在访问数据库之前，一个在访问数据库之后，但是它却让代码丑出了新高度，更可怕的是我竟然没提供 async/await，让回调地狱里的恶魔差点把我吃了。

Handle 还走出了重要的一步，就是对选项对象可复用性的思考，比如你有一个分页逻辑（你一定写过），在 Handle 中你可以把它封装成一个的偏函数。

```javascript
// 为什么是偏函数？
// 因为我给分页预留了默认的配置项
function pagination (defaultCount = 5, defaultPage = 0) => {
  return d => {
    const count = ~~d.count || defaultCount
    const page = ~~d.page || defaultPage
    return {
      limit: count,
      offset: page * count
    }
  }
}
```

然后把它放进 `scope` 中即可。

```javascript
article
    .scope(pagination(10))
    .findAll()
```

另外, Handle 为用户做了更多的事情，在 `scope` 的基础上提供了一个工具集，涵盖了一些常用的封装，让你真的就像在搭积木，轻轻松松就实现了一个复杂的接口。handle 还提供了一个全局管理关联数据的静态类，并提供了对 Mock 的支持，并致力于让所有的事情变得简单有序。值得一提的是 Handle 并不依赖 Koa，过程方法可以让它用在 express 项目中或者 websocket 应用中，Handle 更准确说是一个 sequelize 的包装库。

# 加载器

加载器让 sequelize 模型文件的导入和 Handle 实例化合二为一。

```javascript
// 之前的写法

const Article sequelize.import(__dirname + './article')
const article = new Handle(Article)

// 使用加载器后
// 注意，你仍然需要把 sequelize 传入
// 内部使用 sequelize.import() 方法加载模型文件
const article = Handle.load(sequelize, __dirname + './article')
```

另外，还支持批量加载，一劳永逸。

```javascript
// 遍历指定目录中所有的 .js 文件（默认忽略 index.js 和以 _ 开头的文件）并加载
// 返回一个以文件名为 key ， Handle 实例为 value 的对象
const db = Handle.loadAll(sequelize, __dirname, {
    // 除了 Handle 构造器选项对象外，
    // 还支持匹配规则（支持 glob 写法）
    rule: '/**/!(index|_)*.js',  // 默认
})
```

# 实例方法

Handle 代理了部分 sequelize 模型方法，具体使用请参考 [Reference/Model](http://docs.sequelizejs.com/class/lib/model.js~Model.html)

- **GET：** findOne, findAll, findById, findOrCreate, findAndCountAll, findAndCount, findCreateFind, count, max, min, sun
- **POST:** create, bulkCreate, update, destroy, increment, decrement


以上所有模型方法统称为快捷方法，调用后生成一个 async 函数，可以直接挂载路由。此外，还提供了一套对应的过程方法，调用后仅返回原生数据，可供进一步处理。

rawFindOne, rawFindAll, rawFindById, rawFindOrCreate, rawFindAndCountAll, rawFindAndCount, rawFindCreateFind, rawCount, rawMax, rawMin, rawSun，rawCreate, rawBulkCreate, rawUpdate, rawDestroy, rawIncrement, rawDecrement

## 修改默认的请求方法

Handle 从三个层级上提供自定义实例方法与请求方法的映射关系。

```javascript
// 整个应用
// 不要传给 proxy 一个对象，会覆盖掉默认值
Handle.defaults.proxy.findAll.method = 'post'

// 实例
// 这个可以，因为你它是一个空对象
article.options.proxy = {
  findAll: {
    method: 'post'
  }
}

// 方法
article
  .method('post')
  .findAll()
```

注意，三者的优先级：方法 > 实例 > 整个应用

## where 子句简写


所有实例方法都支持 where 子句的简写，包括同名、多条件同名、提供默认值、别名，可选值和 Op。帮助你快速编写一些简单的接口逻辑，它即简单又强大。

1. 同名

```javascript
article.findOne('id')
// 内部将替换成
// {
//   where: { id:  d.id }
// }
//

```

GET 请求下，`d` 为 `ctx.query` 对象。POST 请求下，`d` 为 `ctx.request.body` 对象（默认为 x-www-form-urlencoded 类型）。简单说，就是前端发送到后端的数据对象。

2. 多条件同名

```javascript

article.findOne('id', 'uid')
// 内部将替换成
// {
//   where: {
//     id:  d.id,
//     uid: d.uid
//  }
// }
//
```

3. 提供默认值

```javascript
article.findOne('id', ['uid': 1])
// 内部将替换成
// {
//   where: {
//     id:  d.id,
//     uid: 1
//  }
// }
//
```

4. 别名

```javascript
article.findOne(['id', '@aid'], ['uid', 1])
// 内部将替换成
// {
//   where: {
//     id:  d.aid,
//     uid: 1
//  }
// }
//
```

5. 可选值

```javascript
article.findOne('uid', '!id')
// 内部将替换成
// {
//   where: {
//     id:  d.id,   // 注意，只有当 d 中存在 id 才会有这一行
//     uid: d.uid
//  }
// }
//
```

> **条件和可选值的区别？**
> 当 d 中不存在指定的值时。条件语法中默认给一个 undefiend（字段仍然会用于查询数据库）。而可选值语法中，则是根本不会出现在 where 子句中。

6. Op

Op 语法支持 Sequelize.op 中所有的条件。

```javascript
article.findOne(['id $gt', 10], 'uid !=')
// 内部将替换成
// {
//   where: {
//     id: {
//        gt: 10
//     },
//     uid: {
//       ne: d.uid
//     }
//  }
// }
//
```

以上所有语法都可以互相组合，但你需要了解一些约束：
- 别名语法（`@`） 只能用于数组中的第二个元素上
- 可选值语法（`!`）不能用于数组中的第二个元素上
- 除了默认值，所有的命名必须是一个合法的标识符
- 在一个位置里写了多 Op 标识，只会应用第一个，不同位置的相同的 Op 标识后面会覆盖前面

以下列出支持的 Op 标识 与  Sequelize.Op 的映射。

```javascript
let opTag = {
    '>': 'gt',
    '>=': 'gte',
    '<': 'lt',
    '<=': 'lte',
    '!=': 'ne',
    '=': 'and',
    '$and': 'and',
    '$or': 'or',
    '$gt': 'gt',
    '$gte': 'gte',
    '$lt': 'lt',
    '$lte': 'lte',
    '$ne': 'ne',
    '$eq': 'eq',
    '$not': 'not',
    '$between': 'between',
    '$notBetween': 'notBetween',
    '$in': 'in',
    '$notIn': 'notIn',
    '$like': 'like',
    '$notLike': 'notLike',
    '$iLike': 'iLike',
    '$regexp': 'regexp',
    '$iRegexp': 'iRegexp',
    '$notIRegexp': 'notIRegexp',
    '$overlap': 'overlap',
    '$contains': 'contains',
    '$contained': 'contained',
    '$any': 'any',
    '$col': 'col',
  }
```


一些 Op 语法需要特殊的动态值，为此，Handle 增加了数组第二个元素对函数写法的支持。

```javascript
// 模糊查询
article.findAll(['title $like', d => `%${d.title}%`])
```

## 更强大的函数式

函数式下支持所有 sequelize 模型选项中合法的选项。（具体请参考 [Model](http://docs.sequelizejs.com/class/lib/model.js~Model.html)）

```javascript
article.findOne(d => ({
  where: {
    id: d.aid,
    uid: 1
  },
}))
```

更复杂的分页查询。

```javascript
article.findAll(d => {
  const count = d.count || 5
  const page = d.page || 0
  return {

    where: {
      uid: d.uid,

    limit: count,
    offset: page * count
  }
}),
```

## 原生数据

Handle 会很聪明的生成 sequelize 方法的参数，一般情况下，我们无须关心。但是对于，increment，decrement 或一些特殊情况，你想要使用指定的数据，而**不是** Handle 帮你处理后的 Request Data（前端发送到后端的数据），可以通过 `raw()` 方法设置原生数据。

```javascript
// 递增 hot 字段
article
  .raw('hot')
  .increment('id')
```

但是，你需要了解，Request Data 仍然会用于各种场景下，比如 Scope 和 where 子句简写的解析，只是在最后合成 sequelize 方法的参数时，Request Data 被替换成了 `rawData`，也就意味着，在钩子或者其他地方修改 Request Data 不会应用到数据库访问中。这一点，`mock()` 在批量添加数据时，就是在内部调用了 `raw()`。


# Process

在核心一节中，我们介绍了过程方法的用法（多步数据库操作），那就是它的全部。现在，我们换一个方向，从抽离和封装堆叠在一起的代码中，贯穿 Handle 的几个关键特性。



```javascript
// 查询用户收藏的文章
articleStar.process(async function (d) {

  const {count = 5, page = 0, uid} = d

  const res = await this.rawFindAll({

    include: [
      {
        // 关联查询文章数据
        model: Article,
        // 并且查询文章的用户数据
        include: [User]
      }
    ],
    // 通过 uid 查询
    where: { uid },
    // 分页
    limit: count,
    offset: page * count
  })
  // 过滤数据，仅返回文章数据
  return res && res.map(d => d.article)
})
```

> 你也许敏锐的发现了 process 提供了 d 给过程方法使用，从另一侧看，过程方法只是纯粹的调用了数据库，所以两者结合到一起就是一个可扩展版的快捷方法。

process 默认为 get 请求，Handle 支持 6 种 http 标准请求方法（get/head/put/delete/post/options）

```javascript
articleStar.process('post', async function (d) {})
```

# Scope

`scope` 是复用模型选项对象的最佳选择，它在内部使用了 `merge` 深度混合所有 `scope` 到选项对象中。外在而言，让你的代码更直观、简洁、易懂和良好的复用性，更易于重构和修改。

so，把上面的分页逻辑封装成为一个提供参数的 scope。

```javascript
function pagination (defaultCount = 5, defaultPage = 0) => {
  return d => {
    const count = ~~d.count || defaultCount
    const page = ~~d.page || defaultPage
    return {
      limit: count,
      offset: page * count
    }
  }
}
```

然后，通过 `scope()` 方法到处复用。


```
// 查询所有指定 uid 的数据，且每页返回 10 条数据
article.scope(pagination(10)).findAll(uid')
// 使用 pagination 函数提供默认值
article.scope(pagination()).findAll('uid')
// 其实，你可以省略掉 pagination 前面的 ()
article.scope(pagination).findAll('uid')
```

看起来好了一些。

```javascript
// 同时，scope 还可以是对象
articleStar.process(async function (d) {
  const include = {
    // 这里有个小问题，
    // 我们无法让关联数据得以复用
    include: [
      {
        model: Article,
        include: [User]
      }
    ],
  }

  const res = await this
    .scope(pagination, include)
    .rawFindAll('uid')

  return res && res.map(d => d.article)
}),
```



`scope()` 方法合并的选项对象**仅在第一次被使用的方法上有效**。如果，想要让所有当前实例的模型方法都共享某些 scope ，可以在实例上通过 `defaultScope()` 添加。==注意，每个 `scope` 都必须最终返回一个选项对象，而不是其中的一部分。==


# Include

`Include` 是 Handle.js 一个静态工具类，用于统一管理整个应用的关联数据。Include 有一个有用的特性，就是通过对象嵌套指定关联数据的层次。现在，在我们复用关联数据的同时添加了一些字段过滤。

```javascript
const { Include } = Handle

Include
  // 添加名为 article 的关联，并忽略查询一些属性。
  .add('article', {
    model: Article,
    attributes: {
      exclude: ['content', 'createdAt', 'updateAt']
    },
  })
  // 同时添加一个名为 user 的关联。
  .add('user', {
    model: User,
    attributes: {
      exclude: ['password', 'lock', 'freeze', 'power' ,'createdAt', 'updateAt']
    },
  })
```

然后，通过 `Handle.create()` 方法，可以简单的组合已添加关联的层级关系。

```javascript
articleStar.process(async function (d) {
    const res = await this
      .scope(
        pagination,
        Include.create({ article: ['user'] })
      )
      .rawFindAll('uid')
    return res && res.map(d => d.article)
})
```

现在看起来就舒服多了。你也许已经看出来，可复用性体现哪里了？没错，就是通过 `scope` 你可以让每个接口轻松实现分页，你什么也不用做，只需要把一篮食材丢给 `scope` 它就会给你做出一盘香喷喷的盖浇米饭。`scope` 做了什么？很简单，它在内部深度合并了所有选项，就好像你把一个原本杂乱而负载过重的大胖子，拆分成了更小更轻快的小帅伙（这比喻有点奇怪），或者说你可以用搭积木的方式有序的易懂的（最重要是好看啊！）建筑起一座摩天大厦。而 `Include` 让你统一管理全局的关联数据并且通过简单的对象嵌套生成复杂的关联层级。

> 另外，除了可以把对象添加到 Include，还支持函数。


# Scopes Utils

`handle.js` 内置了一个 `Scopes` 工具集，封装了一些常用的接口逻辑，帮助你快速编写复杂的接口，让你充分利用 `scope` 封装所带来的优良特性。

==（目前，还在积极收集和考虑高频的接口逻辑，欢迎大家提供 Scope 建议或代码片段）==

```js
const Scopes = Handle.Scopes
const {where, pagination, fuzzyQuery} = Scopes
```

**where**

where 子句简写支持，用法与实例方法一致。

**fuzzyQuery(field = 'name')**

模糊查询

```javascript
article
    .scope(fuzzyQuery('title'))
    .findAll()
/* 内部将替换成
{
    where: {
        title: {
            like: `%${d.title}%`
        }
    }
}

*/
```

此外，还有 fuzzyQueryLeft/fuzzyQueryRight 左模糊查询和右模糊查询。

**pagination(page = 0, count = 5)**

分页

- page = 0：页数
- count = 5：每页的数量

```javascript
article
    .scope(pagination(10))
    .findAll()

/*
  {
    limit: d.count,
    offset: d.page * d.count
  }
*/
```



# 事务

`transaction` 是通过 `process` 简单的对 sequelize 原生事务的封装。在使用上，和 `process` 完全一致。

```javascript
articleStar.transaction(async function (d) {
  /** 事务相关的处理 */
  return /** 返回处理后的数据 */
}),
```

# 钩子

`Handle` 在选项对象里提供了三个全局钩子 `before` 、`after`， `data`。


```javascript
new Handle(model, {
    // before 钩子在数据库操作之前执行
    before (data, ctx, next) {

    }
    // after 钩子在数据库操作之后执行
    after (result, ctx, next) {

    }
    // data 钩子可以在返回数据到前端之前和捕获异常之后做一些处理
    data (err, result, ctx, next) {

    }
})
```

如果你设置了全局钩子，每个快捷方法都会执行这些钩子，而过程方法则会忽略这些钩子，`process` 会在调用回调前执行 `before` 调用回调后执行 `after` 和 `data`。

# Mock 支持

Handle.js 提供了 mock 的接口，但它依赖于 mock 库。这里，我推荐使用 [mockjs](https://github.com/nuysoft/Mock)。

首先，你需要通过选项对象传入 mock 库以开启 `mock()` 方法

```javascript
import Mock from 'mockjs'

// 指定要使用 mockjs
const article = new Handle(Article)
article.options.mock = Mock
```

然后，使用实例的 `mock()` 方法。

```javascript
// 批量向 article 表中插入 20 条数据
article.mock({
 'data|20': [
   {
     title: '@ctitle',
     content: '@cparagraph'
   }
 ]
})
```

`mock()` 内部调用实例的 `bulkCreate()` 方法批量添加数据（注意，因为使用了原生数据入口 `raw()`，所以不会对数据做任何处理）





# 一些差异性的问题

Handle 做为中间库，不会更改 sequelize 原生用法，它只关注一件事，就是让你用最少的代码写出最复杂的接口并让代码具有良好的可读性。另外，从代码层面上引导你编写可复用的代码。

但是，由于一些轮子依赖，在某些特定情况会产生一些约束，这些约束都会在这里指出，并在后续版本中解决，了解它们，可以更好的帮助你使用 Handle。

1. **很遗憾，你无法使用 Sequelize.Op**，但是可以使用字符串标识替代（但是在 v5 中会抛出一个废弃警告），原因是 Op 返回的是一个 Symbol 类型，作为对象的 key 使用时 Handle 所依赖的 `merger` 无法深度合并 Symbol，导致数据丢失。

```javascript
// 会丢失
article
  .scope({
      where: {
        [Op.lt]: 2
      }
  })
  .findAll()

// 更改为字符串语法

article
  .scope({
      where: {
        'it': 2
      }
  })
  .findAll()
```

# 插件系统

（暂无）


