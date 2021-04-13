#### Vue3.0介绍

##### 源码组织方式

- 提升代码可维护性，源码采用TypeScript重写

- 使用Monorepo管理项目结构，将独立模块提取到不同的包中，每个模块划分明确，模块依赖关系也很明确，并且每个功能模块都可以单独测试、发布并使用

  ![image-20210412192848527](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210412192848527.png)

  `compiler`开头的包都是和编译相关的代码，`compiler-core`是和平台无关的编译器，`compiler-dom`是浏览器平台下的编译器，依赖`compiler-core`；`compiler-sfc`（single file component）单文件组件，用于编译单文件组件，依赖`compiler-core`和`compiler-dom`；`compiler-ssr`是和服务端渲染相关的编译器，依赖`compiler-dom`

  `reactivity`是数据响应式系统，可单独使用

  `runtime`开发的包都是运行时代码，`runtime-core`是和平台无关的运行时，`runtime-dom`是针对浏览器的运行时，处理原生DOM API、事件等；`runtime-test`是为测试而编写的轻量的运行时，渲染出的DOM树是一个js对象，所以这个运行时可以运行在所有的js环境里，用它来测试渲染是否正确，还可以用于序列化DOM、触发DOM事件以及记录某次更新中的DOM操作

  `server-renderer`是服务端渲染

  `shared`是vue内部使用的一些公共API

  `size-check`是私有包，不会发布到npm，用于在tree-shaking后检查包的大小

  `template-explorer`是在浏览器里运行的实时编译组件，会输出render函数

  `vue`构建完整版vue，依赖于`compiler`和`runtime`

##### Vue.js3.0不同构建版本

构建不同版本，用于不同的场合，和vue2.x不同的是，不再构建umd模块方式，umd模块方式会让代码更加冗余

- packages/vue存在所有构建版本

  ![image-20210412193022815](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210412193022815.png)

- 说明

  [官网不同构建版本的解释](https://v3.cn.vuejs.org/guide/installation.html#%E5%AF%B9%E4%B8%8D%E5%90%8C%E6%9E%84%E5%BB%BA%E7%89%88%E6%9C%AC%E7%9A%84%E8%A7%A3%E9%87%8A)
  
  |                     版本                     |              名称               |                   说明                   |
  | :------------------------------------------: | :-----------------------------: | :--------------------------------------: |
  |          cjs（commonJS模块化方式，           |           vue.cjs.js            |           开发版，代码未被压缩           |
  |       完整版vue，包含运行时和编译器）        |         vue.cjs.prod.js         |           生产版本，代码被压缩           |
  |   global（全局，这4个文件都可以在浏览器中    |          vue.global.js          |              完整版，开发版              |
  |   通过script的方式引入，增加全局vue对象）    |       vue.global.prod.js        |              完整版，生产版              |
  |                                              |      vue.runtime.global.js      |            运行时版本，开发版            |
  |                                              |   vue.runtime.global.props.js   |            运行时版本，生产版            |
  |   browser（esModule模块化方式，在浏览器中    |       vue.esm-browser.js        |              完整版，开发版              |
  |       通过type="module"的方式来导入）        |       esm-browser.prod.js       |              完整版，生产版              |
  |                                              |   vue.runtime.esm-browser.js    |            运行时版本，开发版            |
  |                                              | vue.runtime.esm-browser.prod.js |            运行时版本，生产版            |
  | bundler（需要配合打包工具使用，使用es Module |       vue.esm-bundler.js        |      完整版，还导入runtime-compiler      |
  |    方式，内部通过import导入runtime-core）    |   vue.runtime.esm-bundler.js    | 运行时，通过脚手架创建项目默认使用此版本 |

##### Composition API

- [RFC(Request For Comments)](https://github.com/vuejs/rfcs)
- [Composition API RFC](https://composition-api.vuejs.org/)

**设计动机**

- Options API

  包含一个描述对象组件选项（data、methods、props等）的对象

  Options API开发负责组件，同一个功能逻辑的代码被拆分到不同选项中

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

  Vue.js3.0中新增的一组API

  一组基于函数的API

  可以更灵活的组织组件的逻辑

  解决超大组件时，使用Options API不好拆分和重用问题

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

同一色块代表同一功能，Options API中相同的代码被拆分在不同位置，不方便提取重用代码

Composition API同一功能代码不需要拆分，有利于代码重用和维护

##### 性能提升

- 响应式系统升级

  Vue.js2.x中响应式系统核心是defineProperty，初始化时遍历所有data中的成员，通过defineProperty将对象属性转换为getter和setter，如何data中的对象又是对象的话，需要递归处理每一个子对象属性

  Vue.js3.0中使用Proxy对象重写响应式系统，可以拦截属性的访问、赋值、删除等操作

  Proxy好处：

  1. 可以监听动态新增属性，vue2.x需要使用$set
  2. 可以监听删除的属性，vue2.x监听不到
  3. 可以监听数组的索引和length属性，vue2.x监听不到

- 编译优化

  对编译器进行优化，重写虚拟DOM，首次渲染和update性能有了大幅度提升

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

  Vue.js2.x在构建过程中需要先编译为render函数，在编译时通过标记静态根节点，优化diff过程（但是依然需要执行diff操作），当组件发生变化时，会通知watcher，触发watcher的update方法，最终执行虚拟DOM的patch操作，遍历所有虚拟节点找到差异，然后更新到真实DOM上；diff过程中会比较整个虚拟DOM，先对比新旧的div，以及它的属性，再去对比内部子节点；

  Vue.js2.x中渲染的最小单位是组件

  Vue.js3.0中标记和提升所有静态根节点，diff时只需要对比动态节点内容

  - Fragments 片段，模板中不需要在创建唯一的根节点，需要升级vetur插件，查看[Vue 3 Template Explorer](https://vue-next-template-explorer.netlify.app/)

    ![image-20210413082819879](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210413082819879.png)

    首先使用`_createBlock`给根div创建block，是树结构，然后通过`_createVNode`创建子节点，相当于`h`函数，当删除根节点时，会创建_`Fragment`片段

    ![image-20210413083059655](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210413083059655.png)

  - 静态提升

    打开`hoistStatic`静态提升选项，可以看到`_createBlock`中的静态节点都被提升到render函数外边，这些节点只有初始化时被创建一次，再次调用render时不会在被创建

    ![image-20210413083144478](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210413083144478.png)

  - Patch flag

    ![image-20210413083558220](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210413083558220.png)

    可以看到在动态节点`<div>{{ count }}</div>`通过`_createVNode`渲染后，最终会有数字`1`，这就是Patch flag。作为一个标记，将来在执行diff时会检查整个`block`中带Patch flag标记的节点，如果Patch flag值为`1`，代表文本内容时动态绑定，所以只会比较文本内容是否发生变化

    ![image-20210413084010181](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210413084010181.png)

    此时在给当前div绑定一个id属性，可以看到Patch flag变为`9`，代表当前节点的文本和PROPS是动态内容，并且记录动态绑定的PROPS是id，将来diff时只会检查此节点的文本和id属性是否发生变化，从而提升diff性能

  - 缓存事件处理函数

    ![image-20210413084318107](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210413084318107.png)

    开启缓存后，首次渲染时会生成新的函数，并将函数缓存到`_cache`对象中，将来再次调用render时，会从缓存中获取

- 源码体积优化

  Vue.js3.0移除一些不常用API，如：inline-template、filter等

  Tree-shaking支持更好，因为Tree-shaking依赖ES Module，也就是ES6的模块化语法结构`import`和`export`，通过编译阶段的静态分析，找到没有引入的模块，在打包的时候直接过滤掉，从而减少打包体积。Vue.js3.x的内置组件keepAlive、Trasition和一些内置指令都是按需引入，并且Vue.js3.x中的很多API都是支持Tree-shaking，没有使用是不会进行打包的

##### Vite

学习Vite前，先需要了解ES Module

- 除IE外，现代浏览器都支持ES Moduie

- 加载模块通过在script标签中type="module"即可

  ```html
  <script type="module" src="..."></script>
  ```

- 支持模块的script默认延迟加载

  类似于script标签设置defer

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

`type="module"`方式引入时需要在服务器中运行项目，在vsCode中安装插件`live-server`，右键启动项目

![image-20210413103509503](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210413103509503.png)

打开浏览器控制台，可以看到输出结果如下所示，可以看到`index.js`模块在文档解析完成后，触发DOMContentLoaded事件前执行

![image-20210413085620461](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210413085620461.png)

Vite vs Vue-Cli

- Vite在开发模式下不需要打包可以直接运行，因为vite在开发模式下使用浏览器支持的es Module加载模块，通过`<script type="module"></script>`的方式加载代码，提升开发效率；vite会开启测试服务器，拦截浏览器发送请求，对浏览器不识别的模块进行处理，比如当import 单文件组件时，会先进行编译，把编译的结果发送给浏览器
- Vue-Cli开发模式下必须对项目打包才可以运行
- Vite在生成环境下使用Rollup打包，基于ES Module的方式打包，不再需要使用babel把import转换为require，因此打包体积会小于webpack体积
- Vue-Cli使用Webpack打包

Vite特点

- 快速冷启动（不需要打包）
- 按需编译（代码加载时才会进行编译）
- 模块热更新

使用Vite创建基于vue3项目

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

通过create-vite-app创建完项目之后，App.vue会有eslint语法错误，原因是Vetur插件还没有更新

![image-20210413113538441](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210413113538441.png)

解决：文件 --> 首选项 --> 设置 --> 搜索eslint-plugin-vue  --> Vetur › Validation: Template取消勾选

![image-20210413095847513](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210413095847513.png)

通过npm run dev启动项目

开发环境下，vite开启web服务器后，会劫持.vue结尾的文件，将.vue文件转换为js文件，并将响应中的content-type设置为application/javascript，告诉浏览器是js脚本

![image-20210413085824316](C:\Users\xiang wang\AppData\Roaming\Typora\typora-user-images\image-20210413085824316.png)

生成环境

#### Composition API使用