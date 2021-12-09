<template>
  <ViewTable
    v-if="this.gazeComputed.length > 0"
    :data="{
      columns: Object.keys(this.gazeComputed[0]),
      values: this.gazeComputed.map((e) => Object.values(e)),
    }"
  />
</template>

<script>
import ViewTable from "./ViewTable.vue";
export default {
  name: "GazeDataVisualizer",
  components: {
    ViewTable,
  },
  data() {
    return {};
  },
  computed: {
    gazeData() {
      return this.$store.state.gazeData;
    },
    gazeDataByObject() {
      return this.$store.getters.gazeDataByObject;
    },
    gazeComputed() {
      let entries = Object.entries(this.gazeDataByObject);
      entries = entries.map((e) => {
        e[1].sort((a, b) => {
          if (a.Timestamp < b.Timestamp) {
            return -1;
          }
          if (a.Timestamp > b.Timestamp) {
            return 1;
          }
          return 0;
        });
        let timeArray = e[1];
        let Time = timeArray.reduce((acc, e) => acc + e.Duration, 0);
        let Count = timeArray.length;
        let Avg = Math.round(Time / Count);
        let First_Enter = Math.round(timeArray[0].Timestamp);
        let Last_Quit = Math.round(
          timeArray[Count - 1].Timestamp + timeArray[Count - 1].Duration
        );
        return { ObjectName: e[0], Time, Avg, Count, First_Enter, Last_Quit };
      });
      return entries;
    },
  },
  props: {},
  emits: [],
  created() {},
  methods: {},
};
</script>

<style>
table,
th,
td {
  border: 1px solid black;
  border-collapse: collapse;
}
</style>