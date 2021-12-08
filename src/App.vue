<template>
  <FileLoader />
  <GazeDataVisualizer />
  <GazeDataTable />
</template>

<script>
import FileLoader from "./components/Header/FileLoader.vue";
import GazeDataVisualizer from "./components/GazeDataVisualizer.vue";
import GazeDataTable from "./components/GazeDataTable.vue";

export default {
  name: "App",
  components: {
    FileLoader,
    GazeDataVisualizer,
    GazeDataTable,
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
