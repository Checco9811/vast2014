<template>
  <vue-plotly :data="data" :layout="layout" :options="options"/>
</template>

<script>
import VuePlotly from '@statnett/vue-plotly'

export default {
  name: "Chart",
  components:{
    VuePlotly
  },
  data(){
    return {
      data: [{x: [1, 3], y: [2, 4]}],
      layout: {},
      options: {}
    }
  }
}
</script>

<style scoped>

</style>