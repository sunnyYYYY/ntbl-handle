

export default {
  database: 'handle_test',
  username: 'root',
  password: '1234',
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  // pool: {
  //   max: 5,
  //   min: 0,
  //   idle: 10000,
  //   acquire: 10000
  // },
  define: {
    underscored: false,
    underscoredAll: false,
    freezeTableName: true,
    timestamps: true,
    paranoid: false,
    deletedAt: true
  }
}
