#### Vue3.0 介绍

##### 源码组织方式

- 提升代码可维护性，源码采用 TypeScript 重写

- 使用 Monorepo 管理项目结构，将独立模块提取到不同的包中，每个模块划分明确，模块依赖关系也很明确，并且每个功能模块都可以单独测试、发布并使用

  ![image-20210412192848527](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210412192848527.png)

  `compiler`开头的包都是和编译相关的代码，`compiler-core`是和平台无关的编译器，`compiler-dom`是浏览器平台下的编译器，依赖`compiler-core`；`compiler-sfc`（single file component）单文件组件，用于编译单文件组件，依赖`compiler-core`和`compiler-dom`；`compiler-ssr`是和服务端渲染相关的编译器，依赖`compiler-dom`

  `reactivity`是数据响应式系统，可单独使用

  `runtime`开发的包都是运行时代码，`runtime-core`是和平台无关的运行时，`runtime-dom`是针对浏览器的运行时，处理原生 DOM API、事件等；`runtime-test`是为测试而编写的轻量的运行时，渲染出的 DOM 树是一个 js 对象，所以这个运行时可以运行在所有的 js 环境里，用它来测试渲染是否正确，还可以用于序列化 DOM、触发 DOM 事件以及记录某次更新中的 DOM 操作

  `server-renderer`是服务端渲染

  `shared`是 vue 内部使用的一些公共 API

  `size-check`是私有包，不会发布到 npm，用于在 tree-shaking 后检查包的大小

  `template-explorer`是在浏览器里运行的实时编译组件，会输出 render 函数

  `vue`构建完整版 vue，依赖于`compiler`和`runtime`

##### Vue.js3.0 不同构建版本

构建不同版本，用于不同的场合，和 vue2.x 不同的是，不再构建 umd 模块方式，umd 模块方式会让代码更加冗余

- packages/vue 存在所有构建版本

  ![image-20210412193022815](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210412193022815.png)

- 说明

  [官网不同构建版本的解释](https://v3.cn.vuejs.org/guide/installation.html#%E5%AF%B9%E4%B8%8D%E5%90%8C%E6%9E%84%E5%BB%BA%E7%89%88%E6%9C%AC%E7%9A%84%E8%A7%A3%E9%87%8A)

  |                     版本                      |              名称               |                   说明                   |
  | :-------------------------------------------: | :-----------------------------: | :--------------------------------------: |
  |          cjs（commonJS 模块化方式，           |           vue.cjs.js            |           开发版，代码未被压缩           |
  |       完整版 vue，包含运行时和编译器）        |         vue.cjs.prod.js         |           生产版本，代码被压缩           |
  |   global（全局，这 4 个文件都可以在浏览器中   |          vue.global.js          |              完整版，开发版              |
  |  通过 script 的方式引入，增加全局 vue 对象）  |       vue.global.prod.js        |              完整版，生产版              |
  |                                               |      vue.runtime.global.js      |            运行时版本，开发版            |
  |                                               |   vue.runtime.global.props.js   |            运行时版本，生产版            |
  |   browser（esModule 模块化方式，在浏览器中    |       vue.esm-browser.js        |              完整版，开发版              |
  |       通过 type="module"的方式来导入）        |       esm-browser.prod.js       |              完整版，生产版              |
  |                                               |   vue.runtime.esm-browser.js    |            运行时版本，开发版            |
  |                                               | vue.runtime.esm-browser.prod.js |            运行时版本，生产版            |
  | bundler（需要配合打包工具使用，使用 es Module |       vue.esm-bundler.js        |     完整版，还导入 runtime-compiler      |
  |   方式，内部通过 import 导入 runtime-core）   |   vue.runtime.esm-bundler.js    | 运行时，通过脚手架创建项目默认使用此版本 |

##### Composition API

- [RFC(Request For Comments)](https://github.com/vuejs/rfcs)
- [Composition API RFC](https://composition-api.vuejs.org/)

**设计动机**

- Options API

  包含一个描述对象组件选项（data、methods、props 等）的对象

  Options API 开发负责组件，同一个功能逻辑的代码被拆分到不同选项中

  ```js
  export default {
    data() {
      return {
        position: {
          x: 0,
          y: 0,
        },
      }
    },
    created() {
      window.addEventListener(' mousemove ', this.handle)
    },
    destroyed() {
      window.removeEventListener('mousemove ', this.handle)
    },
    methods: {
      handle(e) {
        this.position.x = e.pagexthis.position.y = e.pageY
      },
    },
  }
  ```

- Composition API

  Vue.js3.0 中新增的一组 API

  一组基于函数的 API

  可以更灵活的组织组件的逻辑

  解决超大组件时，使用 Options API 不好拆分和重用问题

  ```js
  // CompositionAPI
  import { reactive, onMounted, onUnmounted } from 'vue'
  function userMousePosition() {
    const position = reactive({
      x: 0,
      y: 0,
    })
    const update = (e) => {
      position.x = e.pageX
      position.y = e.pageY
    }
    onMounted(() => {
      window.addEventListener('mousemove', update)
    })
    onUnmounted(() => {
      window.removeEventListener('mousemove', update)
    })
    return position
  }

  export default {
    setup() {
      const position = useMousePosition()
      return {
        position,
      }
    },
  }
  ```

  ![image-20210412200549917](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210412200549917.png)

同一色块代表同一功能，Options API 中相同的代码被拆分在不同位置，不方便提取重用代码

Composition API 同一功能代码不需要拆分，有利于代码重用和维护

##### 性能提升

- 响应式系统升级

  Vue.js2.x 中响应式系统核心是 defineProperty，初始化时遍历所有 data 中的成员，通过 defineProperty 将对象属性转换为 getter 和 setter，如何 data 中的对象又是对象的话，需要递归处理每一个子对象属性

  Vue.js3.0 中使用 Proxy 对象重写响应式系统，可以拦截属性的访问、赋值、删除等操作

  Proxy 好处：

  1. 可以监听动态新增属性，vue2.x 需要使用$set
  2. 可以监听删除的属性，vue2.x 监听不到
  3. 可以监听数组的索引和 length 属性，vue2.x 监听不到

- 编译优化

  对编译器进行优化，重写虚拟 DOM，首次渲染和 update 性能有了大幅度提升

  ```vue
  <template>
    <div id="app">
      <div>
        static root
        <div>static node</div>
      </div>
      <div>static node</div>
      <div>static node</div>
      <div>{{ count }}</div>
      <button @click="handler">button</button>
    </div>
  </template>
  ```

  Vue.js2.x 在构建过程中需要先编译为 render 函数，在编译时通过标记静态根节点，优化 diff 过程（但是依然需要执行 diff 操作），当组件发生变化时，会通知 watcher，触发 watcher 的 update 方法，最终执行虚拟 DOM 的 patch 操作，遍历所有虚拟节点找到差异，然后更新到真实 DOM 上；diff 过程中会比较整个虚拟 DOM，先对比新旧的 div，以及它的属性，再去对比内部子节点；

  Vue.js2.x 中渲染的最小单位是组件

  Vue.js3.0 中标记和提升所有静态根节点，diff 时只需要对比动态节点内容

  - Fragments 片段，模板中不需要在创建唯一的根节点，需要升级 vetur 插件，查看[Vue 3 Template Explorer](https://vue-next-template-explorer.netlify.app/)

    ![image-20210413082819879](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210413082819879.png)

    首先使用`_createBlock`给根 div 创建 block，是树结构，然后通过`_createVNode`创建子节点，相当于`h`函数，当删除根节点时，会创建\_`Fragment`片段

    ![image-20210413083059655](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210413083059655.png)

  - 静态提升

    打开`hoistStatic`静态提升选项，可以看到`_createBlock`中的静态节点都被提升到 render 函数外边，这些节点只有初始化时被创建一次，再次调用 render 时不会在被创建

    ![image-20210413083144478](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210413083144478.png)

  - Patch flag

    ![image-20210413083558220](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210413083558220.png)

    可以看到在动态节点`<div>{{ count }}</div>`通过`_createVNode`渲染后，最终会有数字`1`，这就是 Patch flag。作为一个标记，将来在执行 diff 时会检查整个`block`中带 Patch flag 标记的节点，如果 Patch flag 值为`1`，代表文本内容时动态绑定，所以只会比较文本内容是否发生变化

    ![image-20210413084010181](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210413084010181.png)

    此时在给当前 div 绑定一个 id 属性，可以看到 Patch flag 变为`9`，代表当前节点的文本和 PROPS 是动态内容，并且记录动态绑定的 PROPS 是 id，将来 diff 时只会检查此节点的文本和 id 属性是否发生变化，从而提升 diff 性能

  - 缓存事件处理函数

    ![image-20210413084318107](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210413084318107.png)

    开启缓存后，首次渲染时会生成新的函数，并将函数缓存到`_cache`对象中，将来再次调用 render 时，会从缓存中获取

- 源码体积优化

  Vue.js3.0 移除一些不常用 API，如：inline-template、filter 等

  Tree-shaking 支持更好，因为 Tree-shaking 依赖 ES Module，也就是 ES6 的模块化语法结构`import`和`export`，通过编译阶段的静态分析，找到没有引入的模块，在打包的时候直接过滤掉，从而减少打包体积。Vue.js3.x 的内置组件 keepAlive、Trasition 和一些内置指令都是按需引入，并且 Vue.js3.x 中的很多 API 都是支持 Tree-shaking，没有使用是不会进行打包的

##### Vite

学习 Vite 前，先需要了解 ES Module

- 除 IE 外，现代浏览器都支持 ES Moduie

- 加载模块通过在 script 标签中 type="module"即可

  ```html
  <script type="module" src="..."></script>
  ```

- 支持模块的 script 默认延迟加载

  类似于 script 标签设置 defer

  在文档解析完成后，触发[DOMContentLoaded](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/DOMContentLoaded_event)事件前执行

[案例项目地址](https://github.com/wang1xiang/vue3.0/tree/master/01-esmodule)

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <div id="app">Hello world!</div>
    <script>
      window.addEventListener('DOMContentLoaded', () => {
        console.log('DOMContentLoaded')
      })
    </script>
    <script type="module" src="./modules/index.js"></script>
  </body>
</html>
```

```js
// modules/index.js
import { forEach } from './utils.js'

const app = document.querySelector('#app')
console.log(app.innerHTML)

const arr = [1, 2, 3]
forEach(arr, (item) => {
  console.log(item)
})
```

`type="module"`方式引入时需要在服务器中运行项目，在 vsCode 中安装插件`live-server`，右键启动项目

![image-20210413103509503](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210413103509503.png)

打开浏览器控制台，可以看到输出结果如下所示，可以看到`index.js`模块在文档解析完成后，触发 DOMContentLoaded 事件前执行

![image-20210413085620461](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210413085620461.png)

Vite vs Vue-Cli

- Vite 在开发模式下不需要打包可以直接运行，因为 vite 在开发模式下使用浏览器支持的 es Module 加载模块，通过`<script type="module"></script>`的方式加载代码，提升开发效率；vite 会开启测试服务器，拦截浏览器发送请求，对浏览器不识别的模块进行处理，比如当 import 单文件组件时，会先进行编译，把编译的结果发送给浏览器
- Vue-Cli 开发模式下必须对项目打包才可以运行
- Vite 在生成环境下使用 Rollup 打包，基于 ES Module 的方式打包，不再需要使用 babel 把 import 转换为 require，因此打包体积会小于 webpack 体积
- Vue-Cli 使用 Webpack 打包

Vite 特点

- 快速冷启动（不需要打包）
- 按需编译（代码加载时才会进行编译）
- 模块热更新

使用 Vite 创建基于 vue3 项目

```bash
npm install create-vite-app -g
npm init vite-app <project-name>
cd <project-name>
npm install
npm run dev
```

基于模板创建项目

```bash
npm init vite-app --template react
npm init vite-app --template preact
```

[案例项目地址](https://github.com/wang1xiang/vue3.0/tree/master/02-vite-demo)

通过 create-vite-app 创建完项目之后，App.vue 会有 eslint 语法错误，原因是 Vetur 插件还没有更新

![image-20210413113538441](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210413113538441.png)

解决：文件 --> 首选项 --> 设置 --> 搜索 eslint-plugin-vue --> Vetur › Validation: Template 取消勾选

![image-20210413095847513](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210413095847513.png)

通过 npm run dev 启动项目

开发环境下，vite 开启 web 服务器后，会劫持.vue 结尾的文件，将.vue 文件转换为 js 文件，并将响应中的 content-type 设置为 application/javascript，告诉浏览器是 js 脚本

![image-20210413085824316](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210413085824316.png)

生成环境

#### Composition API 使用

[响应性基础 API](https://v3.cn.vuejs.org/api/basic-reactivity.html#%E5%93%8D%E5%BA%94%E6%80%A7%E5%9F%BA%E7%A1%80-api)

```bash
mkdir 03-composition-api
# 初始化项目package.json
npm init --yes
# 安装vue3
npm install vue@next --save
```

```html
<!-- 01-createApp.html  -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>createApp & reactive</title>
  </head>
  <body>
    <div id="app">
      x: {{ position.x }}<br />
      y: {{ position.y }}
    </div>
    <script type="module">
      import {
        createApp,
        reactive,
      } from './node_modules/vue/dist/vue.esm-browser.js'

      const app = createApp({
        setup() {
          // reactive用于设置对象响应式
          const position = reactive({
            x: 0,
            y: 0,
          })
          return {
            position,
          }
        },
        mounted() {
          this.position.x = 100
        },
      })
      app.mount('#app')
    </script>
  </body>
</html>
```

可以将鼠标移动的相关的参数和方法统一封装在一个函数中

```js
// 将鼠标移动相关统一放在一起
function useMousePosition() {
    const position = reactive({
        x: 0,
        y: 0,
    })

    const update = (e) => {
        position.x = e.pageX
        position.y = e.pageY
    }

    onMounted(() => {
        window.addEventListener('mousemove', update)
    })

    onUnmounted(() => {
        window.removeEventListener('mousemove', update)
    })
	// 返回时转换为ref
    return toRefs(position)
}
```

然后在setup函数中使用

```js
setup() {
	// 通过toRefs可以在不失去响应性的情况下解构
    const { x, y } = useMousePosition()
    return {
        x,
        y,
    }
}
```

