<template>
  <l-map ref="map" style="height: 500px; weight: 100%;" :zoom="zoom" :center="center" :maxBounds="maxBounds">
    <l-tile-layer :url="url"></l-tile-layer>
    <l-geo-json :geojson="geoJsonMap" :options="mapStyle"></l-geo-json>
    <l-geo-json ref="locations" :geojson="geoJsonLocations" :options="locationsStyle"></l-geo-json>
    <l-layer-group ref="features"></l-layer-group>
    <l-layer-group ref="ccRecords"></l-layer-group>
  </l-map>
</template>

<script>
const d3 = Object.assign({}, require("d3"), require("d3-array"));
const preprocessing = require('@/assets/js/preprocessing')
import L from 'leaflet';
import { latLngBounds } from "leaflet";
import { LMap, LTileLayer, LGeoJson, LLayerGroup} from 'vue2-leaflet';

export default {
  name: "Map",
  components: {
    LMap,
    LTileLayer,
    LGeoJson,
    LLayerGroup,
  },
  props:{
    gpsRecord:{
      type: Object,
      default:() => ({})
    },
    ccRecord:{
      type: Array,
      default:() => ([])
    }
  },
  data () {
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      zoom: 13,
      center: [36.070512, 24.864487],
      bounds: latLngBounds(
          [[36.03771731908686, 24.793739318847656],
            [36.09904766316007, 24.91905212402343]]
      ),
      maxBounds: latLngBounds(
          [[36.02799998329553,24.74258422851562],
            [36.110143066608245,24.9664306640625]]
      ),
      mapStyle: {
        color: "grey",
        opacity: 0.5
      },
      locationsStyle: {
        pointToLayer: function (feature, latlng) {
          return L.circleMarker(latlng, {
            radius: 5,
            fillColor: feature.properties.color,
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.7});
        },
        onEachFeature: function onEachFeature(feature, layer) {
          layer.bindPopup('<b>' + 'Location' + '</b>' + ': ' +feature.properties.name + '<br/>' +
                          '<b>' + '#Transactions' + '</b>' + ': 0' + '<br/>'
                      , {closeOnClick: false, autoClose: false});
        }
      },
      geoJsonMap: null,
      geoJsonLocations: null,
    }
  },
  mounted(){
    const map = this.$refs.map.mapObject;
    //Loading map
    d3.json('Abila.geojson')
        .then((data) => {
          this.geoJsonMap = data;

          //Loading locations
          d3.json('location.geojson')
              .then((data) => {
                this.geoJsonLocations = data;
              });

          L.control.legend({
            items: [
              {color: '#ff7f00', label: 'SpecialGoods'}, //orange
              {color: '#e41a1c', label: 'transportation'}, //red
              {color: '#a65628', label: 'GAStech'}, //brown
              {color: '#999999', label: 'Unknown'}, //grey
              {color: '#377eb8', label: 'Shop'}, //blue
              {color: '#4daf4a', label: 'Park'}, //green
              {color: '#984ea3', label: 'Restaurant'}, //violet
              {color: '#f781bf', label: 'SpecialMeeting'}, //pink
              {color: '#ffff33', label: 'Uncertain'}, //yellow
            ],
            collapsed: false,
            position: 'topright',
            buttonHtml: 'Legend'
          }).addTo(map);

        });

  },
  watch: {
    gpsRecord: {
      handler(newGpsRecord) {
        this.refreshMap(newGpsRecord);
      }
    },
    ccRecord: {
      handler(newCcRecordCount) {
        this.refreshLocations(newCcRecordCount);
      }
    },
  },
  methods: {
    refreshLocations(ccCounts) {
      const locationsLayer = this.$refs.locations.mapObject;
      ccCounts = ccCounts.map(d => {
        return{
          key: d.key.toLocaleLowerCase().replace(/ /g,''),
          value: d.value
        }
      })
      const scaleRadius = d3.scaleSqrt([0, d3.max(ccCounts.map(d => d.value))], [5, 20]);

      //for each location point in the map, update the corresponding transactions count
      locationsLayer.eachLayer(function (layer) {
        const el = ccCounts.find(d => d.key === layer.feature.properties.name.toLocaleLowerCase().replace(/ /g,''));
        var value;

        if (el == null)
          value = 0;
        else
          value = el["value"]

        layer.setRadius(value != 0 ? scaleRadius(value) : 5);
        layer.setPopupContent('<b>' + 'Location' + '</b>' + ': ' + layer.feature.properties.name + '<br/>' +
                              '<b>' + '#Transactions' + '</b>' + ': ' + value + '<br/>')
      });

    },
    refreshMap(gpsRecord) {
      const colorMap = gpsRecord.colors;
      const map = this.$refs.map.mapObject;
      const features = this.$refs.features.mapObject;

      const groupIdDate = d3.flatGroup(gpsRecord.points, d => d.id, d => d.Date); // group gps record by id and date
      const trajs = groupIdDate.map(d => {
        return {
          id: d[0],
          Date: d[1],
          trajs : d[2].sort((a, b) => a.Timestamp - b.Timestamp)
              .map(p => {
                return {
                  p: [p.lat, p.long],
                  Timestamp: p.Timestamp
                }
              })
        }
      })

      //remove old trajectories
      features.clearLayers();

      //add to map the new trajectories
      trajs.forEach(d => {
        var newTrajs = preprocessing.splitTrajectories(d.trajs, 600000);

        newTrajs.forEach(dd => {
          if (dd.length != 0) { // draw only array with more than 1 coordinates
            var polyline = L.polyline(dd.map(dd => dd.p),
                {
                  color: colorMap.get(d.id)[0].Color,
                  weight: 2,
                  smoothFactor: 3,
                  opacity: colorMap.get(d.id)[0].Color == '#000000' ? 0.4 : 1,
                  id: d.id,
                  Date: d.Date
                });

            polyline.on('click', function (e) {
              L.popup({closeOnClick: false, autoClose: false})
                  .setLatLng(e.latlng)
                  .setContent('<b>' + 'CarId' + '</b>' + ': ' + d.id + '<br/>' +
                      '<b>' + 'Start' + '</b>' + ': ' + preprocessing.formatDate(dd[0].Timestamp) + '<br/>' +
                      '<b>' + 'Stop' + '</b>' + ': ' + preprocessing.formatDate(dd[dd.length - 1].Timestamp) + '<br/>')
                  .openOn(map);
            });

            var startPoint = L.circleMarker(dd[0].p, {
              radius: 2,
              fillColor: colorMap.get(d.id)[0].Color,
              color: "#000",
              weight: 1,
              opacity: 1,
              fillOpacity: 0.7
            });

            var endPoint = L.circleMarker(dd[dd.length - 1].p, {
              radius: 2,
              fillColor: colorMap.get(d.id)[0].Color,
              color: "#000",
              weight: 1,
              opacity: 1,
              fillOpacity: 0.7
            });

            startPoint.addTo(features);
            endPoint.addTo(features);
            polyline.addTo(features);
          }
        })
      });

    }
  }


}
</script>

<style scoped>

</style>