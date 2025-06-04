titleBox
<template>
  <div class="homePageBox">
    <div class="panel panel_left" :style="{ left: leftPanel ? '0' : '-380px' }">
      <LeftPanel
          :toggleLayerVis="toggleLayerVis"
          :addGraphics="addGraphics"
      />
    </div>
    <img class="iconBox" :style="{ left: leftPanel ? '380px' : '0' }" @click="leftPanel = !leftPanel"
         :src="leftPanel ? l_in : l_out">
    <MainMap
        @getMap="getMap"
    />
    <div class="panel panel_right" :style="{ right: rightPanel ? '0' : '-380px' }">
      <RightPanel
          :map="d3map"
          :toggleCircleLayerVis="toggleCircleLayerVis"
      />
    </div>
    <img class="iconBox" :style="{ right: rightPanel ? '380px' : '0' }" @click="rightPanel = !rightPanel"
         :src="rightPanel ? r_in : r_out">
  </div>
</template>
<script setup name="HomePage">
import {ref, watch} from 'vue'
import l_in from '@/assets/images/homepage/l_in.png'
import l_out from '@/assets/images/homepage/l_out.png'
import r_in from '@/assets/images/homepage/r_in.png'
import r_out from '@/assets/images/homepage/r_out.png'
import MainMap from './component/mainMap.vue'
import LeftPanel from './component/multiLeftPanel.vue'
import RightPanel from './component/multiRightPanel.vue'
import {country2epsg4326, country2epsg4978} from "@/api/homePage.js";
import * as mars3d from "mars3d";
import {Cesium} from "mars3d";
import {useStore} from "@/stores";

const leftPanel = ref(true)
const rightPanel = ref(true)

const store = useStore()

const d3map = ref(null)
const getMap = (map) => {
  d3map.value = map
}

const addGraphics = async (networkObj) => {
  if (networkObj.renderdata.length < 1) {
    const resp = await country2epsg4978(networkObj.sampledata)
    networkObj.renderdata = resp.data
  }

  const layerId = `layer-${networkObj.id}`
  const lineLayer = d3map.value.getLayerById(layerId)
  if (lineLayer) {
    d3map.value.removeLayer(lineLayer)
  }

  const graphicLayer = new mars3d.layer.GraphicLayer({id: layerId})
  d3map.value.addLayer(graphicLayer)

  const renderCount = (networkObj.renderdata.length * networkObj.renderProp) - 1
  const renderData = networkObj.renderdata.slice(0, renderCount)
  const arrData = []

  const [r, g, b, a] = networkObj.graphicColor
  renderData.forEach((item, index) => {
    const positions = mars3d.PolyUtil.getLinkedPointList(item.startPoint, item.endPoint, 5000, 30)

    arrData.push({
      positions,
      style: {
        width: 2.0,
        materialType: mars3d.MaterialType.LineDotDash,
        materialOptions: {
          color: new Cesium.Color(r, g, b, a)
        }
      },
      attr: item
    })
  })

  // 多个线对象的合并渲染。
  const graphic = new mars3d.graphic.PolylineCombine({
    instances: arrData
  })
  graphicLayer.addGraphic(graphic)
}

// 设置图层显隐
const toggleLayerVis = (networkObj, show) => {
  const lineLayer = d3map.value.getLayerById(`layer-${networkObj.id}`)
  if (lineLayer) {
    lineLayer.show = show
  } else {
    addGraphics(networkObj)
  }
}

const addResultGraphic = async (result, layerId) => {
  const resp = await country2epsg4326(result.data)
  const showData = resp.data

  const lineLayer = d3map.value.getLayerById(layerId)
  if (lineLayer) {
    d3map.value.removeLayer(lineLayer)
  }

  const graphicLayer = new mars3d.layer.GraphicLayer({id: layerId})
  d3map.value.addLayer(graphicLayer)

  const arrData = []
  let maxVal = Math.max(...showData.map(item => parseFloat(item.value)));
  resp.data.forEach((item, i) => {
    const position = item.position
    const radius = item.value / maxVal
    arrData.push({
      position,
      style: {
        radius: radius * 300000,
        color: Cesium.Color.fromRandom({alpha: 0.6}),
      }
    })
  })

  // 多个矢量对象的合并渲染。
  const graphic = new mars3d.graphic.CircleCombine({
    instances: arrData,
  })
  graphicLayer.addGraphic(graphic)
}

// 设置图层显隐
const toggleCircleLayerVis = (resultObj, show) => {
  const layerId = `layer-circle-${resultObj.name}`
  const lineLayer = d3map.value.getLayerById(layerId)
  if (lineLayer) {
    lineLayer.show = show
  } else {
    addResultGraphic(resultObj, layerId)
  }
}
</script>
<style lang="scss" scoped>
.homePageBox {
  position: relative;
  overflow: hidden;

  .panel {
    transition: all 0.5s;
    overflow: hidden;
    position: absolute;
    background: #fff;
    top: 80px;
    height: calc(100vh - 110px);
    width: 380px;
    z-index: 99;

    &.panel_left {
      border-radius: 0 10px 10px 0;
    }

    &.panel_right {
      border-radius: 10px 0 0 10px;
    }
  }

  .iconBox {
    position: absolute;
    top: 44vh;
    cursor: pointer;
    transition: all 0.5s;
    z-index: 99;
  }
}
</style>
