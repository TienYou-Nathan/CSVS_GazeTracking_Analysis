import { createApp } from "vue";
import App from "./App.vue";

import { createStore } from "vuex";

// Create a new store instance.
const store = createStore({
  state() {
    return {
      unfilteredGazeData: [],
      gazeData: [],
      unfilteredFovData: [],
      fovData: [],
      blacklist: {},
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
    unfilteredGazeDataByObject(state) {
      let temp = JSON.parse(JSON.stringify(state.unfilteredGazeData));
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
    fovDataByObject(state) {
      let temp = JSON.parse(JSON.stringify(state.fovData));
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
    dataObjects(state) {
      return Object.keys(
        JSON.parse(JSON.stringify(state.gazeData)).reduce((acc, current) => {
          let name = current.Name;
          if (!acc[name]) {
            acc[name] = [];
          }
          delete current.Name;
          acc[name].push(current);
          return acc;
        }, {})
      );
    },
  },
  mutations: {
    setGazeData(state, gazeData) {
      gazeData = gazeData.sort((a, b) => {
        if (a.Name < b.Name) return -1;
        if (a.Name > b.Name) return 1;
        return 0;
      });
      state.unfilteredGazeData = gazeData;
      state.gazeData = gazeData;
    },
    setFovData(state, fovData) {
      state.unfilteredFovData = fovData;
      state.fovData = fovData;
    },
    setBlacklist(state, blacklist) {
      state.blacklist = blacklist;
      state.gazeData = state.unfilteredGazeData.reduce((acc, e) => {
        let list = blacklist[e.Name];
        if (list) {
          // console.log(blacklist[e.Name][0].Timestamp);
          list = list.filter(
            (black) =>
              (black.Timestamp <= e.Timestamp &&
                black.Timestamp + black.Duration > e.Timestamp) ||
              (black.Timestamp >= e.Timestamp &&
                black.Timestamp <= e.Timestamp + e.Duration)
          );
          if (list.length > 0) {
            return acc;
          }
        }
        return [...acc, e];
      }, []);
    },
  },
});

createApp(App).use(store).mount("#app");
