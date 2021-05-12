<template>
  <b-container fluid>
    <b-row>
      <b-col cols="4">
        <b-row>
          <b-table id="CarIDs"
              :items="items"
              :fields="fields"
              :select-mode="selectMode"
              responsive="sm"
              ref="selectableTable"
              selectable sticky-header="300px"
              @row-selected="onRowSelected">
          </b-table>
        </b-row>
        <b-row>
          <b-col>
            <label>Choose a Date</label>
            <b-form-datepicker id="example-datepicker"
                               v-model="selectedDate"
                               min="2014-01-06"
                               max="2014-01-19"
                               locale="en"
                               :date-format-options="{ year: 'numeric', month: 'short', day: '2-digit', weekday: 'short' }"
                               class="mb-2"></b-form-datepicker>
          </b-col>
        </b-row>
      </b-col>
      <b-col>
        <Map :coordinates="coordinates"></Map>
      </b-col>
    </b-row>

  </b-container>

</template>

<script>
import Map from '@/components/Map';

import crossfilter from 'crossfilter';

const d3 = require('d3');

// crossfilter data management
let cf; // crossfilter instance
let dID; // dimension for Id
let dDate; // dimension for Date

export default {
  name: 'App',
  components: {
    Map
  },
  data () {
    return {
      coordinates: [],
      items: [],
      selected: [],
      selectedDate: null,
      fields: [
        {key:'CarID', sortable: true},
        {key:'FirstName', sortable: true},
        {key:'LastName', sortable: true},
        {key:'CurrentEmploymentType', sortable: true},
        {key: 'CurrentEmploymentTitle', sortable: true}
      ],
      selectMode: 'multi'
    };
  },
  mounted(){

    d3.csv('gps-joined.csv')
        .then((data) => {
          const gpsRecord = data.map((d) => {
            const r = {
              Timestamp: +new Date(d.Timestamp),
              Date: new Date(d.Timestamp).toISOString().split("T")[0],
              id: +d.id,
              lat: +d.lat,
              long: +d.long,
              FirstName: d.FirstName,
              LastName: d.LastName,
              CurrentEmploymentType: d.CurrentEmploymentType,
              CurrentEmploymentTitle: d.CurrentEmploymentTitle
            };
            return r;
          });

          cf = crossfilter(gpsRecord);
          dID = cf.dimension(d => d.id);
          dDate = cf.dimension(d => d.Date);

          console.log(dDate.top(Infinity));

          let dAll = cf.dimension(d => JSON.stringify ({
            CarID: d.id ,
            FirstName: d.FirstName,
            LastName: d.LastName,
            CurrentEmploymentType: d.CurrentEmploymentType,
            CurrentEmploymentTitle: d.CurrentEmploymentTitle
          }));

          this.items = dAll.group().reduceCount().all().map(v => {
            var tmp = JSON.parse(v.key);
            return {
              CarID: tmp.CarID,
              FirstName: tmp.FirstName,
              LastName: tmp.LastName,
              CurrentEmploymentType: tmp.CurrentEmploymentType,
              CurrentEmploymentTitle: tmp.CurrentEmploymentTitle
            }});

          this.selected = [];

          //this.refreshMap(dID);
          this.coordinates = dDate.top(Infinity);
        });

  },
  methods: {
    refreshMap(cfDimension) {
      this.coordinates = cfDimension.top(Infinity);
    },
    onRowSelected(items) {
      this.selected = items
    }
  },
  watch: {
    selected: {
      handler(newVal){
        var selectedIDs = []
        newVal.forEach(d => selectedIDs.push(d.CarID));
        dID.filter(d => selectedIDs.indexOf(d) > -1);
        this.refreshMap(dID);
      },
      //deep:true
    },
    selectedDate: {
      handler(newDate){
        dDate.filter(newDate);
        this.refreshMap(dDate);
      },
      //deep: true
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

b-table{
  height: 500px;
  overflow-y: auto;
}


</style>
