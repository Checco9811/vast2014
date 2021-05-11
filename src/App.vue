

<template>
  <l-map ref="map" style="height: 500px; weight: 100%;" :zoom="zoom" :center="center" :maxBounds="maxBounds">
    <l-tile-layer :url="url"></l-tile-layer>
    <l-geo-json :geojson="geoJson"></l-geo-json>
    <l-feature-group ref="features">
    </l-feature-group>
  </l-map>
</template>

<script>



// eslint-disable-next-line no-unused-vars
import L from 'leaflet';
import { latLngBounds } from "leaflet";
// eslint-disable-next-line no-unused-vars
import { LMap, LTileLayer, LMarker, LGeoJson, LFeatureGroup, LPolyline} from 'vue2-leaflet';

const d3 = require('d3');

export default {
  name: 'App',
  components: {
    LMap,
    LTileLayer,
    // eslint-disable-next-line vue/no-unused-components
    LMarker,
    LGeoJson,
    LFeatureGroup,
    // eslint-disable-next-line vue/no-unused-components
    LPolyline
  },
  data () {
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      zoom: 13,
      center: [36.070512, 24.864487],
      bounds: latLngBounds(
          [[36.03771731908686, 24.793739318847656],
              [36.09904766316007, 24.91905212402343]]
      ),
      maxBounds: latLngBounds(
          [[36.03771731908686, 24.793739318847656],
              [36.09904766316007, 24.91905212402343]]
      ),
      geoJson: null,
      pointCollection: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              name: 'Default point',
            },
            geometry: {
              type: 'LineString',
              coordinates: [[1, 1], [1, 2]]
            },
          },
        ],
      },
      lines: []
    };
  },
  mounted(){
    d3.json('Abila.geojson')
        .then((data) => {
          this.geoJson = data;
        });

    d3.csv('gps.csv')
        .then((data) => {
          const gps = data.map((d) => {
            const r = {
              Timestamp: +new Date(d.Timestamp).getTime(),
              id: +d.id,
              lat: +d.lat,
              long: +d.long
            };
            return r;
          });

          const trajs = d3.group(gps, d => d.id); // group by id
          const trs = Array.from(trajs).map((d) => {
            return {
              id: +d[0],
              trajs: d[1].map(p => ([ p.lat, p.long ])),
            };
          });

          console.log(trs);

          var map = this.$refs.map.mapObject;

          trs.forEach(d => {
            L.polyline(d.trajs,
                {
                  color: 'green',
                  weight: 5,
                  opacity: .7,
                  lineJoin: 'roud'
                }).addTo(map);
          });

          this.refreshMap(gps);
        });

  },
  methods: {
    refreshMap(cfDimension) {
      this.pointCollection = this.getGeoJsonFromReportsPoint(cfDimension);
    },
    getGeoJsonFromReportsPoint(coordinates) {
      const fc = {
        type: 'FeatureCollection',
        features:
            coordinates
                .map(d => ({ // for each entry
                      type: 'Feature',
                      properties: {
                        Timestamp: d.Timestamp,
                        id: d.id
                      },
                      geometry: {
                        type: 'Point',
                        coordinates: [d.long, d.lat],
                      },
                    }),
                )
      };

      return fc;
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

#map{
 height: 180px;
}

</style>
