<template>
  <svg height="500" width="100%" class="map">
    <g class="world" id="world"></g>
    <g class="features" ref="features"></g>
  </svg>
</template>

<script>
export default {
  name: "Map"
}
</script>

<style>

svg.map{
  background-color: lightcyan;
}

</style>