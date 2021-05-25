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
  props:{
    cfAggregation:{
      type: Array
    }
  },
  data(){
    return {
      data: [{
        type: 'bar',
        x: [1, 3],
        y: [2, 4],
        orientation: 'v',
      }],
      layout: {
        height: 250,
        margin: {
          t: 10,
          l: 70,
          b: 90,
          r: 10,
          pad: 5,
        },
        xaxis: {
          type: 'category',
        },
      },
      options: {
        displayModeBar: false,
      },
    };
  },
  watch:{
    cfAggregation(datum){
      this.data[0].x = datum.map(d => d.key);
      this.data[0].y = datum.map(d => d.value);
    }
  }
}
</script>

<style scoped>

</style>