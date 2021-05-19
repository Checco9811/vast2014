<template>
  <div id="app">
    <b-navbar id="navbar" toggleable="lg" type="dark" variant="info">
      <b-navbar-brand href="#">VC 2014</b-navbar-brand>
      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav>
          <b-nav-item href="#">Mini Challenge 2</b-nav-item>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>

    <b-container fluid="lg">

      <b-row>
        <b-col>
          <b-form-group label="Select Employment Type">
            <b-form-checkbox-group
                v-model="employmentType.value"
                :options="employmentType.options"
                name="buttonsEmploymentType"
                buttons
            ></b-form-checkbox-group>
          </b-form-group>
        </b-col>
        <b-col>

        </b-col>
      </b-row>

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

            <b-col>
              <b-button size="sm" @click="selectAllRows">Select all</b-button>
              <b-button size="sm" @click="clearSelected">Clear selected</b-button>
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
      <b-row>
        <b-col>

        </b-col>
      </b-row>

      <b-row>
        <b-col>
          <Chart :cf-aggregation="dataEmploymentType"></Chart>
        </b-col>
        <b-col>
          <Chart></Chart>
        </b-col>
      </b-row>

    </b-container>

  </div>
</template>

<script>

import Map from '@/components/Map';
import Chart from "@/components/Chart";
import crossfilter from 'crossfilter';
import moment from 'moment';

const d3 = require('d3');

// crossfilter data management
let cf; // crossfilter instance
let dID; // dimension for Id
let dEmplType // dimension for EmploymentType
let dDate; // dimension for Date
let dMinutes; // dimension for Minutes passed from 00:00

let cf2;
let dEmplTypeCc;
let dDateCc;

export default {
  name: 'App',
  components: {
    Chart,
    Map
  },
  data () {
    return {
      coordinates: [],
      dataForHist: [],
      items: [],
      selected: [],
      selectedDate: [],
      dateOptions: [],
      dotOptions:[{disabled:false}, {disabled: false}],
      ccRecord: [],
      fields: [
        {key:'CarID', sortable: true},
        {key:'FirstName', sortable: true},
        {key:'LastName', sortable: true},
        {key:'CurrentEmploymentType', sortable: true},
        {key:'CurrentEmploymentTitle', sortable: true}
      ],
      selectMode: 'multi',
      isBusy: true,
      min: 1,
      max: 1440,
      prettify: function(ts) {
        var date = new Date(0);
        date.setSeconds(ts*60);
        return date.toISOString().substr(11, 5);
      },
      employmentType:{
        value: [],
        options: ['Executive', 'Other']
      },
      dataEmploymentType:[]
    };
  },
  mounted(){
    d3.csv('gps-joined.csv')
        .then((data) => {
          const gpsRecord = data.map((d) => {
            const timestamp = new Date(d.Timestamp);
            const yyyymmdd = timestamp.toISOString().split("T")[0];
            const hhmmss = timestamp.toISOString().split("T")[1].split(".")[0];
            const r = {
              Timestamp: timestamp,
              Date: yyyymmdd,
              Minutes: moment.duration(hhmmss).asMinutes(),
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
          dEmplType = cf.dimension(d => d.CurrentEmploymentType);
          dDate = cf.dimension(d => d.Date);
          dMinutes = cf.dimension(d => d.Minutes);

          //finding unique values for the options
          this.dateOptions = dDate.group().reduceCount().all().map(v => v.key);
          this.employmentType.options = dEmplType.group().reduceCount().all().map(v => v.key);

          const uniqueStrings = new Set(gpsRecord.map(d => { //slice to consider less record?
            return {
              CarID: d.id,
              FirstName: d.FirstName,
              LastName: d.LastName,
              CurrentEmploymentType: d.CurrentEmploymentType,
              CurrentEmploymentTitle: d.CurrentEmploymentTitle
            }
          }).map(JSON.stringify));
          const uniqueStringsArray = Array.from(uniqueStrings);
          this.items = uniqueStringsArray.map(JSON.parse);

          this.toggleBusy();

          this.selected = [];
          this.selectedDate = [];

          this.refreshMap(dID);

          d3.csv('cc_data_processed.csv')
              .then((data) => {
                const ccRecord = data.map((d) => {
                  const timestamp = new Date(d.timestamp);
                  const yyyymmdd = timestamp.toISOString().split("T")[0];
                  const hhmmss = timestamp.toISOString().split("T")[1].split(".")[0];
                  const r = {
                    Timestamp: timestamp,
                    Date: yyyymmdd,
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

                cf2 = crossfilter(ccRecord);
                dEmplTypeCc = cf2.dimension(d => d.location);
                dDateCc = cf2.dimension(d => d.Date);

                console.log(dEmplTypeCc.top(Infinity));

                this.refreshCharts();

                //this.ccRecord = ccRecord;
                //console.log(ccRecord);
              });
        });

  },
  methods: {
    refreshMap(cfDimension) {
      this.coordinates = cfDimension.top(Infinity);
      this.forceRerender();
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
    },
    updateTable(){
      var table = this.$refs.selectableTable;

      var i=0;
      table.items.forEach( d => {
        if(this.employmentType.value.includes(d.CurrentEmploymentType))
          table.selectRow(i);
        else
          table.unselectRow(i);
        i++;
      })
    },
    /*
    sliderChange(newVal){
      console.log(newVal.from, newVal.to);
      dMinutes.filter(function (d) {
        return d >= newVal.from && d <= newVal.to;
      });
      this.refreshMap(dMinutes);
    },
     */
    refreshCharts(){
      console.log(dEmplTypeCc.group().reduceCount().all());
      this.dataEmploymentType = dEmplTypeCc.group().reduceCount().all();
    }
  },
  watch: {
    selected: {
      handler(newVal){
        var selectedIDs = []
        newVal.forEach(d => selectedIDs.push(d.CarID));
        dEmplType.filter(null); // to allow complex complex condition like "All the Employer of type 'Executive' + CarID 1"
        dID.filter(d => selectedIDs.indexOf(d) > -1);
        this.refreshMap(dID);
      },
      deep:true // force watching within properties
    },
    selectedDate: {
      handler(newDate){
        var selectedDates = []
        newDate.forEach(d => selectedDates.push(d));
        dDate.filter(d => selectedDates.indexOf(d) > -1);
        dDateCc.filter(d => selectedDates.indexOf(d) > -1);
        this.refreshCharts();
        this.refreshMap(dDate);
      },
      deep: true
    },
    employmentType: {
      handler(newVal){
        console.log(newVal.value.length);
        if(newVal.value.length != 0) {
          var selectedTypes = []
          newVal.value.forEach(d => selectedTypes.push(d));
          dEmplType.filter(d => selectedTypes.indexOf(d) > -1);
          this.refreshMap(dEmplType);
        }else{
          dEmplType.filter(null);
        }

        this.updateTable(); // Select the CarIDs in the table according to the EmploymentTypes
      },
      deep:true
    },

  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

#navbar{
  background-color: #1f77b4!important;
}

b-table{
  height: 500px;
  overflow-y: auto;
}

</style>
