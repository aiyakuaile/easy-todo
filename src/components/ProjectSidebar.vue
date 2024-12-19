<template>
  <div class="project-sidebar" :class="{ collapsed }">
    <!-- 顶部操作栏 -->
    <div class="sidebar-header">
      <div class="header-content">
        <el-button type="text" class="collapse-btn" @click="store.toggleCollapse()">
          <el-icon :size="20"><Fold v-if="!collapsed" /><Expand v-else /></el-icon>
        </el-button>
        <span v-if="!collapsed" class="greeting">{{ greeting }}，{{ userName }}</span>
      </div>
    </div>

    <!-- 项目列表 -->
    <div class="projects-list">
      <!-- 活动项目列表 -->
      <div class="list-section">
        <div class="section-header" v-if="!collapsed">
          <span class="section-title">活动项目</span>
        </div>
        <div
          v-for="project in sortedProjects"
          :key="project.id"
          class="project-item"
          :class="{ active: project.id === store.currentProjectId }"
          @click.stop="store.setCurrentProject(project.id)"
        >
          <el-tooltip
            :content="project.name"
            placement="right"
            :disabled="!collapsed"
            :show-after="200"
          >
            <div class="project-info">
              <div 
                class="project-avatar"
                :style="{ 
                  color: project.textColor || '#fff',
                  backgroundColor: project.bgColor || '#409EFF'
                }"
              >
                {{ project.name.charAt(0).toUpperCase() }}
              </div>
              <div v-if="!collapsed" class="project-meta">
                <span class="project-name">{{ project.name }}</span>
                <span class="project-tasks-count">{{ getProjectTasksCount(project.id) }} 个任务</span>
              </div>
            </div>
          </el-tooltip>
          <div v-if="!collapsed" class="project-actions">
            <el-button
              type="text"
              size="small"
              class="action-button"
              circle
              @click.stop="editProject(project)"
            >
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button
              type="text"
              size="small"
              class="action-button delete-button"
              circle
              @click.stop="confirmDeleteProject(project)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
      
      <!-- 归档项目列表 -->
      <div class="list-section" v-if="store.archivedProjects?.length">
        <div class="section-header" v-if="!collapsed">
          <span class="section-title">归档项目</span>
        </div>
        <div
          v-for="project in sortedArchivedProjects"
          :key="project.id"
          class="project-item archived"
          :class="{ active: project.id === store.currentProjectId }"
          @click.stop="store.setCurrentProject(project.id)"
        >
          <el-tooltip
            :content="project.name"
            placement="right"
            :disabled="!collapsed"
            :show-after="200"
          >
            <div class="project-info">
              <div 
                class="project-avatar"
                :style="{ 
                  color: project.textColor || '#fff',
                  backgroundColor: project.bgColor || '#409EFF'
                }"
              >
                {{ project.name.charAt(0).toUpperCase() }}
              </div>
              <div v-if="!collapsed" class="project-meta">
                <span class="project-name">{{ project.name }}</span>
                <span class="archive-date">归档于 {{ formatDateTime(project.archivedAt) }}</span>
              </div>
            </div>
          </el-tooltip>
          <div v-if="!collapsed" class="project-actions">
            <el-button
              type="text"
              size="small"
              class="action-button delete-button"
              circle
              @click.stop="confirmDeleteArchivedProject(project)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建项目按钮 -->
    <div class="create-project">
      <div class="bottom-actions" :class="{ collapsed }">
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          <span v-if="!collapsed">创建项目</span>
        </el-button>
        <el-dropdown @command="handleThemeChange" trigger="click">
          <el-button type="primary" plain>
            <el-icon :size="20">
              <component :is="themeIcon" />
            </el-icon>
            <span v-if="!collapsed">{{ themeText }}</span>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="light">
                <el-icon><Sunny /></el-icon>
                浅色模式
              </el-dropdown-item>
              <el-dropdown-item command="dark">
                <el-icon><Moon /></el-icon>
                深色模式
              </el-dropdown-item>
              <el-dropdown-item command="system">
                <el-icon><Monitor /></el-icon>
                跟随系统
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 创建项目对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="创建项目"
      width="500px"
      :close-on-click-modal="true"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="项目图标">
          <div class="color-schemes">
            <div class="avatar-preview">
              <div class="preview-avatar" :style="{
                color: form.textColor,
                backgroundColor: form.bgColor
              }">
                {{ form.name.charAt(0).toUpperCase() || 'A' }}
              </div>
              <span class="preview-text">项目图标预览</span>
            </div>
            <div class="scheme-options">
              <div
                v-for="(scheme, index) in colorSchemes"
                :key="index"
                class="scheme-item"
                :class="{ active: form.textColor === scheme.text }"
                :style="{ backgroundColor: scheme.text }"
                @click="selectCreateColorScheme(scheme)"
              ></div>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="流程状态" prop="states">
          <div v-for="(state, index) in form.states" :key="index" class="state-item">
            <el-input v-model="state.name" placeholder="状态名称" />
            <el-color-picker v-model="state.color" />
            <el-button type="danger" @click="removeState(index)" :disabled="form.states.length <= 3">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
          <el-button type="primary" @click="addState" plain>
            <el-icon><Plus /></el-icon>
            添加状态
          </el-button>
        </el-form-item>
        <el-form-item label="快速访问" prop="enableQuickAccess">
          <div class="quick-access-wrapper">
            <el-switch v-model="form.enableQuickAccess" />
            <el-tooltip
              content="开启后将支持从utools输入框输入��目名称，快速打开此项目"
              placement="right"
            >
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createProject">确定</el-button>
      </template>
    </el-dialog>

    <!-- 编辑项目对话框 -->
    <el-dialog
      v-model="editProjectVisible"
      title="编辑项目"
      width="500px"
      :close-on-click-modal="true"
    >
      <el-form ref="editProjectFormRef" :model="editProjectForm" :rules="projectRules">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="editProjectForm.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="项目图标">
          <div class="color-schemes">
            <div class="avatar-preview">
              <div class="preview-avatar" :style="{
                color: editProjectForm.textColor,
                backgroundColor: editProjectForm.bgColor
              }">
                {{ editProjectForm.name.charAt(0).toUpperCase() || 'A' }}
              </div>
              <span class="preview-text">项目图标预览</span>
            </div>
            <div class="scheme-options">
              <div
                v-for="(scheme, index) in colorSchemes"
                :key="index"
                class="scheme-item"
                :class="{ active: editProjectForm.textColor === scheme.text }"
                :style="{ backgroundColor: scheme.text }"
                @click="selectColorScheme(scheme)"
              ></div>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="流程状态" prop="states">
          <div v-for="(state, index) in editProjectForm.states" :key="index" class="state-item">
            <el-input v-model="state.name" placeholder="状态名称" />
            <el-color-picker v-model="state.color" />
            <el-button 
              type="danger" 
              @click="removeEditState(index)" 
              :disabled="editProjectForm.states.length <= 3"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
          <el-button type="primary" @click="addEditState" plain>
            <el-icon><Plus /></el-icon>
            添加状态
          </el-button>
        </el-form-item>
        <el-form-item label="快速访问">
          <div class="quick-access-wrapper">
            <el-switch v-model="editProjectForm.enableQuickAccess" />
            <el-tooltip
              content="开启后将支持从utools输入框输入项目名称，快速打开此项目"
              placement="right"
            >
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editProjectVisible = false">取消</el-button>
        <el-button type="primary" @click="updateProject">确定</el-button>
      </template>
    </el-dialog>

    <!-- 删除项目确认对话框 -->
    <el-dialog
      v-model="deleteProjectVisible"
      title="删除项目"
      width="400px"
      align-center
      :close-on-click-modal="true"
    >
      <div class="delete-confirm-content">
        <el-icon class="delete-icon" :size="48"><Warning /></el-icon>
        <div class="delete-text">
          <p class="delete-title">确定要删除项目"<span class="highlight-text">{{ projectToDelete?.name }}</span>"吗？</p>
          <p class="delete-warning">删除后将无法恢复，项目中所有任务也会被删除！</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="deleteProjectVisible = false">取消</el-button>
        <el-button type="danger" @click="deleteProject">确定删除</el-button>
      </template>
    </el-dialog>

    <!-- 删除归档项目确认对话框 -->
    <el-dialog
      v-model="deleteArchivedProjectVisible"
      title="删除归档项目"
      width="400px"
      align-center
      :close-on-click-modal="true"
    >
      <div class="delete-confirm-content">
        <el-icon class="delete-icon" :size="48"><Warning /></el-icon>
        <div class="delete-text">
          <p class="delete-title">确定要删除归档项目"<span class="highlight-text">{{ archivedProjectToDelete?.name }}</span>"吗？</p>
          <p class="delete-warning">删除后将无法恢复！</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="deleteArchivedProjectVisible = false">取消</el-button>
        <el-button type="danger" @click="deleteArchivedProject">确定删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useProjectStore } from '../store/project'
import { storeToRefs } from 'pinia'
import {
  Fold,
  Expand,
  Plus,
  Delete,
  Document,
  Folder,
  Star,
  Collection,
  Box,
  Edit,
  Warning,
  Moon,
  Sunny,
  Monitor,
  QuestionFilled,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { storage } from '../utils/storage'
import { formatDateTime } from '../utils/date'

const store = useProjectStore()
const { projects, collapsed } = storeToRefs(store)

// 图标列表
const icons = [
  'Document', 'Folder', 'Star', 'Collection', 'Box',
  'Files', 'Calendar', 'Flag', 'List', 'Briefcase',
  'Compass', 'Bell', 'Bookmark', 'Trophy', 'Target'
]

// 预设配色方案
const colorSchemes = [
  { text: '#409EFF', bg: 'rgba(64, 158, 255, 0.1)' }, // 蓝色
  { text: '#67C23A', bg: 'rgba(103, 194, 58, 0.1)' }, // 绿色
  { text: '#E6A23C', bg: 'rgba(230, 162, 60, 0.1)' }, // 橙色
  { text: '#F56C6C', bg: 'rgba(245, 108, 108, 0.1)' }, // 红色
  { text: '#722ED1', bg: 'rgba(114, 46, 209, 0.1)' }, // 紫色
  { text: '#2F54EB', bg: 'rgba(47, 84, 235, 0.1)' }, // 深
  { text: '#13C2C2', bg: 'rgba(19, 194, 194, 0.1)' }, // 青色
  { text: '#FA541C', bg: 'rgba(250, 84, 28, 0.1)' }, // 珊瑚红
  { text: '#52C41A', bg: 'rgba(82, 196, 26, 0.1)' }, // 青柠绿
  { text: '#1890FF', bg: 'rgba(24, 144, 255, 0.1)' }, // 天蓝色
]

// 表单相关
const dialogVisible = ref(false)
const formRef = ref(null)
const form = reactive({
  name: '',
  textColor: '#FFFFFF',
  bgColor: '#409EFF',
  enableQuickAccess: false,
  states: [
    { name: '待办', color: '#909399' },
    { name: '进行中', color: '#409EFF' },
    { name: '已完成', color: '#67C23A' },
  ],
})

const rules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
}

// 问候语相关
const userName = '宝宝！'

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '凌晨好'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 17) return '下午好'
  if (hour < 19) return '傍晚好'
  if (hour < 22) return '晚上好'
  return '夜深了'
})

// 显示创建对话框
const showCreateDialog = () => {
  dialogVisible.value = true
}

// 添加状态
const addState = () => {
  form.states.push({ name: '', color: '#909399' })
}

// 移除状态
const removeState = (index) => {
  form.states.splice(index, 1)
}

// 创建项目
const createProject = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid) => {
    if (valid) {
      store.addProject({
        name: form.name,
        textColor: form.textColor,
        bgColor: form.bgColor,
        enableQuickAccess: form.enableQuickAccess,
        states: form.states.map((state, index) => ({
          id: index.toString(),
          ...state,
        })),
      })
      dialogVisible.value = false
      // 重置表单
      form.name = ''
      form.textColor = '#FFFFFF'
      form.bgColor = '#409EFF'
      form.enableQuickAccess = false
      form.states = [
        { name: '待办', color: '#909399' },
        { name: '进行中', color: '#409EFF' },
        { name: '已完成', color: '#67C23A' },
      ]
    }
  })
}

// 编辑项目相关
const editProjectVisible = ref(false)
const editProjectFormRef = ref(null)
const editProjectForm = reactive({
  id: '',
  name: '',
  textColor: '#FFFFFF',
  bgColor: '#409EFF',
  enableQuickAccess: false,
  states: [
    { name: '待办', color: '#909399' },
    { name: '进行中', color: '#409EFF' },
    { name: '已完成', color: '#67C23A' },
  ],
})

const projectRules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
}

const editProject = (project) => {
  editProjectForm.id = project.id
  editProjectForm.name = project.name
  editProjectForm.textColor = project.textColor || '#FFFFFF'
  editProjectForm.bgColor = project.bgColor || '#409EFF'
  editProjectForm.enableQuickAccess = Boolean(project.enableQuickAccess)
  editProjectForm.states = project.states.map(state => ({ ...state }))
  editProjectVisible.value = true
}

const updateProject = async () => {
  if (!editProjectFormRef.value) return
  
  await editProjectFormRef.value.validate((valid) => {
    if (valid) {
      store.updateProjectInfo(editProjectForm.id, {
        name: editProjectForm.name,
        textColor: editProjectForm.textColor,
        bgColor: editProjectForm.bgColor,
        enableQuickAccess: editProjectForm.enableQuickAccess,
        states: editProjectForm.states,
      })
      editProjectVisible.value = false
      ElMessage({
        type: 'success',
        message: '项目更新成功'
      })
    }
  })
}

// 删除项目相关
const deleteProjectVisible = ref(false)
const projectToDelete = ref(null)

const confirmDeleteProject = (project) => {
  projectToDelete.value = project
  deleteProjectVisible.value = true
}

const deleteProject = () => {
  if (projectToDelete.value) {
    store.deleteProject(projectToDelete.value.id)
    deleteProjectVisible.value = false
    projectToDelete.value = null
    ElMessage({
      type: 'success',
      message: '项目已删除'
    })
  }
}

const selectColorScheme = (scheme) => {
  editProjectForm.textColor = scheme.text
  editProjectForm.bgColor = scheme.bg
}

const getProjectTasksCount = (projectId) => {
  return store.tasks.filter(task => task.projectId === projectId).length
}

const selectCreateColorScheme = (scheme) => {
  form.textColor = scheme.text
  form.bgColor = scheme.bg
}

const addEditState = () => {
  editProjectForm.states.push({ name: '', color: '#909399' })
}

const removeEditState = (index) => {
  editProjectForm.states.splice(index, 1)
}

// 按创建时间倒序排列活动项目
const sortedProjects = computed(() => {
  return [...projects.value].sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt)
  })
})

// 按归档时间倒序排列归档项目
const sortedArchivedProjects = computed(() => {
  return [...store.archivedProjects].sort((a, b) => {
    return new Date(b.archivedAt) - new Date(a.archivedAt)
  })
})

// 删除归档项目相关
const deleteArchivedProjectVisible = ref(false)
const archivedProjectToDelete = ref(null)

const confirmDeleteArchivedProject = (project) => {
  archivedProjectToDelete.value = project
  deleteArchivedProjectVisible.value = true
}

const deleteArchivedProject = () => {
  if (archivedProjectToDelete.value) {
    store.deleteArchivedProject(archivedProjectToDelete.value.id)
    deleteArchivedProjectVisible.value = false
    archivedProjectToDelete.value = null
    ElMessage({
      type: 'success',
      message: '归档项目已删除'
    })
  }
}

// 主题相关
const themePreference = ref(storage.getItem('theme-preference') || 'system')
const systemDarkMode = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

mediaQuery.addEventListener('change', (e) => {
  systemDarkMode.value = e.matches
  updateThemeClass()
})

const isDark = computed(() => {
  if (themePreference.value === 'system') {
    return systemDarkMode.value
  }
  return themePreference.value === 'dark'
})

const themeIcon = computed(() => {
  if (themePreference.value === 'system') {
    return Monitor
  }
  return isDark.value ? Moon : Sunny
})

const themeText = computed(() => {
  const themes = {
    light: '浅色模式',
    dark: '深色模式',
    system: '跟随系统'
  }
  return themes[themePreference.value]
})

const handleThemeChange = (theme) => {
  themePreference.value = theme
  storage.setItem('theme-preference', theme)
  updateThemeClass()
}

const updateThemeClass = () => {
  document.documentElement.className = isDark.value ? 'dark' : ''
}

// 初始化主题
updateThemeClass()
</script>

<style scoped>
.project-sidebar {
  width: 240px;
  height: 100vh;
  background-color: #fff;
  border-right: 1px solid #dcdfe6;
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
}

.project-sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #dcdfe6;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.collapse-btn {
  height: 32px;
  width: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.projects-list {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
}

.project-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  margin-bottom: 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  min-height: 40px;
}

.project-item:hover {
  background-color: #f5f7fa;
}

.project-item.active {
  background-color: #ecf5ff;
}

.project-item.archived.active {
  background-color: #f4f4f5;
}

.project-name {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.create-project {
  padding: 12px;
  border-top: 1px solid #dcdfe6;
}

.create-project .el-button {
  width: 100%;
}

.state-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.state-item .el-input {
  flex: 1;
}

.project-item .project-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.project-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s;
  position: absolute;
  right: 12px;
  background: inherit;
}

.project-actions .action-button {
  width: 24px;
  height: 24px;
  padding: 0;
  font-size: 12px;
  background: #f5f7fa;
  border: none;
}

.project-actions .action-button:hover {
  background: #ecf5ff;
  color: #409eff;
}

.project-actions .delete-button:hover {
  background: #fef0f0;
  color: #f56c6c;
}

.project-item:hover .project-actions {
  opacity: 1;
}

.delete-warning {
  color: #F56C6C;
  margin-top: 8px;
  font-size: 14px;
}

.color-schemes {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.avatar-preview {
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-text {
  font-size: 14px;
  color: #606266;
}

.scheme-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.scheme-item {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
  opacity: 0.8;
}

.scheme-item:hover {
  transform: scale(1.1);
  opacity: 1;
}

.scheme-item.active {
  border-color: #409EFF;
  transform: scale(1.1);
  opacity: 1;
}

.preview-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
}

.project-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.3s;
  flex-shrink: 0;
}

.project-avatar .el-icon {
  font-size: 16px;
}

.project-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.project-tasks-count {
  font-size: 12px;
  color: #8c8c8c;
}

.collapsed .project-item {
  justify-content: center;
  padding: 8px 0;
}

.collapsed .project-info {
  justify-content: center;
}

.collapsed .project-avatar {
  margin: 0;
}

.collapsed .create-project .el-button {
  padding: 8px 0;
  justify-content: center;
}

.greeting {
  font-size: 14px;
  color: #606266;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 折叠状态下的样式 */
.collapsed .sidebar-header {
  padding: 16px 0;
}

.collapsed .header-content {
  justify-content: center;
}

.collapsed .collapse-btn {
  margin: 0;
}

.project-name {
  color: #409EFF;
  font-weight: bold;
}

/* 添加状态按钮的样式 */
.el-form-item :deep(.el-form-item__content) {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;
}

.el-button.is-plain {
  width: fit-content;
  margin-top: 8px;
}

.delete-confirm-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px 0;
}

.delete-icon {
  color: #F56C6C;
  flex-shrink: 0;
}

.delete-text {
  flex: 1;
}

.delete-title {
  font-size: 16px;
  margin-bottom: 8px;
  line-height: 1.5;
}

.highlight-text {
  color: #409EFF;
  font-weight: bold;
}

.delete-warning {
  color: #F56C6C;
  font-size: 14px;
  line-height: 1.5;
}

.list-section {
  margin-bottom: 16px;
}

.section-header {
  padding: 0 12px 8px;
}

.section-title {
  font-size: 12px;
  color: #909399;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.archived {
  opacity: 0.7;
}

.archived:hover {
  opacity: 1;
  background-color: #f5f7fa;
}

.archived.active {
  opacity: 1;
}

.archive-date {
  font-size: 12px;
  color: #909399;
}

.theme-switch {
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.theme-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  justify-content: flex-start;
  color: var(--el-text-color-regular);
}

.theme-text {
  font-size: 14px;
}

.collapsed .theme-btn {
  justify-content: center;
}

:deep(.el-dropdown-menu .el-icon) {
  margin-right: 8px;
  vertical-align: middle;
}

.create-project {
  padding: 12px;
  border-top: 1px solid #dcdfe6;
}

.bottom-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
}

:deep(.el-dropdown) {
  margin: 0;
  display: flex;
  flex: 1;
}

:deep(.el-dropdown .el-button) {
  width: 100%;
  margin: 0;
}

.bottom-actions.collapsed {
  flex-direction: column;
  gap: 12px;
}

.bottom-actions .el-button {
  flex: 1;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  min-width: 0;
  margin: 0;
}

.collapsed .bottom-actions .el-button {
  width: 32px;
  padding: 8px;
}

.collapsed :deep(.el-dropdown),
.collapsed :deep(.el-dropdown .el-button) {
  width: 32px;
}

.help-icon {
  margin-right: 8px;
  vertical-align: middle;
}

.help-icon {
  margin-left: 8px;
  font-size: 16px;
  color: var(--el-text-color-secondary);
  cursor: help;
}

.help-icon:hover {
  color: var(--el-color-primary);
}

.quick-access-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style> 