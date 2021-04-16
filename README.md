#### Proxy Vue3.0 介绍

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
  
- Composition Api vs Options Api

  - 在逻辑组织和逻辑复用方面，`Composition API`是优于`Options API`
  - 因为`Composition API`几乎是函数，会有更好的类型推断。
  - `Composition API`对 `tree-shaking` 友好，代码也更容易压缩
  - `Composition API`中见不到`this`的使用，减少了`this`指向不明的情况
  - 如果是小型组件，可以继续使用`Options API`，也是十分友好的

##### 性能提升

- 响应式系统升级

  Vue.js2.x 中响应式系统核心是 defineProperty，初始化时遍历所有 data 中的成员，通过 defineProperty 将对象属性转换为 getter 和 setter，如何 data 中的对象又是对象的话，需要递归处理每一个子对象属性

  Vue.js3.0 中使用 Proxy 对象重写响应式系统，可以拦截属性的访问、赋值、删除等操作

  Proxy 好处：

  1. 可以监听动态新增属性，vue2.x 需要使用$set
  2. 可以监听删除的属性，vue2.x 监听不到
  3. 可以监听数组的索引和 length 属性，vue2.x 监听不到

- 编译优化

  对编译器进行优化，重写虚拟 DOM，首次渲染和 update 性能有了大幅度提升，这也是Vue3性能能够得到提升的重要原因之一

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

- [reactive](https://v3.cn.vuejs.org/api/basic-reactivity.html#reactive)返回对象的响应式副本

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

  可以将鼠标移动的相关的参数和方法统一封装在一个函数中，使用[toRefs](https://v3.cn.vuejs.org/api/refs-api.html#torefs)将响应式对象转换为普通对象

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

  然后在 setup 函数中使用

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

- [ref](https://v3.cn.vuejs.org/api/refs-api.html#ref) 接受一个内部值并返回一个响应式且可变的 ref 对象

  ```html
  ...
  <div id="app">
    <button @click="increase">增加</button>
    <span>{{ count }}</span>
  </div>
  ...
  <script type="module">
    function useRef() {
      const count = ref(0)

      return {
        count,
        increase: () => {
          //
          count.value++
        },
      }
    }
    const app = createApp({
      setup() {
        return {
          ...useRef(),
        }
      },
    })
  </script>
  ```

- [computed](https://v3.cn.vuejs.org/api/computed-watch-api.html#computed) 接受一个 getter 函数，并为从 getter 返回的值返回一个不变的响应式 ref 对象

  ```html
  ...
  <div id="app">
    <button @click="push">按钮</button>
    未完成：{{ activeCount }}
  </div>
  ...
  <script type="module">
    const data = [
      { text: '看书', completed: false },
      { text: '敲代码', completed: false },
      { text: '约会', completed: true },
    ]

    createApp({
      setup() {
        const todos = reactive(data)

        const activeCount = computed(() => {
          return todos.filter((item) => !item.completed).length
        })

        return {
          activeCount,
          push: () => {
            todos.push({
              text: '开会',
              completed: false,
            })
          },
        }
      },
    }).mount('#app')
  </script>
  ```

- [watch](https://v3.cn.vuejs.org/api/computed-watch-api.html#watch) watch 与 Options API this.$watch(以及相应的 watch 选项) 完全等效

  ```js
  createApp({
    setup() {
      const question = ref('')
      const answer = ref('')

      watch(question, async (newValue, oldValue) => {
        const response = await fetch('https://www.yesno.wtf/api')
        const data = await response.json()
        answer.value = data.answer
      })
      return {
        question,
        answer,
      }
    },
  }).mount('#app')
  ```

- [watchEffect](https://v3.cn.vuejs.org/api/computed-watch-api.html#watcheffect) 在响应式地跟踪其依赖项时立即运行一个函数，并在更改依赖项时重新运行它

  ```js
  createApp({
    setup() {
      const count = ref(0)
      const stop = watchEffect(() => {
        console.log(count.value)
      })

      return {
        count,
        stop,
        increase: () => {
          count.value++
        },
      }
    },
  }).mount('#app')
  ```

[项目地址](https://github.com/wang1xiang/vue3.0/tree/master/03-composition-api)

#### Vue.js3.0 响应式系统原理

##### Vue.js响应式原理回顾

- [Proxy](https://es6.ruanyifeng.com/#docs/proxy)对象实现属性监听
- 多层属性嵌套,在访问属性过程中处理下一级属性
- 默认监听动态添加的属性
- 默认监听属性的删除操作
- 默认监听数组索引和 length属性
- 可以作为单独的模块使用

##### 核心方法

- reactive/ref/toRefs/computed
- effect watch/watchEffect是vue3 runtime.core中实现的，内部使用effect底层函数
- track 手机依赖
- trigger 触发更新

##### 响应式系统原理——Proxy

[Proxy](https://es6.ruanyifeng.com/#docs/proxy)和[Reflect](https://es6.ruanyifeng.com/#docs/reflect)是ES6 为了操作对象而提供的新 API

proxy中有两个需要注意的地方：

- set 和 deleteProperty 中需要返回布尔类型的值

  ```js
  <script>
        'use strict'
        // set 和 deleteProperty 中需要返回布尔类型的值
        // 在严格模式下，如果返回 false 的话会出现 Type Error 的异常
        const target = {
          foo: 'xxx',
          bar: 'yyy'
        }
        // Reflect.getPrototypeOf()相当于Object.getPrototypeOf()
        const proxy = new Proxy(target, {
          // receiver代表当前的的Proxy对象或者继承Proxy的对象
          get (target, key, receiver) {
            // return target[key]
            // Reflect反射，代码运行期间获取对象中的成员
            return Reflect.get(target, key, receiver)
          },
          set (target, key, value, receiver) {
            // target[key] = value
            // Reflect.set设置成功返回true 设置失败返回false
            return Reflect.set(target, key, value, receiver)
          },
          deleteProperty (target, key) {
            // delete target[key]
            return Reflect.deleteProperty(target, key)
          }
        })
  
        proxy.foo = 'zzz'
        // delete proxy.foo
  </script>
  ```

  如果set和deleteProperty返回false时，页面会报错

  ![image-20210414080553080](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210414080553080.png)

- Proxy 和 Reflect 中使用的 receiver指向

  ```js
  // Proxy 中 receiver：Proxy 或者继承 Proxy 的对象
  // Reflect 中 receiver：如果 target 对象中设置了 getter，getter 中的 this 指向 receiver
  
  const obj = {
      get foo() {
          console.log(this)
          return this.bar
      },
  }
  
  const proxy = new Proxy(obj, {
      get(target, key, receiver) {
          if (key === 'bar') {
              return 'value - bar'
          }
          return Reflect.get(target, key, receiver)
      },
  })
  console.log(proxy.foo)
  ```

  不传递receiver时，可以看到this返回的是obj对象，proxy.foo返回undefined

![image-20210414080743227](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210414080743227.png)

​	当传递了receiver时，this指向Proxy对象

![image-20210414080825068](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210414080825068.png)

##### 响应式系统原理——reactive

- 接收一个参数，判断这参数是否是对象，不是直接返回，只能转换对象为响应式对象

- 创建拦截器对象handler，设置get/set/deleteProperty

- 返回Proxy 对象

  ```js
  // reactivily/index.js
  const isObject = (val) => val !== null && typeof val === 'object'
  export function reactive(target) {
    if (!isObject(target)) return
  
    const handler = {
      get(target, key, receiver) {
        console.log('get', key, target)
      },
      set(target, key, value, receiver) {
        console.log('set', key, value)
        return value
      },
      deleteProperty(target, key) {
        console.log('delete', key)
        return target
      },
    }
  
    return new Proxy(target, handler)
  }
  ```

  测试set和delete，结果如下

  ![image-20210414082410979](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210414082410979.png)

  reactive实现思路：

  1. 定义handler对象，用于Proxy的第二个参数（拦截器对象）
  2. get方法实现
     - 收集依赖
     - 返回target中对于key的value
     - 如果value为对象，需要再次转为响应式对象
  3. set方法中实现
     - 获取key属性的值，判断新旧值是否相同，相同时返回true
     - 不同时，先将target中的key对应的value修改为新值
     - 最后触发更新
  4. deleteProperty方法实现
     - 首先判断target本身是否存在key
     - 删除target中的key，并返回成功或失败
     - 删除成功，触发更新

  代码示例：

  ```js
  const isObject = (val) => val !== null && typeof val === 'object'
  const convert = (val) => (isObject(val) ? reactive(val) : val)
  const hasOwnProperty = Object.prototype.hasOwnProperty
  const hasOwn = (target, key) => hasOwnProperty.call(target, key)
  
  export function reactive(target) {
    if (!isObject(target)) return
  
    const handler = {
      get(target, key, receiver) {
        // 收集依赖
        const value = Reflect.get(target, key, receiver)
        return convert(value)
      },
      set(target, key, value, receiver) {
        const oldValue = Reflect.get(target, key, receiver)
        let result = true
        if (oldValue !== value) {
          let result = Reflect.set(target, key, value, receiver)
          // 触发更新
        }
        return result
      },
      deleteProperty(target, key) {
        const hasKey = hasOwn(target, key)
        const result = Reflect.deleteProperty(target, key)
        if (hasKey && result) {
          // 触发更新
        }
        return result
      },
    }
  
    return new Proxy(target, handler)
  }
  ```

  测试，创建html文件进行测试：

  ```html
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
  </head>
  <body>
    <script type="module">
      import { reactive } from './reactivity/index.js'
      const obj = reactive({
        name: 'zs',
        age: 18
      })
      obj.name = 'lisi'
      delete obj.age
      console.log(obj)
    </script>
  </body>
  </html>
  ```

##### 响应式系统原理——收集依赖

![image-20210415080133182](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210415080133182.png)

![image-20210414082624298](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210414082624298.png)

- 依赖收集过程中会创建3个集合，分别是targetMap、depsMap和dep
- targetMap作用是记录目标对象和一个字典（depsMap），使用WeakMap弱引用，当目标对象失去引用之后，可以销毁
- targetMap的值是depsMap，depsMap的key是目标对象的属性名称，值是一个set集合dep
- dep中存储的是effect函数，因为可以多次调用一个effect，在effect中访问同一个属性，这时该属性会收集多次依赖，对应多个effect函数
- 通过这种结构，可以存储目标对象，目标对象属性，以及属性对应的effect函数
- 一个属性可能对应多个函数，当触发更新时，在这个结构中根据目标对象属性找到effect函数然后执行
- 收集依赖的track函数内部，首先根据当前targetMap对象找到depsMap，如果没找到要给当前对象创建一个depsMap，并添加到targetMap中，如果找到了再根据当前使用的属性在depsMap找到对应的dep，dep中存储的是effect函数，如果没有找到时，为当前属性创建对应的dep集合，并且存储到depsMap中，如果找到当前属性对应的dep集合，就把当前的effect函数存储到集合中

**effect方法实现**

实现思路：

1. effect接收函数作为参数
2. 执行函数并返回响应式对象去收集依赖，收集依赖过程中将callback存储起来，需要在后面的track函数中能够访问到这里的callback
3. 依赖收集完毕设置activeEffect为null

代码实现：

```js
let activeEffect = null
export function effect (callback) {
  activeEffect = callback
  callback() // 访问响应式对象属性，去收集依赖
  activeEffect = null
}
```

**track方法实现**

实现思路：

1. track接收两个参数，目标对象target和需要跟踪的属性key
2. 内部需要将target存储到targetMap中，targetMap定义在外面，除了track使用外，trigger函数也要使用
3. activeEffect不存在直接返回，否则需要在targetMap中根据当前target找depsMap
4. 判断是否找到depsMap，因为target可能还没有收集依赖
5. 未找到，为当前target创建depsMap去存储对应的键和dep对象，并添加到targetMap中
6. 根据属性查找对应的dep对象，dep是个集合，存储effect函数
7. 判断是否存在，未找到时创建新的dep集合并添加到depsMap中
8. 将effect函数添加到dep集合中
9. 在收集依赖的get中调用这个函数

代码实现：

```js
let targetMap = new WeakMap()
export function track(target, key) {
  if (!activeEffect) return
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }
  dep.add(activeEffect)
}
```

此时，整个依赖收集过程已经完成

**trigger方法实现**

依赖收集完成后需要触发更新

实现思路：

1. 参数target和key
2. 根据target在targetMap中找到depsMap
3. 未找到时，直接返回
4. 再根据key找对应的dep集合，effect函数
5. 如果dep有值，遍历dep集合执行每一个effect函数
6. 在set和deleteProperty中触发更新

代码实现：

```js
export function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  const dep = depsMap.get(key)
  if (dep) {
    dep.forEach((effect) => {
      effect()
    })
  }
}
```

依赖收集和触发更新代码完成，创建html文件进行测试

```html
<body>
  <script type="module">
    import { reactive, effect } from './reactivity/index.js'

    const product = reactive({
      name: 'iPhone',
      price: 5000,
      count: 3
    })
    let total = 0 
    effect(() => {
      total = product.price * product.count
    })
    console.log(total)

    product.price = 4000
    console.log(total)

    product.count = 1
    console.log(total)

  </script>
</body>
```

打开浏览器控制台，可以看到输出结果如下

![image-20210416084313137](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210416084313137.png)

##### 响应式系统原理——ref

ref vs reactive

- ref可以把基本数据类型数据，转成响应式对象
- ref返回的对象，重新赋值成对象也是响应式的
- reactive返回的对象，重新赋值丢失响应式
- reactive返回的对象不可以解构

实现原理：

1. 判断 raw 是否是ref 创建的对象，如果是的话直接返回
2. 判断 raw是否是对象，如果是对象调用reactive创建响应式对象，否则返回原始值
3. 创建ref对象并返回，标识是否是ref对象，这个对象只有value属性，并且这个value属性具有set和get
4. get中调用track收集依赖，收集依赖的对象是刚创建的r对象，属性是value，也就是当访问对象中的值，返回的是内部的变量value
5. set中判断新旧值是否相等，不相等时将新值存储到raw中，并调用convert处理raw，最终把结果存储到value中，如果给value重新赋值为一个对象依然是响应式的，当raw是对象时，convert里调用reactive转换为响应式对象
6. 最后触发更新

代码实现：

```js
export function ref(raw) {
  // 判断 raw 是否是ref 创建的对象，如果是的话直接返回
  if (isObject(raw) && raw.__v_isRef) {
    return
  }
  let value = convert(raw)
  const r = {
    __v_isRef: true,
    get value() {
      track(r, 'value')
      return value
    },
    set value(newValue) {
      if (newValue !== value) {
        raw = newValue
        value = convert(raw)
        trigger(r, 'value')
      }
    },
  }
  return r
}
```

创建html文件进行测试：

```html
<body>
  <script type="module">
    import { reactive, effect, ref } from './reactivity/index.js'

    const price = ref(5000)
    const count = ref(3)
   
    let total = 0 
    effect(() => {
      total = price.value * count.value
    })
    console.log(total)

    price.value = 4000
    console.log(total)

    count.value = 1
    console.log(total)

  </script>
</body>
```

打开控制台可以看到输出结果和上面的相同

##### 响应式系统原理——toRefs

实现思路：

1. 接收参数proxy，判断参数是否为reactive创建的对象，如果不是发出警告
2. 判断传入参数，如果是数组创建长度是length的数组，否则返回空对象，因为传入的proxy可能是响应式数组或响应式对象
3. 接着遍历proxy对象的所有属性，如果是数组遍历索引，将每一个属性都转换为类似ref返回的对象
4. 创建toProxyRef函数，接收proxy和key，创建对象并最终返回对象（类似ref返回的对象）
5. 创建标识属性__v_isRef，这里的get中不需要收集依赖，因为这里访问的是响应式对象，当访问属性时，内部的getter回去收集依赖，set不需要触发更新，调用代理对象内部的set触发更新
6. 调用toProxyRef，将所有属性转换并存储到ret中
7. toRefs将reactive返回的对象的所有属性都转换成一个对象，所以当对响应式对象进行解构的时候，解构出的每一个属性都是对象，而对象是引用传递，所以解构的属性依然是响应式的

代码实现：

```js
export function toRefs(proxy) {
  const ret = proxy instanceof Array ? new Array(proxy.length) : {}

  for (const key in proxy) {
    ret[key] = toProxyRef(proxy, key)
  }

  return ret
}

function toProxyRef(proxy, key) {
  const r = {
    __v_isRef: true,
    get value() {
      return proxy[key]
    },
    set value(newValue) {
      proxy[key] = newValue
    },
  }
  return r
}
```

创建html进行测试：

```html
<body>
  <script type="module">
    import { reactive, effect, toRefs } from './reactivity/index.js'

    function useProduct () {
      const product = reactive({
        name: 'iPhone',
        price: 5000,
        count: 3
      })
      
      return toRefs(product)
    }

    const { price, count } = useProduct()


    let total = 0 
    effect(() => {
      total = price.value * count.value
    })
    console.log(total)

    price.value = 4000
    console.log(total)

    count.value = 1
    console.log(total)

  </script>
</body>
```

打开控制台可以看到输出结果和上面的相同

##### 响应式系统原理——computed

实现原理：

1. 接收一个有返回值的函数作为参数，函数的返回值就是计算属性的值
2. 监听这个函数内部的响应式数据变化，最后将函数执行结果返回
3. computed内部会通过effect监听getter内部的响应式数据变化，因为在effect中执行getter访问响应式数据的getter会去收集依赖，当数据变化后，回去重新执行effect函数将getter结果在存储到result中

代码实现：

```js
export function computed(getter) {
  const result = ref()

  effect(() => (result.value = getter()))

  return result
}
```

创建html文件进行测试：

```html
<body>
  <script type="module">
    import { reactive, effect, computed } from './reactivity/index.js'

    const product = reactive({
      name: 'iPhone',
      price: 5000,
      count: 3
    })
    let total = computed(() => {
      return product.price * product.count
    })
   
    console.log(total.value)

    product.price = 4000
    console.log(total.value)

    product.count = 1
    console.log(total.value)

  </script>
</body>
```

打开控制台可以看到输出结果和上面的相同

#### Vite

##### 概念

- Vite是一个面向现代浏览器的一个更轻、更快的 Web应用开发工具
- 它基于ECMAScript标准原生模块系统（ES Modules）实现
- 为了解决webpack在开发阶段使用webpack devServer冷启动时间过长，另外webpack HMR反应慢问题
- 使用vite创建项目为vue3应用，相比基于vue-cli创建项目，少了很多配置和依赖

##### 项目依赖

- Vite
- @vue/compiler-sfc 编译项目中.vue结尾的单文件组件

##### 基础使用

- vite serve
- vite build

vite serve vs vue-cli-service serve

运行vite serve时不需要打开，直接开启一个web serve，当浏览器请求服务器，例如请求一个单文件组件，此时服务端编译单文件组件，再将编译结果返回给浏览器，即时编译，只有浏览器请求时，才去编译，按需编译速度更快

![image-20210415080607387](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210415080607387.png)

当运行vue-cli-service时，内部会使用webpack打包所有模块，模块越大打包越慢，将打包结果存储到内存中，再开启开发服务器，浏览器请求时将内存中的打包结果直接返回，提前打包，不管模块是否被使用都会被编译打包到bundle中

![image-20210415080617075](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210415080617075.png)

##### HMR

- Vite HMR

  vite只需立即编译当前所修改的文件，所以响应快

- Webpack HMR
  会自动以这个文件为入口重写build一次，所有的涉及到的依赖也都会被加载一遍

##### Build

- vite build
  内部使用Rollup打包，最终将文件提前编译并打包到一起
  对于代码切割的需求，vite内部采用原生的动态导入Dynamic import实现，所以打包结果只支持现代浏览器
  可以使用Polyfill

##### 打包 or 不打包

vite出现会引出一个问题，到底有没有必要去打包呢？

- 使用 Webpack打包的两个原因:
  - 浏览器环境并不支持模块化（随着现代浏览器对ES6支持的逐渐完善，这个问题已经不存在）
  - 零散的模块文件会产生大量的 HTTP请求（HTTP2解决）

##### 浏览器对ES Module的支持

![image-20210415080940648](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210415080940648.png)

##### 开箱即用

vite项目不需要额外的配置，默认支持：

- TypeScript -内置支持
- less/sass/stylus/postcss -内置支持（需要单独安装)J
- JSX
- Web Assembly

##### Vite特性

提升开发者在开发过程中的体验

- 快速冷启动
- 模块热更新
- 按需编译
- 开箱即用，避免各种loader和plugins的配置

##### Vite实现原理

启动vite时，会将当前项目目录作为静态文件服务器的根目录，静态服务器会拦截部分请求，例如：当请求单文件组件时会实时编译，以及处理其他浏览器不能识别的模块

- 核心功能

  - 开启静态 Web服务器

  - 编译单文件组件

    拦截浏览器不识别的模块,并处理

  - HMR（通过websocket实现）

- 实现步骤

  1. 初始化项目package.json，安装koa、koa-send

     ```bash
     # koa-send：静态文件处理的中间件
     npm i koa koa-send
     ```

  2. 在package.json中配置 `bin` 字段，默认执行的 js 文件的路径

  3. 创建index.js，最终开发是一个基于node的命令行工具，在index.js头部配置运行node的位置`#!/usr/bin/env node`

  4. 导入koa和koa-send，Vite 内部使用 Koa 开启静态 Web 服务器

  5. 返回当前目录下的index.html静态页面

     ```js
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
     ```

  6. 监听端口，测试静态服务器，在终端执行`npm link`将当前项目链接到npm的安装目录中

  7. 打开基于vue3开发的项目，在终端输入`vite-cli`，开启静态服务器，可以看到此时返回的index.html信息

     ![image-20210415083448542](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210415083448542.png)

     此时，可以看到控制台报错信息，因为main.js中导入vue，但导入vue时路径中没有'/'、'./'或者'../'，所以浏览器不识别

     ![image-20210415083539006](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210415083539006.png)

     ![image-20210415083552206](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210415083552206.png)

  8. 创建中间件，处理第三方模块路径为/@modules/xxx

     参考vite中处理，处理第三方模块加载路径，所以在服务端需要手动处理路径问题

     ![image-20210415083810622](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210415083810622.png)

     响应头中将`Content-Type`设置为`application/javascript`，告诉浏览器返回时javascript文件

     ![image-20210415083838766](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210415083838766.png)

     ```js
     // 2. 修改第三方模块的路径
     app.use(async (ctx, next) => {
       // 判断当前文件是否是javascript
       if (ctx.type === 'application/javascript') {
         // ctx.body是流，需要转换为字符串
         const contents = await streamToString(ctx.body)
         // 匹配第三方模块 替换为@modules/xxx
         // import vue from 'vue'
         // import App from './App.vue'
         ctx.body = contents.replace(/(from\s+['"])(?![\.\/])/g, '$1/@modules/')
       }
     })
     
     const streamToString = (stream) =>
       new Promise((resolve, reject) => {
         const chunks = []
         stream.on('data', (chunk) => chunks.push(chunk))
         stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
         stream.on('error', reject)
       })
     ```

     使用`vite-cli`重新启动项目，可以看到此时路径已被修改为`/@modules/vue`，但根据目录找不到vue模块

     ![image-20210415084837510](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210415084837510.png)

  9. 需要在处理静态文件之前，创建中间件，当请求时判断请求中是否有/@modules/xxx，如果有则去node_modules中加载对应模块，交给处理静态文件中间件去处理

     ```js
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
     ```

     使用`vite-cli`重新启动项目，可以看到已经从服务器加载了vue模块，此时加载的vue是bundle版本，需要打包的vue版本

     但是控制台报错，加载App.vue失败，因为浏览器不能识别这个模块，需要在服务器处理浏览器不能识别的模块

     ![image-20210415085350680](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210415085350680.png)

     ![image-20210415085516070](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210415085516070.png)

  10. 处理单文件组件，第一次请求将单文件组件编译成一个对象，第二次请求编译单文件组件的模板返回render函数，并挂载到第一次请求编译的对象render属性上

      参考vite的实现方法：当服务器第一次请求App.vue时，服务器会将单文件组件编译成一个对象，加载需要的模块，创建组件选项对象，这里没有模板，是因为模板最终要被编译成render函数挂载到选项对象上；接着又加载了App.vue，并加上参数`type=template`，这次请求是告诉服务器需要编译单文件组件模板，然后返回rende函数，接着将render函数挂载到刚刚创建的组件选项对象，最终导出选项对象

      ![image-20210415085804989](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210415085804989.png)

      ![image-20210415090222352](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210415090222352.png)

  11. 当请求到单文件组件，并读取完成后，接着要对单文件组件进行编译，并且将编译后的结果返回给浏览器，所以是处理完静态文件之后，并且单文件组件可能会加载第三方模块，并且是加载第三方模块之前

  12. 使用@vue/compiler-sfc对单文件组件进行编译，将编译后的结果拼凑成vite生成文件样式，并转换为流的方式发送给浏览器

      ```js
      const compilerSFC = require('@vue/compiler-sfc')
      const stringToStream = (text) => {
        const stream = new Readable()
        stream.push(text)
        stream.push(null)
        return stream
      }
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
      ```

      使用`vite-cli`重新启动项目，第一次请求:

      ![image-20210415095503181](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210415095503181.png)

      第二次请求:

      ![image-20210415095826916](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210415095826916.png)

  13. 加载css模块错误会阻塞后续代码执行，导致请求中断，注释图片和css模块的加载，此时重新启动，第一次编译单文件组件为组件的项目对象并返回给浏览器成功

  14. 处理第二次请求，将单文件组件模板编译为render函数

  15. 将process.env.NODE_ENV处理为development

      ```js
      ctx.body = contents
            .replace(/(from\s+['"])(?![\.\/])/g, '$1/@modules/')
            .replace(/process\.env\.NODE_ENV/g, '"development"')
      ```

      此时，资源都加载完成了，但是在页面中还是没有任何展示，打开控制台可以看到shared的报错，因为当前环境是在浏览器环境执行，而process是node环境中的变量，所以报错，需要在服务器进行处理，将process.env.NODE_ENV处理为development

      ![image-20210415101408994](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210415101408994.png)

  16. 处理样式、图片等资源

  完整代码

  ```js
  #!/usr/bin/env node
  const path = require('path')
  const { Readable } = require('stream')
  const Koa = require('koa')
  const send = require('koa-send')
  const compilerSFC = require('@vue/compiler-sfc')
  
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
  ```

  