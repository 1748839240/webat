<template>
  <At />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import At from './components/At/At.vue'

export default defineComponent({
  name: 'App',
  components: { At }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
}
html,
body,
#app {
  height: 100%;
}
.flex {
  display: flex;
  align-items: center;
  justify-content: center;
}
.flexc {
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
}
.flex1 {
  flex: 1;
}
.w100 {
  width: 100%;
}
.h100 {
  height: 100%;
}
.flex_fs {
  justify-content: flex-start;
}
.flex_fe {
  justify-content: flex-end;
}
.flex_sb {
  justify-content: space-between;
}
.flex_sa {
  justify-content: space-around;
}
.flex_se {
  justify-content: space-evenly;
}
.flex_c_fs {
  align-items: flex-start;
}
.flex_c_fe {
  align-items: flex-end;
}
.flex_c_sb {
  align-items: space-between;
}
.flex_c_sa {
  align-items: space-around;
}
.flex_c_se {
  align-items: space-evenly;
}
.bb {
  box-sizing: border-box;
}
.p8 {
  padding: 8px;
}
</style>
