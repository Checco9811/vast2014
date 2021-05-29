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

    <b-container ref="container" fluid="xl">

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
                :items="employees.options"
                :fields="fields"
                :select-mode="'multi'"
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

      </b-row>

      <b-row>
        <b-col>
          <div id='hist'>
          </div>
        </b-col>
      </b-row>

      <b-row>
        <b-col>
          <h5>Credit Card Transactions</h5>
          <div style="height:250px">
            <Chart :cf-aggregation="dataEmploymentType"></Chart>
          </div>
        </b-col>
        <b-col>
          <Chart></Chart>
        </b-col>
      </b-row>

      <b-row class="description">
        <p>...</p>
        <p>
          <b-link @click="setEmploymentType('Executive')">Executive</b-link>
        </p>
        <p></p>
      </b-row>

    </b-container>

  </div>
</template>

<script>

import Map from '@/components/Map';
import Chart from "@/components/Chart";
import crossfilter from 'crossfilter2';
import moment from 'moment';
import histogram from "@/assets/js/histogramSlider";

const preprocessing = require('@/assets/js/preprocessing')
const d3 = require('d3');


// histogram slider
const histogramSlider = histogram();

// crossfilter data management
let cf; // crossfilter instance
let dID; // dimension for Id
let dEmplType // dimension for EmploymentType
let dTimestamp;

let cf2;
let dIDCc;
let dEmplTypeCc;
let dDateCc;
let dMinutesCc;

export default {
  name: 'App',
  components: {
    Chart,
    Map
  },
  data () {
    return {
      coordinates: [],
      employees: {
        value: [],
        options: []
      },
      ccRecord: [],
      fields: [
        {key:'CarID', sortable: true},
        {key:'FirstName', sortable: true},
        {key:'LastName', sortable: true},
        {key:'CurrentEmploymentType', sortable: true},
        {key:'CurrentEmploymentTitle', sortable: true}
      ],
      isBusy: true,
      ranges : [],
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
    histogramSlider.width(this.$refs.container.clientWidth);
    // init histogram slider
    d3.select('#hist')
        .call(histogramSlider);

    histogramSlider.on('range', (range) =>{
      console.log(range);
      this.ranges = range;
    })

    d3.csv('gps-joined.csv')
        .then((data) => {
          const gpsRecord = data.map((d) => {
            const timestamp = new Date(d.Timestamp);
            const yyyymmdd = timestamp.toISOString().split("T")[0];
            const hhmmss = timestamp.toISOString().split("T")[1].split(".")[0];
            const r = {
              Timestamp: +timestamp,
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
          dTimestamp = cf.dimension(d => d.Timestamp);

          //finding unique values for the options
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
          this.employees.options = uniqueStringsArray.map(JSON.parse);

          this.toggleBusy();

          d3.csv('cc_data_processed.csv')
              .then((data) => {
                const ccRecord = data.map((d) => {
                  const timestamp = new Date(d.timestamp);
                  const yyyymmdd = timestamp.toISOString().split("T")[0];
                  const hhmmss = timestamp.toISOString().split("T")[1].split(".")[0];
                  const r = {
                    Timestamp: +timestamp,
                    Date: yyyymmdd,
                    Minutes: moment.duration(hhmmss).asMinutes(),
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

                d3.csv('car-assignments.csv').then((data) => {
                  const carAssignments = data.map((d) => {
                    return {
                      CarID: +d.CarID,
                      FirstName: d.FirstName,
                      LastName: d.LastName,
                      CurrentEmploymentType: d.CurrentEmploymentType,
                      CurrentEmploymentTitle: d.CurrentEmploymentTitle
                    }
                  })

                  const ccRecordJoined = preprocessing.join(carAssignments, ccRecord, "CarID", "id", function(cc, car) {
                    return {
                      Timestamp: cc.Timestamp,
                      Date: cc.Date,
                      Minutes: cc.Minutes,
                      CarID: car.CarID,
                      FirstName: car.FirstName,
                      LastName: car.LastName,
                      price: cc.price,
                      location: cc.location,
                      CurrentEmploymentType: car.CurrentEmploymentType,
                      CurrentEmploymentTitle: car.CurrentEmploymentTitle
                    };
                  });

                  cf2 = crossfilter(ccRecordJoined);
                  dIDCc = cf2.dimension(d => d.CarID);
                  dEmplTypeCc = cf2.dimension(d => d.CurrentEmploymentType);
                  dDateCc = cf2.dimension(d => d.Date);
                  dMinutesCc = cf2.dimension(d => d.Minutes);

                  this.employees.value = [];
                  this.ranges = [];

                  this.refreshCharts();
                  this.refreshMap(dID);
                })

                //this.ccRecord = ccRecord;
              });
        });

  },
  methods: {
    refreshMap(cfDimension) {
      this.coordinates = cfDimension.top(Infinity);
    },
    onRowSelected(items) {
      this.employees.value = items
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
    setEmploymentType(type){
      this.employmentType.value = new Array(type);
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
    refreshCharts(){
      this.dataEmploymentType = dEmplTypeCc.group().reduceCount().all();
    },
    refreshHistogramSlider(){
      // ignoring the dMinutes dimension for the histogram slider
      histogramSlider.data(cf.allFiltered([dTimestamp]).map(d => d.Timestamp));
    }
  },
  watch: {
    employees: {
      handler(newVal){
        var selectedIDs = []
        newVal.value.forEach(d => selectedIDs.push(d.CarID));
        dEmplType.filter(null); // to allow complex complex condition like "All the Employer of type 'Executive' + CarID 1"
        dID.filter(d => selectedIDs.indexOf(d) > -1);
        dIDCc.filter(d => selectedIDs.indexOf(d) > -1);

        this.refreshCharts();
        this.refreshMap(dID);
        this.refreshHistogramSlider();
      },
      deep:true // force watching within properties
    },
    employmentType: {
      handler(newVal){
        console.log(newVal.value.length);
        if(newVal.value.length != 0) {
          var selectedTypes = []
          newVal.value.forEach(d => selectedTypes.push(d));
          dEmplType.filter(d => selectedTypes.indexOf(d) > -1);

          this.refreshCharts();
          this.refreshMap(dEmplType);
          this.refreshHistogramSlider();
        }else{
          dEmplType.filter(null);
        }

        this.updateTable(); // Select the CarIDs in the table according to the EmploymentTypes
      },
      deep:true
    },
    ranges: {
      handler(newRange){
        dTimestamp.filter(function (d) {
          let filter = false;
          newRange.forEach(r => {
              filter |= d >= r[0] && d <= r[1];
          })
          return filter;
        });

        /*
        dMinutesCc.filter(function (d) {
          return d >= newRange.min && d <= newRange.max;
        });

         */

        this.refreshCharts();
        this.refreshMap(dTimestamp);
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
  color: #2c3e50;
}

#navbar{
  background-color: #1f77b4!important;
}
#CarIDs{
  font-size: 10px;
}

b-table{
  height: 500px;
  overflow-y: auto;
}

</style>
