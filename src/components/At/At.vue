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
          <li>
            XSS注意同时仅允许用户通过输入、粘贴饿形式修改输入内容（通过console、element面板修改无效）
          </li>
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
          <el-popover
            v-model:visible="state.visible"
            popper-class="atPopover"
            trigger="manual"
          >
            <template #default>
              <el-card>
                <template #header>
                  <div class="flex flex_sb">
                    <span>@谁</span>
                    <i class="el-icon-close" @click="close" />
                  </div>
                </template>
                <div
                  v-for="item in unAtList"
                  :key="item.id"
                  class="flex flex_sb bb p8"
                >
                  <span>{{ item.name }}</span>
                  <el-button size="mini" @click="select(item)">选择</el-button>
                </div>
              </el-card>
            </template>
            <template #reference>
              <div
                id="atInput"
                ref="refAtInput"
                contenteditable="plaintext-only"
                @input="input"
                @focus="state.visible = false"
                @click="click"
              />
            </template>
          </el-popover>
          <div
            v-if="!state.inputing"
            class="placeholder"
            @click.stop="() => refAtInput.focus()"
          >
            请输入文字信息
          </div>
        </div>
      </el-card>
    </div>
    <div class="atedList">
      <el-card header="已选人员" size="mini">
        <el-tag v-for="item in atedList" :key="item.id">{{ item.name }}</el-tag>
      </el-card>
    </div>
    <div class="send flex flex_sb flex_c_fs">
      <el-card header="发送内容">{{ state.send || '请点击发送' }}</el-card>
      <el-button @click="send">发送</el-button>
    </div>
  </div>
</template>

<script lang="ts">
import list, { Item } from './list'
import {
  ref,
  reactive,
  computed,
  nextTick,
  onMounted,
  defineComponent,
  onBeforeUnmount
} from 'vue'

const className = '__at_span'
export default defineComponent({
  name: 'At',
  setup () {
    const refAtInput = ref()
    const state = reactive({
      send: '',
      inputing: '', // 实时输入内容
      focusNode: {} as Node, // 缓存光标所在节点
      focusOffset: 0, // 缓存光标所在位置
      inputed: false, // 输入框内容是否是常规输入
      visible: false, // 是否显示选择人员弹窗
      observer: {} as MutationObserver, // dom 监听器
      atIds: [] as Array<string> // @ 的人员id
    })

    // 可选人员列表
    const atedList = computed(() =>
      list.filter(e => state.atIds.includes(e.id))
    )

    // 已选人员列表
    const unAtList = computed(() =>
      list.filter(e => !state.atIds.includes(e.id))
    )

    // lock，用于标记内容修改是在常规修改（在输入框输入或粘贴）还是通过其他方式修改（浏览器控制台修改）
    const lock = () => {
      state.inputed = true
      nextTick(() => {
        state.inputed = false
      })
    }

    // 打开选择框
    const open = () => {
      const selection = window.getSelection() as Selection
      const range = selection?.getRangeAt(0) as Range
      // 缓存光标所在节点
      state.focusNode = selection?.focusNode as Node
      // 缓存光标所在节点位置
      state.focusOffset = selection?.focusOffset as number
      // 光标所在位置
      const pos = range.getBoundingClientRect() as DOMRect
      // 显示选择框
      state.visible = true
      // 输入框失去焦点
      refAtInput.value.blur()
      // 设置弹窗位置
      nextTick(() => {
        const x = pos.x > 75 ? pos.x - 75 : 0
        const y = pos.y + pos?.height + 8
        const s = document.getElementsByClassName('atPopover')[0] as HTMLElement
        s.style.transform = `translate3d(${x}px, ${y}px, 0px)`
      })
    }

    // 关闭选择框
    const close = () => {
      // 关闭选择框
      state.visible = false
      const selection = window.getSelection()
      const range = selection?.getRangeAt(0) as Range
      // 选中节点
      range.selectNode(state.focusNode)
      // 设置终点
      range.setEnd(state.focusNode, state.focusOffset)
      // 移动到终点
      range.collapse()
      // 聚焦输入框
      refAtInput.value.focus()
    }

    // 选择 @
    const select = (item: Item) => {
      const selection = window.getSelection()
      const range = selection?.getRangeAt(0) as Range
      // 选中输入的 @ 符
      range.setStart(state.focusNode, state.focusOffset - 1)
      range.setEnd(state.focusNode, state.focusOffset)
      // 删除输入的 @ 符
      range.deleteContents()
      // 创建元素节点
      const element = document.createElement('SPAN')
      element.className = className
      element.dataset.id = item.id
      element.contentEditable = 'false'
      element.innerText = `@${item.name}`
      // 选中元素节点
      range.insertNode(element)
      // 光标移动到末尾
      range.collapse()
      // 聚焦输入框
      refAtInput.value.focus()
      // 关闭选择框
      state.visible = false
      // 标记为常规修改
      lock()
    }

    // 输入监听
    const input = (e: InputEvent) => {
      // 标记内容修改为常规输入
      lock()
      // 实时输入框的保存
      state.inputing = (e.target as Element).innerHTML
      // 如果触发 @
      if (e.data === '@') {
        // 打开选择弹窗
        open()
      }
    }

    // 点击 @ 选中
    const click = ({ target }: MouseEvent) => {
      if ((target as HTMLElement).className === className) {
        const selection = window.getSelection()
        const range = selection?.getRangeAt(0) as Range
        range.selectNode(target as Node)
      }
    }

    // 粘贴处理（ webkit 浏览器可以用 contenteditable="plaintext-only" 设置 contenteditable 粘贴文字，此方法可以用于火狐浏览器 hack，缺点 Ctrl + Z 无效）
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
    //   state.inputing = (e.target as HTMLElement).innerHTML
    //   // 阻止默认事件
    //   e.preventDefault()
    //   return false
    // }

    onMounted(() => {
      if (localStorage.getItem('send')) {
        refAtInput.value.innerHTML = state.inputing =
          localStorage.getItem('send') || ''
      }
      // 自动聚焦
      refAtInput.value.focus()
      state.observer = new MutationObserver(mutationsList => {
        if (state.inputed) {
          // 添加的元素
          const addElements = Array.from(
            mutationsList.map(e => Array.from(e.addedNodes))
          )
            .flat()
            .filter(e => (e as HTMLElement).tagName) as Array<HTMLElement>
          // 添加的 @姓名 元素
          const addAtIds = addElements
            .filter(e => e.tagName === 'SPAN' && e.className === className)
            .map(e => e.dataset.id) as Array<string>
          // 添加 @
          addAtIds.forEach(
            id => !state.atIds.includes(id) && state.atIds.push(id)
          )
          // 删除的元素
          const delElements = Array.from(
            mutationsList.map(e => Array.from(e.removedNodes))
          )
            .flat()
            .filter(e => (e as HTMLElement).tagName) as Array<HTMLElement>
          const delAtIds = delElements
            .filter(e => e.tagName === 'SPAN' && e.className === className)
            .map(e => e.dataset.id) as Array<string>
          delAtIds.forEach(
            id =>
              state.atIds.indexOf(id) > -1 &&
              state.atIds.splice(state.atIds.indexOf(id), 1)
          )
        } else {
          alert('非法修改')
          window.location.reload()
        }
      })
      state.observer.observe(refAtInput.value, {
        subtree: true, // 监听所有后代节点
        childList: true, // 监听后代节点增加删除
        attributes: true, // 监听属性
        characterData: true, // 监听字符数据变化
        attributeOldValue: true, // 记录变化前属性值
        characterDataOldValue: true // 记录变化前字符值
      })
    })

    onBeforeUnmount(() => {
      state.observer.disconnect()
    })

    // 点击发送
    const send = () => {
      state.send = refAtInput.value.innerHTML.trim()
      console.log(refAtInput.value.innerHTML)
      localStorage.setItem('send', state.send)
    }

    return {
      send,
      state,
      close,
      input,
      click,
      select,
      atedList,
      unAtList,
      refAtInput
    }
  }
})
</script>

<style lang="scss" scoped>
@import './at.scss';
::v-deep {
  .__at_span {
    color: red;
    font-weight: bolder;
  }
}
</style>
