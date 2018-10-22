import Sequelize from 'sequelize'
import config from '../../config/database.config'

export const op = Sequelize.Op
export const sequelize = new Sequelize(config)

export const Comment = sequelize.import(__dirname + '/Comment')
export const Article = sequelize.import(__dirname + '/Article')


Article.hasMany(Comment, {foreignKey: 'aid'})
Comment.belongsTo(Article, {foreignKey: 'aid'})


// sequelize.sync()