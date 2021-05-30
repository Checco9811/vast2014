<template>
  <l-map ref="map" style="height: 500px; weight: 100%;" :zoom="zoom" :center="center" :maxBounds="maxBounds">
    <l-tile-layer :url="url"></l-tile-layer>
    <l-geo-json :geojson="geoJson" :optionsStyle="mapStyle"></l-geo-json>
    <l-layer-group ref="features">
    </l-layer-group>
    <l-layer-group ref="ccRecords">
    </l-layer-group>
  </l-map>
</template>

<script>
const d3 = require('d3');
import L from 'leaflet';
import { latLngBounds } from "leaflet";
import { LMap, LTileLayer, LMarker, LGeoJson, LPolyline, LLayerGroup, LFeatureGroup} from 'vue2-leaflet';

export default {
  name: "Map",
  components: {
    LMap,
    LTileLayer,
    LGeoJson,
    LLayerGroup,
  },
  props:{
    coordinates:{
      type: Array,
      default:() => ([])
    },
    ccRecord:{
      type: Array,
      default:() => ([])
    }
  },
  data () {
    return {
      specialGoods: [],
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      zoom: 13,
      center: [36.070512, 24.864487],
      bounds: latLngBounds(
          [[36.03771731908686, 24.793739318847656],
            [36.09904766316007, 24.91905212402343]]
      ),
      maxBounds: latLngBounds(
          [[36.03771731908686, 24.793739318847656],
            [36.09904766316007, 24.91905212402343]]
      ),
      mapStyle: {"color": "grey", "opacity": 0.5},
      geoJson: null,
      colors: ['#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a','#ffff99','#b15928'], // qualitative colors
    }
  },
  mounted(){
    var map = this.$refs.map.mapObject;
    const specialGoods = ["MAXIMUM IRON AND STILL", "Frank's Fuels", "ABILA SCRAP", "PUMP"];
    const transportation = ['Abila Airport', 'Port Of Abila'];
    const park = ['Pilau Park', 'Abila Park', 'Desafio Golf Course'];

    //Loading map
    d3.json('Abila.geojson')
        .then((data) => {
          this.geoJson = data;

          //Loading locations
          d3.json('location.geojson')
              .then((data) => {
                L.geoJSON(data, {
                  pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng, style(feature));
                  },
                  onEachFeature: function onEachFeature(feature, layer) {
                    layer.bindPopup(feature.properties.name, {permanent: true});
                  }
                }).addTo(map);

                L.control.legend({
                  items: [
                    {color: 'orange', label: 'SpecialGoods'},
                    {color: 'red', label: 'transportation'},
                    {color: 'brown', label: 'GAStech'},
                    {color: 'grey', label: 'Unknown'},
                    {color: 'blue', label: 'Shop'},
                    {color: 'green', label: 'Park'},
                    {color: 'violet', label: 'Restaurant'},
                    {color: 'pink', label: 'SpecialMeeting'},
                    {color: 'yellow', label: 'Uncertain'},
                  ],
                  collapsed: false,
                  position: 'topright',
                  buttonHtml: 'Legend'
                }).addTo(map);

                function getColor(d) {
                  if(specialGoods.includes(d.properties.name))
                    return "#ff7800";
                  else if(transportation.includes(d.properties.name))
                    return "#FF0000"
                  else
                    return "black";
                }

                function style(feature) {
                  return {
                    radius: 10,
                    fillColor: getColor(feature),
                    color: "#000",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.7
                  };
                }

              });
        });
  },
  watch:{
    coordinates: {
      handler(newCoordinates){
        this.refreshMap(newCoordinates);
      }
    },
    ccRecord: {
      handler(newCcRecords){
        const specialGoods = new Array("MAXIMUM IRON AND STILL", "Frank's Fuels", "ABILA SCRAP", "PUMP");
        const transportation = ['Abila Airport', 'Port Of Abila'];

        var map = this.$refs.map.mapObject;
        var ccRecordLayer = this.$refs.ccRecords.mapObject;

        newCcRecords.forEach(d => {
          var point = L.circleMarker([d.lat, d.long], style(d.location));
          point.on('mouseover', function(e) {
            L.popup()
                .setLatLng(e.latlng)
                .setContent('<h1>'+d.CarID+'</h1>'+d.id + ' ' + d.location)
                .openOn(map);
          });

          point.addTo(ccRecordLayer);
        });

        function getColor(d) {
          if(specialGoods.includes(d))
            return "#ff7800";
          else if(transportation.includes(d))
            return "#FF0000"
          else
            return "black";
        }

        function style(feature) {
          return {
            radius: 2.5,
            fillColor: getColor(feature),
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.7
          };
        }
      }
    }
  },
  methods:{
    createTrajectories(coordinates){
      const result = [];
      var tmp = [];

      for (var i = 0; i < coordinates.length-1; i++) {
        if(coordinates[i+1].Timestamp - coordinates[i].Timestamp > 600000) {
          if(tmp.length==0){
            tmp.push(coordinates[i]);
          }
          result.push(tmp);
          tmp = [];
        }
        tmp.push(coordinates[i])
      }

      if(result.length == 0) {
        result.push(tmp);
      }

      return result;
    },
    refreshMap(coordinates) {
      var map = this.$refs.map.mapObject;
      var features = this.$refs.features.mapObject;
      var idList = [];
      var dateList = [];

      const trajs = d3.group(coordinates, d => d.id, d => d.Date); // group by id
      const trs = [];
      Array.from(trajs).map((d) => {
        idList.push(+d[0]);
        var id = d[0];
        Array.from(d[1]).map( d => {
          dateList.push(d[0]);
          trs.push({
            id: id,
            Date: d[0],
            //trajs: d[1].map(p => ([p.lat, p.long])),
            trajs: d[1].sort((a, b) => a.Timestamp - b.Timestamp)
                .map(p => {
                  return {
                    p: [ p.lat, p.long],
                    Timestamp: p.Timestamp
                  }
                }),
          })
        })
      });

      console.log(trs);

      features.clearLayers();

      //add to map the new trajectories
      trs.forEach(d => {
        var newTrajs = this.createTrajectories(d.trajs);
        console.log(newTrajs);

        newTrajs.forEach(dd => {
          var polyline = L.polyline(dd.map(dd => dd.p),
              {
                color: 'black',
                weight: 2,
                smoothFactor: 3,
                opacity: 0.4,
                id: d.id,
                Date: d.Date
              });

          polyline.on('mouseover', function(e) {
            L.popup()
                .setLatLng(e.latlng)
                .setContent(d.id +' '+ d.Date)
                .openOn(map);
          });

          var startPoint = L.circleMarker(dd[0].p, style());
          startPoint.on('mouseover', function(e) {
            L.popup()
                .setLatLng(e.latlng)
                .setContent('Start: '+dd[0].Timestamp.toISOString())
                .openOn(map);
          });
          var endPoint = L.circleMarker(dd[dd.length-1].p, style());
          endPoint.on('mouseover', function(e) {
            L.popup()
                .setLatLng(e.latlng)
                .setContent('End: '+dd[dd.length-1].Timestamp.toISOString())
                .openOn(map);
          });

          startPoint.addTo(features);
          endPoint.addTo(features);
          polyline.addTo(features);
        })
      });

      function style() {
        return {
          radius: 2.5,
          fillColor: 'black',
          color: "#000",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.7
        };
      }

    }
  }

}
</script>

<style scoped>

</style>