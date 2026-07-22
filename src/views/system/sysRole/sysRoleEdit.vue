<script setup lang="ts">
import { ref, computed, toRaw } from 'vue'
import { ElMessage } from 'element-plus'
import { getRoleById, createRole, updateRole } from '@/api/permission/sysRole'
import type { SysRole, SysRoleRequest } from '@/api/permission/sysRole'
import { useLocalStore } from '@/stores/useLocalStore'

const localStore = useLocalStore<SysRole>('local_sysRole')

// ==================== 对话框状态 ====================

const dialogVisible = ref(false)
const saved = ref(false) // 标记是否已成功提交，防止 @close 时重复保存草稿
const emit = defineEmits(['afterSave'])
const formRef = ref()
const nowId = ref(0)
const nowParentId = ref<number | undefined>(undefined)

// ==================== 表单数据 ====================

const form = ref<SysRole>({
  id: 0,
  name: '',
  parentId: undefined,
  sort: 0,
  status: 1,
  remark: '',
})

// 保存表单初始值，用于清空时还原
const formTemp = structuredClone(toRaw(form.value))

// ==================== 计算属性 ====================

// 根据 nowId 判断是否为修改模式
const isUpdate = computed(() => {
  return nowId.value !== 0
})

// 对话框标题
const title = computed(() => {
  if (isUpdate.value) return '编辑角色'
  return nowParentId.value ? '新增下级角色' : '新建角色'
})

// ==================== 数据获取 ====================

// 根据 ID 查询角色详情
const findById = async (id: number) => {
  try {
    const res: any = await getRoleById(id)
    form.value = (res?.data || res || {}) as SysRole
  } catch {
    ElMessage.error('获取角色信息失败')
  }
}

// ==================== 表单验证规则 ====================

const rules = ref({
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
})

// ==================== 清空表单 ====================

const clear = () => {
  form.value = {
    ...structuredClone(toRaw(formTemp)),
  }
}

// ==================== 对外暴露 open 方法 ====================

// 打开新增 / 编辑对话框
// id > 0 编辑服务端数据，id <= 0 新增（优先加载草稿）
// parentId 可选，用于新增下级角色
const open = async (id: number, parentId?: number) => {
  nowId.value = id
  nowParentId.value = parentId
  if (id > 0) {
    await findById(id)
  } else {
    const draft = localStore.load()
    form.value = draft ? { ...draft } : { ...formTemp }
    form.value.parentId = parentId
  }
  dialogVisible.value = true
}

// 弹框关闭时保存草稿（已提交/服务端数据则跳过）
const handleCancel = () => {
  if (saved.value) {
    saved.value = false
    return
  }
  if (nowId.value > 0) {
    return
  }
  localStore.save({ ...form.value })
}

// ==================== 新增 / 修改 ====================

// 新增角色
const addForm = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    ElMessage.error('请填写必填项')
    return
  }

  await createRole(form.value as SysRoleRequest)
  ElMessage.success('角色创建成功')
  localStore.remove()
  saved.value = true
  dialogVisible.value = false
  emit('afterSave')
}

// 修改角色
const updateForm = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    ElMessage.error('请填写必填项')
    return
  }

  await updateRole(nowId.value, form.value as SysRoleRequest)
  ElMessage.success('角色更新成功')
  saved.value = true
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
    <el-dialog :title="title" draggable :close-on-click-modal="false" v-model="dialogVisible" @close="handleCancel">
      <el-form ref="formRef" @submit.prevent :model="form" :rules="rules" label-position="left" label-width="auto">
        <el-form-item label="角色名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入角色名称" clearable/>
        </el-form-item>
        <el-form-item label="排序">
            <el-input-number v-model="form.sort" :min="0" style="width: 200px"/>
        </el-form-item>
        <el-form-item label="状态">
            <el-radio-group v-model="form.status">
              <el-radio-button :value="1">启用</el-radio-button>
              <el-radio-button :value="2">禁用</el-radio-button>
            </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
            <el-input v-model="form.remark" type="textarea" placeholder="备注（选填）"/>
        </el-form-item>
      </el-form>

      <!-- 对话框底部按钮 -->
      <template #footer>
        <div style="margin-top: 30px">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button @click="clear">清空</el-button>
          <el-button v-if="isUpdate" type="primary" @click="updateForm">修改</el-button>
          <el-button v-else type="primary" @click="addForm">新增</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
