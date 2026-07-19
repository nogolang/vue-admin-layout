<script setup lang="ts">
import { ref, computed, toRaw } from 'vue'
import { ElMessage } from 'element-plus'
import { getMenuById, createMenu, updateMenu } from '@/api/system/sysMenu'
import type { SysMenu, MenuType } from '@/api/system/sysMenu'

// ==================== 对话框状态 ====================

const dialogVisible = ref(false)
const emit = defineEmits(['afterSave'])
const formRef = ref()
const nowId = ref(0)
const nowParentId = ref(0)

// ==================== 表单数据 ====================

const form = ref<SysMenu>({
  id: 0,
  parentId: 0,
  name: '',
  path: '',
  component: '',
  icon: '',
  type: 'page' as MenuType,
  sort: 0,
  status: 1,
  perm: '',
})

// 保存表单初始值，用于清空时还原
const formTemp = structuredClone(toRaw(form.value))

// ==================== 菜单类型选项 ====================

const typeOptions = [
  { label: '分组', value: 'group' },
  { label: '页面', value: 'page' },
  { label: '按钮', value: 'button' },
]

// ==================== 计算属性 ====================

// 根据 nowId 判断是否为修改模式
const isUpdate = computed(() => {
  return nowId.value !== 0
})

// ==================== 数据获取 ====================

// 根据 ID 查询菜单详情
const findById = async (id: number) => {
  try {
    const res: any = await getMenuById(id)
    form.value = (res?.data || res || {}) as SysMenu
  } catch {
    ElMessage.error('获取菜单信息失败')
  }
}

// ==================== 表单验证规则 ====================

const rules = ref({
  name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  path: [{ required: true, message: '请输入路由路径', trigger: 'blur' }],
})

// ==================== 清空表单 ====================

const clear = () => {
  form.value = {
    ...structuredClone(toRaw(formTemp)),
  }
}

// ==================== 对外暴露 open 方法 ====================

// 打开新增 / 编辑对话框
// id = 0 表示新增，id > 0 表示编辑
// parentId 用于指定父菜单 ID
const open = async (id: number, parentId = 0) => {
  nowId.value = id
  nowParentId.value = parentId

  if (id) {
    // 编辑模式：回显数据
    await findById(id)
  } else {
    // 新增模式：清空表单
    clear()
  }

  // 查询完成后打开对话框
  dialogVisible.value = true
}

// ==================== 新增 / 修改 ====================

// 新增菜单
const addForm = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    ElMessage.error('请填写必填项')
    return
  }

  await createMenu({
    parentId: nowParentId.value,
    name: form.value.name,
    path: form.value.path,
    component: form.value.component || undefined,
    icon: form.value.icon || undefined,
    type: form.value.type,
    sort: form.value.sort,
    status: form.value.status,
    perm: form.value.perm || undefined,
  })
  ElMessage.success('菜单创建成功')
  dialogVisible.value = false
  emit('afterSave')
}

// 修改菜单
const updateForm = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    ElMessage.error('请填写必填项')
    return
  }

  await updateMenu(nowId.value, {
    parentId: nowParentId.value,
    name: form.value.name,
    path: form.value.path,
    component: form.value.component || undefined,
    icon: form.value.icon || undefined,
    type: form.value.type,
    sort: form.value.sort,
    status: form.value.status,
    perm: form.value.perm || undefined,
  })
  ElMessage.success('菜单更新成功')
  dialogVisible.value = false
  emit('afterSave')
}

// ==================== 暴露方法给父组件 ====================

defineExpose({
  open,
})
</script>

<template>
  <div>
    <el-dialog :title="isUpdate ? '编辑菜单' : '新建菜单'" draggable :close-on-click-modal="false" v-model="dialogVisible" @close="clear">
      <el-form ref="formRef" @submit.prevent :model="form" :rules="rules" label-position="left" label-width="auto">
        <el-form-item label="菜单名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入菜单名称" clearable/>
        </el-form-item>
        <el-form-item label="菜单类型">
            <el-radio-group v-model="form.type">
              <el-radio-button v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</el-radio-button>
            </el-radio-group>
        </el-form-item>
        <el-form-item label="路由路径" prop="path">
            <el-input v-model="form.path" placeholder="如 /system/role" clearable/>
        </el-form-item>
        <el-form-item v-if="form.type === 'page'" label="组件路径">
            <el-input v-model="form.component" placeholder="如 /system/role（对应 views 下的目录）" clearable/>
        </el-form-item>
        <el-form-item label="图标">
            <el-input v-model="form.icon" placeholder="Element Plus 图标名（如 Setting）" clearable/>
        </el-form-item>
        <el-form-item v-if="form.type === 'button'" label="权限标识">
            <el-input v-model="form.perm" placeholder="如 sys:user:add" clearable/>
        </el-form-item>
        <el-form-item label="排序">
            <el-input-number v-model="form.sort" :min="0" style="width: 200px"/>
        </el-form-item>
        <el-form-item label="状态">
            <el-radio-group v-model="form.status">
              <el-radio :value="1">启用</el-radio>
              <el-radio :value="2">禁用</el-radio>
            </el-radio-group>
        </el-form-item>
      </el-form>

      <!-- 对话框底部按钮 -->
      <template #footer>
        <div style="margin-top: 30px">
          <el-button @click="clear();dialogVisible = false">取消</el-button>
          <el-button @click="clear">清空</el-button>
          <el-button v-if="isUpdate" type="primary" @click="updateForm">修改</el-button>
          <el-button v-else type="primary" @click="addForm">新增</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
