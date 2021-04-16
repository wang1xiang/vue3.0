const isObject = (val) => val !== null && typeof val === 'object'
const convert = (target) => (isObject(target) ? reactive(target) : target)
const hasOwnProperty = Object.prototype.hasOwnProperty
const hasOwn = (target, key) => hasOwnProperty.call(target, key)

export function reactive(target) {
  if (!isObject(target)) return target

  // 定义handler对象 proxy构造函数的第二个参数 称为处理器或拦截器对象
  const handler = {
    // 1.收集依赖
    // 2.返回target中对应key的值
    // 3.如果key对应的值是对象，需要再次转为响应式对象
    get(target, key, receiver) {
      // 收集依赖
      track(target, key)
      const result = Reflect.get(target, key, receiver)
      return convert(result)
    },
    // 1.首先获取key属性的值
    // 2.判断oldValue是否和value相同，不同时需要更新
    // 3.触发更新
    // 4.需要返回boolean值，判断是否设置成功
    set(target, key, value, receiver) {
      const oldValue = Reflect.get(target, key, receiver)
      let result = true
      if (oldValue !== value) {
        result = Reflect.set(target, key, value, receiver)
        // 触发更新
        trigger(target, key)
      }
      return result
    },
    // 1.首先判断target本身是否有key属性
    // 2.删除target中的key属性，并返回成功或失败
    // 3.如果有属性并删除成功，触发更新
    deleteProperty(target, key) {
      const hadKey = hasOwn(target, key)
      const result = Reflect.deleteProperty(target, key)
      if (hadKey && result) {
        // 触发更新
        trigger(target, key)
      }
      return result
    },
  }

  return new Proxy(target, handler)
}

let activeEffect = null
// 1.接收函数作为参数
// 2.执行callback，访问响应式对象属性，去收集依赖，收集依赖过程中将callback存储起来，需要后面的track函数能够访问到这里的callback
// 3.定义变量activeEffect，存储callback
// 4.依赖收集完毕设置activeEffect为null
export function effect(callback) {
  activeEffect = callback
  callback() // 访问响应式对象属性，去收集依赖
  activeEffect = null
}

let targetMap = new WeakMap()
// 1.track接收两个参数，目标对象target和需要跟踪的属性key
// 2.内部需要将target存储到targetMap中，targetMap定义在外面，除了track使用外，trigger函数也要使用
// 3.activeEffect不存在直接返回，否则需要在targetMap中根据当前target找depsMap
// 4.判断是否找到depsMap，因为target可能还没有收集依赖
// 5.未找到，为当前target创建depsMap去存储对应的键和dep对象，并添加到targetMap中
// 6.根据属性查找对应的dep对象，dep是个集合，存储effect函数
// 7.判断是否存在，未找到时创建新的dep集合并添加到depsMap中
// 8.将effect函数添加到dep集合中
// 9.在收集依赖的get中调用这个函数
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

// 1.参数target和key
// 2.根据target在targetMap中找到depsMap
// 3.未找到时，直接返回
// 4.再根据key找对应的dep集合，effect函数
// 5.如果dep有值，遍历dep集合执行每一个effect函数
// 6.在set和deleteProperty中触发更新
// 测试：02-effect
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

// 1.判断 raw 是否是ref 创建的对象，如果是的话直接返回
// 2.判断 raw是否是对象，如果是对象调用reactive创建响应式对象，否则返回原始值
// 3.创建ref对象并返回，标识是否是ref对象，这个对象只有value属性，并且这个value属性具有set和get
// 4.get中调用track收集依赖，收集依赖的对象是刚创建的r对象，属性是value，也就是当访问对象中的值，返回的是内部的变量value
// 5.set中判断新旧值是否相等，不相等时将新值存储到raw中，并调用convert处理raw，最终把结果存储到value中，如果给value重新赋值为一个对象依然是响应式的，当raw是对象时，convert里调用reactive转换为响应式对象
// 6.最后触发更新
// 测试 ref
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

// 1.接收参数proxy，判断参数是否为reactive创建的对象，如果不是发出警告
// 2.判断传入参数，如果是数组创建长度是length的数组，否则返回空对象，因为传入的proxy可能是响应式数组或响应式对象
// 3.接着遍历proxy对象的所有属性，如果是数组遍历索引，将每一个属性都转换为类似ref返回的对象
// 4.创建toProxyRef函数，接收proxy和key，创建对象并最终返回对象（类似ref返回的对象）
// 5.创建标识属性__v_isRef，这里的get中不需要收集依赖，因为这里访问的是响应式对象，当访问属性时，内部的getter回去收集依赖，set不需要触发更新，调用代理对象内部的set触发更新
// 6.调用toProxyRef，将所有属性转换并存储到ret中
// 7.toRefs将reactive返回的对象的所有属性都转换成一个对象，所以当对响应式对象进行解构的时候，解构出的每一个属性都是对象，而对象是引用传递，所以解构的属性依然是响应式的
// 测试：04-torefs
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

// 1.接收一个有返回值的函数作为参数，函数的返回值就是计算属性的值
// 2.监听这个函数内部的响应式数据变化，最后将函数执行结果返回
// computed内部会通过effect监听getter内部的响应式数据变化，因为在effect中执行getter访问响应式数据的getter会去收集依赖，当数据变化后，回去重新执行effect函数将getter结果在存储到result中
export function computed(getter) {
  const result = ref()

  effect(() => (result.value = getter()))

  return result
}
