import { createApp } from "vue";
import App from "./App.vue";

import { createStore } from "vuex";

// Create a new store instance.
const store = createStore({
  state() {
    return {
      gazeData: [],
    };
  },
  getters: {
    gazeDataByObject(state) {
      //Hard copy because vuejs uses proxies
      let temp = JSON.parse(JSON.stringify(state.gazeData));
      return temp.reduce((acc, current) => {
        let name = current.Name;
        if (!acc[name]) {
          acc[name] = [];
        }
        delete current.Name;
        acc[name].push(current);
        return acc;
      }, {});
    },
  },
  mutations: {
    setGazeData(state, gazeData) {
      state.gazeData = gazeData;
    },
  },
});

createApp(App).use(store).mount("#app");
