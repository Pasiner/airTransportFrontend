<template>
  <div class="rightPanelBox">
    <div class="titleBox" style="margin-top:25px;">派生信息</div>
    <el-form label-width="auto" :model="formInfo" :rules="rules" ref="ruleFormRef">
      <el-form-item label="选择网络" prop="net">
        <el-select placeholder="请选择" style="width: 240px" v-model="formInfo.net">
          <el-option v-for="item in netData" :key="'net_' + item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="分析算法" prop="ctype">
        <el-select v-model="formInfo.ctype" placeholder="请选择" style="width: 240px">
          <el-option-group v-for="group in calOptions" :key="group.label" :label="group.label">
            <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
          </el-option-group>
        </el-select>
      </el-form-item>
      <el-form-item label="计算参数" prop="isWeight" v-if="isDcOrBc">
        <el-select v-model="formInfo.isWeight" style="width: 240px">
          <el-option v-for="item in diffOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
    </el-form>
    <div class="btnBox">
      <el-button type="primary" @click="submitForm">执行</el-button>
    </div>

    <el-table v-loading="resultLoading" :data="tableData" max-height="60vh" @selection-change="handleSelectionChange" @select="onSelect">
      <el-table-column type="selection" width="55" />
      <el-table-column prop="name" label="计算值" :show-overflow-tooltip="true" min-width="100" />
      <el-table-column label="操作" width="140" align="center">
        <template #default="scope">
          <div class="opreateBox">
            <span class="red" @click="onDelete(scope.row,scope.$index)">删除</span>
            <span class="blue" @click="seeTable(scope.row)">表格</span>
            <span class="green" @click="seeChart(scope.row)">统计</span>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 表格展示弹窗 -->
    <el-dialog v-model="dialogTableVisible" title="计算结果" width="500" @open="onTableDialogOpen">
      <el-table :data="resultTable" max-height="45vh">
        <el-table-column prop="node" label="节点" :show-overflow-tooltip="true" min-width="100" />
        <el-table-column prop="value" label="计算值" :show-overflow-tooltip="true" min-width="100" />
      </el-table>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="exportTable">导出</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 统计弹窗 -->
    <el-dialog v-model="dialogChartVisible" title="计算结果" width="800" @open="onChartDialogOpen">
      <div id="chart" style="width: 800px; height: 400px;"></div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import * as echarts from 'echarts'
import { calculate } from "@/api/homePage.js";
import { useStore } from "@/stores/index.js";
import { ElMessageBox } from 'element-plus'
const props = defineProps(['map', 'toggleCircleLayerVis'])

const store = useStore()
const ruleFormRef = ref()

const tableData = ref([])

const netData = computed(() => {
  return store.tabelData
})

const isDcOrBc = computed(() => {
  return formInfo.ctype === 'dc' || formInfo.ctype === 'bc' || formInfo.ctype === 'pageRank'
})

let resultLoading = ref(false)

const calOptions = [
  {
    label: '网络测度',
    options: [
      {
        value: 'dc',
        label: '度中心性',
      },
      {
        value: 'pageRank',
        label: 'PageRank中心性',
      },
      {
        value: 'bc',
        label: '介数中心性',
      },
    ],
  },
  {
    label: '社区划分',
    options: [
      {
        value: 'fastnewman',
        label: 'Fast-Newman社区划分算法',
      },
    ],
  },
]
const calMap = new Map([
  ['dc', '度中心性'],
  ['pageRank', 'PageRank中心性'],
  ['bc', '介数中心性'],
  ['fastnewman', 'Fast-Newman社区划分算法']
])

const rules = {
  net: [{ required: true, message: '请选择网络', trigger: 'change' }],
  ctype: [{ required: true, message: '请选择算法', trigger: 'change' }],
  isWeight: [{ required: true, message: '请选择计算参数', trigger: 'change' }]
}

const resultTable = ref([])
const chartData = ref([]) // 表格数据

const diffOptions = [{
  label: '加权',
  value: true
}, {
  label: '无权',
  value: false
}]

const formInfo = reactive({
  net: null,
  ctype: '',
  isWeight: false
})

const multipleSelection = ref([]) // 勾选控制图层

const dialogTableVisible = ref(false) //表格弹窗显隐
const dialogChartVisible = ref(false) //图表弹窗显隐

const currentRow = ref(null) // 当前选中行

const handleSelectionChange = (val) => {
  multipleSelection.value = val
}

const onSelect = (selection, row) => {
  let selected = selection.length && selection.indexOf(row) !== -1
  props.toggleCircleLayerVis(row, selected)
}

const submitForm = () => {
  // console.log('net', formInfo.net)
  console.log("formInfo")
  console.log(formInfo)
  const mapRow = store.getItem(formInfo.net)

  ruleFormRef.value.validate(valid => {
    if (valid) {
      resultLoading.value = true
      console.log("RightPanel的mapRow.sampleData")
      console.log(mapRow.sampledata)
      calculate({
        isWeight: formInfo.isWeight,
        ctype: formInfo.ctype,
        inputs: mapRow.sampledata
      })
          .then(resp => {
            console.log("pageRank计算结果")
            console.log(resp.data)
            tableData.value.push({name: `${calMap.get(formInfo.ctype)}-result`, data: resp.data})
          })
          .finally(() => {
            resultLoading.value = false
      })
    }
  })
}

const seeTable = (row) => {
  dialogTableVisible.value = true
  currentRow.value = row
}

const onDelete = (row,index) => {

  props.toggleCircleLayerVis(row, false) // 隐藏图层
  tableData.value.splice(index, 1)
}

const onTableDialogOpen = () => {
  resultTable.value = currentRow.value.data
}

const onChartDialogOpen = () => {
  chartData.value = currentRow.value.data
  initChart()
}

const seeChart = (row) => {
  dialogChartVisible.value = true
  currentRow.value = row
}

const exportTable = () => {
  console.log(currentRow);
  let csvContent = "data:text/csv;charset=utf-8,"
      + convertToCSV(resultTable.value);

  let encodedUri = encodeURI(csvContent);
  let link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${currentRow.value.name}.csv`);
  document.body.appendChild(link); // Required for FF

  link.click();
}

const convertToCSV = (data) => {
  const rows = data.map(item => `${item.node},${item.value}`);
  return 'node,value\n' + rows.join('\n');
}


const initChart = () => {
  const myChart = echarts.init(document.getElementById('chart'))
  myChart && myChart.clear();

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    // color: ["#6C63F0", "#3AACFF", "#ED589D", "#FB466C", "#B750BE"],
    // legend: {
    //     top: 5,
    //     itemWidth: 12,
    //     itemHeight: 8,
    // },
    grid: {
      left: "20px",
      right: "50px",
      bottom: "10px",
      top: "40px",
      containLabel: true
    },
    xAxis: {
      type: 'category',
      axisTick: {
        show: false,
      },
      axisLine: {
        show: false,
      },
      // splitLine: {//分割线配置
      //     lineStyle: {
      //         color: "#bdbfc2",
      //         type: 'dashed'
      //     }
      // },
      data: chartData.value.sort((a, b) => b.value - a.value).slice(0, 20).map(x => x.node),
    },
    yAxis: {
      name: '计算值',
      axisTick: {
        show: false,
      },
      type: 'value',
    },
    series: [
      {
        name: '计算值',
        type: 'bar',
        // stack: 'total',
        barWidth: '20px',
        label: {
          show: true,
          position: 'top'
        },
        emphasis: {
          focus: 'series'
        },
        data: chartData.value.sort((a, b) => b.value - a.value).slice(0, 20).map(x => x.value),
      }
    ]
  };

  option && myChart.setOption(option);
  window.addEventListener("resize", () => {
    myChart.resize()
  })
}

</script>
<style lang="scss" scoped>
.rightPanelBox {
  padding: 20px 15px 0;

  .titleBox {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 15px;
  }

  .btnBox {
    text-align: right;
    margin-bottom: 10px;
  }

  .opreateBox {
    >span {
      display: inline-block;
      padding: 0 5px;
      cursor: pointer;
    }
  }

}
</style>
