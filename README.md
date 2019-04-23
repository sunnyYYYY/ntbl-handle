```
^ Sunny
) 18.08.10
? F
```

[TOC]

# Handle.js

[![GitHub](https://img.shields.io/badge/GitHub-yeshimei-green.svg)](https://github.com/yeshimei/ntbl-handle.git) [![npm](https://img.shields.io/npm/v/@ntbl/handle.svg)](https://www.npmjs.com/package/handle.js) [![MIT](https://img.shields.io/npm/l/express.svg)](https://github.com/yeshimei/ntbl-handle.git)

Handle，一个基于 koa 和 sequelize 的中间库，让你只专注于接口逻辑。

[API Documentation](https://yeshimei.github.io/Handle.js/)

# 安装

```bash
npm i handle.js --save
```

# Usage

```javascript
import Handle from 'handle.js'
// 导入 sequelize 模型
import { Article } from '../models/db'

// 把 article 传入 Handle，并实例化
const article = new Handle(Article)

// 生成一个查询当前模型所有数据的 koa 中间件
const find = article.findAll()

// 绑定到路由
router.get('/article/find', find)
```

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
// 另外还会返回一个名为 _models 的对象，包含 sequelize 模型实例
const db = Handle.loadAll(sequelize, __dirname, {
    // 除了 Handle 构造器选项对象外，
    // 还支持匹配规则（支持 glob 写法）
    rule: '/**/!(index|_)*.js',  // 默认
})
```

# 实例方法

Handle 拥有大部分 sequelize 模型实例上的方法，分为两类。

第一类，统称为**快捷方法**。调用后直接生成一个 async 函数（接口函数），可以直接挂载至路由，**无须编写一行代码。**。


- **GET：** findOne, findAll, findById, findOrCreate, findAndCountAll, findAndCount, findCreateFind, count, max, min, sun
- **POST:** create, bulkCreate, update, destroy, increment, decrement

```js
router.get('/article/find', article.findAll())
```

第二类，统称为**过程方法**，调用后仅返回数据，配合实例的 `process` 方法进一步处理。

rawFindOne, rawFindAll, rawFindById, rawFindOrCreate, rawFindAndCountAll, rawFindAndCount, rawFindCreateFind, rawCount, rawMax, rawMin, rawSun，rawCreate, rawBulkCreate, rawUpdate, rawDestroy, rawIncrement, rawDecrement

```js
const find = artcile.process(async function (d) {
    // 查询用户
    const userData = await user.rawFindOne(['username', 'password'])
    // 查询当前用户的文章
    const result = await this.rawFindAll([['id', userData.id]])
    // 仅返回被推荐的文章
    return result.filter(e => e.type === 'recommend')
})

// 最后，挂载至路由
router.get('/article/find', find)
```

# 修改默认的请求方法

你可能注意到了快捷方法已被固定了请求方法，我们可以通过以下方式修改。

```javascript
// 会让整个应用生效
// 不要传给 proxy 一个对象，会覆盖掉默认值
Handle.defaults.proxy.findAll.method = 'post'

// 让整个实例生效
// 这个可以，因为你它是一个空对象
article.options.proxy = {
  findAll: {
    method: 'post'  
  }
}

// 仅让当前的一次调用生效
article
  .method('post')
  .findAll()
```

注意，三者的优先级：方法 > 实例 > 整个应用，前者会覆盖掉后者。

# 工具方法

handle.js 内置了一个工具集，封装了一些常用的接口逻辑，帮助你快速编写复杂的接口，让你充分利用封装所带来的优良特性。




## 接口参数

where 工具方法帮助你更加灵活地处理接口参数逻辑，它提供六种 wehre 子句的便捷写法。

1. 同名

```js
article
    // uid ☞ 用户的 id
    // 查询指定用户的所有文章数据
    .where('uid')
    .findAll()
```

2. 多条件同名

```js
article
    // 查询指定用户并且指定文章的数据
    // 同时，满足两个条件
    .where('uid', 'id')
    .findAll()
```


3. 提供默认值

```js
article
    // 查询 id = 1 的文章数据
    // 注意，需要传入一个数组
    .where(['id', 1])
    .findAll()
```


4. 别名

```js
article
    // 通过 aid 查询指定文章的数据
    // 对外使用别名 aid，对内将替换为 id
    .where(['id', '@aid'])
    .findAll()
```


5. 可选值

```js
article
    // 通过 id 或 uid 查询文章的数据
    // 注意，当 id 和 uid 都未指定时
    // 意味着，无任何条件限制，这将返回所有的数据
    // 你必须小心谨慎！！！
    .where(['!id', '!uid'])
    .findAll()
```

6. Op

```js
article
    // 查询大于指定 id 的文章数据
    .where('id >')
    .findAll()
```

某些 Op 语法需要特殊的动态值，为此，Handle 增加了传入数组的第二个元素对函数写法的支持。

```js
article
    // 一个模糊查询
    .where(['title $like', d => `%${d.title}%`])
    .findAll()
```

where 支持的所有 Op 便捷写法。

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

另外，以上的六种便捷写法互相之间可以组合，但你需要了解一些约束：
- 别名语法（`@`） 只能用于数组中的第二个元素上
- 可选值语法（`!`）不能用于数组中的第二个元素上
- 除了默认值，所有的命名必须是一个合法的标识符
- 在一个位置里写了多 Op 标识，只会应用第一个，不同位置的相同的 Op 标识后面会覆盖前面

我们能写出更强大的接口参数。

```js
/*

以下接口参数逻辑，可以帮助我们完成 ☞

1. 查询指定用户的所有文章数据
2. 查询指定用户并且指定文章数据
3. 查询指定用户并且模糊匹配指定标题的文章数据

请注意，id 和 title 是可选的
而 uid 则是必须指定
*/
full: db.article
    .where('uid')
    .where('!id')
    .where(['!title $like', d => `%${d.title}%`])
    .findAll()
```

## 模糊查询

`fuzzyQuery`（模糊查询）、`fuzzyQueryLeft`（左模糊查询）、`fuzzyQueryRight`（右模糊查询）可以帮你快速生成一个模糊查询。

```js
article
    // 接受一个用于查询的参数
    // 默认为 name
    .fuzzyQuery('title')
    .findAll()
```

## 分页

`pagination` 帮助你快速生成一个分页逻辑。

```js

article
    // 每页查询 10 条数据
    // count 参数为每页的数量，默认为 15
    // page 参数为从第几页开始，默认为 0
    .pagination(10)
    .findAll()
```

## 排序

`order` 帮助你简单生成一个排序。

```js

article
    // 按最新的日期排序
    .order(['createdAt', 'DESC'])
    .findAll()
```

## 关联

`include` 帮助你添加关联（关联的更多知识，请参考 [sequelize 官方文档]()）

```js
article
    // 查询文章数据，同时
    // 查询每篇文件的用户和评论数据
    .include(User, Comment)
    .findAll()
```

## 数据处理

`remove` 帮助你移除 request data 中的指定字段。
`set` 则允许你修改。

```js
article
    // 将 status 字段移除
    // 不允许用户更新它
    .remove('status')
    .update()
```

```js
article
    // 将 status 字段的值更改为 fall
    set('status', 'fall')
    .update()
```

## 条件分支

`it` 类似 if 语句，可以让你的接口逻辑出现分支，这对于一些有细微差别的接口很重要，你可以通过 it 把它们合并成一个接口。除此之外，它还可以做某些特定查询的开关。

**it(condition, f1, [f2])**
- string/function **condition：** 用于 request data 的条件
- array/function **f1** 测试成功时执行
- array/function **f2** 测试失败时执行

其语法为：

```javascript
it(条件, 条件成立时执行, 条件不成立时执行)
```


```javascript
// 字段
// 当 comment == ture 时， 执行 f1，否则 f2
// 请注意，内部使用相等比较
it('comment', f1, f2)

// 函数
// 当 count 大于 2 时， 执行 f1，否则 f2
it(d => d.count > 2, f1, f2)

// 其他，f1, f2。 可以为一个函数或者一个函数数组
it('comment', f1, [f1, f2, f3])

// 不成立的条件执行可以省略
it('comment', [f1, f2, f3])
```

```js
article
    // 当 comment 时，
    // 才同时查询每篇文章的评论数据
    .it('comment', include(Comment))

```


`not` 是 it 的反向版本。

```javascript
not(条件, 条件不成立时执行, 条件成立时不执行)
```

`more` 类似 switch 语句，同时可分支多个条件。

```js
article
    itField('sort', {
      // 当 sort = 'name' 时执行
      'name': f1,    
      // 当 sort = 'age'  时执行
      'age': [f2, f3],   
      // 当 sort = 'height' 时执行
      'height': f4          
    })
    .findAll()
```

## Scope 

链式调用看起来简洁大方，但是却缺乏良好的复用性。当你有一组相同或类似的接口逻辑，你可以使用独立的函数版本再次封装后调用 `scope` 方法添加。


```js
// 引入独立的函数版本 Scopes 对象
const Scopes = Handle.Scopes
const {where, pagination, fuzzyQuery, include, order, it, merge} = Scopes

function nb () {
  // 使用 merge 函数合并多个工具函数
  return merge(
    where('uid'),
    where('!id'),
    fuzzyQuery('title'),
    pagination(10),
    order(['createdAt', 'DESC']),
  )
}


article
    .scope(nb)
    .findAll()
```

`scope` 方法合并的选项对象仅在第一次被使用的方法上有效。如果，想要让所有当前实例的模型方法都共享某些工具方法 ，可以在实例上通过 `defaultScope` 添加。

## 自定义



```

```

# Process

`process` 的是为一个接口需要多表操作并且对返回数据进一步处理的情况提供，也是实现更为复杂的接口的一个台阶。

这里，我们先分解了一个分页工具函数。

```javascript
articleStar.process(async function (d) {
  // 这里我们分解了工具函数里的分页      
  const {count = 15, page = 0, uid} = d
  // 注意，process 内部需要用过程方法
  // 需要返回数据进一步处理
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

然后，再看看多表操作。

```js
const find = artcile.process(async function (d) {
    // 查询用户
    const userData = await user.rawFindOne(['username', 'password'])
    // 查询当前用户的文章
    const result = await this.rawFindAll([['id', userData.id]])
    // 仅返回被推荐的文章
    return result.filter(e => e.type === 'recommend')
})
```

process 默认为 get 请求，Handle 支持 6 种 http 标准请求方法（get/head/put/delete/post/options）

```javascript
articleStar.process('post', async function (d) {})
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

# 原生数据

Handle 会很聪明的生成 sequelize 方法的参数，一般情况下，我们无须关心。但是对于，increment，decrement 或一些特殊情况，你想要使用指定的数据，而**不是** Handle 帮你处理后的 Request Data（前端发送到后端的数据），可以通过 `raw` 方法设置原生数据。

```javascript
// 递增 hot 字段
article
  .raw('hot')
  .increment('id')
```

但是，你需要了解，Request Data 仍然会用于各种场景下，比如 Scope 和 where 工具函数的解析，只是在最后合成 sequelize 方法的参数时，Request Data 被替换成了 原生数据，也就意味着，在钩子或者其他地方修改 Request Data 不会应用到数据库访问中。通过这一点，你可以使用类似 mock 的库批量向数据库添加数据。（并在未来可能会支持 mocK 的数据模拟）

# 差异性的问题

Handle 做为中间库，不会更改 sequelize 原生用法，它只关注一件事，就是让你用最少的代码写出最复杂的接口并让代码具有良好的可读性。另外，从代码层面上引导你编写可复用的代码。

但是，由于一些轮子依赖，在某些特定情况会产生一些约束，这些约束都会在这里指出，并在后续版本中解决，了解它们，可以更好的帮助你使用 Handle。

1. **很遗憾，你无法使用 Sequelize.Op**，但是可以使用字符串标识替代（但是在 v5 中会抛出一个废弃警告），原因是 Op 返回的是一个 Symbol 类型，作为对象的 key 使用时 Handle 所依赖的 `merge` 无法深度合并 Symbol，导致数据丢失。

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

## 一句话

一句话，如果你在工具函数中找不到可以帮你解决问题的函数时，我强烈建议你把相关代码封装成一个自定义的 scope 再使用，其一是你会有个优雅的代码结构和可读的命名，其二，当在其他地方复用时你必须再重新写一遍。如果你的 scope 足够通用时，你可以提交到 handle.js 中，为更多的人提供便利。

**如果你不使用 pull requests 或 Issues，也可以通过以下方式联系到我：**
- **qq ☞** 1517642399
- **email ☞** hsy.ntbl@gmail.com