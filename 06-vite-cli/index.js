#!/usr/bin/env node
const path = require('path')
const { Readable } = require('stream')
const Koa = require('koa')
const send = require('koa-send')
const compilerSFC = require('@vue/compiler-sfc')

/**
 * 1.最终开发是一个基于node的命令行工具，在index.js头部配置运行node的位置`#!/usr/bin/env node`
 * 2.导入koa和koa-send
 * 3.开启静态文件服务器
 * 4.返回当前目录下的index.html静态页面
 * 5.监听端口，测试静态服务器，在终端执行npm link将当前项目链接到npm的安装目录中
 * 6.打开基于vue3开发的项目，在终端输入vite-cli，开启静态服务器
 * 7.创建中间件，处理第三方模块路径为/@modules/xxx
 * 8.在处理静态文件之前，创建中间件，当请求时判断请求中是否有/@modules/xxx，如果有去node_modules中加载对应模块，交给处理静态文件中间件去处理
 * 9.处理单文件组件，第一次请求将单文件组件编译成一个对象，第二次请求编译单文件组件的模板返回render函数，并挂载到render方法上
 * 10.当请求到单文件组件，并读取完成后，接着要对单文件组件进行编译，并且将编译后的结果返回给浏览器，所以是处理完静态文件之后，并且单文件组件可能会加载第三方模块，并且是加载第三方模块之前1，2之间
 * 11.使用@vue/compiler-sfc对单文件组件进行编译，将编译后的结果拼凑成vite生成文件样式，并转换为流的方式发送给浏览器
 * 12.加载css模块错误会阻塞后续代码执行，导致请求中断，注释图片和css模块的加载，此时重新启动，第一次编译单文件组件为组件的项目对象并返回给浏览器成功
 * 13.处理第二次请求，将单文件组件模板编译为render函数
 * 14.将process.env.NODE_ENV处理为development
 * 15.处理样式、图片等资源
 */
const app = new Koa()

const streamToString = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = []
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
    stream.on('error', reject)
  })

const stringToStream = (text) => {
  const stream = new Readable()
  stream.push(text)
  stream.push(null)
  return stream
}

// 3. 加载第三方模块
app.use(async (ctx, next) => {
  // ctx.path --> /@modules/vue
  if (ctx.path.startsWith('/@modules/')) {
    const moduleName = ctx.path.substr(10)
    // 需要先找到模块的package.json，在获取package.json中module值，就是ESModule的入口文件
    const pkgPath = path.join(
      process.cwd(),
      'node_modules',
      moduleName,
      'package.json'
    )
    const pkg = require(pkgPath)
    ctx.path = path.join('/node_modules', moduleName, pkg.module)
  }
  await next()
})

// 1. 静态文件服务器
app.use(async (ctx, next) => {
  // 返回当前目录下的index.html
  await send(ctx, ctx.path, { root: process.cwd(), index: 'index.html' })
  // 执行下一个中间件
  await next()
})

// 4. 处理单文件组件
app.use(async (ctx, next) => {
  if (ctx.path.endsWith('.vue')) {
    const contents = await streamToString(ctx.body)
    // 单文件组件的描述对象descriptor
    const { descriptor } = compilerSFC.parse(contents)
    let code
    // 如果当前请求不带type字段 说明是第一次请求
    if (!ctx.query.type) {
      code = descriptor.script.content
      // console.log(code)
      // import HelloWorld from './components/HelloWorld.vue'
      // export default {
      //   name: 'App',
      //   components: {
      //     HelloWorld
      //   }
      // }
      code = code.replace(/export\s+default\s+/g, 'const __script = ')
      code += `
      import { render as __render } from "${ctx.path}?type=template"
      __script.render = __render
      export default __script
      `
      // 处理第二次请求 编译模板compileTemplate
    } else if (ctx.query.type === 'template') {
      const templateRender = compilerSFC.compileTemplate({
        source: descriptor.template.content,
      })
      code = templateRender.code
    }
    // 设置'application/javascript'请求头
    ctx.type = 'application/javascript'
    // 需要将code转换为只读流发送给浏览器
    ctx.body = stringToStream(code)
  }
  // 经过下一中间件处理 将加载第三方模块路径进行修改
  await next()
})

// 2. 修改第三方模块的路径
app.use(async (ctx, next) => {
  // 判断当前文件是否是javascript
  if (ctx.type === 'application/javascript') {
    // ctx.body是流，需要转换为字符串
    const contents = await streamToString(ctx.body)
    // 匹配第三方模块 替换为@modules/xxx
    // import vue from 'vue'
    // import App from './App.vue'
    ctx.body = contents
      .replace(/(from\s+['"])(?![\.\/])/g, '$1/@modules/')
      .replace(/process\.env\.NODE_ENV/g, '"development"')
  }
})

app.listen(3000)
console.log('Server running @ http://localhost:3000')
