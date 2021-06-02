<template>
  <div id="barChart"></div>
</template>

<script>
const d3 = require('d3');
import barchart from "@/assets/js/HierarchicalBarChart";
import preprocessing from "@/assets/js/preprocessing";

const barChart = barchart();

export default {
  name: "Chart",
  components:{
  },
  props:{
    cfAggregation:{
      type: Array
    }
  },
  data(){
    return {

    }

  },
  mounted(){
    d3.select("#barChart").call(barChart);
  },
  watch:{
    cfAggregation(datum){
      if(datum.length > 0 ) {

        var tmp = Array.from(d3.rollup(datum, v => v.length, d => d.Category, d => d.location))
        var result = []
        tmp.map(d => {
          var t = d[0];
          Array.from(d[1]).map(dd => {
            result.push({
              Category: t,
              location: dd[0],
              count: dd[1]
            })
          })
        })

        const root = preprocessing.fromFlatToHierarchy(result, ["Category", "location"]);
        const hierarchy = d3.hierarchy(root)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value)

        barChart.data(hierarchy);
      }
    }
  }
}
</script>

<style scoped>

</style>