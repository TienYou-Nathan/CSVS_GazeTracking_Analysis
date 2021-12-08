<template>
  <button @click="debug">consolelog</button>
  <div id="svgcontainer"></div>
</template>

<script>
import * as d3 from "d3";
import * as d3scale from "d3-scale";
import * as d3axis from "d3-axis";

export default {
  name: "GazeDataVisualizer",
  components: {},
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
  },
  props: {},
  emits: [],
  created() {},
  methods: {
    debug() {
      const objectKeys = Object.keys(this.gazeDataByObject);
      var rectheight = 20;
      var yLabel = "test";
      var width = 1000;
      var height = 500;
      var yoffset = 0.5;
      var svg = d3
        .select("#svgcontainer")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("id", "mainSvg");
      const margin = { top: 30, right: 30, bottom: 30, left: 100 };

      const containerWidth = width - margin.left - margin.right;
      const containerHeight = height - margin.top - margin.bottom;

      // const eventRect = svg
      //   .append("rect")
      //   .attr("x", margin.left)
      //   .attr("y", height - margin.bottom)
      //   .attr("width", containerWidth)
      //   .attr("height", margin.bottom)
      //   .attr("opacity", "0");

      var x = d3scale
        .scaleLinear()
        .domain([
          d3.min(this.gazeData, (e) => e.Timestamp),
          d3.max(this.gazeData, (e) => e.Timestamp),
        ])
        .range([0, containerWidth]);

      var y = d3scale
        .scaleLinear()
        .domain([0, objectKeys.length])
        .range([0, height - margin.bottom - margin.top]);

      let xAxis = d3axis
        .axisBottom(x)
        .tickFormat((d) => `${Math.floor(d / 1000)}s`);

      let yAxis = d3axis
        .axisLeft(y)
        .tickFormat((d) => Object.keys(this.gazeDataByObject)[d - yoffset]);
      svg
        .append("g")
        .attr("transform", () => `translate(${margin.left} ${margin.top})`)
        .call(yAxis)
        .call((g) =>
          g
            .append("text")
            .attr("x", -margin.left)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text(yLabel)
        );

      const xAxisContainer = svg
        .append("svg")
        .attr(
          "transform",
          () => `translate(${margin.left} ${height - margin.bottom})`
        );

      xAxisContainer.append("g").call(xAxis);

      function createRect(d) {
        const el = d3.select(this);
        const sx = x(d.Timestamp);
        const w = x(d.Timestamp + d.Duration) - x(d.Timestamp);
        el.style("cursor", "pointer");

        el.append("rect")
          .attr("x", sx)
          .attr("y", y(objectKeys.indexOf(d.Name) + yoffset) - rectheight / 2)
          .attr("height", rectheight)
          .attr("width", w)
          .attr("fill", d.color);
      }

      const rectsContainer = svg
        .append("svg")
        .attr("transform", () => `translate(${margin.left} ${margin.top})`)
        .attr("width", containerWidth)
        .attr("height", containerHeight)
        .attr("preserveAspectRatio", "none")
        .attr("id", "rectsContainer")
        .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`);

      var currentWidth = containerWidth;
      var currentOffset = 0;
      function zoom(x, percentage) {
        let leftCenterOffset = x / containerWidth;
        let sizeDifference = currentWidth - currentWidth * percentage;
        let offsetDifference = sizeDifference * leftCenterOffset;

        if (currentWidth * percentage < containerWidth) {
          currentWidth *= percentage;
        } else {
          currentWidth = containerWidth;
        }
        if (currentWidth == 0) {
          currentWidth = containerWidth;
        }

        if (currentOffset + offsetDifference + currentWidth > containerWidth) {
          currentOffset = containerWidth - currentWidth;
        } else if (currentOffset + offsetDifference >= 0) {
          currentOffset += offsetDifference;
        } else {
          currentOffset = 0;
        }

        rectsContainer.attr(
          "viewBox",
          `${currentOffset} 0 ${currentWidth} ${containerHeight}`
        );
      }

      const g = rectsContainer.append("g");
      svg.on("wheel", (e) => {
        e.preventDefault();
        const offset = rectsContainer.node().getBoundingClientRect();
        if (
          !(
            e.clientX > offset.left &&
            e.clientX < offset.right &&
            e.clientY < offset.bottom &&
            e.clientY > offset.top
          )
        )
          return;

        let delta = e.deltaY * 0.01;
        if (delta < 0) {
          delta = 1 / Math.abs(delta);
        }
        zoom(e.clientX - offset.left, delta);
      });

      svg.on("mousemove", (e) => {
        const offset = rectsContainer.node().getBoundingClientRect();
        if (
          !(
            e.clientX > offset.left &&
            e.clientX < offset.right &&
            e.clientY < offset.bottom &&
            e.clientY > offset.top
          )
        )
          return;

        if (e.buttons == 1) {
          if (
            currentOffset - e.movementX * (currentWidth / containerWidth) <
            0
          ) {
            currentOffset = 0;
            return;
          }

          if (
            currentOffset -
              e.movementX * (currentWidth / containerWidth) +
              currentWidth >
            containerWidth
          ) {
            currentOffset = containerWidth - currentWidth;
            return;
          }
          currentOffset -= e.movementX * (currentWidth / containerWidth);
          rectsContainer.attr(
            "viewBox",
            `${currentOffset} 0 ${currentWidth} ${containerHeight}`
          );
        }
      });

      const groups = g
        .selectAll("g")
        .data(this.gazeData)
        .enter()
        .append("g")
        .attr("class", "civ");
      groups.each(createRect);
    },
  },
};
</script>

<style>
</style>