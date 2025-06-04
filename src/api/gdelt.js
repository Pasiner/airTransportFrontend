import request from '@/utils/request'
/**
 * 多层网络计算接口
 * @param {number} year - 年份
 * @param {string} ctype - 计算类型
 * @param {number[]} data - 整数数组数据
 * */
export function multilayerCalculate(year, ctype, data) {
    return request({
        url: '/multiCalculate',
        method: 'post',
        params: {
            year: year,
            ctype: ctype
        },
        data: data
    })
}