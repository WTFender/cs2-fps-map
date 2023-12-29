<template>
  <ol-map
    :loadTilesWhileAnimating="true"
    :loadTilesWhileInteracting="true"
    style="height: 512px;"
  >
    <ol-view
      ref="view"
      :center="center"
      :rotation="rotation"
      :zoom="zoom"
      :projection="projection"
    />
    <ol-image-layer>
      <ol-source-image-static
        :url="imgUrl"
        :imageSize="size"
        :imageExtent="extent"
        :projection="projection"
      ></ol-source-image-static>
    </ol-image-layer>

    <ol-vector-layer>
      <ol-source-vector>
        <ol-feature v-for="(l, idx) in logs" :key="`line-${idx}`">
          <ol-geom-line-string
            :coordinates="[l.pos_px, logs[idx > 0 ? idx - 1 : idx].pos_px]"
            style="display: none"
          ></ol-geom-line-string>
          <ol-style-flowline
            :color="getColor(l.smooth_fps / highFps)"
            :color2="
              getColor(logs[idx > 0 ? idx - 1 : idx].smooth_fps / highFps)
            "
            :width="3"
            :width2="3"
          />
        </ol-feature>
        <ol-feature
          v-for="(l, idx) in logs"
          :key="`point-${idx}`"
        >
          <ol-geom-point :coordinates="l.pos_px"></ol-geom-point>
          <ol-style>
            <ol-style-circle :radius="10">
              <ol-style-fill
                :color="getColor(l.smooth_fps / highFps)"
              ></ol-style-fill>
              <ol-style-stroke :color="getColor(l.smooth_fps / highFps)" :width="2"></ol-style-stroke>
              <ol-style-text
                :stroke="{ color: '#000', width: 2 }"
                fill="#fff"
                scale="1.5"
                offsetX="-20"
                offsetY="-20"
                :text="`${l.smooth_fps}`"
              ></ol-style-text>
            </ol-style-circle>
          </ol-style>
        </ol-feature>
      </ol-source-vector>
    </ol-vector-layer>
    <ol-interaction-select
      :condition="hoverCondition"
      :filter="selectInteractionFilter"
    >
      <ol-style>
        <ol-style-circle :radius="5">
          <ol-style-fill :color="'red'"></ol-style-fill>
          <ol-style-stroke color="black" :width="2"></ol-style-stroke>
          <ol-style-text
            :stroke="{ color: '#000', width: 2 }"
            fill="#fff"
            scale="1.5"
            offsetX="-20"
            offsetY="-20"
            :text="`Click to Select`"
          ></ol-style-text>
        </ol-style-circle>
      </ol-style>
    </ol-interaction-select>
    <ol-interaction-select
      @select="featureSelected"
      :condition="clickCondition"
      :filter="selectInteractionFilter"
    >
      <ol-style>
        <ol-style-circle :radius="5">
          <ol-style-fill :color="'red'"></ol-style-fill>
          <ol-style-stroke color="black" :width="2"></ol-style-stroke>
          <ol-style-text
            :stroke="{ color: '#000', width: 2 }"
            fill="#fff"
            scale="1.5"
            offsetX="-20"
            offsetY="-20"
          ></ol-style-text>
        </ol-style-circle>
      </ol-style>
    </ol-interaction-select>
  </ol-map>
  <br />
  <div>
    <select name="maps" id="maps" style="margin-right: 1rem;" @change="setMap()" v-model="map">
      <option v-for="k in Object.keys(maps)" :key="k">{{ k }}</option>
    </select>
    <button type="button" @click="uploadLogs()">Upload Logs</button>
  </div>
  <input
    ref="fileUpload"
    id="fileUpload"
    type="file"
    hidden
    @change="setLogs()"
  />
  <div>
    <Diff
      :theme="isDarkMode ? 'dark' : 'light'"
      mode="unified"
      language="json"
      :prev="JSON.stringify(stats, null, 2)"
      :current="JSON.stringify(stats, null, 2)"
      :virtual-scroll="{ height: 180, lineMinHeight: 24, delay: 100 }"
      style="margin-top: 1rem; width: 49%; float: left;"
    />    <Diff
      :theme="isDarkMode ? 'dark' : 'light'"
      mode="unified"
      language="json"
      :prev="JSON.stringify(statsSelection, null, 2)"
      :current="JSON.stringify(statsSelection, null, 2)"
      :virtual-scroll="{ height: 180, lineMinHeight: 24, delay: 100 }"
      style="margin-top: 1rem; width: 49%; float: right;"
    />
    <Diff
      :theme="isDarkMode ? 'dark' : 'light'"
      mode="unified"
      language="json"
      :prev="JSON.stringify(logs, null, 2)"
      :current="JSON.stringify(logs, null, 2)"
      :virtual-scroll="{ height: 360, lineMinHeight: 24, delay: 100 }"
      style="margin-top: 1rem; width: 49%; float: left;"
    /><Diff
      :theme="isDarkMode ? 'dark' : 'light'"
      mode="unified"
      language="json"
      :prev="JSON.stringify(selection, null, 2)"
      :current="JSON.stringify(selection, null, 2)"
      :virtual-scroll="{ height: 360, lineMinHeight: 24, delay: 100 }"
      style="margin-top: 1rem; width: 49%; float: right;"
    />

  </div>
</template>

<script>
import { ref, reactive, inject } from "vue";
export default {
  name: "App",
  created() {
    this.selectConditions = inject("ol-selectconditions");
    this.hoverCondition = this.selectConditions.pointerMove;
    this.clickCondition = this.selectConditions.pointerClick;

    this.zoom = ref(1);
    this.rotation = 0;
    this.size = [1024, 1024];
    this.center = [this.size[0] / 2, this.size[1] / 2];
    this.extent = [0, 0, ...this.size];
    this.projection = reactive({
      code: "de_dust2",
      units: "pixels",
      extent: this.extent,
    });
  },
  data() {
    return {
      highFps: 500,
      selection: [],
      path: ref([[0, 0]]),
      stats: {},
      map: "de_dust2",
      imgUrl: "/maps/de_dust2_radar_psd.png",
      maps: {
        cs_italy: {
          x: -2647,
          y: 2592,
          scale: 4.6,
        },
        cs_office: {
          x: -1838,
          y: 1838,
          scale: 4.1,
        },
        de_ancient: {
          x: -2953,
          y: 2164,
          scale: 5,
        },
        de_anubis: {
          x: -2796,
          y: 3328,
          scale: 5.22,
        },
        de_dust2: {
          x: -2476,
          y: 3239,
          scale: 4.4,
        },
        de_inferno: {
          x: -2087,
          y: 3870,
          scale: 4.9,
        },
        de_mirage: {
          x: -3230,
          y: 1713,
          scale: 5,
        },
        de_nuke: {
          x: -3453,
          y: 2887,
          scale: 7,
        },
        de_nuke_lower: {
          x: -3453,
          y: 2887,
          scale: 7,
        },
        de_overpass: {
          x: -4831,
          y: 1781,
          scale: 5.2,
        },
        de_vertigo: {
          x: -3168,
          y: 1762,
          scale: 4.0
        },
        de_vertigo_lower: {
          x: -3168,
          y: 1762,
          scale: 4.0
        },
      },
      expectedHeaders: [
        "Time",
        "Player 1 Position",
        "Smooth FPS",
        "Frame FPS",
        "Smooth MS",
        "Frame MS",
        "Server Frame MS",
      ],
      logs: [
        { pos_px: [367, 120], smooth_fps: 347 },
        { pos_px: [450, 104], smooth_fps: 261 },
        { pos_px: [642, 118], smooth_fps: 242 },
        { pos_px: [479, 416], smooth_fps: 503 },
        { pos_px: [480, 487], smooth_fps: 322 },
        { pos_px: [642, 822], smooth_fps: 447 },
        { pos_px: [621, 851], smooth_fps: 317 },
        { pos_px: [444, 781], smooth_fps: 217 },
        { pos_px: [261, 896], smooth_fps: 117 },
        { pos_px: [160, 739], smooth_fps: 147 },
        { pos_px: [110, 586], smooth_fps: 311 },
      ],
      coord: {
        radius: ref(4),
        strokeWidth: ref(1),
        coordinate: ref([1000, 1024]),
      },
    };
  },
  computed: {
    statsSelection() {
      return {
        avgFps: parseInt(
          this.selection.reduce((a, b) => a + b.smooth_fps, 0) /
            this.selection.length
        ),
        maxFps: parseInt(
          Math.max(...this.selection.map((l) => l.smooth_fps))
        ),
        minFps: parseInt(
          Math.min(...this.selection.map((l) => l.smooth_fps))
        ),
        totalPoints: this.selection.length,
        uniquePoint: this.selection.length,
      };
    },
    isDarkMode() {
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        return true;
      }
      return false;
    },
  },
  methods: {
    setMap() {
      const map = this.maps[document.getElementById("maps").value];
      console.log(map)
    },
    featureSelected(event) {
      const logs = [];
      event.selected.forEach((feature) => {
        const coords = feature.values_.geometry.flatCoordinates;
        this.logs.map((log) => {
          if (log.pos_px[0] === coords[0] && log.pos_px[1] === coords[1]) {
            logs.push(log);
          }
        });
      });
      this.selection = logs;
    },
    selectInteractionFilter(feature) {
      return feature.getGeometry().getType() === "Point";
    },
    getColor(value) {
      value = 1 - value;
      var hue = ((1 - value) * 120).toString(10);
      return ["hsl(", hue, ",100%,50%,35%)"].join("");
    },
    scaleCoords(pos) {
      const map = this.maps[this.map];
      const x = parseInt(Math.abs((parseInt(pos.x) - map.x) / map.scale));
      const y = parseInt(
        1024 - Math.abs(-(parseInt(pos.y) - map.y) / map.scale)
      );
      return [x, y];
    },
    uniqueCoords() {
      /*
              avgFps: parseInt(
          this.selection.reduce((a, b) => a + b.smooth_fps, 0) /
            this.selection.length
        ),
        maxFps: parseInt(
          Math.max(...this.selection.map((l) => l.smooth_fps))
        ),
        minFps: parseInt(
          Math.min(...this.selection.map((l) => l.smooth_fps))
        ),
        totalPoints: this.selection.length,
        uniquePoint: this.selection.length,
      */
      const uniqueCoords = Object.values(
        this.logs.reduce((p, v) => {
          const old = p[v.pos_px];
          if (!old) p[v.pos_px] = { ...v, count: 1 };
          else p[v.pos_px].count++;
          return p;
        }, {})
      );
      uniqueCoords.map((item) => {
        item.smooth_fps = parseInt(item.smooth_fps / item.count);
        item.frame_fps = parseInt(item.frame_fps / item.count);
        item.smooth_ms = parseInt(item.smooth_ms / item.count);
        item.frame_ms = parseInt(item.frame_ms / item.count);
        item.server_frame_ms = parseInt(item.server_frame_ms / item.count);
      });
      return uniqueCoords
    },
    uploadLogs() {
      document.getElementById("fileUpload").click();
    },
    setLogs() {
      const v = this;
      const csv = this.$refs.fileUpload.files[0];
      this.$papa.parse(csv, {
        dynamicTyping: true,
        header: true,
        transformHeader: (hdr, idx) => {
          if (hdr === this.expectedHeaders[idx]) {
            return hdr.toLowerCase().replace(/ /g, "_");
          } else {
            throw new Error(
              `Expected CSV field header '${this.expectedHeaders[idx]}' at index ${idx}, received ${hdr} instead.`
            );
          }
        },
        skipEmptyLines: true,
        complete: function (results, file) {
          var errs = results.errors.map((item) => item.row);
          const logs = results.data.filter(function (val, idx) {
            return errs.indexOf(idx) == -1;
          });
          logs.map((item) => {
            /*
              "setpos 521.00 -934.00 284.00 ; setang 14.00 130.00 0.00"
              "setpos 258.16 2480.55 -121.08 ; setang 0.00 -67.50 0.00"
            */
            const tmp = item.player_1_position
              .replace("setpos ", "")
              .replace("; setang ", "")
              .split(" ");
            item.pos = {
              x: tmp[0],
              y: tmp[1],
              z: tmp[2],
            };
            item.ang = {
              x: tmp[3],
              y: tmp[4],
              z: tmp[5],
            };
            item.pos_px = v.scaleCoords(item.pos);
            delete item.player_1_position;
          });
          v.logs = logs;
          console.log("Parsing complete:", results, file);
          console.log(v.logs);
        },
        error: function (err, file) {
          alert(err);
          console.log(file);
        },
      });
    },
  },
  watch: {
    map: {
      handler: function () {
        this.imgUrl = `/maps/${this.map}_radar_psd.png`;
        console.log(this.map)
      }
    },
    logs: {
      handler: function () {
        var fps = this.logs.map((l) => l.smooth_fps);
        console.log(fps);
        var avg_fps = fps.reduce((a, b) => a + b) / fps.length;
        this.stats = {
          avgFps: parseInt(avg_fps),
          maxFps: parseInt(Math.max(...fps)),
          minFps: parseInt(Math.min(...fps)),
          totalPoints: this.logs.length,
          uniquePoint: this.uniqueCoords().length,
        };
        this.path = this.uniqueCoords().map((l) => l.pos_px);
        //this.path = this.logs.map((l) => l.pos_px);
        console.log(this.stats);
      },
    },
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
  margin-top: 60px;
}
</style>
