<template>
  <b-container fluid>
    <b-row>
      <b-col cols="4">
        <b-row>
          <b-table
              id="CarIDs"
              :busy="isBusy"
              :items="items"
              :fields="fields"
              :select-mode="selectMode"
              responsive="sm"
              ref="selectableTable"
              selectable sticky-header="300px"
              @row-selected="onRowSelected">

            <template #table-busy>
              <div class="text-center text-danger my-2">
                <b-spinner label="Loading..." class="align-middle"></b-spinner>
                <strong>Loading...</strong>
              </div>
            </template>
          </b-table>

          <b-button size="sm" @click="selectAllRows">Select all</b-button>
          <b-button size="sm" @click="clearSelected">Clear selected</b-button>

        </b-row>
        <b-row>
          <b-col>
            <vue-slider
                v-model="timeRange"
                :dot-options="dotOptions"
                :order="false"
            ></vue-slider>
          </b-col>
        </b-row>
      </b-col>

      <b-col>
        <Map :coordinates="coordinates" :ccRecord="ccRecord"></Map>
      </b-col>

      <b-col cols="2">
        <b-form-group
            label="Select Dates">
          <b-form-checkbox-group
              v-model="selectedDate"
              :options="dateOptions"
              name="dateSelector"
              stacked
          ></b-form-checkbox-group>
        </b-form-group>
      </b-col>
    </b-row>

  </b-container>

</template>

<script>
import Map from '@/components/Map';

import crossfilter from 'crossfilter';
import VueSlider from "vue-slider-component";

const d3 = require('d3');

// crossfilter data management
let cf; // crossfilter instance
let dID; // dimension for Id
let dDate; // dimension for Date

export default {
  name: 'App',
  components: {
    Map,
    VueSlider
  },
  data () {
    return {
      coordinates: [],
      items: [],
      selected: [],
      selectedDate: [],
      dateOptions: [],
      dotOptions:[{disabled:false}, {disabled: false}],
      timeRange: ['00:01', '23:59'],
      ccRecord: [],
      fields: [
        {key:'CarID', sortable: true},
        {key:'FirstName', sortable: true},
        {key:'LastName', sortable: true},
        {key:'CurrentEmploymentType', sortable: true},
        {key: 'CurrentEmploymentTitle', sortable: true}
      ],
      selectMode: 'multi',
      isBusy: true,
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

          let dAll = cf.dimension(d => JSON.stringify ({
            CarID: d.id ,
            FirstName: d.FirstName,
            LastName: d.LastName,
            CurrentEmploymentType: d.CurrentEmploymentType,
            CurrentEmploymentTitle: d.CurrentEmploymentTitle
          }));

          this.dateOptions = dDate.group().reduceCount().all().map(v => v.key);

          this.items = dAll.group().reduceCount().all().map(v => {
            var tmp = JSON.parse(v.key);
            return {
              CarID: tmp.CarID,
              FirstName: tmp.FirstName,
              LastName: tmp.LastName,
              CurrentEmploymentType: tmp.CurrentEmploymentType,
              CurrentEmploymentTitle: tmp.CurrentEmploymentTitle
            }
          });

          this.toggleBusy();

          this.selected = [];
          this.selectedDate = [];

          //this.refreshMap(dID);
          this.coordinates = dID.top(Infinity);

          d3.csv('cc_data_processed.csv')
              .then((data) => {
                const ccRecord = data.map((d) => {
                  const r = {
                    Timestamp: +new Date(d.timestamp),
                    id: +d.CarID,
                    lat: +d.lat,
                    long: +d.long,
                    FirstName: d.FirstName,
                    LastName: d.LastName,
                    price: d.price,
                    location: d.location
                  }

                  return r;
                });

                //this.ccRecord = ccRecord;

                console.log(ccRecord);
              });
        });

  },
  methods: {
    refreshMap(cfDimension) {
      this.coordinates = cfDimension.top(Infinity);
    },
    onRowSelected(items) {
      this.selected = items
    },
    toggleBusy() {
      this.isBusy = !this.isBusy
    },
    selectAllRows() {
      this.$refs.selectableTable.selectAllRows()
    },
    clearSelected() {
      this.$refs.selectableTable.clearSelected()
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
      deep:true
    },
    selectedDate: {
      handler(newDate){
        var selectedDates = []
        newDate.forEach(d => selectedDates.push(d));
        dDate.filter(d => selectedDates.indexOf(d) > -1);
        this.refreshMap(dDate);
      },
      deep: true
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

b-table{
  height: 500px;
  overflow-y: auto;
}


</style>
