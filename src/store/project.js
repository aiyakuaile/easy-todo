import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import { storage } from '../utils/storage'

export const useProjectStore = defineStore('project', {
  state: () => ({
    projects: storage.getItem('projects') || [],
    archivedProjects: storage.getItem('archivedProjects') || [],
    tasks: storage.getItem('tasks') || [],
    currentProjectId: storage.getItem('currentProjectId') || '',
    taskOrders: storage.getItem('taskOrders') || {},
    projectFilters: storage.getItem('projectFilters') || {},
    collapsed: storage.getItem('sidebarCollapsed') || false,
  }),

  getters: {
    currentProject() {
      return this.getProject(this.currentProjectId)
    },
  },

  actions: {
    saveState() {
      storage.setItem('projects', this.projects)
      storage.setItem('archivedProjects', this.archivedProjects)
      storage.setItem('tasks', this.tasks)
      storage.setItem('currentProjectId', this.currentProjectId)
      storage.setItem('taskOrders', this.taskOrders)
      storage.setItem('projectFilters', this.projectFilters)
    },

    initDemoProject() {
      // 创建示例项目
      const project = {
        id: uuidv4(),
        name: '示例项目',
        icon: 'Document',
        createdAt: new Date().toISOString(),
        states: [
          { id: uuidv4(), name: '待办', color: '#909399' },
          { id: uuidv4(), name: '进行中', color: '#409EFF' },
          { id: uuidv4(), name: '已完成', color: '#67C23A' },
        ],
      }
      this.projects.push(project)
      this.currentProjectId = project.id

      // 先初始化任务顺序
      const [todoState, doingState, doneState] = project.states
      this.taskOrders = {
        [todoState.id]: [],
        [doingState.id]: [],
        [doneState.id]: [],
      }

      // 创建示例任务
      const demoTasks = [
        {
          id: uuidv4(),
          title: '完成项目初始化',
          content: '搭建项目基础架构，配置开发环境',
          tags: ['基础设施'],
          priority: '高',
          projectId: project.id,
          stateId: doneState.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: uuidv4(),
          title: '实现任务拖拽功能',
          content: '实现任务卡片拖拽，并提交产品验证',
          tags: ['功能开发', 'UI交互'],
          priority: '中',
          projectId: project.id,
          stateId: doingState.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: uuidv4(),
          title: '添加数据持久化',
          content: '将项目数据进行持久化保存',
          tags: ['功能开发'],
          priority: '低',
          projectId: project.id,
          stateId: todoState.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      this.tasks.push(...demoTasks)

      // 设置任务顺序
      Object.assign(this.taskOrders, {
        [todoState.id]: [demoTasks[2].id],
        [doingState.id]: [demoTasks[1].id],
        [doneState.id]: [demoTasks[0].id],
      })

      this.saveState()
    },

    addProject(project) {
      const newProject = {
        ...project,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        states: project.states.map(state => ({
          ...state,
          id: uuidv4(),
        })),
      }
      this.projects.push(newProject)
      // 为新项目的每个状态初始化任务顺序
      project.states.forEach(state => {
        if (!this.taskOrders[state.id]) {
          this.taskOrders[state.id] = []
        }
      })
      // 如果是第一个项目，自动设置为当前项目
      if (this.projects.length === 1) {
        this.currentProjectId = newProject.id
      }
      this.saveState()
    },

    setCurrentProject(projectId) {
      this.currentProjectId = projectId
      this.saveState()
    },

    updateProjectStates(projectId, states) {
      const project = this.projects.find(p => p.id === projectId)
      if (project) {
        // 保存旧状态ID映射，用于更新任务
        const oldStateMap = {}
        project.states.forEach(state => {
          oldStateMap[state.name] = state.id
        })

        // 更新项目状态
        project.states = states.map(state => ({
          ...state,
          id: oldStateMap[state.name] || uuidv4()
        }))

        // 更新任务顺序
        const newTaskOrders = {}
        project.states.forEach(state => {
          newTaskOrders[state.id] = this.taskOrders[oldStateMap[state.name]] || []
        })
        this.taskOrders = newTaskOrders

        this.saveState()
      }
    },

    toggleCollapse() {
      this.collapsed = !this.collapsed
      storage.setItem('sidebarCollapsed', this.collapsed)
    },

    addTask(task) {
      const newTask = {
        ...task,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      this.tasks.push(newTask)
      if (!this.taskOrders[newTask.stateId]) {
        this.taskOrders[newTask.stateId] = []
      }
      this.taskOrders[newTask.stateId].push(newTask.id)
      this.saveState()
    },

    updateTaskState(taskId, newStateId) {
      const task = this.tasks.find(t => t.id === taskId)
      if (task) {
        const oldStateId = task.stateId
        // 先从原状态的顺序列表中移除
        if (this.taskOrders[oldStateId]) {
          this.taskOrders[oldStateId] = this.taskOrders[oldStateId].filter(id => id !== taskId)
        }
        // 更新任务状态
        task.stateId = newStateId
        task.updatedAt = new Date().toISOString()
        // 确保新状态的顺序列表存在
        if (!this.taskOrders[newStateId]) {
          this.taskOrders[newStateId] = []
        }
        this.saveState()
      }
    },

    updateTask(taskId, updates) {
      const task = this.tasks.find(t => t.id === taskId)
      if (task) {
        Object.assign(task, updates)
        task.updatedAt = new Date().toISOString()
        this.saveState()
      }
    },

    deleteTask(taskId) {
      const task = this.tasks.find(t => t.id === taskId)
      if (task) {
        // 从任务列表中移除
        this.tasks = this.tasks.filter(t => t.id !== taskId)
        // 从任务顺序中移除
        if (this.taskOrders[task.stateId]) {
          this.taskOrders[task.stateId] = this.taskOrders[task.stateId].filter(id => id !== taskId)
        }
        this.saveState()
      }
    },

    updateProject(projectId, updates) {
      const project = this.projects.find(p => p.id === projectId)
      if (project) {
        Object.assign(project, updates)
        this.saveState()
      }
    },

    deleteProject(projectId) {
      // 删除项目
      this.projects = this.projects.filter(p => p.id !== projectId)
      // 删除相关任务
      this.tasks = this.tasks.filter(t => t.projectId !== projectId)
      // 删除相关任务顺序
      const project = this.projects.find(p => p.id === projectId)
      if (project) {
        project.states.forEach(state => {
          delete this.taskOrders[state.id]
        })
      }
      // 如果删除的是当前项目，重置当前项目ID
      if (this.currentProjectId === projectId) {
        this.currentProjectId = this.projects[0]?.id || ''
      }
      this.saveState()
    },

    updateProjectInfo(projectId, updates) {
      const project = this.projects.find(p => p.id === projectId)
      if (project) {
        Object.assign(project, updates)
        this.saveState()
      }
    },

    // 归档项目
    archiveProject(projectId) {
      const project = this.projects.find(p => p.id === projectId)
      if (project) {
        // 保存相关任务
        const projectTasks = this.tasks.filter(t => t.projectId === projectId)
        
        // 从活动项目中移除
        this.projects = this.projects.filter(p => p.id !== projectId)
        
        // 添加到归档项目
        this.archivedProjects.push({
          ...project,
          tasks: projectTasks,  // 保存项目相关的任务
          taskOrders: {  // 保存任务顺序
            ...this.taskOrders
          },
          archivedAt: new Date().toISOString()
        })
        
        // 从主任务列表中移除已归档项目的任务
        this.tasks = this.tasks.filter(t => t.projectId !== projectId)
        
        // 清理任务顺序
        project.states.forEach(state => {
          delete this.taskOrders[state.id]
        })
        
        // 如果归档的是当前项目，重置当前项目ID
        if (this.currentProjectId === projectId) {
          this.currentProjectId = this.projects[0]?.id || ''
        }
        
        this.saveState()
      }
    },

    // 获取项目（包括归档的项目）
    getProject(projectId) {
      return this.projects.find(p => p.id === projectId) || 
             this.archivedProjects.find(p => p.id === projectId)
    },

    // 设置项目的筛选条件
    setProjectFilter(projectId, filters) {
      if (!this.projectFilters) {
        this.projectFilters = {}
      }
      if (!this.projectFilters[projectId]) {
        this.projectFilters[projectId] = {}
      }
      this.projectFilters[projectId] = { ...filters }
      this.saveState()
    },

    // 清除项目的筛选条件
    clearProjectFilter(projectId) {
      if (!this.projectFilters) {
        this.projectFilters = {}
        return
      }
      if (this.projectFilters[projectId]) {
        this.projectFilters[projectId] = {
          text: '',
          priority: '',
          isFiltering: false
        }
        this.saveState()
      }
    },

    // 删除归档项目
    deleteArchivedProject(projectId) {
      // 从归档项目列表中移除
      this.archivedProjects = this.archivedProjects.filter(p => p.id !== projectId)
      // 如果删除的是当前项目，重置当前项目ID
      if (this.currentProjectId === projectId) {
        this.currentProjectId = this.projects[0]?.id || ''
      }
      // 清除该项目的筛选条件
      if (this.projectFilters[projectId]) {
        delete this.projectFilters[projectId]
      }
      this.saveState()
    },
  },
}) 