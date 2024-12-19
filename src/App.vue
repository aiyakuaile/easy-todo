<template>
  <div class="app" :class="{ 'dark': isDark }">
    <ProjectSidebar />
    <TaskBoard />
  </div>
</template>

<script setup>
import ProjectSidebar from './components/ProjectSidebar.vue'
import TaskBoard from './components/TaskBoard.vue'
import { useProjectStore } from './store/project'
import { onMounted, onBeforeMount } from 'vue'

const store = useProjectStore()

// 监听插件进入
onBeforeMount(() => {
  if (typeof utools !== 'undefined') {
    utools.onPluginEnter(({ code, type, payload }) => {
      console.log('Plugin entered:', { code, type, payload })

      if (code.startsWith('project_')) {
        // 通过快速访问进入，选中指定项目
        const projectId = code.replace('project_', '')
        console.log('Selecting project by quick access:', projectId)
        store.setCurrentProject(projectId)
      } else if (code === 'todo') {
        // 普通进入，选中第一个非归档项目（按显示顺序）
        const sortedProjects = [...store.projects].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        )
        const firstProject = sortedProjects[0]
        console.log('Selecting first project on normal entry:', firstProject)
        if (firstProject) {
          console.log('Selecting first project:', firstProject.id)
          store.setCurrentProject(firstProject.id)
        }
      }
    })
  }
})

onMounted(() => {
  if (store.projects.length === 0) {
    store.initDemoProject()
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
}

.app {
  display: flex;
  min-height: 100vh;
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

.theme-switch {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

/* 暗色主题变量 */
html.dark {
  --el-bg-color: #1a1a1a;
  --el-bg-color-overlay: #242424;
  --el-text-color-primary: #e5eaf3;
  --el-text-color-regular: #cfd3dc;
  --el-text-color-secondary: #a3a6ad;
  --el-border-color: #4c4d4f;
  --el-border-color-light: #363637;
  --el-fill-color-blank: #242424;
  --el-fill-color: #303030;
  --el-fill-color-light: #262727;
  --el-mask-color: rgba(0, 0, 0, 0.8);
}

/* 暗色主题样式覆盖 */
html.dark .task-card {
  background: var(--el-bg-color-overlay);
  border-color: var(--el-border-color);
}

html.dark .board-column {
  background: var(--el-bg-color-overlay);
}

html.dark .task-content {
  color: var(--el-text-color-regular);
}

html.dark .task-actions .el-button {
  background: var(--el-fill-color);
}

html.dark .task-meta {
  border-color: var(--el-border-color-light);
}

html.dark .empty-search-result,
html.dark .empty-archived-state {
  background-color: var(--el-fill-color);
}

html.dark .project-sidebar {
  background-color: var(--el-bg-color-overlay);
  border-color: var(--el-border-color);
}

html.dark .sidebar-header {
  border-color: var(--el-border-color);
}

html.dark .project-item:hover {
  background-color: var(--el-fill-color);
}

html.dark .project-item.active {
  background-color: var(--el-color-primary-light-9);
}

html.dark .create-project {
  border-color: var(--el-border-color);
}

.el-dropdown-menu .el-icon {
  margin-right: 8px;
  vertical-align: middle;
}

.el-dropdown-menu .el-dropdown-item {
  display: flex;
  align-items: center;
}
</style> 