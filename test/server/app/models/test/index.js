import Sequelize from 'sequelize'
import Handle from  '../../../../../dist/handle.es'
import config from '../../config/database.config'

export const sequelize = new Sequelize(config)

const db = Handle.loadAll(sequelize, __dirname, {
  data (err, data) {
    console.log(err)
    return data || err || '未知错误'
  }
})
const {article, comment} = db._models
article.hasMany(comment, {foreignKey: 'aid'})
comment.belongsTo(article, {foreignKey: 'aid'})


// sequelize.sync({alter: true})

export default db