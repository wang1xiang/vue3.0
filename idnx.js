// OptionsAPI
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
