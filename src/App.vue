

<template>
  <b-component>
    <b-row>
      <b-col cols="3">

      </b-col>
      <b-col>
        <l-map ref="map" style="height: 500px; weight: 100%;" :zoom="zoom" :center="center" :maxBounds="maxBounds">
          <l-tile-layer :url="url"></l-tile-layer>
          <l-geo-json :geojson="geoJson"></l-geo-json>
          <l-layer-group ref="features">
          </l-layer-group>
        </l-map>
      </b-col>
      <b-col cols="3">
        <b-form-group label="Select a CarId" id="carList">
          <b-form-checkbox-group
              size="lg"
              v-model="CarID.value"
              :options="CarID.options"
              name="buttonsCarId"
              buttons
              stacked
              style="width: 100%"
          ></b-form-checkbox-group>
        </b-form-group>
      </b-col>
    </b-row>

  </b-component>

</template>

<script>



// eslint-disable-next-line no-unused-vars
import L from 'leaflet';
import { latLngBounds } from "leaflet";
// eslint-disable-next-line no-unused-vars
import { LMap, LTileLayer, LMarker, LGeoJson, LFeatureGroup, LPolyline, LLayerGroup} from 'vue2-leaflet';

const d3 = require('d3');

export default {
  name: 'App',
  components: {
    LMap,
    LTileLayer,
    // eslint-disable-next-line vue/no-unused-components
    LMarker,
    LGeoJson,
    LLayerGroup,
    // eslint-disable-next-line vue/no-unused-components
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
      lines: [],
      CarID: {
        value: [1, 2],
        options: [1, 2, 3]
      }
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

          var map = this.$refs.features.mapObject;

          trs.forEach(d => {
            L.polyline(d.trajs,
                {
                  color: 'green',
                  weight: 5,
                  opacity: .7,
                  lineJoin: 'roud',
                  id: d.id
                }).addTo(map);
          });

          //map.clearLayers();

          map.eachLayer(function (layer) {
            if(layer.options.id===3)
              map.clearLayers();
              //map.removeLayer();
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
  },
  watch: {
    CarID: {
      handler(newVal) {
        console.log(newVal);
      },
    },
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
