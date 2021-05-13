<template>
  <l-map ref="map" style="height: 500px; weight: 100%;" :zoom="zoom" :center="center" :maxBounds="maxBounds">
    <l-tile-layer :url="url"></l-tile-layer>
    <l-geo-json :geojson="geoJson"></l-geo-json>
    <l-layer-group ref="features">
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
    // eslint-disable-next-line vue/no-unused-components
    LMarker,
    LGeoJson,
    // eslint-disable-next-line vue/no-unused-components
    LLayerGroup,
    // eslint-disable-next-line vue/no-unused-components
    LPolyline,
    // eslint-disable-next-line vue/no-unused-components
    LFeatureGroup
  },
  props:{
    coordinates:{
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
          [[36.03771731908686, 24.793739318847656],
            [36.09904766316007, 24.91905212402343]]
      ),
      geoJson: null,
    }
  },
  mounted(){
    var map = this.$refs.map.mapObject;

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
                    layer.bindPopup(feature.properties.name);
                  }
                }).addTo(map);

                // eslint-disable-next-line no-unused-vars
                function getColor(d) {
                 return "#ff7800";
                }

                function style(feature) {
                  return {
                    radius: 5,
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
    }
  },
  methods:{
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
            trajs: d[1].sort((a, b) => a.Timestamp - b.Timestamp).map(p => ([ p.lat, p.long ])),
          })
        })
      });

      console.log(dateList);

      //remove from map non selected CarIDs
      features.eachLayer(function (layer) {
        if(!idList.includes(layer.options.id) || !dateList.includes(layer.options.Date)){
          features.removeLayer(layer);
        }
      });

      //add to map the new CarIDs
      trs.forEach(d => {
        var polyline = L.polyline(d.trajs,
            {
              color: 'green',
              weight: 5,
              opacity: .7,
              lineJoin: 'roud',
              id: d.id
            });
        polyline.on('mouseover', function(e) {
          L.popup()
            .setLatLng(e.latlng)
            .setContent('CarID: '+d.id)
            .openOn(map);
        });
        //polyline.bindTooltip(d.id+"");
        polyline.addTo(features);
      });

    }
  },
  createTrajectories(coordinates){
    // eslint-disable-next-line no-unused-vars
    var t=0;
    const result = [];
    var tmp = [];

    for (var i = 0; i < coordinates.length; i++) {
      if(coordinates[i+1].Timestamp - coordinates[i].Timestamp > 2) {
        result.push({
          t: tmp
        });
        tmp = [];
        t++;
      }
      tmp.push([coordinates[i].lat, coordinates[i].long])
    }
  }

}
</script>

<style scoped>

</style>