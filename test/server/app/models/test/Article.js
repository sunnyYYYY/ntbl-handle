/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('article', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    uid: {
      type: DataTypes.INTEGER(11),
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    summary: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: ''
    },
    poster: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: 'http://img2.imgtn.bdimg.com/it/u=76730858,3456223049&fm=27&gp=0.jpg'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });
};
