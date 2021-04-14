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
