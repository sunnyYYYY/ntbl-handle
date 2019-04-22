

export default {
  database: 'handle_test',
  username: 'root',
  password: '1234',
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  define: {
    underscored: false,
    underscoredAll: false,
    freezeTableName: true,
    timestamps: true,
    paranoid: false,
    deletedAt: true
  }
}
