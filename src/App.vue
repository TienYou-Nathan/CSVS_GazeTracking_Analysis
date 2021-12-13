<template>
  <FileLoader />
  <DataVisualizer />
  <GazeDataTable />
  <FovDataTable />
</template>

<script>
import FileLoader from "./components/Header/FileLoader.vue";
import DataVisualizer from "./components/DataVisualizer.vue";
import GazeDataTable from "./components/GazeDataTable.vue";
import FovDataTable from "./components/FovDataTable.vue";

export default {
  name: "App",
  components: {
    FileLoader,
    DataVisualizer,
    GazeDataTable,
    FovDataTable,
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  /* margin-top: 60px; */
}
</style>
