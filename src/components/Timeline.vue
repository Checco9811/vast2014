<template>
  <div id="chart"></div>
</template>

<script>
const d3 = Object.assign({}, require("d3"), require("d3-array"));
import TimelinesChart from 'timelines-chart';

// timeline component
const timeline = TimelinesChart();

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
    transactions: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      data: [{
        group: " ",
        data: [
          {
            label: " ",
            data: [
              {
                timeRange: [1, 1],
                val: "Unknown"
              },
              {
                timeRange: [1440, 1440],
                val: "Unknown"
              }
            ]
          }
        ]
      }]
    }

  },
  created() {
    window.addEventListener("resize", this.pageResize);
  },
  destroyed() {
    window.removeEventListener("resize", this.pageResize);
  },
  mounted() {

    const colorScale = d3.scaleOrdinal(["SpecialGoods", "transportation", "Unknown", "Shop", "Park", "Restaurant", "SpecialMeeting", "Uncertain"],
                              ["#ff7f00", "#e41a1c", "#999999", "#377eb8", "#4daf4a", "#984ea3", "#f781bf", "#ffff33"]);
    const width = d3.select('#chart').node().getBoundingClientRect().width;

    timeline
        .width(width)
        .xTickFormat(n => formatMinutes(+n))
        .timeFormat('%Q')
        .data(this.data)
        .zoomX([1, 1440])
        .zQualitative(true)
        .zColorScale(colorScale)(document.getElementById('chart'));

  },
  watch: {
    transactions(datum) {
      var group = Array.from(d3.group(datum.transactions, d => d.LastName, d => d.Date));

      var result = group.map(d => {
        return {
          group: d[0],
          data: Array.from(d[1]).map(dd => {
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

      timeline
          .data(result.length == 0 ? this.data : result)
          .zoomX(datum.range.min != null && datum.range.max != null ? [datum.range.min, datum.range.max] : [1,1440])
          .segmentTooltipContent(d => {
            return "<p>" +  "Ora: " + formatMinutes(d.data.timeRange[0]) + "</p></br>" +
                    "<p>" + "Price: " + d.data.price + "</p></br>" +
                    "<p>" + "Location: " + d.data.location + "</p>";

          });

    }
  },
  methods: {
    pageResize() {
      const width = d3.select('#chart').node().getBoundingClientRect().width;

      timeline
        .width(width)
        .zoomX(this.transactions.range.min != null && this.transactions.range.max != null ?
            [this.transactions.range.min, this.transactions.range.max] : [1,1440])
    }
  }

}
</script>

<style scoped>

</style>