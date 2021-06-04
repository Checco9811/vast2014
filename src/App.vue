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

              <template v-slot:cell(Color)="row">
                <v-swatches @click.native.stop v-model="row.item.Color" :swatches="colors" popover-x="left"></v-swatches>
              </template>

            </b-table>

            <b-col>
              <b-button size="sm" @click="selectAllRows">Select all</b-button>
              <b-button size="sm" @click="clearSelected">Clear selected</b-button>
            </b-col>
          </b-row>

          <b-row>
            <b-col>
              <b-form-group label="Select Employment Type">
                <b-form-checkbox-group
                    v-model="employmentType.value"
                    :options="employmentType.options"
                    name="buttonsEmploymentType"
                    size="sm"
                    buttons
                ></b-form-checkbox-group>
              </b-form-group>
            </b-col>
          </b-row>

          <b-row>
            <b-col>
              <h5>Select dates</h5>
              <datepicker
                  placeholder=""
                  v-model="dates.value"
                  :options="dates.options"></datepicker>
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
          <h5 style="text-align: center">Credit Card Transactions</h5>
          <div style="height:250px">
            <Timeline :cf-aggregation="ccRecord"></Timeline>
          </div>
        </b-col>
      </b-row>

    </b-container>

  </div>
</template>

<script>

import Map from '@/components/Map';
import Timeline from "@/components/Timeline";
import VSwatches from 'vue-swatches'
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
let dDate; // dimension for Date
let dMinutes; // dimension for Minutes passed from 00:00

let cf2;
let dIDCc;
let dEmplTypeCc;
let dDateCc;
let dMinutesCc;

export default {
  name: 'App',
  components: {
    VSwatches,
    Timeline,
    Map
  },
  data () {
    return {
      colors: ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a','#ffff99','#b15928','#000000'],
      coordinates: {},
      employees: {
        value: [],
        options: []
      },
      dates: {
        options:{
          mode: 'multiple',
          minDate: '2014-01-06',
          maxDate: '2014-01-19',
          defaultDate: '2014-01-06'
        },
        value: ''
      },
      ccRecord: {},
      fields: [
        {key:'CarID', sortable: true},
        {key:'FirstName', sortable: true},
        {key:'LastName', sortable: true},
        {key:'CurrentEmploymentType', sortable: true},
        {key:'CurrentEmploymentTitle', sortable: true},
        {key: 'Color'}
      ],
      isBusy: true,
      range: {
        min: 1,
        max: 1440,
      },
      employmentType:{
        value: [],
        options: ['Executive', 'Other']
      }
    };
  },
  mounted(){
    // init histogram slider
    d3.select('#hist')
        .call(histogramSlider);

    histogramSlider.on('range', (range) =>{
      this.range = {min: range[0], max: range[1]}
    })

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

          d3.csv('cc_data_joined_test.csv')
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
                    location: d.location,
                    Category: d.Category
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
                      Category: cc.Category,
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

                  //finding unique values for the options
                  this.employmentType.options = dEmplType.group().reduceCount().all().map(v => v.key);

                  /*
                  this.dateOptions.enable = dDate.group().reduceCount().all().map(v => v.key);
                  */

                  const uniqueStrings = new Set(gpsRecord.map(d => { //slice to consider less record?
                    return {
                      CarID: d.id,
                      FirstName: d.FirstName,
                      LastName: d.LastName,
                      CurrentEmploymentType: d.CurrentEmploymentType,
                      CurrentEmploymentTitle: d.CurrentEmploymentTitle,
                      Color: '#000000' //black is the default color
                    }
                  }).map(JSON.stringify));
                  const uniqueStringsArray = Array.from(uniqueStrings);
                  this.employees.options = uniqueStringsArray.map(JSON.parse);

                  this.toggleBusy();

                  this.employees.value = [];
                  this.dates.value = '2014-01-06';
                  this.range = {min:0, max:0};

                  this.refreshMap(dID, dIDCc);
                })
              });
        });

  },
  methods: {
    refreshMap(cfDimension1, cfDimension2) {
      this.coordinates = {
        points: cfDimension1.top(Infinity),
        colors: d3.group(this.employees.value, d => d.CarID)
      };
      this.ccRecord = {
        transactions: cfDimension2.top(Infinity),
        range: this.range
      }
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
    refreshHistogramSlider(){
      // ignoring the dMinutes dimension for the histogram slider
      histogramSlider.data(cf.allFiltered([dMinutes]).map(d => d.Minutes));
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

        this.refreshMap(dID, dIDCc);
        this.refreshHistogramSlider();
      },
      deep:true // force watching within properties
    },
    dates: {
      handler(newDate){
        console.log(newDate);
        var selectedDates = [];

        newDate.value.split(";").forEach(d => selectedDates.push(d.trim()));
        dDate.filter(d => selectedDates.indexOf(d) > -1);
        dDateCc.filter(d => selectedDates.indexOf(d) > -1);

        this.refreshMap(dDate, dDateCc);
        this.refreshHistogramSlider();
      },
      deep: true
    },
    employmentType: {
      handler(newVal){
        if(newVal.value.length != 0) {
          var selectedTypes = []
          newVal.value.forEach(d => selectedTypes.push(d));
          dEmplType.filter(d => selectedTypes.indexOf(d) > -1);
          dEmplTypeCc.filter(d => selectedTypes.indexOf(d) > -1);

          this.refreshMap(dEmplType, dEmplTypeCc);
          this.refreshHistogramSlider();
        }else{
          dEmplType.filter(null);
        }

        this.updateTable(); // Select the CarIDs in the table according to the EmploymentTypes
      },
      deep:true
    },
    range: {
      handler(newRange){
        dMinutes.filter(function (d) {
          return d >= newRange.min && d <= newRange.max;
        });

        dMinutesCc.filter(function (d) {
          return d >= newRange.min && d <= newRange.max;
        });

        this.refreshMap(dMinutes, dMinutesCc);
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
  font-size: 8px;
}

b-table{
  height: 500px;
  overflow-y: auto;
}

</style>
