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
  props: {
    featureCollection: {
      type: Object,
      default: () => ({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              name: 'Default Line',
            },
            geometry: {
              type: 'LineString',
              coordinates: [[0, 0], [1, 1]],
            },
          },
        ],
      }),
    },
  },
  mounted(){
    const gAbila = d3.select(this.$refs.world);
    const gFeatures = d3.select(this.$refs.features);

    d3.json('Abila.geojson')
        .then((geoJson) => {
          gAbila.datum(geoJson)
              .call(map);
        });

    gFeatures.datum(this.featureCollection)
        .call(map);
  },
  watch: {
    featureCollection(newFc) {
      const gFeature = d3.select(this.$refs.features);

      gFeature.datum(newFc).call(map);

      const gWorld = d3.select(this.$refs.world);
      gWorld.call(map);

    }
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

g.features path{
  stroke: red;
  stroke-width: 0.5;
}

</style>