<template>
    <div class="titleBox" :class="{ 'bgc': fixedNav }">
        <div class="titleLeft">
            地理多元流网络挖掘与分析平台
            <!-- <img :src="logoPic" />
            <img :src="titlePic" /> -->
        </div>

        <div class="tabBox flex_box flex_center">
            <div class="nav-item">
                <div :class="{ 'active': route.name === '' || route.name === 'homePage' }" @click="$router.push('/')">基础分析</div>
            </div>

            <div v-for="item in nav" :key="item.path" class="nav-item" 
                 @mouseenter="handleMouseEnter(item)" 
                 @mouseleave="handleMouseLeave(item)">
                <div :class="{ 'active': item.path === route.name }" 
                     @click="handleMenuClick(item)">
                    {{ item.name }}
                </div>
                <div class="dropdown-menu" v-show="item.showDropdown">
                    <div v-for="child in item.children" :key="child.path" 
                         @click="handleMenuClick(child)"
                         :class="{ 'active': child.path === route.name }">
                        {{ child.name }}
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
import logoPic from '@/assets/images/homepage/logo.png'
import titlePic from '@/assets/images/homepage/title.png'
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const fixedNav = ref(false);
const route = useRoute();
const router = useRouter();

const nav = ref([
    {
        name: '国际关系网络',
        path: 'international',
        showDropdown: false,
        children: [
            {
                name: '冲突网络时序分析',
                path: 'time'
            },
            {
                name: '多层网络分析',
                path: 'multilayer'
            }
        ]
    },
    {
        name: '国际贸易网络',
        path: 'trade',
        showDropdown: false,
        isDeveloped: false
    },
    {
        name: '人口移动网络',
        path: 'population',
        showDropdown: false,
        isDeveloped: false,
        children: [
            {
                name: '相关性分析',
                path: 'corr'
            }
        ]
    },
    {
        name: '航空网络',
        path: 'aviation',
        showDropdown: false
    }
]);

const handleMouseEnter = (item) => {
    if (item.children) {
        item.showDropdown = true;
    }
};

const handleMouseLeave = (item) => {
    if (item.children) {
        item.showDropdown = false;
    }
};

const handleMenuClick = (item) => {
    if (item.isDeveloped === false) {
        ElMessage({
            message: '功能尚未开放',
            type: 'info',
            duration: 2000
        });
        return;
    }
    
    router.push('/' + item.path);
};

function getScrollHeight() {
    const scrollPx = document.documentElement.scrollTop || document.body.scrollTop || window.pageYOffset;
    if (scrollPx >= 60) {
        fixedNav.value = true
    } else {
        fixedNav.value = false
    }
}

onMounted(() => {
    window.addEventListener("scroll", getScrollHeight);
})

</script>

<style scoped lang="scss">
.titleBox {

    position: fixed;
    z-index: 99;
    left: 0;
    right: 0;
    top: 0;
    height: 70px;
    background-image: linear-gradient(rgba(0, 58, 111, 0.8), rgba(0, 58, 111, 0));

    &.bgc {
        background-image: none;
        background: #132a89;
    }

    .titleLeft {
        line-height:70px;
        padding-left:30px;
        font-size:28px;
        color:#fff;
        font-family: 'PangMenZhengDao';
        letter-spacing: 2px;

        // padding-top: 10px;
        // padding-left: 30px;

        // >img {
        //     height: 55px;

        //     +img {
        //         margin-left: 10px;
        //     }
        // }
    }

    .tabBox {
        position: absolute;
        z-index: 1;
        top: 19px;
        color: #fff;
        width: 800px;
        left: calc(50% - 400px);

        .nav-item {
            position: relative;
            padding: 0 16px;
            line-height: 32px;
            cursor: pointer;
            border-radius: 16px;
            margin-left: 15px;

            > div:first-child {
                position: relative;
                padding: 0 4px;
                
                &.active {
                    color: #fabc14;
                    font-weight: bold;
                }

                &:hover {
                    color: #fabc14;
                }

                &::after {
                    content: '';
                    position: absolute;
                    bottom: -2px;
                    left: 0;
                    width: 100%;
                    height: 2px;
                    background: #fabc14;
                    transform: scaleX(0);
                    transition: transform 0.3s ease;
                }

                &:hover::after {
                    transform: scaleX(1);
                }
            }

            .dropdown-menu {
                position: absolute;
                top: calc(100% + 8px);
                left: 50%;
                transform: translateX(-50%);
                background: rgba(19, 42, 137, 0.95);
                min-width: 180px;
                border-radius: 8px;
                padding: 8px 0;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                z-index: 1000;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;

                &::before {
                    content: '';
                    position: absolute;
                    top: -6px;
                    left: 50%;
                    transform: translateX(-50%);
                    border-left: 6px solid transparent;
                    border-right: 6px solid transparent;
                    border-bottom: 6px solid rgba(19, 42, 137, 0.95);
                }

                > div {
                    padding: 10px 20px;
                    color: #fff;
                    cursor: pointer;
                    white-space: nowrap;
                    transition: all 0.3s ease;
                    font-size: 14px;
                    position: relative;
                    display: flex;
                    align-items: center;

                    &::before {
                        content: '';
                        position: absolute;
                        left: 0;
                        top: 0;
                        height: 100%;
                        width: 3px;
                        background: #fabc14;
                        transform: scaleY(0);
                        transition: transform 0.3s ease;
                    }

                    &:hover {
                        color: #fabc14;
                        background: rgba(255, 255, 255, 0.1);
                        padding-left: 25px;

                        &::before {
                            transform: scaleY(1);
                        }
                    }

                    &.active {
                        color: #fabc14;
                        font-weight: bold;
                        background: rgba(250, 188, 20, 0.1);
                        padding-left: 25px;

                        &::before {
                            transform: scaleY(1);
                        }
                    }
                }
            }

            &:hover .dropdown-menu {
                opacity: 1;
                visibility: visible;
                top: calc(100% + 4px);
            }
        }
    }

}
</style>