<template>
  <b-container fluid="lg">
    <b-row>
      <b-col>
        <HistogramSlider
            ref="slider"
            :key="componentKey"
            style="margin: 10px auto"
            :width="1000"
            :bar-height="100"
            :transitionDuration="10"
            :data="dataForHist"
            :drag-interval="true"
            :force-edges="true"
            :prettify="prettify"
            :gridTextColor="'#2c3e50'"
            :primary-color="'#2c3e50'"
            :step="1"
            :min="1"
            :max="1440"
            @finish="sliderFinish"
            @start="sliderStart"/>
        <!--@change="sliderChange"-->
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

          <b-button size="sm" @click="selectAllRows">Select all</b-button>
          <b-button size="sm" @click="clearSelected">Clear selected</b-button>

        </b-row>
        <b-row>
          <b-col>

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
import moment from 'moment';

const d3 = require('d3');

// crossfilter data management
let cf; // crossfilter instance
let dID; // dimension for Id
let dDate; // dimension for Date
let dMinutes; // dimension for Minutes passed from 00:00

export default {
  name: 'App',
  components: {
    Map,
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
        {key: 'CurrentEmploymentTitle', sortable: true}
      ],
      selectMode: 'multi',
      isBusy: true,
      componentKey: 0,
      min: 1,
      max: 1440,
      prettify: function(ts) {
        var date = new Date(0);
        date.setSeconds(ts*60);
        return date.toISOString().substr(11, 5);
      }

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

          //console.log(gpsRecord);

          cf = crossfilter(gpsRecord);
          dID = cf.dimension(d => d.id);
          dDate = cf.dimension(d => d.Date);
          dMinutes = cf.dimension(d => d.Minutes);

          //finding unique values for the options
          this.dateOptions = dDate.group().reduceCount().all().map(v => v.key);
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

          this.refreshMap(dID.filter(null));

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
    /*
    sliderChange(newVal){
      console.log(newVal.from, newVal.to);
      dMinutes.filter(function (d) {
        return d >= newVal.from && d <= newVal.to;
      });
      this.refreshMap(dMinutes);
    },
     */
    sliderFinish(newVal){
      console.log(newVal.from, newVal.to);
      dMinutes.filter(function (d) {
        return d >= newVal.from && d <= newVal.to;
      });
      this.refreshMap(dMinutes);
      this.min = newVal.from;
      this.max = newVal.to;
      //this.dataForHist = this.coordinates.map(d => d.Minutes);
      this.forceRerender();
    },
    sliderStart(newVal){
      console.log(newVal);
      newVal.from = this.min;
      newVal.to = this.max;
    },
    forceRerender(){
      this.componentKey += 1;
      this.$refs.slider.from = this.min;
      this.$refs.slider.to = this.max;
      this.dataForHist = this.coordinates.map(d => d.Minutes);
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
