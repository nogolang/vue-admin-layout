<script setup lang="ts">
import { ref, computed, toRaw } from 'vue'
import { ElMessage } from 'element-plus'
import { getUserById, createUser, updateUser } from '@/api/permission/sysUser'
import type { SysUser, SysUserRequest, SysUserUpdate } from '@/api/permission/sysUser'
import { useLocalStore } from '@/stores/useLocalStore'

const localStore = useLocalStore<SysUser>('local_sysUser')

// ==================== 对话框状态 ====================

const dialogVisible = ref(false)
const saved = ref(false) // 标记是否已成功提交，防止 @close 时重复保存草稿
const emit = defineEmits(['afterSave'])
const formRef = ref()
const nowId = ref(0)

// ==================== 表单数据 ====================

// 表单扩展字段：password 仅新增时需要，后端实体不包含此字段
interface UserForm extends SysUser {
  /** 密码（仅新增时填写，编辑时不可见） */
  password?: string
}

const form = ref<UserForm>({
  id: 0,
  username: '',
  password: '',
  nickName: '',
  email: '',
  phone: '',
  status: 1,
})

// 保存表单初始值，用于清空时还原
const formTemp = structuredClone(toRaw(form.value))

// ==================== 计算属性 ====================

// 根据 nowId 判断是否为修改模式
const isUpdate = computed(() => {
  return nowId.value !== 0
})

// ==================== 数据获取 ====================

// 根据 ID 查询用户详情
const findById = async (id: number) => {
  try {
    const res: any = await getUserById(id)
    const row: SysUser = res?.data || res || {}
    form.value = { ...row, password: '' }
  } catch {
    ElMessage.error('获取用户信息失败')
  }
}

// ==================== 表单验证规则 ====================

const rules = ref({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
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
const open = async (id: number) => {
  nowId.value = id
  if (id > 0) {
    await findById(id)
  } else {
    const draft = localStore.load()
    form.value = draft ? { ...draft, password: '' } : { ...formTemp }
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
  localStore.save({ ...form.value } as SysUser)
}

// ==================== 新增 / 修改 ====================

// 新增用户
const addForm = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    ElMessage.error('请填写必填项')
    return
  }

  await createUser(form.value as SysUserRequest)
  ElMessage.success('用户创建成功')
  localStore.remove()
  saved.value = true
  dialogVisible.value = false
  emit('afterSave')
}

// 修改用户
const updateForm = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    ElMessage.error('请填写必填项')
    return
  }

  await updateUser(nowId.value, form.value as SysUserUpdate)
  ElMessage.success('用户更新成功')
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
    <el-dialog :title="isUpdate ? '编辑用户' : '新建用户'" draggable :close-on-click-modal="false" v-model="dialogVisible" @close="handleCancel">
      <el-form ref="formRef" @submit.prevent :model="form" :rules="rules" label-position="left" label-width="auto">
        <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" placeholder="请输入用户名" :disabled="isUpdate" clearable/>
        </el-form-item>
        <el-form-item v-if="!isUpdate" label="密码" prop="password">
            <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password clearable/>
        </el-form-item>
        <el-form-item label="昵称">
            <el-input v-model="form.nickName" placeholder="昵称（选填）" clearable/>
        </el-form-item>
        <el-form-item label="邮箱">
            <el-input v-model="form.email" placeholder="邮箱（选填）" clearable/>
        </el-form-item>
        <el-form-item label="手机号">
            <el-input v-model="form.phone" placeholder="手机号（选填）" clearable/>
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
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button @click="clear">清空</el-button>
          <el-button v-if="isUpdate" type="primary" @click="updateForm">修改</el-button>
          <el-button v-else type="primary" @click="addForm">新增</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
