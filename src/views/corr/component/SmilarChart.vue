<template>
    <div>
        <div id="chart1" class="chartsBox"></div>
        <div id="chart2" class="chartsBox"></div>
        <div id="chart3" class="chartsBox"></div>
    </div>

</template>
<script setup>
import { defineProps, nextTick, onMounted, watch } from "vue";
import * as echarts from 'echarts'
import {similarity, similarity2, similarity3} from "@/api/homePage.js";

const initChart = (id, title, data) => {
    let chart = echarts.init(document.getElementById(id))
    chart && chart.clear()

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                crossStyle: {
                    color: '#999',
                }
            },

            borderColor: '#1071cd',
            backgroundColor: 'rgba(7,67,113,0.35)',
            axisPointer: {
                // 坐标轴指示器，坐标轴触发有效
                type: 'shadow' // 默认为直线，可选为：'line' | 'shadow'
            },
            textStyle: {
                color: '#fff'
            }
        },
        title: {
            text: title, // 主标题文本
            left: 'center', // 标题水平位置
            textStyle: { // 主标题样式
                color: '#019fa0',
                fontSize: 14
            }
        },
        grid: {
            top: '28',
            left: '0',
            right: '10',
            bottom: '10',
            containLabel: true
        },
        xAxis: [
            {
                type: 'category',
                data: ['2013', '2016', '2019', '2022'],
                alignTicks: true
            }
        ],
        yAxis: [
            {
                type: 'value',
                splitLine: {
                    lineStyle: {
                        color: 'rgb(81,82,89,0.25)',
                        type: 'dashed'
                    }
                },
            },
        ],
        series: [
            {
                name: '日完成率',
                type: 'line',
                smooth: true,
                symbol: 'none',
                color: '#72FFF7',
                data: data
            }
        ]
    }
    chart.setOption(option)

    window.addEventListener('resize', () => {
        chart && chart.resize()
    })
}



onMounted(async () => {
  const topChartData =  await similarity()
  const midChartData =  await similarity2()
  const bottomChartData =  await similarity3()

  initChart('chart1', '结构相似性演化分析', topChartData.data.map(item => item.similarity))
  initChart('chart2', '相似性演化分析', midChartData.data.map(item => item.similarity))
  initChart('chart3', '信息论相似性演化分析', bottomChartData.data.map(item => item.similarity))
})

</script>
<style lang="scss" scoped>
.chartsBox {
    height: 168px;
}
</style>
