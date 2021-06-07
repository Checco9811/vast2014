import Vue from 'vue'
import App from './App.vue'

import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import '@/assets/js/leaflet-legend.css';
import '@/assets/js/leaflet-legend';
import 'moment';

import { LMap, LTileLayer, LMarker } from 'vue2-leaflet';
import 'leaflet/dist/leaflet.css';

import { Icon } from 'leaflet';

import "vue-histogram-slider/dist/histogram-slider.css";

import VueBlu from 'vue-blu';
import 'vue-blu/dist/css/vue-blu.min.css';

import 'vue-swatches/dist/vue-swatches.css';
import VSwatches from 'vue-swatches'

Vue.use(VSwatches);
Vue.use(VueBlu);
Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

Vue.component('l-map', LMap);
Vue.component('l-tile-layer', LTileLayer);
Vue.component('l-marker', LMarker);

delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
