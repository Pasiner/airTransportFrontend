import request from '@/utils/request'
//request拦截器
/**
 * 获取示例数据
 * */
export function querySampleData(params) {
    // console.log("params")
    // console.log(params)
   return request({
        url: '/sampleData/list',
        method: 'get',
        params
    })
}
/**
 * 获取当年各月事件数差值
 */
export function queryEventDiff(params){
    return request({
        url: '/gdelt/queryEventDiff',
        method: 'get',
        params
    })
}

/**
 * 获取指定年份月份节点强度和边强度差值统计
 */
export function queryNodeEdgeDiff(params){
    return request({
        url: '/gdelt/queryNodeEdgeDiff',
        method: 'get',
        params
    })
}

/**
 * 计算接口
 * */
export function calculate(data) {
    return request({
        url: '/calculate',
        method: 'post',
        data: data
    })
}

/**
 * 根据城市code添加centroid
 * */
export function country2epsg4978(data) {
    return request({
        url: '/get-epsg4978-by-country',
        method: 'post',
        data: data
    })
}

/**
 * 根据城市code添加centroid
 * */
export function country2epsg4326(data) {
    return request({
        url: '/get-epsg4326-by-country',
        method: 'post',
        data: data
    })
}

/**
 * similarity
 * */
export function similarity(data) {
    return request({
        url: '/similarity',
        method: 'get',
        data: data
    })
}

/**
 * similarity
 * */
export function similarity2(data) {
    return request({
        url: '/similarity2',
        method: 'get',
        data: data
    })
}

/**
 * similarity
 * */
export function similarity3(data) {
    return request({
        url: '/similarity3',
        method: 'get',
        data: data
    })
}
