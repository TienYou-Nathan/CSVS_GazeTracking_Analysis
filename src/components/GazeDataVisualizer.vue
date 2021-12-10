<template>
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
    return {
      svg: {},
      width: 1000,
      height: 500,
      margin: { top: 30, right: 30, bottom: 30, left: 100 },
      rectheight: 20,
      xScale: null,
      yScale: null,
      xAxis: null,
      yAxis: null,
      rectsContainer: null,
      currentWidth: null,
      currentOffset: 0,
    };
  },
  computed: {
    gazeData() {
      return this.$store.state.gazeData;
    },
    gazeDataByObject() {
      return this.$store.getters.gazeDataByObject;
    },
    gazeDataObjects() {
      return Object.keys(this.gazeDataByObject);
    },
    containerWidth() {
      return this.width - this.margin.left - this.margin.right;
    },
    containerHeight() {
      return this.height - this.margin.top - this.margin.bottom;
    },
    maxTimestamp() {
      return d3.max(this.gazeData, (e) => e.Timestamp);
    },
  },
  watch: {
    gazeDataObjects() {
      this.drawSVG();
    },
  },
  props: {},
  emits: [],
  mounted() {
    this.AxisSvg = d3
      .select("#svgcontainer")
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .attr("id", "AxisSvg");

    this.xScale = d3scale.scaleLinear().range([0, this.containerWidth]);
    this.yScale = d3scale.scaleLinear().range([0, this.containerHeight]);

    this.xAxisContainer = this.AxisSvg.append("g")
      .attr("id", "xAxis")
      .attr(
        "transform",
        () =>
          `translate(${this.margin.left} ${this.height - this.margin.bottom})`
      );
    this.yAxisContainer = this.AxisSvg.append("g")
      .attr("id", "xAxis")
      .attr(
        "transform",
        () => `translate(${this.margin.left} ${this.margin.top})`
      );

    this.rectsContainer = d3
      .select("#svgcontainer")
      .append("svg")
      .attr(
        "transform",
        () => `translate(${this.margin.left} ${this.margin.top})`
      )
      .attr("width", this.containerWidth)
      .attr("height", this.containerHeight)
      .attr("preserveAspectRatio", "none")
      .attr("id", "rectsContainer")
      .attr("viewBox", `0 0 ${this.containerWidth} ${this.containerHeight}`);
    this.currentWidth = this.containerWidth;

    if (this.gazeData.length > 0) {
      this.drawSVG();
    }
  },
  methods: {
    setXScale(start, end) {
      this.xScale = this.xScale.domain([start, end]);
      this.drawXAxis();
    },
    setYScale(start, end) {
      this.yScale = this.yScale.domain([start, end]);
      this.drawYAxis();
    },
    drawXAxis() {
      this.xAxisContainer.selectAll("*").remove();
      this.xAxis = d3axis
        .axisBottom(this.xScale)
        .tickFormat((d) => `${d / 1000}s`);

      this.xAxisContainer.call(this.xAxis);
    },
    drawYAxis() {
      this.yAxisContainer.selectAll("*").remove();
      this.yAxis = d3axis
        .axisLeft(this.yScale)
        .tickFormat((d) => Object.keys(this.gazeDataByObject)[d - 0.5]);
      this.yAxisContainer.call(this.yAxis);
    },
    zoom(xpos, percentage) {
      let leftCenterOffset = xpos / this.containerWidth;
      let sizeDifference = this.currentWidth - this.currentWidth * percentage;
      let offsetDifference = sizeDifference * leftCenterOffset;

      if (this.currentWidth * percentage < this.containerWidth) {
        this.currentWidth *= percentage;
      } else {
        this.currentWidth = this.containerWidth;
      }
      if (this.currentWidth == 0) {
        this.currentWidth = this.containerWidth;
      }

      if (
        this.currentOffset + offsetDifference + this.currentWidth >
        this.containerWidth
      ) {
        this.currentOffset = this.containerWidth - this.currentWidth;
      } else if (this.currentOffset + offsetDifference >= 0) {
        this.currentOffset += offsetDifference;
      } else {
        this.currentOffset = 0;
      }
      this.setViewBox(this.currentOffset, this.currentWidth);
    },
    scroll(xoffset) {
      if (
        this.currentOffset -
          xoffset * (this.currentWidth / this.containerWidth) <
        0
      ) {
        this.currentOffset = 0;
      } else if (
        this.currentOffset -
          xoffset * (this.currentWidth / this.containerWidth) +
          this.currentWidth >
        this.containerWidth
      ) {
        this.currentOffset = this.containerWidth - this.currentWidth;
      } else {
        this.currentOffset -=
          xoffset * (this.currentWidth / this.containerWidth);
      }
      this.setViewBox(this.currentOffset, this.currentWidth);
    },
    setViewBox(left, width) {
      this.setXScale(
        (left * this.maxTimestamp) / this.containerWidth,
        ((left + width) * this.maxTimestamp) / this.containerWidth
      );

      this.rectsContainer.attr(
        "viewBox",
        `${left} 0 ${width} ${this.containerHeight}`
      );
      // transform instead of viewbox to avoid antialising problems. Not working ATM
      // this.rectsContainer.attr(
      //   "transform",
      //   `scale(${this.containerWidth / width} 1) translate(${
      //     this.margin.left - left
      //   } ${this.margin.top})`
      // );
    },
    handleScroll(e) {
      e.preventDefault();
      const offset = this.rectsContainer.node().getBoundingClientRect();
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
      this.zoom(e.clientX - offset.left, delta);
    },
    handleDrag(e) {
      const offset = this.rectsContainer.node().getBoundingClientRect();
      if (
        !(
          e.clientX > offset.left &&
          e.clientX < offset.right &&
          e.clientY < offset.bottom &&
          e.clientY > offset.top
        )
      )
        return;
      if (e.buttons != 1) return;

      this.scroll(e.movementX);
    },
    drawSVG() {
      this.setViewBox(this.currentOffset, this.currentWidth);
      this.setYScale(0, this.gazeDataObjects.length);

      this.rectsContainer.on("wheel", this.handleScroll);
      this.rectsContainer.on("mousemove", this.handleDrag);

      //drawRects
      this.rectsContainer
        .data(this.gazeData)
        .enter()
        .each((d) => {
          const sx = this.xScale(d.Timestamp);
          const w =
            this.xScale(d.Timestamp + d.Duration) - this.xScale(d.Timestamp);

          this.rectsContainer
            .append("rect")
            .attr("x", sx)
            .attr(
              "y",
              this.yScale(this.gazeDataObjects.indexOf(d.Name) + 0.5) -
                this.rectheight / 2
            )
            .attr("height", this.rectheight)
            .attr("width", w)
            .attr("fill", d.color);
        });
      this.rectsContainer
        .data(this.gazeDataObjects)
        .enter()
        .each((e) => {
          let lineHeight = this.yScale(this.gazeDataObjects.indexOf(e));
          this.rectsContainer
            .append("line")
            .attr("x1", 0)
            .attr("x2", this.containerWidth)
            .attr("y1", lineHeight)
            .attr("y2", lineHeight)
            .attr("stroke", "black");
        });
    },
  },
};
</script>

<style>
#AxisSvg {
  user-select: none;
}
#svgcontainer {
  margin-bottom: 75px;
}
#AxisSvg {
  position: absolute;
}
#rectsContainer {
  cursor: grab;
}
#rectsContainer:active {
  cursor: grabbing;
}
</style>