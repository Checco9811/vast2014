<template>
  <div id="app">
    <b-container>
      <b-row>
        <b-col>
          <b-row>
            <!--Map here-->
          </b-row>

          <b-row>

          </b-row>

        </b-col>
        <b-col cols="3">
          <b-form-group label="Select a CarId" id="carList">
            <b-form-checkbox-group
                size="lg"
                v-model="CarID.value"
                :options="CarID.options"
                name="buttonsCarId"
                buttons
                stacked
                style="width: 100%"
            ></b-form-checkbox-group>
          </b-form-group>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>

export default {
  name: 'App',
  components: {
  },
  data(){
    return{
      CarID: {
        value: [1,2],
        options: [1,2,3],
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
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
