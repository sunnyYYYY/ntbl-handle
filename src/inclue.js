/**
 * 关联查询的辅助类，
 * 通过 add 添加模型的基本 include，然后由 create 指定层级关系，并生成复杂的关联查询。
 *
 * @constructor
 *
 */
class Include {
  constructor () {
    this.__maps = {}
  }

  /**
   * 添加一个 include
   *
   * @param {string} name - include 的名称
   * @param {object|function} f - 一个返回 include 数据的方法，如果为对象，则简单的封装成一个函数
   * @returns {Include}
   */
  add (name, f) {
    const maps = this.__maps
    if (typeof f !== 'function') f = () => f
    maps[name] = f.bind(maps)
    return this
  }

  /**
   * 移除一个 include
   * @param {string} name - include 的名称
   * @returns {boolean}
   */
  remove (name) {
    const maps = this.__maps
    return delete maps[name]
  }

  /**
   * 获取一个 include
   * @param {string} name - include 的名称
   * @returns {*}
   */
  get (name) {
    const maps = this.__maps
    return maps[name]
  }

  /**
   * 组合 include 生成更复杂的 include
   * @param {...args} scopes - 指定的层级关系
   * @returns {Array}
   */


  create (...args) {
    const maps = this.__maps
    return (function _create(scopes, ret = []) {
      for (let key in scopes) {
        let value = scopes[key]
        if (typeof value === 'string') ret.push(maps[value]())
        else if (Array.isArray(value)) _create(value, ret)
        else {
          let [_k, _v] = Object.entries(value)[0]
          let d = maps[_k]()
          d.include = []
          ret.push(d)
          _create(_v, d.include)
        }
      }
      return {include: ret}
    })(args)

  }
}


export default Include
