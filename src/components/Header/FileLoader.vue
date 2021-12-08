<template>
  <div id="accessButtons">
    <span @click="currentWindow = 'upload'">
      test
      <i class="fas fa-upload icon"></i>
    </span>
    <button @click="startAnalysis">start</button>
    <!-- <span @click="getSerializedDatabase">
      <i class="fas fa-download icon"></i>
    </span> -->
  </div>
  <Prompt
    v-if="currentWindow == 'upload'"
    :data="fields"
    @fileChange="fileChange"
    @currentWindowChange="currentWindow = $event"
    :type="'largePanels'"
  />
</template>

<script>
import Prompt from "./Prompt.vue";

import * as d3 from "d3";

export default {
  name: "FileLoader",
  components: { Prompt },
  data() {
    return {
      currentWindow: "",
      isLoadingSerializedDatabase: 0,
      fields: [
        {
          name: "gazeData",
          label: "Upload Gaze Data",
          format: "csv",
        },
      ],
    };
  },
  props: {
    isLoading: Number,
    perUserAnswers: Object,
    serializedDatabase: [],
  },
  emits: ["updateSerializedDatabase", "downloadDatabase"],
  created() {},
  methods: {
    load_file: async function (file) {
      function readFileAsync(file) {
        return new Promise((resolve, reject) => {
          let reader = new FileReader();
          reader.onload = () => {
            resolve(reader.result);
          };
          reader.onerror = reject;
          reader.readAsText(file);
        });
      }
      let data;
      try {
        let contentBuffer = await readFileAsync(file);
        data = d3.csvParse(contentBuffer, d3.autoType); // see https://github.com/d3/d3-dsv#autoType
      } catch (err) {
        console.log(err);
      }
      return data;
    },
    startAnalysis: async function () {
      if (this.fields[0].file) {
        var file = await this.load_file(this.fields[0].file);
        this.$store.commit("setGazeData", file);
      }
    },
    fileChange(e) {
      this.fields.find((field) => field.name == e.target.id).file =
        e.target.files[0];
    },
  },
};
</script>

<style scoped>
#accessButtons {
  display: flex;
  align-items: center;
}
#accessButtons .icon {
  flex-basis: 0;
  flex-grow: 1;
  min-width: 0;
  margin: 10px;
  cursor: pointer;
}
</style>