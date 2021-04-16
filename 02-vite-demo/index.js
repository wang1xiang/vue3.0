#!/usr/bin/env node
const Koa = require('koa')
const send = require('koa-send')

const app = new Koa()

// 1. 静态文件服务器
app.use(async (ctx, next) => {
  // 返回当前目录下的index.html
  await send(ctx, ctx.path, { root: process.cwd(), index: 'index.html' })
  // 执行下一个中间件
  await next()
})


app.listen(3000)
console.log('Server running @ http://localhost:3000')
