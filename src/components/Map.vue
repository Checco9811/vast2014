<template>
  <svg height="500" width="100%" class="map">
    <g class="world" ref="world"></g>
    <g class="features" ref="features"></g>
  </svg>
</template>


<script>
import BuildMap from "@/assets/BuildMap";

const map = BuildMap()
    .featureClass('id'); //component to handle the map

const d3 = require('d3');

export default {
  name: "Map",
  mounted(){
    const gAbila = d3.select(this.$refs.world);

    d3.json('Abila.geojson')
        .then((geoJson) => {
          gAbila.datum(geoJson)
              .call(map);
        });
  }


}
</script>

<style>

svg.map{
  background-color: lightcyan;
}

g.world path{
  fill: transparent;
  stroke: black;
}

</style>