<template>
  <div id="app">
    <b-container>
      <b-row>
        <b-col>
          <b-row>
            <Map :featureCollection="featureCollection"></Map>
          </b-row>

          <b-row>

          </b-row>

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
    </b-container>
  </div>
</template>

<script>
import crossfilter from 'crossfilter';
import Map from '@/components/Map';
const d3 = require('d3');

// crossfilter data management
let cf; // crossfilter instance
let dID; // dimension for Id

export default {
  name: 'App',
  components: {
    Map
  },
  data() {
    return {
      featureCollection: {
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
      CarID: {
        value: [1, 2],
        options: [1, 2, 3],
      }
    }

  },
  mounted() {
    fetch('gpsSmall.json')
        .then(data => data.json())
        .then((data) => {
          const gpsRecord = data.map((d) => {
            const r = {
              Timestamp: d.Timestamp,
              id: +d.id,
              lat: +d.lat,
              long: +d.long
            };
            return r;
          });

          const trajs = d3.group(gpsRecord, d => d.id); // group by id
          const trs = Array.from(trajs).map((d) => {
            return {
              id: +d[0],
              trajs: d[1].map(p => ([p.long, p.lat])),
            };
          });

          cf = crossfilter(trs);
          dID = cf.dimension(d => d.id);

          this.CarID.options = dID.group().reduceCount().all().map(v => v.key);
          //this.CarID.value = this.CarID.options;
          this.CarID.value = [this.CarID.options[0]];

          this.refreshMap(dID);
        });
  },
  methods: {
    refreshMap(cfDimension) {
      this.featureCollection = this.getGeoJsonLineString(cfDimension.top(Infinity));
    },
    getGeoJsonFromGpsRecord(gpsRecord) {
      const fc = {
        type: 'FeatureCollection',
        features:
            gpsRecord
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
    },
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
    CarID: {
      handler(newVal) {
        //dID.filter(newVal.value);
        dID.filter(d => newVal.value.indexOf(d) > -1);
        this.refreshMap(dID);
      },
      deep: true, // force watching within properties
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

#carList{
  height: 500px;
  overflow-y: auto;
}
</style>
