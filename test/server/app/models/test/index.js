import Sequelize from 'sequelize'
import Handle from  '../../../../../dist/handle.es'
import config from '../../config/database.config'

export const op = Sequelize.Op
export const sequelize = new Sequelize(config)

export const article = Handle.load(sequelize, __dirname + '/Article')

export const Comment = sequelize.import(__dirname + '/Comment')
const db = Handle.loadAll(sequelize, __dirname)

article.model.hasMany(Comment, {foreignKey: 'aid'})
Comment.belongsTo(article.model, {foreignKey: 'aid'})


// sequelize.sync({force: true})