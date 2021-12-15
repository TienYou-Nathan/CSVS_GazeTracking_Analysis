<template>
  <div id="svgcontainer"></div>
</template>

<script>
import * as d3 from "d3";
import * as d3scale from "d3-scale";
import * as d3axis from "d3-axis";

function sortByTimestamp(a, b) {
  if (a.Timestamp < b.Timestamp) return -1;
  if (a.Timestamp > b.Timestamp) return 1;
  return 0;
}
class Blacklist {
  state = "creating";
  constructor(start, index, rectY, yratio, xratio, rectsContainer, blacklists) {
    this._startX = start;
    this._endX = start + 1;
    this.objectIndex = index;
    this.xRatio = xratio;
    this.blacklists = blacklists;
    this.rectsContainer = rectsContainer;
    this.domObject = rectsContainer
      .append("rect")
      .attr("x", start)
      .attr("y", rectY)
      .attr("height", yratio)
      .attr("width", 1)
      .attr("fill", "red")
      .attr("fill-opacity", "0.1")
      .attr("class", "blacklist")
      .attr("stroke", "black")
      .attr("stroke-width", "1px");
  }

  remove() {
    this.domObject.remove();
  }
  set startX(val) {
    this.domObject.attr("x", val);
    this.domObject.attr("width", this._endX - val);
    this._startX = val;
  }
  get startX() {
    return this._startX;
  }
  get endX() {
    return this._endX;
  }
  get width() {
    return this._endX - this.startX;
  }
  set endX(val) {
    this.domObject.attr("width", val - this._startX);
    this._endX = val;
  }
  get Timestamp() {
    return this.startX * this.xRatio * 1000;
  }
  get Duration() {
    console.log(
      this.Timestamp + (this.endX - this.startX) * this.xRatio * 1000
    );
    return (this.endX - this.startX) * this.xRatio * 1000;
  }
}

export default {
  name: "DataVisualizer",
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
      blacklists: [],
      draggingBlacklist: null,
    };
  },
  computed: {
    fovData() {
      return this.$store.state.fovData;
    },
    fovDataByObject() {
      return this.$store.getters.fovDataByObject;
    },
    gazeData() {
      return this.$store.state.gazeData;
    },
    gazeDataByObject() {
      return this.$store.getters.gazeDataByObject;
    },
    dataObjects() {
      return this.$store.getters.dataObjects;
    },

    containerWidth() {
      return this.width - this.margin.left - this.margin.right;
    },
    containerHeight() {
      return this.height - this.margin.top - this.margin.bottom;
    },
    maxTimestamp() {
      return Math.max(
        d3.max(this.gazeData, (e) => e.Timestamp + e.Duration),
        d3.max(this.fovData, (e) => e.Timestamp + e.Duration)
      );
    },
    xRatio() {
      return this.containerWidth / this.maxTimestamp;
    },
    yRatio() {
      return this.containerHeight / this.dataObjects.length;
    },
    xZoom() {
      return this.currentWidth / this.containerWidth;
    },
  },
  watch: {
    dataObjects() {
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
      if (this.currentOffset - xoffset * this.xZoom < 0) {
        this.currentOffset = 0;
      } else if (
        this.currentOffset - xoffset * this.xZoom + this.currentWidth >
        this.containerWidth
      ) {
        this.currentOffset = this.containerWidth - this.currentWidth;
      } else {
        this.currentOffset -= xoffset * this.xZoom;
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
    createBlacklist(x, y) {
      //check if blacklist already exists
      let existing = this.blacklists[y]?.find(
        (e) => e.startX < x && e.endX > x
      );
      if (existing) return;

      this.draggingBlacklist = new Blacklist(
        x,
        y,
        this.yScale(y),
        this.yRatio,
        this.xRatio,
        this.rectsContainer,
        this.blacklists
      );

      if (!this.blacklists[y]) this.blacklists[y] = [];
      this.blacklists[y].push(this.draggingBlacklist);
      this.rectsContainer.node().style.cursor = "col-resize";
    },
    drawBlacklist(position, offset) {
      if (offset == 0) return;
      if (!this.draggingBlacklist) return;
      let occlusion = this.blacklists[this.draggingBlacklist.objectIndex].find(
        (e) =>
          this.draggingBlacklist != e &&
          position <= e.endX &&
          e.startX <= position
      );
      if (
        (position < this.draggingBlacklist.startX && offset < 0) ||
        (position < this.draggingBlacklist.endX && offset > 0)
      ) {
        occlusion =
          this.blacklists[this.draggingBlacklist.objectIndex]
            .filter(
              (e) => position < e.startX && this.draggingBlacklist.endX > e.endX
            )
            .sort(sortByTimestamp)
            .at(-1) || occlusion;
        if (occlusion) {
          return (this.draggingBlacklist.startX = occlusion.endX);
        }
        return (this.draggingBlacklist.startX = position);
      }
      occlusion =
        this.blacklists[this.draggingBlacklist.objectIndex]
          .filter(
            (e) => this.draggingBlacklist.startX < e.startX && position > e.endX
          )
          .sort(sortByTimestamp)[0] || occlusion;

      if (occlusion) {
        return (this.draggingBlacklist.endX = occlusion.startX);
      }
      return (this.draggingBlacklist.endX = position);
    },
    moveBlacklist(position, offset) {
      if (offset == 0) return;
      offset *= this.xZoom;
      if (
        !(
          offset > 0 &&
          position >
            this.draggingBlacklist.startX + this.draggingBlacklist.width / 2
        ) &&
        !(
          offset < 0 &&
          position <
            this.draggingBlacklist.startX + this.draggingBlacklist.width / 2
        )
      )
        return;

      //If rect is too left
      if (this.draggingBlacklist.startX + offset < 0) {
        this.draggingBlacklist.endX -= this.draggingBlacklist.startX;
        this.draggingBlacklist.startX = 0;
        return;
      }
      //If rect is too right
      if (this.draggingBlacklist.endX + offset >= this.containerWidth) {
        this.draggingBlacklist.startX =
          this.containerWidth - this.draggingBlacklist.width;
        this.draggingBlacklist.endX = this.containerWidth;
        return;
      }
      let occlusion;
      //occlusion detection
      if (offset > 0) {
        occlusion = this.blacklists[this.draggingBlacklist.objectIndex].find(
          (e) =>
            this.draggingBlacklist != e &&
            this.draggingBlacklist.endX + offset <= e.endX &&
            e.startX <= this.draggingBlacklist.endX + offset
        );
        if (occlusion) {
          this.draggingBlacklist.startX =
            occlusion.startX - this.draggingBlacklist.width;
          this.draggingBlacklist.endX = occlusion.startX;
          return;
        }
      } else {
        occlusion = this.blacklists[this.draggingBlacklist.objectIndex].find(
          (e) =>
            this.draggingBlacklist != e &&
            this.draggingBlacklist.startX + offset <= e.endX &&
            e.startX <= this.draggingBlacklist.startX + offset
        );
        if (occlusion) {
          this.draggingBlacklist.endX =
            occlusion.endX + this.draggingBlacklist.width;
          this.draggingBlacklist.startX = occlusion.endX;
          return;
        }
      }

      this.draggingBlacklist.startX += offset;
      this.draggingBlacklist.endX += offset;
    },
    finishDrawBlacklist() {
      if (!this.draggingBlacklist) return;
      if (this.draggingBlacklist.width < 2) {
        this.draggingBlacklist.remove();
      }
      this.draggingBlacklist.state = "created";
      delete this.draggingBlacklist;
      this.draggingBlacklist = null;
      this.rectsContainer.node().style.cursor = null;
      this.$store.commit(
        "setBlacklist",
        this.blacklists.reduce((acc, value, index) => {
          acc[this.dataObjects[index]] = value;
          return acc;
        }, {})
      );

      setTimeout(() => {
        this.drawSVG();
      }, 10);
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
      if (e.buttons == 0) return;
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

      if (e.buttons == 1) {
        return this.scroll(e.movementX);
      }
      if (e.buttons == 2) {
        if (this.draggingBlacklist?.state == "creating") {
          return this.drawBlacklist(
            (e.clientX - offset.left) * this.xZoom + this.currentOffset,
            e.movementX
          );
        }
        if (this.draggingBlacklist?.state == "moving") {
          // return this.moveBlacklist(
          //   (e.clientX - offset.left) * this.xZoom + this.currentOffset,
          //   e.movementX
          // );
        }
      }
    },
    handleClick(e) {
      if (e.buttons != 2) return;
      const offset = this.rectsContainer.node().getBoundingClientRect();
      let mouseX = this.currentOffset + (e.clientX - offset.left) * this.xZoom;
      let mouseY = Math.floor((e.clientY - offset.top) / this.yRatio);
      let target = this.blacklists[mouseY]?.find(
        (e) => e.startX < mouseX && e.endX > mouseX
      );
      if (target) {
        target.state = "moving";
        return (this.draggingBlacklist = target);
      }
      // this.createBlacklist(mouseX, mouseY);
    },
    handleRelease(e) {
      if (e.button != 2) return;
      this.finishDrawBlacklist();
    },
    drawSVG() {
      this.setViewBox(this.currentOffset, this.currentWidth);
      this.setYScale(0, this.dataObjects.length);

      this.rectsContainer.on("wheel", this.handleScroll);
      this.rectsContainer.on("mousemove", this.handleDrag);
      this.rectsContainer.on("mousedown", this.handleClick);
      this.rectsContainer.on("mouseup", this.handleRelease);
      this.rectsContainer.on("contextmenu", (e) => e.preventDefault());
      //FovRects
      this.rectsContainer
        .selectAll("rect.fov")
        .remove()
        .data(this.fovData)
        .enter()
        .append("rect")
        .attr("x", (d) => this.xScale(d.Timestamp))
        .attr(
          "y",
          (d) =>
            this.yScale(this.dataObjects.indexOf(d.Name) + 0.5) -
            this.rectheight / 2
        )
        .attr("height", this.rectheight)
        .attr(
          "width",
          (d) =>
            this.xScale(d.Timestamp + d.Duration) - this.xScale(d.Timestamp)
        )
        .attr("fill", (d) => d.color ?? "lightgray")
        .attr("class", "fov");

      //GazeRects
      this.rectsContainer
        .selectAll("rect.gaze")
        .remove()
        .attr("id", "gazeData")
        .data(this.gazeData)
        .enter()
        .append("rect")
        .attr("x", (d) => this.xScale(d.Timestamp))
        .attr(
          "y",
          (d) =>
            this.yScale(this.dataObjects.indexOf(d.Name) + 0.5) -
            this.rectheight / 2
        )
        .attr("height", this.rectheight)
        .attr(
          "width",
          (d) =>
            this.xScale(d.Timestamp + d.Duration) - this.xScale(d.Timestamp)
        )
        .attr("fill", (d) => d.color ?? "black")
        .attr("class", "gaze");

      //Add Lines
      this.rectsContainer
        .selectAll("line")
        .data(this.dataObjects)
        .enter()
        .append("line")
        .attr("x1", 0)
        .attr("x2", this.containerWidth)
        .attr("y1", (e) => this.yScale(this.dataObjects.indexOf(e)))
        .attr("y2", (e) => this.yScale(this.dataObjects.indexOf(e)))
        .attr("stroke", "black");
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