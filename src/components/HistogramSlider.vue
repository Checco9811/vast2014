<template>
  <div id='hist'>
  </div>
</template>

<script>
import histogram from "@/assets/js/histogramSlider";
const d3 = require('d3');

// histogram slider
const histogramSlider = histogram();

export default {
  name: "HistogramSlider",
  props: {
    data: {
      type: Array
    }
  },
  mounted() {
    // init histogram slider
    d3.select('#hist')
        .call(histogramSlider);

    histogramSlider.on('range', (range) =>{
      this.$emit('updateRange', {
        min: range[0],
        max: range[1]
      });

    })
  },
  watch: {
    data(datum){
      histogramSlider.data(datum);
    }
  }
}
</script>

<style scoped>

</style>