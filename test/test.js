const supertest = require('supertest')
const {expect} = require('chai')
const app = require('./app')

const request = supertest.agent(app.callback())