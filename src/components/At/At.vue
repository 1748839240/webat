<template>
  <div class="at">
    <div class="tipList">
      <el-card header="实现效果">
        <ul>
          <li>在文字任意任意地方输入@都会弹出选择人员弹窗</li>
          <li>选择人员后展示 @名称 ，并显示自定义颜色</li>
          <li>修改/删除 @名称 中的任意一个字符，删除 @名称</li>
          <li>光标不可游走 @名称 其中</li>
          <li>@名称 只能整体被选中</li>
          <li>@选择人员实时映射到数据</li>
          <li>XSS注意</li>
        </ul>
      </el-card>
    </div>
    <div class="unAtList">
      <el-card header="可选人员">
        <el-tag v-for="item in unAtList" :key="item.id">{{ item.name }}</el-tag>
      </el-card>
    </div>
    <div class="atArea">
      <el-card>
        <div class="atInputWrapper">
          <el-popover v-model:visible="state.visible" popper-class="atPopover" trigger="manual">
            <template #default>
              <el-card>
                <template #header>
                  <div class="flex flex_sb">
                    <span>@谁</span>
                    <i class="el-icon-close" @click="closePopover" />
                  </div>
                </template>
                <div v-for="item in unAtList" :key="item.id" class="flex flex_sb bb p8">
                  <span>{{ item.name }}</span>
                  <el-button size="mini" @click="selectAt(item)">选择</el-button>
                </div>
              </el-card>
            </template>
            <template #reference>
              <div id="atInput" ref="refAtInput" contenteditable @input="inputing" @click="click" />
            </template>
          </el-popover>
          <div v-if="!state.inputing" class="placeholder" @click.stop="() => refAtInput.focus()">
            请输入文字信息
          </div>
        </div>
      </el-card>
    </div>
    <div class="atedList">
      <el-card header="已选人员">
        <el-tag v-for="item in atedList" :key="item.id">{{ item.name }}</el-tag>
      </el-card>
    </div>
  </div>
</template>

<script lang="ts">
import list, { Item } from "./list"
import { insertAfter, isNextSiblings, isPreviousSiblings } from './util'
import { ref, reactive, computed, nextTick, onMounted, defineComponent, onBeforeUnmount } from "vue"

const className = '__at_span'
export default defineComponent({
  name: "At",
  setup() {
    const refAtInput = ref()
    const state = reactive({
      list, // 人名字列表
      inputing: "", // 实时输入内容
      inputText: "", // 展示的文字
      focusOffset: 0, // 缓存光标位置
      visible: false, // 是否显示选择人员弹窗
      observer: {} as MutationObserver, // dom 监听器
      atIds: [] as Array<string>, // @ 的人员id
    })

    // 可选人员列表
    const atedList = computed(() => state.list.filter((e) => state.atIds.includes(e.id)))

    // 已选人员列表
    const unAtList = computed(() => state.list.filter((e) => !state.atIds.includes(e.id)))

    // 输入监听
    const inputing = (e: InputEvent) => {
      // 保存实时输入信息用于控制 placeholder 状态
      state.inputing = (e.target as Element).innerHTML
      // 如果正在拼音输入，退出函数
      if (e.inputType === "insertCompositionText") {
        return
      }
      // 如果触发 @
      if (e.data === "@") {
        // // 缓存光标位置
        state.focusOffset = window.getSelection()?.focusOffset as number
        // 打开选择弹窗
        openPopover()
        return
      } else {
        state.visible = false
      }
    }

    // // 粘贴处理（ webkit 浏览器可以用 contenteditable="plaintext-only" 设置 contenteditable 粘贴文字，此方法可以用于火狐浏览器 hack）
    // const paste = (e: ClipboardEvent) => {
    //   // 获取到粘贴的纯文本
    //   const data = e.clipboardData?.getData("text/plain")
    //   // 获取 selection 对象
    //   const selection = window.getSelection()
    //   // 获取 range 对象
    //   const range = selection?.getRangeAt(0)
    //   // 如果此时有文字选中
    //   if (range?.toString()) {
    //     // 删除选中内容
    //     range?.deleteContents()
    //   }
    //   // 生成文本节点
    //   const text = document.createTextNode(data || "")
    //   // 从当前光标位置插入文本节点（插入后默认选中）
    //   range?.insertNode(text)
    //   // 取消选中状态将光标移动至选中最后
    //   selection?.collapseToEnd()
    //   // 触发 input 保存文本数据
    //   inputing(e as unknown as InputEvent)
    //   // 阻止默认事件
    //   e.preventDefault()
    //   return false
    // }

    // 打开 Popover
    const openPopover = () => {
      // 获取当前光标位置
      const curporPos = window.getSelection()?.getRangeAt(0).getBoundingClientRect() as DOMRect
      // 打开弹出框
      state.visible = true
      // 设置弹窗位置
      nextTick(() => {
        const x = curporPos.x > 75 ? curporPos.x - 75 : 0
        const y = curporPos.y + curporPos?.height + 8
          ; (document.getElementsByClassName("atPopover")[0] as HTMLElement).style.transform = `translate3d(${x}px, ${y}px, 0px)`
      })
    }

    // 关闭 Popover
    const closePopover = () => {
      // 关闭弹窗
      state.visible = false
      // 自动聚焦光标为移动到首位
      refAtInput.value.focus()
      // 设置 selection 选中到缓存的位置
      window.getSelection()?.extend(window.getSelection()?.anchorNode as Node, state.focusOffset)
      // 将光标移动到末尾
      window.getSelection()?.getRangeAt(0).collapse(false)
    }

    // 选择 @
    const selectAt = (item: Item) => {
      // 关闭选择弹窗
      closePopover()
      // 为即将插入的 span 生成一个 id，便于后面找到
      const id = Date.now().toString()
      // @ 人员信息
      // 要插入的元素
      const selection = window.getSelection()
      const parent = selection?.focusNode?.parentElement as HTMLElement
      // 选中输入的 @ 符
      selection?.extend(selection?.focusNode as Node, state.focusOffset - 1);
      // 删除输入的 @ 符
      const range = selection?.getRangeAt(0)
      range?.deleteContents()
      // 向文本节点插入元素节点
      const element = document.createElement('SPAN')
      element.id = id
      element.className = className
      element.dataset.id = item.id
      element.contentEditable = 'false'
      element.innerText = `@${item.name}`
      range?.insertNode(element)
      selection?.collapseToEnd()
    }

    onMounted(() => {
      // 自动聚焦
      refAtInput.value.focus()
      state.observer = new MutationObserver(function (mutationsList) {
        // 添加的元素
        const addElements = Array.from(mutationsList.map(e => Array.from(e.addedNodes))).flat().filter(e => (e as HTMLElement).tagName) as Array<HTMLElement>
        // 添加的 @姓名 元素
        const addAtIds = addElements.filter(e => (e.tagName === 'SPAN') && (e.className === className)).map(e => e.dataset.id) as Array<string>
        // 添加的其他元素
        const addOthers = addElements.filter(e => !((e.tagName === 'SPAN') && (e.className === className)))
        // 删除其他元素防止XSS攻击
        // addOthers.forEach(element => element.remove())
        // 添加 @
        addAtIds.forEach(id => !state.atIds.includes(id) && state.atIds.push(id))
        // 删除的元素  
        const delElements = Array.from(mutationsList.map(e => Array.from(e.removedNodes))).flat().filter(e => (e as HTMLElement).tagName) as Array<HTMLElement>
        const delAtIds = delElements.filter(e => (e.tagName === 'SPAN') && (e.className === className)).map(e => e.dataset.id) as Array<string>
        delAtIds.forEach(id => (state.atIds.indexOf(id) > -1) && state.atIds.splice(state.atIds.indexOf(id), 1))
      })
      state.observer.observe(refAtInput.value, { subtree: true, childList: true })
    })

    onBeforeUnmount(() => {
      state.observer.disconnect()
    })

    const click = (e: MouseEvent) => {
      // if ((e.target as HTMLElement).className = className) {
      //   window.getSelection()?.getRangeAt(0).selectNode(e.target as HTMLElement)
      // }
    }
    return {
      state,
      click,
      atedList,
      unAtList,
      selectAt,
      inputing,
      refAtInput,
      closePopover,
    }
  },
})
</script>

<style lang="scss" scoped>
@import "./at.scss";
::v-deep {
  .__at_span {
    color: red;
    font-weight: bolder;
  }
}
</style>
