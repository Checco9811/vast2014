<template>
  <div id="barChart"></div>
</template>

<script>


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
    d3.select("#barChart");
  },
  watch:{
    cfAggregation(datum){

    }
  }
}
</script>

<style scoped>

</style>