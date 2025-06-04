<template>
  <div class="mainMapBox" :id="mars3dContainerId" :key="mars3dContainerId">
  </div>
</template>

<script setup>
import {onMounted} from "vue";
import * as mars3d from "mars3d"
import {Cesium} from "mars3d";

const emits = defineEmits(['getMap']);
const props = defineProps({
  mars3dContainerId: {
    type: String,
    default: 'earthContainer'
  }
});

const initMap = () => {
  const map = new mars3d.Map(props.mars3dContainerId, {
    scene: {
      // center: { lat: 30.054604, lng: 108.885436, alt: 17036414, heading: 0, pitch: -90 },
      showSkyAtmosphere: false, // 关闭球周边的白色轮廓 map.scene.skyAtmosphere = false
      fog: true,
      fxaa: true,
      globe: {
        depthTestAgainstTerrain: false,
        baseColor: "#546a53"
      },
      cameraController: {
        zoomFactor: 3.0,
        minimumZoomDistance: 1,
        maximumZoomDistance: 50000000,
        enableRotate: true,
        enableZoom: true
      },
      mapProjection: mars3d.CRS.EPSG3857, // 2D下展示墨卡托投影
      mapMode2D: Cesium.MapMode2D.INFINITE_SCROLL// 2D下左右一直可以滚动重复世界地图
    },
    basemaps: [
      {
        "pid": 10,
        "name": "TianDiMap",
        "icon": "/img/basemaps/tdt_img.png",
        "type": "group",
        "layers": [
          { "name": "底图", "type": "tdt", "layer": "img_d" },
          { "name": "注记", "type": "tdt", "layer": "img_z" }
        ],
        "show": true
      }
    ]
  })

  emits('getMap',map)
}

onMounted(() => {
  initMap()
})

</script>

<style lang="scss" scoped>
.mainMapBox {
  height: 100vh;

  .container {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
  }
}
</style>
