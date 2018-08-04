// /**
//  * 数据库操作类，提供了快捷和过程两套方法。
//  * @interface
//  *
//  */
// class Base {
//   /**
//    *
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    * @param {function} [before] - 在全局钩子 before 之后执行
//    * @param {function} [after] - 在全局钩子 after 之后执行
//    */
//   toggle (options, before, after) {}
//   /**
//    *
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    * @param {function} [before] - 在全局钩子 before 之后执行
//    * @param {function} [after] - 在全局钩子 after 之后执行
//    */
//   findOne (options, before, after) {}
//
//   /**
//    *
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    * @param {function} [before] - 在全局钩子 before 之后执行
//    * @param {function} [after] - 在全局钩子 after 之后执行
//    */
//   findAll (options, before, after) {}
//
//   /**
//    *
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    * @param {function} [before] - 在全局钩子 before 之后执行
//    * @param {function} [after] - 在全局钩子 after 之后执行
//    */
//   findById (options, before, after) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    * @param {function} [before] - 在全局钩子 before 之后执行
//    * @param {function} [after] - 在全局钩子 after 之后执行
//    */
//   findOrCreate (options, before, after) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    * @param {function} [before] - 在全局钩子 before 之后执行
//    * @param {function} [after] - 在全局钩子 after 之后执行
//    */
//   findAndCountAll (options, before, after) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    * @param {function} [before] - 在全局钩子 before 之后执行
//    * @param {function} [after] - 在全局钩子 after 之后执行
//    */
//   findAndCount (options, before, after) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    * @param {function} [before] - 在全局钩子 before 之后执行
//    * @param {function} [after] - 在全局钩子 after 之后执行
//    */
//   findCreateFind (options, before, after) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    * @param {function} [before] - 在全局钩子 before 之后执行
//    * @param {function} [after] - 在全局钩子 after 之后执行
//    */
//   count (options, before, after) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    * @param {function} [before] - 在全局钩子 before 之后执行
//    * @param {function} [after] - 在全局钩子 after 之后执行
//    */
//   max (options, before, after) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    * @param {function} [before] - 在全局钩子 before 之后执行
//    * @param {function} [after] - 在全局钩子 after 之后执行
//    */
//   min (options, before, after) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    * @param {function} [before] - 在全局钩子 before 之后执行
//    * @param {function} [after] - 在全局钩子 after 之后执行
//    */
//   sun (options, before, after) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    * @param {function} [before] - 在全局钩子 before 之后执行
//    * @param {function} [after] - 在全局钩子 after 之后执行
//    */
//   create (options, before, after) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    * @param {function} [before] - 在全局钩子 before 之后执行
//    * @param {function} [after] - 在全局钩子 after 之后执行
//    */
//   bulkCreate (options, before, after) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    * @param {function} [before] - 在全局钩子 before 之后执行
//    * @param {function} [after] - 在全局钩子 after 之后执行
//    */
//   update (options, before, after) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    * @param {function} [before] - 在全局钩子 before 之后执行
//    * @param {function} [after] - 在全局钩子 after 之后执行
//    */
//   destroy (options, before, after) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    * @param {function} [before] - 在全局钩子 before 之后执行
//    * @param {function} [after] - 在全局钩子 after 之后执行
//    */
//   increment (options, before, after) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    * @param {function} [before] - 在全局钩子 before 之后执行
//    * @param {function} [after] - 在全局钩子 after 之后执行
//    */
//   decrement (options, before, after) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    */
//
//   rawFindOne (options) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    */
//   rawFindAll (options) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    */
//   rawFindById (options) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    */
//   rawFindOrCreate (options) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    */
//   rawFindAndCountAll (options) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    */
//   rawFindAndCount (options) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    */
//   rawFindCreateFind (options) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    */
//   rawCount (options) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    */
//   rawMax (options) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    */
//   rawMin (options) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    */
//   rawSun (options) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    */
//   rawCreate (options) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    */
//   rawBulkCreate (options) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    */
//   rawUpdate (options) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    */
//   rawDestroy (options) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    */
//   rawIncrement (options) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    */
//   rawDecrement (options) {}
//
//   /**
//    * @since 1.0.0
//    * @param {string|array|object|function(data,ctx,next)} options - 选项对象
//    */
// }
//
// export default Base
