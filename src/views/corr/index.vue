<template>
    <div class="corrBox flex_box flex_between">
        <div class="leftMap mapBox">
          <main-map
              mars3dContainerId="leftEarthContainer"
              ref="LEarthRef"
              @getMap="getLeftEarth"
          />
        </div>

        <div class="middleBox">

            <div class="titleBox">
                <div>相关性分析</div>
                <span>航空网络和国际网络分析</span>
            </div>

            <el-select v-model="year" placeholder="选择年份" @change="onChange">
                <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>

            <div class="contentBox">
                <div class="title" style="margin-bottom:8px;margin-top:15px;">网络相似性</div>
                <SmilarChart />
                <div class="title" style="margin-bottom:15px;margin-top:8px;">网络节点相似性</div>
                <el-table height='30vh' :data="tableData" border>
                    <el-table-column label="网络名称" prop="name" :show-overflow-tooltip="true" />
                    <el-table-column label="sim" prop="sim" />
                </el-table>
            </div>


        </div>
        <div class="rightMap mapBox">
          <main-map
              mars3dContainerId="rightEarthContainer"
              ref="REarthRef"
              @getMap="getRightEarth"
          />
        </div>

    </div>
</template>
<script setup>
import SmilarChart from './component/SmilarChart.vue'
import {onMounted, ref} from 'vue';
import MainMap from "@/views/homePage/component/mainMap.vue";
import {country2epsg4978, querySampleData} from "@/api/homePage.js";
import * as mars3d from "mars3d";

const LEarth = ref(null)
const getLeftEarth = (map) => {
  LEarth.value = map
}

const REarth = ref(null)
const getRightEarth = (map) => {
  REarth.value = map
}

//只要这里把网络数据请求改成现在的就大功告成啦！
//可以这里换一个接口函数，从原来的表里请求
//关联分析还用三种数据放一起的表，单独的应用工程各自有表
onMounted(async () => {
  init(LEarth.value, 1)
  init(REarth.value, 3)
  console.log("挂载完毕")
  console.log(year.value)
  getTableData(year.value)
})

const init = async (earth, type) => {
  //换句话说就是把这个改了    
  const earthResp = await querySampleData({type: type, year: year.value})
  addGraphics(earth, earthResp.data.rows)
}

const options = [{
  value: '2013',
  label: '2013',
}, {
  value: '2016',
  label: '2016',
}, {
  value: '2019',
  label: '2019',
}, {
  value: '2022',
  label: '2022',
}]
const tableData = ref([])
const year = ref(2013)

const addGraphics = async (earth, data) => {

  const resp = await country2epsg4978(data)

  const layerId = `layer-earth`
  const lineLayer = earth.getLayerById(layerId)
  if (lineLayer) {
    lineLayer.remove()
  }

  const graphicLayer = new mars3d.layer.GraphicLayer({id: layerId})
  earth.addLayer(graphicLayer)

  const renderCount = (resp.data.length * 0.01) - 1
  const renderData = resp.data.slice(0, renderCount)
  const arrData = []

  renderData.forEach((item, index) => {
    const positions = mars3d.PolyUtil.getLinkedPointList(item.startPoint, item.endPoint, 5000, 30)

    arrData.push({
      positions,
      style: {
        width: 2.0,
        materialType: mars3d.MaterialType.LineDotDash,
        materialOptions: {
          color: mars3d.Cesium.Color.fromRandom({alpha: 0.6}),
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

const onChange = () => {
  init(REarth.value, 1)
  init(LEarth.value, 3)

  getTableData()
}

const getTableData = async () => {
  // console.log("开始请求相似性结果")
  //为什么存放数据的文件夹明明是datasim，这里却要用static啊
  const resp = await fetch(`/static/${year.value}comatrix.json`)
  tableData.value = await resp.json()
  // console.log(tableData.value)
}
</script>
<style lang="scss" scoped>
.corrBox {
    position: relative;

    .mapBox {
        width: 50%;
        height: 100vh;
        background: url('../../assets/images/homepage/ban_4.png') no-repeat center;
        background-size: cover;
    }

    .middleBox {
        padding: 15px;
        position: absolute;
        top: 70px;
        height: calc(100vh - 100px);
        border-radius: 10px;
        background: rgba(255, 255,255, 0.8);
        width: 360px;
        left: calc(50% - 195px);
        z-index: 99;

        >.titleBox {
            text-align: center;
            margin-bottom: 15px;

            >div {
                font-size: 19px;
                font-family: "OPPOSans-M";
            }

            >span {
                color: #909399;
                font-size: 14px;
                letter-spacing: 1px;
            }

        }

        .contentBox {
            height: calc(100% - 100px);
            overflow-y: auto;

            >.title {
                font-size: 16px;
                text-align: center;
                font-family: '时尚中黑简体';
            }

            >.chartBox {
                height: 440px;
            }
        }


    }
}
</style>
