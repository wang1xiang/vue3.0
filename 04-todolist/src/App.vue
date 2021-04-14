<template>
  <section id="app" class="todoapp">
    <header class="header">
      <h1>todos</h1>
      <input
        class="new-todo"
        placeholder="What needs to be done?"
        autocomplete="off"
        autofocus
        v-model="input"
        @keyup.enter="addTodo"
      />
    </header>
    <section class="main" v-show="count">
      <input
        id="toggle-all"
        class="toggle-all"
        v-model="allDone"
        type="checkbox"
      />
      <label for="toggle-all">Mark all as complete</label>
      <ul class="todo-list">
        <li
          v-for="todo in todos"
          :key="todo"
          :class="{ editing: todo === editingTodo, completed: todo.completed }"
        >
          <div class="view">
            <input class="toggle" type="checkbox" v-model="todo.completed" />
            <label @dblclick="editTodo(todo)">{{ todo.text }}</label>
            <button class="destroy" @click="remove(todo)"></button>
          </div>
          <input
            class="edit"
            type="text"
            v-editing-focus="todo === editingTodo"
            v-model="todo.text"
            @keyup.enter="doneEdit(todo)"
            @blur="doneEdit(todo)"
            @keyup.esc="cancelEdit(todo)"
          />
        </li>
      </ul>
    </section>
    <footer class="footer" v-show="count">
      <span class="todo-count">
        <strong>{{ remainingCount }}</strong>
        {{ remainingCount > 1 ? 'items' : 'item' }} left
      </span>
      <ul class="filters">
        <li><a href="#/all">All</a></li>
        <li><a href="#/active">Active</a></li>
        <li><a href="#/completed">Completed</a></li>
      </ul>
      <button
        class="clear-completed"
        @click="removeCompleted"
        v-show="count > remainingCount"
      >
        Clear completed
      </button>
    </footer>
  </section>
  <footer class="info">
    <p>Double-click to edit a todo</p>
    <!-- Remove the below line ↓ -->
    <p>Template by <a href="http://sindresorhus.com">Sindre Sorhus</a></p>
    <!-- Change this out with your name and url ↓ -->
    <p>Created by <a href="https://www.lagou.com">教瘦</a></p>
    <p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
  </footer>
</template>
<script>
import './assets/index.css'
import { ref, computed, onMounted, onUnmounted, watchEffect } from 'vue'
import useStorage from './utils/useStorage.js'

const storage = useStorage()
// 1. 添加待办事项
const useAdd = (todos) => {
  const input = ref('')
  const addTodo = () => {
    const text = input.value && input.value.trim()
    if (text.length === 0) return
    todos.value.unshift({
      text,
      completed: false,
    })
    input.value = ''
  }
  return {
    input,
    addTodo,
  }
}

// 2.删除待办事项
const useRemove = (todos) => {
  const remove = (todo) => {
    const index = todos.indexOf(todo)
    todos.splice(index, 1)
  }
  const removeCompleted = () => {
    todos.value = todos.value.filter((item) => !item.complete)
  }

  return {
    remove,
    removeCompleted,
  }
}
// 3.编辑待办项
const useEdit = (todos) => {
  let beforeEditText = ''
  const editingTodo = ref(null)

  const editTodo = (todo) => {
    beforeEditText = todo.text
    editingTodo = todo
  }

  const doneEdit = (todo) => {
    if (!editingTodo.value) return
    todo.text = todo.text.trim()
    todo.text || remove(todo)
    editingTodo.value = null
  }

  const cancelEdit = (todo) => {
    editingTodo.value = null
    todo.text = beforeEditText
  }

  return {
    editingTodo,
    editTodo,
    doneEdit,
    cancelEdit,
  }
}
// 4.切换待办完成状态
const useFilter = (todos) => {
  const allDone = computed({
    get() {
      return todos.value.every((item) => item.completed)
    },
    set(value) {
      todos.value.forEach((item) => (item.completed = value))
    },
  })
  const filter = {
    all: (list) => list,
    active: (list) => list.filter((item) => !item.completed),
    completed: (list) => list.filter((item) => !item.completed),
  }

  const type = ref('all')
  const filterTodos = computed(() => filter[type.value](todos.value))
  const remainingCount = computed(() => filter.active(todos.value).length)
  const count = computed(() => todos.value.length)

  const onHashchange = () => {
    const hash = window.location.hash.replace('/#', '')
    if (filter[hash]) {
      type.value = hash
    } else {
      type.value = 'all'
      window.location.hash = ''
    }
  }
  onMounted(() => {
    window.addEventListener('hashchange', onHashchange)
  })
  onUnmounted(() => {
    window.removeEventListener('hashchange', onHashchange)
  })
  return {
    allDone,
    filterTodos,
    remainingCount,
    count,
  }
}
// 5.存储待办事项
const useLocalStorage = () => {
  const KEY = 'todos'
  const todos = ref(storage.getItem(KEY) || [])
  watchEffect(() => {
    storage.setItem(KEY, todos.value)
  })
  return todos
}

export default {
  name: 'App',
  setup() {
    const todos = useLocalStorage()
    console.log(todos.value)
    return {
      todos,
      ...useAdd(todos),
      ...useRemove(todos),
      ...useEdit(todos),
      ...useFilter(todos),
    }
  },
  directives: {
    editingFocus: (el, binding) => {
      binding.value && el.focus()
    },
  },
}
</script>
