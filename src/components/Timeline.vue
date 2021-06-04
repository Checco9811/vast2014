<template>
  <div id="chart"></div>
</template>

<script>
const d3 = require('d3');
import TimelinesChart from 'timelines-chart';

// timeline component
const myChart = TimelinesChart();

const formatMinutes = function (d) {
  var hours = Math.floor(d / 60),
      minutes = Math.floor(d - hours * 60);

  if (hours <= 12)
    return hours + ":" + minutes + ' AM';
  else
    return hours - 12 + ":" + minutes + ' PM';
};

export default {
  name: "Timeline",
  components: {},
  props: {
    cfAggregation: {
      type: Object
    }
  },
  data() {
    return {
      data: [{
        group: "35",
        data: [
          {
            label: "2014-01-06",
            data: [
              {
                timeRange: [600, 605],
                val: "Restaurant"
              }
            ]
          }
        ]
      }]
    }

  },
  mounted() {

    const colorScale = d3.scaleOrdinal(["SpecialGoods", "transportation", "Unknown", "Shop", "Park", "Restaurant", "SpecialMeeting", "Uncertain"],
                              ["#ff7f00", "#e41a1c", "#999999", "#377eb8", "#4daf4a", "#984ea3", "#f781bf", "#ffff33"]);

    myChart
        .width(1000)
        .xTickFormat(n => formatMinutes(+n))
        .timeFormat('%Q')
        .data(this.data)
        .zoomX([1, 1440])
        .zQualitative(true)
        .zColorScale(colorScale)(document.getElementById('chart'));

  },
  watch: {
    cfAggregation(datum) {
      console.log(datum);

      var group = Array.from(d3.group(datum.transactions, d => d.CarID, d => d.Date));

      var result = group.map(d => {
        return {
          group: d[0]+"",
          data: Array.from(d[1]).map(dd => {
            console.log(dd)
            return {
              label: dd[0],
              data: dd[1].map(ddd => {
                return {
                  timeRange: [ddd.Minutes, ddd.Minutes+10],
                  val: ddd.Category,
                  price: ddd.price,
                  location: ddd.location
                }
              })
            }
          })
        }
      })

      console.log(result, datum.range)

      myChart
          .data(result)
          .zoomX(datum.range.min != null && datum.range.max != null ? [datum.range.min, datum.range.max] : [1,1440])
          .segmentTooltipContent(d => {
            console.log(d)
            return "<p>" +  "Ora: " + formatMinutes(d.data.timeRange[0]) + "</p></br>" +
                    "<p>" + "Price: " + d.data.price + "</p></br>" +
                    "<p>" + "Location: " + d.data.location + "</p>";

          });
    }
  }

}
</script>

<style scoped>

</style>