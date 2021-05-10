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
    trajectories: {
      type: Array,
      default: () => ([{
        id: 1,
        trajs: [[1, 2], [2, 2]]
      }])
    }
    /*
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
     */

  },
  mounted(){
    const gAbila = d3.select(this.$refs.world);
    const gFeatures = d3.select(this.$refs.features);

    d3.json('Abila.geojson')
        .then((geoJson) => {
          gAbila.datum(geoJson)
              .call(map);
        });

    gFeatures.datum(this.getGeoJsonLineString(this.trajectories))
        .call(map);
  },
  methods:{
    getGeoJsonLineString(trajs) {
      const fc = {
        type: 'FeatureCollection',
        features: trajs
            .map(d => ({ // for each entry
                  type: 'Feature',
                  properties: {
                    Timestamp: d.Timestamp,
                    id: d.id
                  },
                  geometry: {
                    type: 'LineString',
                    coordinates: d.trajs,
                  }
                })
            )
      };

      return fc;
    },
  },
  watch: {
    trajectories(newFc) {
      const gFeature = d3.select(this.$refs.features);

      gFeature.datum(this.getGeoJsonLineString(newFc)).call(map);

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
  fill: transparent;
  stroke-width: 2;
}

</style>