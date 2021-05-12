<template>
  <b-table
      :items="items"
      :fields="fields"
      :select-mode="selectMode"
      responsive="sm"
      ref="selectableTable"
      selectable
      @row-selected="onRowSelected">
  </b-table>
</template>

<script>
export default {
  name: "Table",
  props:{
    items: {
      type: Array,
      default: () => ([
        {CarID: 1, "First Name": 'Dickerson', 'Last Name': 'Macdonald'},
        {CarID: 2, "First Name": 'Larsen', 'Last Name': 'Shaw'}
        ])
    },
    selected: []
  },
  data(){
    return {
      fields: ['CarID', 'First Name', 'Last Name'],
      selectMode: 'multi'
    }
  },
  methods: {
    onRowSelected(items) {
      console.log(items);
      this.selected = items
    }
  }
}
</script>

<style scoped>

</style>