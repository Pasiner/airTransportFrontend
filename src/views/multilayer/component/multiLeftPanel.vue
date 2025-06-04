<template>
  <div class="leftPanelBox">
    <div class="contentBox">
      <div class="btnBox">
        <el-button type="primary" class="add-network-btn" @click="dialogVisible = true">请点击此处添加网络</el-button>
      </div>
      <el-table
          :data="tableData"
          ref="networkTableRef"
          height="calc(35vh - 10px)"
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

      <el-descriptions title="详细信息" class="network-details" :column="1" border v-loading="loading">
        <el-descriptions-item label="网络名称">{{ currentNetwork.name }}</el-descriptions-item>
        <el-descriptions-item label="年份">{{ networkDetail.time }}</el-descriptions-item>
        <el-descriptions-item label="网络类型">{{networkDetail.netType}}</el-descriptions-item>
        <el-descriptions-item label="节点数">{{ networkDetail.nodeCount }}</el-descriptions-item>
        <el-descriptions-item label="边数">{{ networkDetail.edgeCount }}</el-descriptions-item>
      </el-descriptions>

      <div class="titleBox">渲染信息</div>
      <el-card class="render-card" shadow="never">
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
    <el-dialog v-model="dialogVisible" title="选择数据" width="600" class="data-selection-dialog" @close="handleCancel">
        <div class="dialog-content">
          <div class="section">
            <div class="section-title">数据类型（多选）</div>
            <el-checkbox-group v-model="typeValue" class="checkbox-group">
            <!--国际关系（冲突）=0，国际关系（合作）=1，航空=2，国际贸易=3-->
              <el-checkbox label="国际关系冲突数据" value="0" border />
              <el-checkbox label="国际关系合作数据" value="1" border />
              <el-checkbox label="航空数据" value="2" border />
              <el-checkbox label="国际贸易数据" value="3" border />
            </el-checkbox-group>
          </div>
          <div class="choose-time">
            <span style="color:black;">请选择分析年份：</span>
            <el-date-picker
              v-model="timeValue"
              type="year"
              placeholder="Pick a year"
            />
          </div>
        </div>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="handleCancel">取消</el-button>
            <el-button type="primary" @click="sureAdd">确认</el-button>
          </div>
        </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, toRaw, nextTick, computed, reactive, toRefs, onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { querySampleData } from "@/api/homePage.js";
import { useStore } from "@/stores/index.js";
import {Cesium} from "mars3d";
const multipleTableRef = ref(null)
const networkTableRef = ref(null)

const props = defineProps(['addGraphics', 'toggleLayerVis'])
const store = useStore()
//起始和终止时间
let timeValue=ref([])
//0 冲突/1 合作 
let typeValue=ref([])
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
    //console.log(row)
    currentNetwork.value = row
    currentId = row.id
    // console.log("id")
    // console.log(id)
    const mapRow = store.getItem(row.id)
    // console.log("maprow")
    // console.log(mapRow)
    if (mapRow.sampledata && mapRow.sampledata.length < 1) {
      loading.value = true
      // console.log(row?.type)
      // console.log(row?.year)
      const resp = await querySampleData({type: row?.type, year: row?.year})
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
    networkDetail.time = mapRow.year

    setPickerColor(mapRow.graphicColor)
    setRenderProp(mapRow.renderProp)
}

// table checkbox 事件
const onSelect = (selection, row) => {
    selectedRows = selection

    // 检查当前行是否被选中
    let selected = selection.some(item => item.id === row.id)
    
    //从store当中根据选中行的id获取该行的数据
    const mapRow = store.getItem(row.id)

    if (mapRow.sampledata.length < 1) {
      //勾选的时候，如果还没有加载实际网络数据（querySampleData），会先加载网络数据，并添加进store
      handleRow(mapRow)
          .then(() => {
            // 只存储必要的渲染数据
            const renderData = {
              id: mapRow.id,
              sampledata: mapRow.sampledata,
              renderProp: mapRow.renderProp,
              graphicColor: mapRow.graphicColor
            }
            store.addItem(mapRow.id, renderData)
            props.toggleLayerVis(renderData, selected)
          })
    } else {
      props.toggleLayerVis(mapRow, selected)
    }
}



// 确认添加示例网络
// 添加只是把名称显示到左侧图层面板里

const sureAdd = () => {
  if (!timeValue.value || typeValue.value.length === 0) {
    ElMessage.warning('请选择数据类型和时间')
    return
  }

  dialogVisible.value = false

  // 清理旧的未选中数据
  const oldData = tableData.value.filter(item => !selectedRows.some(selected => selected.id === item.id))
  oldData.forEach(item => {
    store.removeItem(item.id)
  })

  for(var i=0; i<typeValue.value.length; i++){
    let name = ""
    if(typeValue.value[i] == 0){
      name = "国际关系（冲突）"
    }else if(typeValue.value[i] == 1){
      name = "国际关系（合作）"
    }else if(typeValue.value[i] == 2){
      name = "航空"
    }else if(typeValue.value[i] == 3){
      name = "国际贸易"
    }
    
    const year = timeValue.value.getFullYear();
    
    tableData.value.push({
      "id":i,
      "type":typeValue.value[i],
      "year":`${year}`,
      "name":`${year}`+" "+name,
    })
  }

  // 设置本地网络行选中状态
  nextTick(() => {
    selectedRows.forEach(row => {
      networkTableRef.value.toggleRowSelection(row, true)
    })
  })

  //将数据交给store管理
  store.setTabelData(tableData.value)

  // 前端维护示例网络map
  tableData.value.forEach(item => {
    const re = Cesium.Color.fromRandom({alpha: 0.6})
    if (!store.hasItem(item.id)) {
      // 只存储必要的初始数据
      const initialData = {
        id: item.id,
        sampledata: [],
        renderdata: [],
        renderProp: 0.01,
        graphicColor: [re.red, re.green, re.blue, re.alpha]
      }
      store.addItem(item.id, initialData)
    }
  })
  
  if (currentId == null) {
    handleRow(tableData.value[0])
  }

  //清空时间选择器里的值
  timeValue.value = null
}

// 添加取消按钮的处理函数
const handleCancel = () => {
  dialogVisible.value = false
  // 清空选择
  timeValue.value = null
  typeValue.value = []
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
      store.removeItem(id) // 从store中删除数据

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
  height: 100%;
  padding: 12px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;

  .contentBox {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow: hidden;

    .btnBox {
      flex-shrink: 0;
      text-align: center;
      margin-bottom: 0;

      .add-network-btn {
        width: 100%;
        height: 36px;
        font-size: 14px;
      }
    }

    .el-table {
      flex-shrink: 0;
    }

    .network-details {
      flex-shrink: 0;
      margin: 0 !important;
    }

    .titleBox {
      flex-shrink: 0;
      font-size: 14px;
      font-weight: bold;
      margin: 0;
    }

    .render-card {
      flex-shrink: 0;
      margin: 0;
    }
  }
}

:deep(.el-descriptions) {
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

.data-selection-dialog {
  :deep(.el-dialog) {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);

    .el-dialog__header {
      margin: 0;
      padding: 20px 30px;
      border-bottom: 1px solid #ebeef5;
      background-color: #f8f9fa;

      .el-dialog__title {
        font-size: 18px;
        font-weight: 600;
        color: #303133;
      }

      .el-dialog__headerbtn {
        top: 20px;
      }
    }

    .el-dialog__body {
      padding: 24px 30px;
    }

    .el-dialog__footer {
      padding: 16px 30px;
      border-top: 1px solid #ebeef5;
      background-color: #f8f9fa;
    }
  }

  .dialog-content {
    .section {
      margin-bottom: 24px;
      background-color: #fff;
      border-radius: 6px;
      padding: 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

      &:last-child {
        margin-bottom: 0;
      }

      .section-title {
        font-size: 15px;
        color: #303133;
        margin-bottom: 16px;
        font-weight: 500;
        display: flex;
        align-items: center;

        &::before {
          content: '';
          display: inline-block;
          width: 4px;
          height: 16px;
          background-color: #409eff;
          margin-right: 8px;
          border-radius: 2px;
        }
      }

      .checkbox-group {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;

        :deep(.el-checkbox) {
          width: 100%;
          margin-right: 0;
          transition: all 0.3s ease;
          
          .el-checkbox__input {
            .el-checkbox__inner {
              border-radius: 4px;
            }
          }
          
          .el-checkbox__label {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: #606266;
          }

          &:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          }

          &.is-checked {
            .el-checkbox__label {
              color: #409eff;
            }
          }
        }
      }

      .time-picker-wrapper {
        .time-picker {
          width: 100%;

          :deep(.el-input__wrapper) {
            box-shadow: 0 0 0 1px #dcdfe6 inset;
            
            &:hover {
              box-shadow: 0 0 0 1px #409eff inset;
            }
          }
        }
      }
    }
  }

  .dialog-footer {
    padding-top: 0;
    text-align: right;

    .el-button {
      padding: 8px 20px;
      font-weight: 500;
      border-radius: 4px;
      transition: all 0.3s ease;

      &--default {
        &:hover {
          color: #409eff;
          border-color: #c6e2ff;
          background-color: #ecf5ff;
        }
      }

      &--primary {
        &:hover {
          background-color: #66b1ff;
          border-color: #66b1ff;
        }
      }
    }
  }
}
</style>
