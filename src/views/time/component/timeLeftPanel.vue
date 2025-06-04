<template>
  <div class="leftPanelBox">
    <div class="contentBox">
      <div class="timeChoose">
        <span class="demonstration" style="color:grey;">请选择分析年份：</span>
        <el-date-picker
          v-model="timeValue"
          type="year"
          placeholder="Pick a year"
          @change="sureAdd"
        />
      </div>
      <!-- 添加统计按钮 -->
      <el-button 
        type="primary" 
        style="margin-bottom: 15px;"
        @click="showChart">
        查看事件数变化
      </el-button>
      <el-table
          :data="tableData"
          ref="networkTableRef"
          height="50vh"
          @row-click="handleRow"
          :highlight-current-row="true"
          @select="onSelect">
        <el-table-column type="selection" width="55" />
        <el-table-column label="月份" prop="name" :show-overflow-tooltip="true" min-width="100" />
        <el-table-column label="与上月对比" width="136" >
          <template #default="scope">
            <div class="opreateBox">
              <el-button text type="warning" size="small" @click="showNodeStrength(scope.row)">节点强度</el-button>
              <el-button text type="success" size="small">边强度</el-button>              
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="titleBox">渲染信息</div>
      <el-card style="width: 100%; margin-bottom: 10px;" shadow="never">
        <!--    @submit.prevent 阻止按下 Enter （回车键）提交表单    -->
        <el-form label-width="auto" @submit.prevent label-position="left" size="small">
          <el-form-item>
            <template #label>
              <div class="flex items-center">
                <span>渲染比例</span>
                <el-popover
                    placement="top"
                    :width="200"
                    trigger="hover"
                >
                  <template #reference>
                    <el-icon :size="18" ><QuestionFilled /></el-icon>
                  </template>
                  渲染比例为控制基础网络数据在图上的显示条数，如数据量较少，请适当增大比例数值，调整范围[0.01~1]
                </el-popover>
              </div>
            </template>
            <el-input-number v-model="formInfo.num" :min="0.01" :step="0.01" :max="1" @change="handleChange" />
          </el-form-item>

          <el-form-item label="渲染颜色">
            <el-color-picker color-format="rgb" :show-alpha="true" @change="changeColor"
              v-model="formInfo.color"></el-color-picker>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
    <!-- 当年各月事件数差值 -->
    <div 
      v-show="dialogChartVisible"
      class="custom-dialog"
      :style="{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        width: '800px',
        background: '#fff',
        borderRadius: '4px',
        boxShadow: '0 2px 12px 0 rgba(0,0,0,.1)',
        zIndex: 2000
      }"
    >
      <!-- 标题栏 -->
      <div class="dialog-header">
        <span>年度统计</span>
        <el-icon 
          class="close-icon" 
          @click="dialogChartVisible = false"
        >
          <Close />
        </el-icon>
      </div>
      <!-- 图表容器 -->
      <div id="chart" style="width: 800px; height: 400px;"></div>
    </div>

    <!-- 节点强度变化图表 -->
    <div 
      v-show="dialogNodeStrengthVisible"
      class="custom-dialog"
      :style="{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        width: '800px',
        background: '#fff',
        borderRadius: '4px',
        boxShadow: '0 2px 12px 0 rgba(0,0,0,.1)',
        zIndex: 2000
      }"
    >
      <!-- 标题栏 -->
      <div class="dialog-header">
        <span>节点强度变化</span>
        <el-icon 
          class="close-icon" 
          @click="dialogNodeStrengthVisible = false"
        >
          <Close />
        </el-icon>
      </div>
      <!-- 图表容器 -->
      <div id="nodeStrengthChart" style="width: 800px; height: 400px;"></div>
    </div>

  </div>
</template>
<script setup>
import { ref, toRaw, nextTick, computed, reactive, toRefs, onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import { querySampleData,queryEventDiff, queryNodeEdgeDiff } from "@/api/homePage.js";
import { useStore } from "@/stores/index.js";
import {Cesium} from "mars3d";
import * as echarts from 'echarts'
import { calculate } from "@/api/homePage.js";
import { Close } from '@element-plus/icons-vue'
const multipleTableRef = ref(null)
const networkTableRef = ref(null)
const uploadFileUrl = ref(import.meta.env.VITE_APP_BASE_API + "/upload-csv"); // 上传文件服务器地址
const examplePath = import.meta.env.VITE_APP_STATIC + 'example.csv';

const props = defineProps(['addGraphics', 'toggleLayerVis'])
const store = useStore()
//选择年份
let timeValue=ref()

// 表格数据
const tableData = ref([])
let currentNetwork = ref({}) // 当前选中行

let currentId = null //当前选中的id
let selectedRows = [] // 本地存储选中的id

//控制年统计图窗口
let dialogChartVisible = ref(false)

// 控制节点强度图窗口
let dialogNodeStrengthVisible = ref(false)

const formInfo = reactive({
  num: 0.01,
  color: ''
})

const setPickerColor = (color) => {
  formInfo.color = `rgba(${color.map((x, index) => index === 3 ? x : Math.round(x * 255)).join(', ')})`
}

const setRenderProp = (prop) => {
  formInfo.num = prop
}



const loading = ref(false)

//点击table中的行时，对该行执行handleRow
const handleRow = async (row) => {
    if (row.id === currentId) {
      return
    }

    networkTableRef.value.setCurrentRow(row)

    currentNetwork.value = row
    currentId = row.id

    const mapRow = store.getItem(row.id)

    if (mapRow.sampledata && mapRow.sampledata.length < 1) {
      loading.value = true
      let year = timeValue.value.getFullYear();
      const resp = await querySampleData({type: row?.type, begin: row?.begin, end: row?.end, filePath: row?.path})
      loading.value = false
      const respData = resp.data
      // 维护示例网络map
      mapRow.sampledata = respData.rows   
      store.addItem(row.id, mapRow);

    }
  

    setPickerColor(mapRow.graphicColor)
    setRenderProp(mapRow.renderProp)
}

// table checkbox 事件
const onSelect = (selection, row) => {
    selectedRows = selection

    let selected = selection.length && selection.indexOf(row) !== -1
//从store当中根据选中行的id获取该行的数据
    const mapRow = store.getItem(row.id)
    if (mapRow.sampledata.length < 1) {
      //勾选的时候，如果还没有加载实际网络数据（querySampleData），会先加载网络数据，并添加进store
      handleRow(mapRow)
          .then(() => {
            props.toggleLayerVis(mapRow, selected)
          })
    } else {
      props.toggleLayerVis(mapRow, selected)
    }
}


// 确认添加示例网络
// 添加只是把名称显示到左侧图层面板里
let id=0

const sureAdd = () => {
  if(tableData.value!=null) tableData.value = [];
  let year = timeValue.value.getFullYear();
  let beginDay = "01";
  let endDay = "31";

for(var i=1;i<=12;i++){
  let month = String(i).padStart(2,'0');
  id=id+1;
  tableData.value.push({
    "id":id,
    "type":0,
    "begin":`${year}-${month}-${beginDay}`,
    "end":`${year}-${month}-${endDay}`,
    "name":year+'-'+month,
  })
}


  //将数据交给store管理
  store.setTabelData(tableData.value)

  // 前端维护示例网络map
  //存放进store.tablMap的没有网络的实际数据，这一步还没请求网络数据
  //放进去的是key:id，data:SampleData的那些+样式
  tableData.value.forEach(item => {
    const re = Cesium.Color.fromRandom({alpha: 0.6})
    if (!store.hasItem(item.id)) {
      item.sampledata = []
      item.renderdata = []
      item.renderProp = 0.01
      item.graphicColor = [re.red, re.green, re.blue, re.alpha]
      store.addItem(item.id, item)

    }
  })

  if (currentId == null) {
    handleRow(tableData.value[0])

  }

}


// 改变渲染比例
const handleChange = (val) => {
  const mapRow = getMapRow()
  if (mapRow) {
    mapRow.renderProp = val
    store.addItem(currentId, mapRow)
    if (selectedRows.length > 0 && selectedRows.some(item => item.id === mapRow.id)) {
      props.addGraphics(mapRow) // 重新渲染
    }
  }
}

// 改变颜色
const changeColor = (val) => {
  const rgbaArray = val.replace(/[rgba()]/g, '')
    .split(',')
    .map((x, index) => index < 3 ? parseFloat((parseFloat(x) / 255).toFixed(2)) : x);

  const mapRow = getMapRow()
  mapRow.graphicColor = rgbaArray
  store.addItem(currentId, mapRow)

  props.addGraphics(mapRow) // 重新渲染
}

// 获取当前选中行对应的map行
const getMapRow = () => {
  return store.getItem(currentId)
}

let chartData=ref([])

// 显示图表
const showChart = async () => {
  dialogChartVisible.value = true
  // 等待 DOM 更新完成
  await nextTick()
  // 初始化图表
  const year = timeValue.value.getFullYear()
  try {
    const resp = await queryEventDiff({year: year})
    chartData.value = resp.data
    initChart()
  } catch(error) {
    console.error("获取事件数差值失败",error)
  }
}

const initChart = () => {
  const myChart = echarts.init(document.getElementById('chart'))
  myChart && myChart.clear();
  // const labelRight = {
  //   position: 'right'
  // };
  console.log(chartData.value.rows)
  const option = {
    title: {
    text: '各月冲突事件数变化',
    left: 'center'
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  grid: {
    top: 80,
    bottom: 30,
    left: 100
  },
  xAxis: {
    type: 'value',
    position: 'top',
    splitLine: {
      lineStyle: {
        type: 'dashed'
      }
    }
  },
  yAxis: {
    type: 'category',
    axisLine: { show: true },
    axisLabel: { show: true },
    axisTick: { show: true },
    splitLine: { show: true },
    data: [
      '1月-2月',
      '2月-3月',
      '3月-4月',
      '4月-5月',
      '5月-6月',
      '6月-7月',
      '7月-8月',
      '8月-9月',
      '9月-10月',
      '10月-11月',
      '11月-12月'
    ]
  },
  series: [
    {
      name: '事件数差值',
      type: 'bar',
      stack: 'Total',
      label: {
        show: true,
        position: 'right',
        formatter: '{c}'
      },
      data: chartData.value.rows.map(value=>{
        return{
          value: value,
          label: value < 0 ? {position: 'left'} : {position: 'right'}
        }
      })
    }
  ]
};

option && myChart.setOption(option);

  // 添加窗口大小改变时的自适应
  window.addEventListener("resize", () => {
    myChart.resize()
  })
}

// 显示节点强度图表
const showNodeStrength = async (row) => {
  dialogNodeStrengthVisible.value = true
  // 等待 DOM 更新完成
  await nextTick()
  
  try {
    console.log(row.name)
    const resp = await queryNodeEdgeDiff({     
      time: row.name,
      type: 'node'
    })
    initNodeStrengthChart(resp.data)
  } catch(error) {
    console.error("获取节点强度差值失败", error)
  }
}

const initNodeStrengthChart = (data) => {
  const myChart = echarts.init(document.getElementById('nodeStrengthChart'))
  myChart && myChart.clear();
  console.log(typeof(data))
  console.log(data)
  // 生成排名数据
  const scatterData = data.rows.map((item, index) => [index + 1, item[1]])
  const countryNames = data.rows.map(item => item[0])

  const option = {
    title: {
      text: '节点强度变化排名',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        const index = params.dataIndex
        return `国家: ${countryNames[index]}<br/>排名: ${params.value[0]}<br/>变化量: ${params.value[1]}`
      }
    },
    xAxis: {
      name: '排名',
      type: 'value'
    },
    yAxis: {
      name: '节点强度变化量',
      type: 'value'
    },
    series: [{
      type: 'scatter',
      data: scatterData,
      symbolSize: 10,
    }]
  }

  option && myChart.setOption(option)

  // 添加窗口大小改变时的自适应
  window.addEventListener("resize", () => {
    myChart.resize()
  })
}
</script>
<style lang="scss">
.custom-dialog {
  .dialog-header {
    padding: 20px;
    border-bottom: 1px solid #e4e4e4;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
    
    span {
      font-size: 16px;
      font-weight: 500;
      color: #303133;
    }
    
    .close-icon {
      cursor: pointer;
      font-size: 20px;
      color: #909399;
      transition: color 0.2s;
      
      &:hover {
        color: #303133;
      }
    }
  }
  
  #chart {
    padding: 20px;
    width: 100%;
    box-sizing: border-box;
  }
}

.leftPanelBox {
  padding: 20px 15px 0px;
  height: calc(100% - 20px);
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;

  >.contentBox {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    width: 100%;
    box-sizing: border-box;
    gap: 10px;

    .timeChoose {
      text-align: center;
      width: 100%;
      box-sizing: border-box;

      .el-date-picker {
        width: 100%;
        max-width: 200px;
      }
    }

    .titleBox {
      font-size: 16px;
      font-weight: bold;
      width: 100%;
      box-sizing: border-box;
    }
    
    .opreateBox {
      width: 100%;
      box-sizing: border-box;
      display: flex;
      justify-content: space-between;
      
      .el-button {
        width: 48%;
        padding: 0;
        text-align: center;
      }
    }

    .el-table {
      width: 100%;
      box-sizing: border-box;
      flex: 1;
    }

    .el-card {
      width: 100%;
      box-sizing: border-box;
    }

    .el-button {
      width: 100%;
      box-sizing: border-box;
    }
  }
}

.render-card {
  .el-form {
    .el-form-item {
      .el-form-item__label {
        padding-right: 8px;
      }

      .el-input-number {
        width: 120px;
      }

      .el-color-picker {
        .el-color-picker__trigger {
          border-radius: 4px;
        }
      }
    }
  }
}
</style>
