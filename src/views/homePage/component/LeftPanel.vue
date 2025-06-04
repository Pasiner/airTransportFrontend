<template>
  <div class="leftPanelBox">
    <div class="contentBox">
      <div class="btnBox">
        <el-popover
            placement="top"
            :width="200"
            trigger="hover"
        >
          <template #reference>
            <el-upload class="inline-block mr-2.5" :show-file-list="false" accept=".csv"
                       :action="uploadFileUrl" :on-success="compeleteUp">
              <el-button type="primary" plain>上传本地网络</el-button>
            </el-upload>
          </template>
          点击
          <a :href='examplePath' download>此处</a>
          下载上传本地网络样例
        </el-popover>

        <el-button type="primary" @click="dialogVisible = true">添加网络</el-button>
      </div>
      <el-table
          :data="tableData"
          ref="networkTableRef"
          height="35vh"
          @row-click="handleRow"
          :highlight-current-row="true"
          @select="onSelect">
        <el-table-column type="selection" width="55" />
        <el-table-column label="网络名称" prop="name" :show-overflow-tooltip="true" min-width="100" />
        <el-table-column label="操作" width="136" align="center">
          <template #default="scope">
            <div>
              <el-button type="danger" @click.stop="deleteData(scope.row, scope.$index)" size="small">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-descriptions title="详细信息" style="margin-top:18px;" :column="1" border v-loading="loading">
        <el-descriptions-item label="网络名称">{{ currentNetwork.name }}</el-descriptions-item>
        <el-descriptions-item label="时间区间">{{ networkDetail.time }}</el-descriptions-item>
        <el-descriptions-item label="网络类型">{{networkDetail.netType}}</el-descriptions-item>
        <el-descriptions-item label="节点数">{{ networkDetail.nodeCount }}</el-descriptions-item>
        <el-descriptions-item label="边数">{{ networkDetail.edgeCount }}</el-descriptions-item>
      </el-descriptions>

      <div class="titleBox">渲染信息</div>
      <el-card style="max-width: 480px" shadow="never">
        <!--    @submit.prevent 阻止按下 Enter （回车键）提交表单    -->
        <el-form label-width="auto" @submit.prevent label-position="left">

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
    <!-- 添加示例网络弹窗 -->
    <!--要修改的就是这个弹窗，把它从固定网络变成选择起始和终止时间-->
    <!--再把起始和终止时间连同其他信息一起封装进sampleData里-->
    <el-dialog v-model="dialogVisible" title="选择时间段" width="400">
        <!-- <el-table :data="sampleData" height="45vh" @selection-change="handleSelectionChange" ref="multipleTableRef">
          <el-table-column type="selection" width="55" />
          <el-table-column prop="name" label="网络名称" :show-overflow-tooltip="true" min-width="100" />
        </el-table> -->
        <div class="choose-type">
          <el-radio-group v-model="typeValue">
            <el-radio value="0" size="large">GDELT冲突网络</el-radio>
            <el-radio value="1" size="large">GDELT合作网络</el-radio>
          </el-radio-group>
        </div>
        <div class="choose-time">
          <span class="time-picker"></span>
          <el-date-picker
            v-model="timeValue"
            type="daterange"
            range-separator="至"
            start-placeholder="起始时间"
            end-placeholder="终止时间"
            size="large"
          />
        <!-- <el-date-picker
          v-model="timeValue"
          type="month"
          placeholder="Pick a month"
        /> -->
        </div>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="sureAdd">确认</el-button>
          </div>
        </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, toRaw, nextTick, computed, reactive, toRefs, onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import { querySampleData } from "@/api/homePage.js";
import { useStore } from "@/stores/index.js";
import {Cesium} from "mars3d";
const multipleTableRef = ref(null)
const networkTableRef = ref(null)
const uploadFileUrl = ref(import.meta.env.VITE_APP_BASE_API + "/upload-csv"); // 上传文件服务器地址
const examplePath = import.meta.env.VITE_APP_STATIC + 'example.csv';

const props = defineProps(['addGraphics', 'toggleLayerVis'])
const store = useStore()
//起始和终止时间
let timeValue=ref([])
//0 冲突/1 合作 
let typeValue=ref()
// 表格数据
const tableData = ref([])
let currentNetwork = ref({}) // 当前选中行

let currentId = null //当前选中的id
let selectedRows = [] // 本地存储选中的id

// 详细信息
const networkDetail = reactive({
  nodeCount: '',
  edgeCount: '',
  netType: '',
  time:''
})

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

// 弹出窗口里用户勾选的示例网络
//格式和SampleData一样，就是SampleData里的部分或全部数据
let multipleSelection = []

// 本地网络数据
let localData = []

const dialogVisible = ref(false)
const loading = ref(false)

//点击table中的行时，对该行执行handleRow
const handleRow = async (row) => {
    if (row.id === currentId) {
      return
    }

    networkTableRef.value.setCurrentRow(row)

    networkDetail.nodeCount = ''
    networkDetail.edgeCount = ''
    networkDetail.netType=''
    networkDetail.time=''

    currentNetwork.value = row
    currentId = row.id
    // console.log("id")
    // console.log(id)
    const mapRow = store.getItem(row.id)
    // console.log("maprow")
    // console.log(mapRow)
    if (mapRow.sampledata && mapRow.sampledata.length < 1) {
      loading.value = true
      const resp = await querySampleData({type: row?.type, begin: row?.begin, end: row?.end, filePath: row?.path})
      loading.value = false
      const respData = resp.data

      // 维护示例网络map
      mapRow.sampledata = respData.rows
      mapRow.nodeCount = respData.nodeCount
      mapRow.edgeCount = respData.edgeCount
   
      store.addItem(row.id, mapRow);
    }

    networkDetail.nodeCount = mapRow.nodeCount
    networkDetail.edgeCount = mapRow.edgeCount
    networkDetail.netType = "单元流"
    networkDetail.time = mapRow.begin+'至'+mapRow.end

    setPickerColor(mapRow.graphicColor)
    setRenderProp(mapRow.renderProp)
}

// table checkbox 事件
const onSelect = (selection, row) => {
    selectedRows = selection

    let selected = selection.length && selection.indexOf(row) !== -1
//从store当中根据选中行的id获取该行的数据
    const mapRow = store.getItem(row.id)
    // console.log("当前网络的id")
    // console.log(row.id)
    // console.log("通过id当前本地网络数据")
    // console.log(mapRow.sampledata)
    // console.log("selected")
    // console.log(selected)
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

// const handleSelectionChange = (row) => {
//   multipleSelection = toRaw(row)
// }

// const onDialogOpen = () => {
  //  反选  没生效  toggleRowSelection
  // sampleData.forEach(item => {
  //   const flag = multipleSelection.some(ele => ele.id === item.id)
  //   if (flag) {
  //     multipleTableRef.value.toggleRowSelection(item, true)
  //   } else {
  //     multipleTableRef.value.toggleRowSelection(item, false)
  //   }
  // })
// }


// 确认添加示例网络
// 添加只是把名称显示到左侧图层面板里
let id=0
const sureAdd = () => {
  // console.log(timeValue)
  // console.log(type(timeValue))
  dialogVisible.value = false
  //将刚添加的若干示例网络信息与上传的本地网络信息拼接在一起
  //tableData是要显示在左侧图层面板的数据

  //使用时间选择器，没有handleSelection这个函数，怎么处理multiplSelection的问题？即怎么获得网络的id，type，beginTime,endTime，并放到一个对象multipleSelection里
  //在什么时机获得
  id=id+1
  let name=null

  if(typeValue.value==0){
    name = "冲突网络"
  }
  else{
    name = "合作网络"
  }
  // tableData.value = multipleSelection.concat(localData)
  const beginYear = timeValue.value[0].getFullYear();
  const beginMonth = String(timeValue.value[0].getMonth() + 1).padStart(2, '0');
  const beginDay = String(timeValue.value[0].getDate()).padStart(2, '0');
  const endYear = timeValue.value[1].getFullYear();
  const endMonth = String(timeValue.value[1].getMonth() + 1).padStart(2, '0');
  const endDay = String(timeValue.value[1].getDate()).padStart(2, '0');
  //把timeValue的值转换成YYYY-MM-DD的形式
  // console.log(`${beginYear}-${beginMonth}-${beginDay}`)
  // console.log(`${endYear}-${endMonth}-${endDay}`)
  tableData.value.push({
    "id":id,
    "type":typeValue,
    "begin":`${beginYear}-${beginMonth}-${beginDay}`,
    "end":`${endYear}-${endMonth}-${endDay}`,
    "name":name+id.toString(),
  })


  // 设置本地网络行选中状态
  nextTick(() => {
    selectedRows.forEach(row => {
      networkTableRef.value.toggleRowSelection(row, true)
    })
  })

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
      console.log("将item放进store了")
      store.addItem(item.id, item)
      console.log(item.id)
      console.log(store.getItem(item.id))
    }
  })

  if (currentId == null) {
    handleRow(tableData.value[0])
  }

  //清空时间选择器里的值
  timeValue=ref([])
}

const deleteData = (row, index) => {
  ElMessageBox.confirm(
    '是否确认继续执行删除操作？',
    '提示',
    {
      confirmButtonText: '是',
      cancelButtonText: '否',
      type: 'warning',
    }
  )
    .then(() => {
      const id = row.id
      props.toggleLayerVis(row, false) // 隐藏图层
      tableData.value.splice(index, 1)

      // multipleSelection = multipleSelection.filter(item => item.id !== id)
      localData = localData.filter(item => item.id !== id)
      if (id == currentId && tableData.value.length > 0) {
        handleRow(tableData.value[0])
      } else if (tableData.value.length === 0) {
        networkDetail.nodeCount = ''
        networkDetail.edgeCount = ''
        currentNetwork.value = {}
        currentId = null
      }
    })
    .catch(() => {
    })
}

const compeleteUp = (res) => {
  let item = {
    name: res.data.filename.split('.csv')[0],
    path: res.data.path,
    id: new Date().getTime()
  }
  localData.push(item)

  if (!store.hasItem(item.id)) {
    const re = Cesium.Color.fromRandom({alpha: 0.6})
    item.sampledata = []
    item.renderdata = []
    item.renderProp = 0.01
    item.graphicColor = [re.red, re.green, re.blue, re.alpha]
    store.addItem(item.id, item)
    console.log("将上传的本地数据放进store了")
    console.log(item)
  }

  tableData.value.push(item)
  store.setTabelData(tableData.value)
  console.log("本地网络的currentId")
  console.log(currentId)
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
</script>
<style lang="scss" scoped>
.leftPanelBox {
  padding: 20px 15px 0px;
  height: calc(100% - 20px);

  >.contentBox {
    overflow-y: auto;
    height: calc(100% - 20px);

    .btnBox {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 16px;
      gap: 8px;
      width: 100%;

      .el-upload {
        width: 48%;
        display: block;
        
        :deep(.el-button) {
          width: 100%;
          min-width: 120px;
          padding: 8px 20px;
          box-sizing: border-box;
          white-space: nowrap;
        }
      }

      .el-button {
        width: 48%;
        min-width: 120px;
        padding: 8px 20px;
        box-sizing: border-box;
        white-space: nowrap;
      }
    }

    .titleBox {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 15px;
      margin-top: 18px;
    }

    :deep(.el-descriptions) {
      width: 100%;
      margin: 0 !important;

      .el-descriptions__header {
        margin-bottom: 12px;
      }

      .el-descriptions__body {
        .el-descriptions__table {
          .el-descriptions__cell {
            padding: 8px 12px;
          }

          .el-descriptions__label {
            width: 100px;
            color: #606266;
            font-weight: normal;
          }

          .el-descriptions__content {
            color: #303133;
          }
        }
      }
    }
  }
}
</style>
