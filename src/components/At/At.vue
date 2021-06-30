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
                  <el-button size="mini" @click="selectAt(item.id)">选择</el-button>
                </div>
              </el-card>
            </template>
            <template #reference>
              <div id="atInput" ref="refAtInput" contenteditable="plaintext-only" @input="inputing" @click="click"
                @compositionend="inputing" />
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
import { insertAfter } from './util'
import {
  ref,
  reactive,
  computed,
  nextTick,
  onMounted,
  defineComponent,
  onBeforeUnmount,
} from "vue"

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
      // focusEnd: false, // 插入 @ 时光标是否位于文字末尾
      visibleAt: false, // 处理 input 和 selectionchange 事件冲突
      lastCursorNode: {} as Node, // 光标上一次所在的节点
      atIds: [] as Array<string>, // @ 的人员id
    })

    // 可选人员列表
    const atedList = computed(() => state.list.filter((e) => state.atIds.includes(e.id)))

    // 已选人员列表
    const unAtList = computed(() => state.list.filter((e) => !state.atIds.includes(e.id)))

    // 自动聚焦
    onMounted(() => refAtInput.value.focus())

    // 输入监听
    const inputing = (e: InputEvent) => {
      // 保存实时输入信息用于控制 placeholder 状态
      state.inputing = (e.target as Element).innerHTML
      // 如果正在拼音输入，退出函数
      if (e.inputType === "insertCompositionText") {
        return
      }
      // console.log(e)
      // console.log(e.data)
      // console.log((e.target as Element).innerHTML)
      // 保存 innerHTML
      state.inputText = (e.target as Element).innerHTML
      // 如果触发 @
      if (e.data === "@") {
        // console.log(state.inputing)
        // input 先于 selectionchange 触发
        state.visibleAt = true
        setTimeout(() => {
          state.visibleAt = false
        })
        // 保存光标位置
        state.focusOffset = window.getSelection()?.focusOffset || 0
        // // 如果光标位置位于最后一个节点
        // const lastChild = window.getSelection()?.anchorNode === refAtInput.value.lastChild
        // // 如果光标位于当前节点的最后一个位置
        // const lastFocus = window.getSelection()?.focusOffset === (window.getSelection()?.anchorNode as unknown as string).length
        // // 则表示当前光标位于最后位置
        // if (lastChild && lastFocus) {
        //   state.focusEnd = true
        // }
        // 打开选择弹窗
        openPopover()
      } else {
        state.visible = false
        document.dispatchEvent(new Event('selectionchange'))
        // console.log((e.target as Element).innerHTML, 'inputing')
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
        ;(document.getElementsByClassName("atPopover")[0] as HTMLElement).style.transform = `translate3d(${x}px, ${y}px, 0px)`
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
    const selectAt = (id: string) => {
      // 关闭选择弹窗
      closePopover()
      // 为即将插入的 span 生成一个 id，便于后面找到
      const atId = Date.now().toString()
      // 记录 @ 人员 id
      state.atIds.push(id)
      // @ 人员信息
      const item = state.list.find((e) => e.id === id) as unknown as Item
      // 要插入的 html
      const html = `<span id="${atId}" class="at">@${item.name}</span>`
      const selection = window.getSelection()
      const range = selection?.getRangeAt(0)
      const span = document.getElementById(atId)
      // 选中输入的 @ 符
      range?.setStart(range?.commonAncestorContainer as Node, state.focusOffset - 1)
      range?.setEnd(range?.commonAncestorContainer as Node, state.focusOffset)
      // 删除输入的 @ 符
      range?.deleteContents()
      // 向文本节点插入 html（ < 和 > 会被转义为 &lt; 和 &gt; ）
      range?.insertNode(document.createTextNode(html))
      // 将转义后的 html 转换为真正的 html 并插入 dom
      refAtInput.value.innerHTML = refAtInput.value.innerHTML.replaceAll("&lt;", "<").replaceAll("&gt;", ">") // !!!!!!!!!!!!!!!!!!!!!!!
      // 在 @姓名 后添加一个不可见字符串用于防止点击 @姓名 最后一个字符后文字样式收到 @姓名 影响
      insertAfter.call(span, document.createTextNode("\u200b"))
      // 在不可见字符串后面添加一个空格，用于优化用户体验
      range?.selectNode(span?.nextSibling as Node)
      // 删除所有 range
      selection?.removeAllRanges()
      // 添加想要光标移动的位置
      selection?.addRange(range as Range)
      // 选中 range
      selection?.collapse(span?.nextSibling as Node, 1)
      // 光标移动到末尾
      range?.collapse(false)
    }

    // 光标移动事件
    const selectionchange = () => {
      // 光标移动关闭弹窗
      if (!state.visibleAt) {
        state.visible = false
      }
      // 检查光标位置使得 @姓名 不可点击
      const range = window.getSelection()?.getRangeAt(0)
      // console.log(range)
      // 如果光标进入 @姓名 中
      if (range?.collapsed && (range.commonAncestorContainer.parentElement?.tagName === 'SPAN')) {
        // 如果 @姓名 后面的 \u200b 没有了或者 @姓名 中有字符变动，表示删除 @
        // if (range.commonAncestorContainer.parentElement.nextSibling?.nodeValue !== "\u200b") {
        //   range.selectNode(range.commonAncestorContainer.parentElement)
        //   range.deleteContents()
        //   return
        // }
        console.log(range?.commonAncestorContainer, state.lastCursorNode, state.lastCursorNode.nodeValue === '\u200b')
        // console.log(range.commonAncestorContainer.parentElement.nextSibling?.nodeValue !== "\u200b", 'range.commonAncestorContainer, range.commonAncestorContainer.nextSibling')
        // range.selectNode(range.commonAncestorContainer)
        // range.collapse(true)
        return
      }
      state.lastCursorNode = range?.commonAncestorContainer as Node
    }
    // 监听光标移动
    document.addEventListener('selectionchange', selectionchange, true)
    onBeforeUnmount(() => {
      document.removeEventListener('selectionchange', selectionchange)
    })
    return {
      state,
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
</style>
