<script setup lang="ts">
import { ref, computed, toRaw } from 'vue'
import { ElMessage } from 'element-plus'
import {
  createApiGroup,
  updateApiGroup,
  getApiGroupById,
  createApi,
  updateApi,
  getApiById,
} from '@/api/system/sysApi'
import type { SysApi, SysApiRequest, SysApiGroupRequest } from '@/api/system/sysApi'

// ==================== 对话框状态 ====================

const dialogVisible = ref(false)
const emit = defineEmits(['afterSave'])
const formRef = ref()
const formType = ref<'group' | 'api'>('api')
const nowId = ref(0)
const nowGroupId = ref<number | undefined>(undefined)

// ==================== 表单数据 ====================

// 表单同时承载分组和接口两种类型的数据
interface EditForm {
  /** 分组名称（api 模式不使用） */
  name?: string
  /** 接口路径（api 模式） */
  path: string
  /** 请求方法（api 模式） */
  method: string
  /** 描述 */
  description?: string
}

const form = ref<EditForm>({
  name: '',
  path: '',
  method: 'GET',
  description: '',
})

// 保存表单初始值，用于清空时还原
const formTemp = structuredClone(toRaw(form.value))

// ==================== 请求方法选项 ====================

const methodOptions = ['GET', 'POST', 'PUT', 'DELETE']

// ==================== 计算属性 ====================

// 根据 nowId 判断是否为修改模式
const isUpdate = computed(() => {
  return nowId.value !== 0
})

// 对话框标题
const title = computed(() => {
  if (formType.value === 'group') {
    return isUpdate.value ? '编辑分组' : '新建分组'
  }
  return isUpdate.value ? '编辑接口' : '新建接口'
})

// ==================== 表单验证规则 ====================

const groupRules = ref({
  name: [{ required: true, message: '请输入分组名称', trigger: 'blur' }],
})

const apiRules = ref({
  path: [{ required: true, message: '请输入接口路径', trigger: 'blur' }],
})

// 根据表单类型动态选择验证规则
const rules = computed(() => {
  return formType.value === 'group' ? groupRules.value : apiRules.value
})

// ==================== 清空表单 ====================

const clear = () => {
  form.value = {
    ...structuredClone(toRaw(formTemp)),
  }
}

// ==================== 对外暴露方法 ====================

// 打开分组新增 / 编辑对话框
const openGroup = async (id: number) => {
  formType.value = 'group'
  nowId.value = id
  if (id > 0) {
    const res: any = await getApiGroupById(id)
    const row = res?.data || res || {}
    form.value = { name: row.name || '', path: '', method: 'GET', description: row.description || '' }
  } else {
    clear()
  }
  dialogVisible.value = true
}

// 打开接口新增 / 编辑对话框
const open = async (id: number, groupId?: number) => {
  formType.value = 'api'
  nowId.value = id
  nowGroupId.value = groupId
  if (id > 0) {
    const res: any = await getApiById(id)
    const row: SysApi = res?.data || res || {}
    form.value = { name: '', path: row.path || '', method: row.method || 'GET', description: row.description || '' }
  } else {
    clear()
  }
  dialogVisible.value = true
}

// ==================== 新增 / 修改 ====================

// 新增（分组或接口）
const addForm = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    ElMessage.error('请填写必填项')
    return
  }

  if (formType.value === 'group') {
    await createApiGroup(form.value as SysApiGroupRequest)
    ElMessage.success('分组创建成功')
  } else {
    await createApi({ ...form.value, groupId: nowGroupId.value } as SysApiRequest)
    ElMessage.success('接口创建成功')
  }

  dialogVisible.value = false
  emit('afterSave')
}

// 修改（分组或接口）
const updateForm = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    ElMessage.error('请填写必填项')
    return
  }

  if (formType.value === 'group') {
    await updateApiGroup(nowId.value, form.value as SysApiGroupRequest)
    ElMessage.success('分组更新成功')
  } else {
    await updateApi(nowId.value, { ...form.value, groupId: nowGroupId.value } as SysApiRequest)
    ElMessage.success('接口更新成功')
  }

  dialogVisible.value = false
  emit('afterSave')
}

// ==================== 暴露方法给父组件 ====================

defineExpose({
  openGroup,
  open,
})
</script>

<template>
  <div>
    <el-dialog :title="title" draggable :close-on-click-modal="false" v-model="dialogVisible">
      <el-form ref="formRef" @submit.prevent :model="form" :rules="rules" label-position="left" label-width="auto">
        <template v-if="formType === 'group'">
          <el-form-item label="分组名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入分组名称" clearable/>
          </el-form-item>
          <el-form-item label="描述">
              <el-input v-model="form.description" type="textarea" placeholder="分组描述（选填）"/>
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="接口路径" prop="path">
              <el-input v-model="form.path" placeholder="如 /user/v1/list" clearable/>
          </el-form-item>
          <el-form-item label="请求方法">
              <el-radio-group v-model="form.method">
                <el-radio-button v-for="m in methodOptions" :key="m" :value="m">{{ m }}</el-radio-button>
              </el-radio-group>
          </el-form-item>
          <el-form-item label="描述">
              <el-input v-model="form.description" type="textarea" placeholder="接口描述（选填）"/>
          </el-form-item>
        </template>
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
