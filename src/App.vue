

<template>
  <b-container>
    <b-row>
      <b-col cols="5">
        <Table :items="items" :selected="selected" id="CarIDs"></Table>
      </b-col>
      <b-col>
        <Map :coordinates="coordinates"></Map>
      </b-col>
    </b-row>

  </b-container>

</template>

<script>
import Map from '@/components/Map';
import Table from "@/components/Table";

import crossfilter from 'crossfilter';

const d3 = require('d3');

// crossfilter data management
let cf; // crossfilter instance
let dID; // dimension for Id

export default {
  name: 'App',
  components: {
    Table,
    Map
  },
  data () {
    return {
      coordinates: [],
      items: [],
      selected: null,
      CarID: {
        value: [1, 2],
        options: [1, 2, 3]
      }
    };
  },
  mounted(){

    d3.csv('gps-joined.csv')
        .then((data) => {
          const gpsRecord = data.map((d) => {
            const r = {
              Timestamp: +new Date(d.Timestamp).getTime(),
              id: +d.id,
              lat: +d.lat,
              long: +d.long
            };
            return r;
          });

          cf = crossfilter(gpsRecord);
          dID = cf.dimension(d => d.id);

          this.items = dID.group().reduceCount().all().map(v => {return {CarID: v.key}});
          console.log(this.items);

          //this.CarID.options = dID.group().reduceCount().all().map(v => v.key);
          //this.CarID.value = this.CarID.options;
          //this.CarID.value = [this.CarID.options[0]];

          //this.refreshMap(dID);
          this.coordinates = dID.top(Infinity);
        });

  },
  methods: {
    refreshMap(cfDimension) {
      this.coordinates = cfDimension.top(Infinity);
    },
  },
  watch: {
    CarID: {
      handler(newVal) {
        //dID.filter(newVal.value);
        dID.filter(d => newVal.value.indexOf(d) > -1);
        this.refreshMap(dID);
      },
      deep: true,
    },
    selected: {
      handler(newVal){
        console.log(newVal);
      }
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

#CarIDs{
  height: 500px;
  overflow-y: auto;
}


</style>
