# 前端实现@功能

## 实现功能
* 在文字任意任意地方输入@都会弹出选择人员弹窗
* 选择人员后展示 @名称 ，并显示自定义颜色
* 修改/删除 @名称 中的任意一个字符，删除 @名称
* 光标不可游走 @名称 其中
* @名称 只能整体被选中
* @选择人员实时映射到数据
* XSS注意同时仅允许用户通过输入、粘贴饿形式修改输入内容（通过console、element面板修改无效）

## 项目架构

vite + vue3 + typescript + ElementPlus

## 核心实现

通过使用 dom contenteditable 功能实现对 div 的可编辑。
使用 Selection 和 Range API 对选中和光标进行操作
使用 MutationObserver 实现数据映射和防篡改
# webatvite
