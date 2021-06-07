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
  created() {
    window.addEventListener("resize", this.pageResize);
  },
  destroyed() {
    window.removeEventListener("resize", this.pageResize);
  },
  mounted() {
    const width = d3.select('#hist').node().getBoundingClientRect().width;
    histogramSlider.width(width-60);

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
  },
  methods: {
    pageResize(){
      const width = d3.select('#hist').node().getBoundingClientRect().width;
      //const height = d3.select('#hist').node().getBoundingClientRect().height;

      histogramSlider
          .resize(width-60);
    }
  }
}
</script>

<style scoped>

</style>