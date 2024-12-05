<template>
  <div class="task-board">
    <div v-if="currentProject" class="board-content">
      <!-- 看板头部 -->
      <div class="board-header">
        <div class="header-top">
          <div class="project-info">
            <h2 class="project-title">{{ currentProject.name }}</h2>
          <div class="header-actions">
            <div class="filter-bar">
              <el-input
                v-model="filterText"
                placeholder="搜索任务"
                clearable
                @input="handleSearch"
              />
              <el-select v-model="filterPriority" placeholder="优先级" clearable @change="handleSearch">
                <el-option label="高" value="高" />
                <el-option label="中" value="中" />
                <el-option label="低" value="低" />
              </el-select>
              <el-button @click="handleReset">
                <el-icon><RefreshRight /></el-icon>
                重置
              </el-button>
            </div>
          </div>
          </div>
          <div class="board-actions">
            <el-button
              type="primary"
              plain
              @click="toggleStatistics"
            >
              <el-icon><DataLine /></el-icon>
              统计分析
            </el-button>
            <el-dropdown @command="handleExport">
              <el-button type="primary" plain>
                <el-icon><Download /></el-icon>
                导出任务
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="all">导出全部字段</el-dropdown-item>
                  <el-dropdown-item command="basic">导出基本信息</el-dropdown-item>
                  <el-dropdown-item command="custom">自定义导出</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <template v-if="!isArchived">
              <el-dropdown @command="handleImport">
                <el-button type="primary" plain>
                  <el-icon><Upload /></el-icon>
                  导入任务
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="template">下载导入模板</el-dropdown-item>
                    <el-dropdown-item command="import">导入任务</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-button 
                type="primary" 
                @click="showCreateTaskDialog"
              >
                <el-icon><Plus /></el-icon>
                创建任务
              </el-button>
              <el-button 
                type="info" 
                @click="confirmArchive"
              >
                <el-icon><Box /></el-icon>
                归档项目
              </el-button>
            </template>
            <el-button v-else type="info" plain disabled>
              <el-icon><Lock /></el-icon>
              已归档
            </el-button>
          </div>
        </div>
      </div>

      <!-- 看板列表 -->
      <div class="board-columns">
        <div
          v-for="state in currentProject.states"
          :key="state.id"
          class="board-column"
          :data-state-id="state.id"
          :style="{ borderTopColor: state.color }"
        >
          <div class="column-header">
            <span class="state-name">{{ state.name }}</span>
            <span class="task-count">{{ getStateTaskCount(state.id) }}</span>
          </div>
          <div class="task-list-container">
            <draggable
              v-model="filteredTasksMap[state.id]"
              group="tasks"
              :animation="150"
              ghost-class="ghost-card"
              class="task-list"
              :disabled="isArchived || hasActiveFilters"
              @change="handleTaskMove"
              @start="handleDragStart"
              item-key="id"
              @scroll="handleScroll($event, state.id)"
            >
              <template #item="{element: task}">
                <div class="task-card">
                  <div class="task-header">
                    <div class="task-title-wrapper">
                      <span class="task-title">{{ task.title }}</span>
                      <div v-if="!isArchived" class="task-actions">
                        <el-button
                          type="text"
                          size="small"
                          class="action-button"
                          circle
                          @click.prevent.stop="editTask(task)"
                        >
                          <el-icon><Edit /></el-icon>
                        </el-button>
                        <el-button
                          type="text"
                          size="small"
                          class="action-button delete-button"
                          circle
                          @click.prevent.stop="confirmDelete(task)"
                        >
                          <el-icon><Delete /></el-icon>
                        </el-button>
                      </div>
                    </div>
                    <el-tag size="small" :disable-transitions="true" :type="getPriorityType(task.priority)">
                      {{ task.priority }}
                    </el-tag>
                  </div>
                  <p class="task-content">{{ task.content }}</p>
                  <div class="task-tags">
                    <el-tag
                      v-for="(tag, index) in task.tags"
                      :key="tag"
                      size="small"
                      effect="plain"
                      :disable-transitions="true"
                      :style="{
                        backgroundColor: TAG_COLORS[index % TAG_COLORS.length].bg,
                        color: TAG_COLORS[index % TAG_COLORS.length].text,
                        borderColor: 'transparent',
                      }"
                    >
                      {{ tag }}
                    </el-tag>
                  </div>
                  <div class="task-meta">
                    <span class="time-info">
                      <el-icon><Timer /></el-icon>
                      创建于 {{ formatDateTime(task.createdAt) }}
                    </span>
                    <span class="time-info">
                      <el-icon><Refresh /></el-icon>
                      更新于 {{ formatDateTime(task.updatedAt) }}
                    </span>
                  </div>
                </div>
              </template>
              <template #header v-if="hasActiveFilters && !filteredTasksMap[state.id].length">
                <div class="empty-search-result">
                  <el-empty
                    :image-size="60"
                    description="没有找到符合条件的任务"
                  >
                    <template #image>
                      <el-icon :size="40" class="empty-icon"><Search /></el-icon>
                    </template>
                  </el-empty>
                </div>
              </template>
              <template #footer v-else-if="!filteredTasksMap[state.id].length && isArchived">
                <div class="empty-archived-state">
                  <el-icon :size="24"><Lock /></el-icon>
                  <span>暂无任务</span>
                </div>
              </template>
            </draggable>
            <el-button
              v-show="showBackTopMap[state.id]"
              class="back-to-top"
              circle
              size="small"
              @click="scrollToTop(state.id)"
            >
              <el-icon><CaretTop /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="empty-tip">
      请先创建或选择一个项目
    </div>

    <!-- 创建任务对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="创建任务"
      width="500px"
      :close-on-click-modal="true"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入任务标题" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            rows="3"
            placeholder="请输入任务内"
          />
        </el-form-item>
        <el-form-item label="标签">
          <div class="dynamic-tags">
            <el-tag
              v-for="(tag, index) in form.tags"
              :key="tag"
              class="tag"
              closable
              :disable-transitions="true"
              :style="{
                backgroundColor: TAG_COLORS[index % TAG_COLORS.length].bg,
                color: TAG_COLORS[index % TAG_COLORS.length].text,
                borderColor: 'transparent'
              }"
              @close="removeTag(tag)"
            >
              {{ tag }}
            </el-tag>
            <el-input
              v-if="inputVisible"
              ref="tagInputRef"
              v-model="inputValue"
              class="tag-input"
              size="small"
              @keyup.enter="handleInputConfirm"
              @blur="handleInputConfirm"
            />
            <el-button
              v-else
              class="button-new-tag"
              size="small"
              @click="showInput"
            >
              + 添加标签
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="form.priority" placeholder="请选择优先级">
            <el-option label="低" value="低" />
            <el-option label="中" value="中" />
            <el-option label="高" value="高" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createTask">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加编辑任务对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑任务"
      width="500px"
      :close-on-click-modal="true"
    >
      <el-form ref="editFormRef" :model="editForm" :rules="rules" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="editForm.title" placeholder="请输入任务标题" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="editForm.content"
            type="textarea"
            rows="3"
            placeholder="请输入任务内容"
          />
        </el-form-item>
        <el-form-item label="标签">
          <div class="dynamic-tags">
            <el-tag
              v-for="(tag, index) in editForm.tags"
              :key="tag"
              class="tag"
              closable
              :disable-transitions="true"
              :style="{
                backgroundColor: TAG_COLORS[index % TAG_COLORS.length].bg,
                color: TAG_COLORS[index % TAG_COLORS.length].text,
                borderColor: 'transparent'
              }"
              @close="removeEditTag(tag)"
            >
              {{ tag }}
            </el-tag>
            <el-input
              v-if="editInputVisible"
              ref="editTagInputRef"
              v-model="editInputValue"
              class="tag-input"
              size="small"
              @keyup.enter="handleEditInputConfirm"
              @blur="handleEditInputConfirm"
            />
            <el-button
              v-else
              class="button-new-tag"
              size="small"
              @click="showEditInput"
            >
              + 添加标签
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="editForm.priority" placeholder="请选择优先级">
            <el-option label="低" value="低" />
            <el-option label="中" value="" />
            <el-option label="" value="高" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="updateTask">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="删除任务"
      width="400px"
      align-center
      :close-on-click-modal="true"
    >
      <div class="delete-confirm-content">
        <el-icon class="delete-icon" :size="48"><Warning /></el-icon>
        <div class="delete-text">
          <p class="delete-title">确定要除务"<span class="highlight-text">{{ taskToDelete?.title }}</span>"吗？</p>
          <p class="delete-warning">删除后将无法恢复！</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="deleteTask">确定删除</el-button>
      </template>
    </el-dialog>

    <!-- 添加归确认对话框 -->
    <el-dialog
      v-model="archiveDialogVisible"
      title="归档"
      width="400px"
      align-center
      :close-on-click-modal="true"
    >
      <div class="delete-confirm-content">
        <el-icon class="delete-icon" :size="48"><InfoFilled /></el-icon>
        <div class="delete-text">
          <p class="delete-title">确定要归档项目"<span class="highlight-text">{{ currentProject?.name }}</span>"吗？</p>
          <p class="delete-warning">归档后项目将变为只读状态，不能进行任何修改！</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="archiveDialogVisible = false">消</el-button>
        <el-button type="info" @click="archiveProject">确定归档</el-button>
      </template>
    </el-dialog>

    <!-- 统计分对话框 -->
    <el-dialog
      v-model="showStatistics"
      title="项目统计分析"
      width="80%"
      style="min-width: 800px"
      :close-on-click-modal="true"
      class="statistics-dialog"
    >
      <task-statistics />
    </el-dialog>

    <!-- 定导出对话框 -->
    <el-dialog
      v-model="exportDialogVisible"
      title="自定义导出字段"
      width="400px"
      :close-on-click-modal="true"
    >
      <el-checkbox-group v-model="selectedFields">
        <div class="export-fields">
          <el-checkbox label="title">题</el-checkbox>
          <el-checkbox label="content">内容</el-checkbox>
          <el-checkbox label="priority">优先级</el-checkbox>
          <el-checkbox label="state">状态</el-checkbox>
          <el-checkbox label="tags">标签</el-checkbox>
          <el-checkbox label="createdAt">创建间</el-checkbox>
          <el-checkbox label="updatedAt">更新时间</el-checkbox>
        </div>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="exportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCustomExport">确定导</el-button>
      </template>
    </el-dialog>

    <!-- 导入文选择器 -->
    <input
      ref="fileInputRef"
      type="file"
      accept=".xlsx,.xls"
      style="display: none"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue'
import { nextTick } from 'vue'
import { useProjectStore } from '../store/project'
import draggable from 'vuedraggable'
import { Plus, Edit, Delete, Warning, Box, InfoFilled, Lock, Search, RefreshRight, Timer, Refresh, DataLine, Download, ArrowDown, Upload, CaretTop } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import TaskStatistics from './TaskStatistics.vue'
import { exportProjectTasks, getImportTemplate, parseImportFile } from '../utils/export'
import { useDebounceFn } from '@vueuse/core'
import { formatDateTime } from '../utils/date'

const store = useProjectStore()

// 务单
const dialogVisible = ref(false)
const formRef = ref(null)
const tagInputRef = ref(null)
const editTagInputRef = ref(null)
const inputVisible = ref(false)
const editInputVisible = ref(false)
const inputValue = ref('')
const editInputValue = ref('')

const form = reactive({
  title: '',
  content: '',
  tags: [],
  priority: '中',
})

const rules = {
  title: [{ required: true, message: '请输入任务标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输任务内容', trigger: 'blur' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
}

// 所有已使的标签
const allTags = computed(() => {
  const tags = new Set()
  store.tasks.forEach(task => {
    task.tags.forEach(tag => tags.add(tag))
  })
  return Array.from(tags)
})

// 按状分组的任务
const stateTasksMap = computed(() => {
  const map = {}
  const currentProject = store.getProject(store.currentProjectId)
  if (currentProject) {
    const isArchived = store.archivedProjects.some(p => p.id === currentProject.id)
    const tasks = isArchived ? currentProject.tasks : store.tasks
    const taskOrders = isArchived ? currentProject.taskOrders : store.taskOrders

    currentProject.states.forEach(state => {
      map[state.id] = []
      // 如果没有顺序记录，按��认序显示
      if (!taskOrders[state.id]) {
        map[state.id] = tasks.filter(task => 
          task.projectId === currentProject.id && task.stateId === state.id
        )
      } else {
        // 有顺序记录则按记录的顺序显示
        map[state.id] = taskOrders[state.id]
          .map(id => tasks.find(task => task.id === id))
          .filter(task => task && task.projectId === currentProject.id)
      }
    })
  }
  return map
})

// 获取每个状态的任务数量
const getStateTaskCount = (stateId) => {
  return (stateTasksMap.value[stateId] || []).length
}

// 获取优先对应类型
const getPriorityType = (priority) => {
  const types = {
    '低': 'info',
    '中': 'warning',
    '高': 'danger'
  }
  return types[priority]
}

// 显示创任务对话框
const showCreateTaskDialog = () => {
  dialogVisible.value = true
}

// 创建任务
const createTask = async () => {
  if (!formRef.value) return

  await formRef.value.validate((valid) => {
    if (valid) {
      const firstState = store.currentProject.states[0]
      store.addTask({
        ...form,
        projectId: store.currentProject.id,
        stateId: firstState.id,
      })
      dialogVisible.value = false
      // 重表单
      form.title = ''
      form.content = ''
      form.tags = []
      form.priority = '中'
    }
  })
}

// 检查是否有活动的筛选条件
const hasActiveFilters = computed(() => {
  const currentFilters = store.projectFilters[currentProject.value?.id]
  return currentFilters?.isFiltering || false
})

// 处拖拽开
const handleDragStart = (evt) => {
  if (hasActiveFilters.value) {
    evt.preventDefault()
    ElMessage({
      type: 'warning',
      message: '请先重置搜索条件，再进行拖拽操作'
    })
  }
}

// 处理任务动
const handleTaskMove = (evt) => {
  if (hasActiveFilters.value) {
    return
  }

  if (evt.added) {
    // 处理跨列拖拽
    const task = evt.added.element
    const newIndex = evt.added.newIndex
    const newStateId = Object.keys(stateTasksMap.value).find(
      key => stateTasksMap.value[key].includes(task)
    )

    // 更新任务状态
    store.updateTaskState(task.id, newStateId)
    
    // 获取目列的任务
    const targetTasks = stateTasksMap.value[newStateId]
    
    // 在正确的置插入任务
    const newOrder = [
      ...targetTasks.slice(0, newIndex),
      task,
      ...targetTasks.slice(newIndex)
    ].map(t => t.id)
    
    // 更新目列的顺序
    store.taskOrders[newStateId] = newOrder
    store.saveState()
  } else if (evt.moved) {
    // 处理同列内排序
    const task = evt.moved.element
    const stateId = task.stateId
    store.taskOrders[stateId] = stateTasksMap.value[stateId].map(task => task.id)
    store.saveState()
  }
}

// 编辑任务相
const editDialogVisible = ref(false)
const editFormRef = ref(null)
const editForm = reactive({
  id: '',
  title: '',
  content: '',
  tags: [],
  priority: '',
})

const editTask = (task) => {
  editForm.id = task.id
  editForm.title = task.title
  editForm.content = task.content
  editForm.tags = [...task.tags]
  editForm.priority = task.priority
  editDialogVisible.value = true
}

const updateTask = async () => {
  if (!editFormRef.value) return

  await editFormRef.value.validate((valid) => {
    if (valid) {
      store.updateTask(editForm.id, {
        title: editForm.title,
        content: editForm.content,
        tags: editForm.tags,
        priority: editForm.priority,
      })
      editDialogVisible.value = false
    }
  })
}

// 删除任务相关
const deleteDialogVisible = ref(false)
const taskToDelete = ref(null)

const confirmDelete = (task) => {
  taskToDelete.value = task
  deleteDialogVisible.value = true
}

const deleteTask = () => {
  if (taskToDelete.value) {
    store.deleteTask(taskToDelete.value.id)
    deleteDialogVisible.value = false
    taskToDelete.value = null
    ElMessage({
      type: 'success',
      message: '任务已删除'
    })
  }
}

// 标签相关方法
const MAX_TAGS = 5
const TAG_COLORS = [
  { bg: '#e8f4ff', text: '#409EFF' }, // 色
  { bg: '#f0f9eb', text: '#67C23A' }, // 绿色
  { bg: '#fff7e6', text: '#fa8c16' }, // 橙色
  { bg: '#fff1f0', text: '#f5222d' }, // 红色
  { bg: '#f9f0ff', text: '#722ed1' }, // 紫色
]

const removeTag = (tag) => {
  form.tags = form.tags.filter(t => t !== tag)
}

const showInput = () => {
  if (form.tags.length >= MAX_TAGS) {
    ElMessage({
      type: 'warning',
      message: `最多只能添加${MAX_TAGS}个签`
    })
    return
  }
  inputVisible.value = true
  nextTick().then(() => {
    tagInputRef.value.input.focus()
  })
}

const handleInputConfirm = () => {
  if (inputValue.value) {
    if (form.tags.length >= MAX_TAGS) {
      ElMessage({
        type: 'warning',
        message: `最多只能添加${MAX_TAGS}个标签`
      })
      inputVisible.value = false
      inputValue.value = ''
      return
    }
    if (!form.tags.includes(inputValue.value)) {
      form.tags.push(inputValue.value)
    }
  }
  inputVisible.value = false
  inputValue.value = ''
}

// 编表单的标签方法
const removeEditTag = (tag) => {
  editForm.tags = editForm.tags.filter(t => t !== tag)
}

const showEditInput = () => {
  if (editForm.tags.length >= MAX_TAGS) {
    ElMessage({
      type: 'warning',
      message: `最多只能添加${MAX_TAGS}个标签`
    })
    return
  }
  editInputVisible.value = true
  nextTick().then(() => {
    editTagInputRef.value.input.focus()
  })
}

const handleEditInputConfirm = () => {
  if (editInputValue.value) {
    if (editForm.tags.length >= MAX_TAGS) {
      ElMessage({
        type: 'warning',
        message: `最多只能添加${MAX_TAGS}个标签`
      })
      editInputVisible.value = false
      editInputValue.value = ''
      return
    }
    if (!editForm.tags.includes(editInputValue.value)) {
      editForm.tags.push(editInputValue.value)
    }
  }
  editInputVisible.value = false
  editInputValue.value = ''
}

// 归档项目
const archiveDialogVisible = ref(false)

const confirmArchive = () => {
  archiveDialogVisible.value = true
}

const archiveProject = () => {
  store.archiveProject(store.currentProject.id)
  archiveDialogVisible.value = false
  ElMessage({
    type: 'success',
    message: '项目已归档'
  })
}

const isArchived = computed(() => {
  return store.archivedProjects.some(p => p.id === currentProject.value?.id)
})

const currentProject = computed(() => store.currentProject)

// 搜索相关
const filterText = ref('')
const filterPriority = ref('')

// 监听当前项目变化，重置搜索条件
watch(() => currentProject.value?.id, (newProjectId, oldProjectId) => {
  if (newProjectId !== oldProjectId) {
    // 搜索条件
    filterText.value = ''
    filterPriority.value = ''
    // 清除上一个项目的筛选条件（如果有）
    if (oldProjectId) {
      store.clearProjectFilter(oldProjectId)
    }
  }
})

// 处理搜索
const handleSearch = useDebounceFn(() => {
  if (!currentProject.value?.id) return

  store.setProjectFilter(currentProject.value.id, {
    text: filterText.value,
    priority: filterPriority.value,
    isFiltering: !!(filterText.value || filterPriority.value)
  })
}, 300)

// 处理重置
const handleReset = () => {
  if (!currentProject.value?.id) return

  filterText.value = ''
  filterPriority.value = ''
  store.clearProjectFilter(currentProject.value.id)
  if(isArchived.value) return
  nextTick(() => {
    ElMessage({
      type: 'success',
      message: '已重置搜索条件，可以进行拖拽操作'
    })
  })
}

// 筛选后的任务列表
const filteredTasksMap = computed(() => {
  // 使用 Map 缓存计算结果
  const cache = new Map()
  
  if (!currentProject.value?.id) {
    return stateTasksMap.value
  }

  const currentFilters = store.projectFilters[currentProject.value?.id]
  if (!currentFilters?.isFiltering) {
    return stateTasksMap.value
  }

  const map = {}
  Object.keys(stateTasksMap.value).forEach(stateId => {
    const cacheKey = `${stateId}-${currentFilters.text}-${currentFilters.priority}`
    if (cache.has(cacheKey)) {
      map[stateId] = cache.get(cacheKey)
      return
    }

    map[stateId] = stateTasksMap.value[stateId].filter(task => {
      const textMatch = !currentFilters.text || 
        task.title.toLowerCase().includes(currentFilters.text.toLowerCase()) ||
        task.content.toLowerCase().includes(currentFilters.text.toLowerCase())
      
      const priorityMatch = !currentFilters.priority || task.priority === currentFilters.priority
      
      return textMatch && priorityMatch
    })

    cache.set(cacheKey, map[stateId])
  })
  
  return map
})

// 切换计图
const showStatistics = ref(false)
const toggleStatistics = () => {
  showStatistics.value = !showStatistics.value
}

// 导出任务
const exportDialogVisible = ref(false)
const selectedFields = ref(['title', 'content', 'priority', 'state'])

const handleExport = (command) => {
  const project = currentProject.value
  const tasks = isArchived.value ? project.tasks : store.tasks.filter(t => t.projectId === project.id)

  switch (command) {
    case 'all':
      exportProjectTasks(project, tasks)
      break
    case 'basic':
      exportProjectTasks(project, tasks, {
        includeFields: ['title', 'content', 'priority', 'state']
      })
      break
    case 'custom':
      exportDialogVisible.value = true
      break
  }
}

const handleCustomExport = () => {
  const project = currentProject.value
  const tasks = isArchived.value ? project.tasks : store.tasks.filter(t => t.projectId === project.id)
  
  exportProjectTasks(project, tasks, {
    includeFields: selectedFields.value
  })
  
  exportDialogVisible.value = false
  ElMessage({
    type: 'success',
    message: '导出成功'
  })
}

// 导入相关
const fileInputRef = ref(null)

const handleImport = (command) => {
  if (command === 'template') {
    getImportTemplate()
  } else if (command === 'import') {
    fileInputRef.value.click()
  }
}

const handleFileChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    const tasks = await parseImportFile(file)
    if (!tasks.length) {
      ElMessage.warning('文件中没有找到有效的任务数据')
      return
    }

    // 获取默认状态ID（通常是"待办"状态）
    const defaultState = currentProject.value.states[0]
    
    // 批量创建任务
    tasks.forEach(task => {
      // 查应的状态ID
      const state = currentProject.value.states.find(s => s.name === task.state)
      
      store.addTask({
        ...task,
        projectId: currentProject.value.id,
        stateId: state?.id || defaultState.id
      })
    })

    ElMessage.success(`成功导入 ${tasks.length} 个任务`)
  } catch (error) {
    ElMessage.error(error.message)
  }

  // 重置文件输框
  event.target.value = ''
}

// 回到顶部相关
const showBackTopMap = ref({})
const scrollThreshold = 200 // 显示回到顶部按钮的滚动阈值

const handleScroll = (event, stateId) => {
  const target = event.target
  showBackTopMap.value[stateId] = target.scrollTop > scrollThreshold
}

const scrollToTop = (stateId) => {
  const taskList = document.querySelector(`.board-column[data-state-id="${stateId}"] .task-list`)
  if (taskList) {
    taskList.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }
}
</script>

<style scoped>
.task-board {
  flex: 1;
  padding: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.board-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.board-columns {
  flex: 1;
  display: flex;
  gap: 20px;
  overflow-x: auto;
  min-height: 0;
}

.board-column {
  flex: 1;
  min-width: 300px;
  background: #fff;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  max-height: 100%;
  border: 1px solid var(--el-border-color-light);
  border-top: 6px solid;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.column-header {
  padding: 12px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.01));
  position: relative;
  z-index: 1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.task-count {
  background: rgba(0, 0, 0, 0.06);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 12px;
  color: #909399;
}

.task-card {
  margin-bottom: 8px;
  padding: 12px;
  background: #fff;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  cursor: v-bind('isArchived ? "default" : "move"');
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.task-card:last-child {
  margin-bottom: 0;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  position: relative;
}

.task-title {
  font-weight: 500;
}

.task-content {
  color: #606266;
  font-size: 14px;
  margin-bottom: 8px;
}

.task-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.task-tags .el-tag {
  background-color: rgba(255, 255, 255, 0.9);
}

.ghost-card {
  opacity: 0.5;
  background: #f2f6fc;
  border: 2px dashed var(--el-color-primary);
}

.empty-tip {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 14px;
}

.task-title-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
  flex: 1;
}

.task-actions {
  display: flex;
  gap: 8px;
  z-index: 1;
  margin-right: 12px;
}

.task-actions .el-button {
  opacity: 0;
  transition: all 0.3s;
  width: 24px;
  height: 24px;
  padding: 0;
  font-size: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  border: none;
}

.task-actions .action-button:hover {
  background: #ecf5ff;
  color: #409eff;
}

.task-actions .delete-button:hover {
  background: #fef0f0;
  color: #f56c6c;
}

.task-card:hover .task-actions .el-button {
  opacity: 1;
}

.task-card {
  position: relative;
}

.task-header {
  position: relative;
}

.task-list {
  flex: 1;
  overflow-y: auto;
  min-height: 100px;
  padding: 8px;
  max-height: calc(100vh - 160px);
  scrollbar-width: thin;
  scrollbar-color: rgba(144, 147, 153, 0.1) transparent;
  padding-top: 12px;
}

.task-list.sortable-ghost {
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
  min-height: 100%;
}

/* Webkit (Chrome/Safari/Edge) 滚动条样式 */
.task-list::-webkit-scrollbar {
  width: 4px;
}

.task-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.02);
}

.task-list::-webkit-scrollbar-thumb {
  background-color: rgba(144, 147, 153, 0.1);
  border-radius: 3px;
}

.task-list::-webkit-scrollbar-thumb:hover {
  background-color: rgba(144, 147, 153, 0.2);
}

.task-list:empty::after {
  content: attr(data-empty-text);
  font-size: 14px;
}

.task-header .el-tag {
  flex-shrink: 0;
}

.dynamic-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.tag-input {
  width: 90px;
  margin-left: 0;
  vertical-align: bottom;
}

.button-new-tag {
  margin-left: 0;
  height: 24px;
  padding-top: 0;
  padding-bottom: 0;
}

.dynamic-tags .el-tag {
  --el-tag-close-hover-color: currentColor;
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

.board-actions {
  display: flex;
  gap: 12px;
}

.archive-status {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background-color: #f4f4f5;
  border-radius: 4px;
  color: #909399;
  font-size: 14px;
}

.archive-status .el-icon {
  font-size: 16px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  width: 100%;
}

.project-info {
  display: flex;
  align-items: center;
  gap: 24px;
}

.project-title {
  margin: 0;
  font-size: 24px;
  white-space: nowrap;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 24px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-bar .el-input {
  width: 200px;
}

.filter-bar .el-select {
  width: 160px;
}

.empty-search-result {
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.empty-search-result .empty-icon {
  color: #909399;
  opacity: 0.7;
}

.empty-archived-state {
  height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
  color: #909399;
  font-size: 14px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin: 8px;
}

.empty-archived-state .el-icon {
  opacity: 0.7;
}

.task-meta {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid #ebeef5;
  display: flex;
  gap: 16px;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  font-size: 12px;
}

.time-info .el-icon {
  font-size: 14px;
}

.statistics-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.export-fields {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.archive-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  font-size: 13px;
  border-style: dashed;
}

.archive-tag .el-icon {
  font-size: 14px;
  margin-right: 2px;
}

/* 暗色模式下的标题栏样式 */
html.dark .column-header {
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01));
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

html.dark .task-count {
  background: rgba(255, 255, 255, 0.08);
}

.task-list-container {
  position: relative;
  flex: 1;
  overflow: hidden;
  display: flex;
}

.back-to-top {
  position: absolute;
  right: 16px;
  bottom: 16px;
  background-color: var(--el-color-primary);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  width: 32px;
  height: 32px;
  transform: translateY(0);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.back-to-top:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(64, 158, 255, 0.4);
}

/* 暗色模式下的到顶部按钮样式 */
html.dark .back-to-top {
  background-color: var(--el-color-primary-dark-2);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

html.dark .back-to-top:hover {
  box-shadow: 0 8px 16px rgba(64, 158, 255, 0.3);
}

.back-to-top .el-icon {
  font-size: 16px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-3px);
  }
  60% {
    transform: translateY(-1.5px);
  }
}

/* 确保拖拽区域可以接收拖放 */
.task-list.sortable-ghost {
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
  min-height: 100%;
}

/* 拖拽时的跟随元素样式 */
.sortable-drag {
  opacity: 0.8;
  background: #fff;
  transform: rotate(2deg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  height: auto !important;
  width: calc(100% - 16px) !important;
}

.sortable-drag .task-card {
  margin: 0;
  height: auto;
}

/* 归档状态下的任务卡片样式 */
.task-card {
  position: relative;
  cursor: default;  /* 归档状态移除移动光标 */
}

/* 归档状态下的任务卡片悬停效果 */
:deep(.sortable-ghost) {
  display: none;  /* 归档状态下禁用拖拽效果 */
}

.task-actions {
  display: flex;
  gap: 8px;
  z-index: 1;
  margin-right: 12px;
}

.task-actions .el-button {
  opacity: 0;
  transition: all 0.3s;
  width: 24px;
  height: 24px;
  padding: 0;
  font-size: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  border: none;
}

.task-actions .action-button:hover {
  background: #ecf5ff;
  color: #409eff;
}

.task-actions .delete-button:hover {
  background: #fef0f0;
  color: #f56c6c;
}

/* 非归档状态下显示操作按钮 */
.task-card:not(.archived):hover .task-actions .el-button {
  opacity: 1;
}
</style> 