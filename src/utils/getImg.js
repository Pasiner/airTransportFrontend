export function getImg(name) {
    let url = new URL(`/${name}`, window.location.href).href
    return url
}