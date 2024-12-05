import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取任务状态名称
const getStateName = (task, project) => {
  const state = project.states.find(s => s.id === task.stateId)
  return state ? state.name : ''
}

// 导出项目任务
export const exportProjectTasks = (project, tasks, options = {}) => {
  const {
    includeFields = ['title', 'content', 'priority', 'state', 'tags', 'createdAt', 'updatedAt']
  } = options

  // 字段映射
  const fieldMap = {
    title: '标题',
    content: '内容',
    priority: '优先级',
    state: '状态',
    tags: '标签',
    createdAt: '创建时间',
    updatedAt: '更新时间'
  }

  // 准备表头
  const headers = includeFields.map(field => fieldMap[field])

  // 准备数据
  const data = tasks.map(task => {
    const row = {}
    includeFields.forEach(field => {
      switch (field) {
        case 'title':
          row[fieldMap.title] = task.title
          break
        case 'content':
          row[fieldMap.content] = task.content
          break
        case 'priority':
          row[fieldMap.priority] = task.priority
          break
        case 'state':
          row[fieldMap.state] = getStateName(task, project)
          break
        case 'tags':
          row[fieldMap.tags] = task.tags.join(', ')
          break
        case 'createdAt':
          row[fieldMap.createdAt] = formatDate(task.createdAt)
          break
        case 'updatedAt':
          row[fieldMap.updatedAt] = formatDate(task.updatedAt)
          break
      }
    })
    return row
  })

  // 创建工作簿
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet([...data], {
    header: headers
  })

  // 设置列宽
  const colWidths = {
    '标题': 20,
    '内容': 40,
    '优先级': 10,
    '状态': 10,
    '标签': 20,
    '创建时间': 20,
    '更新时间': 20
  }

  ws['!cols'] = headers.map(header => ({
    wch: colWidths[header] || 15
  }))

  // 添加工作表
  XLSX.utils.book_append_sheet(wb, ws, project.name)

  // 生成文件并下载
  const wbout = XLSX.write(wb, {
    bookType: 'xlsx',
    type: 'array'
  })
  const blob = new Blob([wbout], { type: 'application/octet-stream' })
  saveAs(blob, `${project.name}-任务列表.xlsx`)
}

// 导入任务的字段映射
const IMPORT_FIELD_MAP = {
  '标题': 'title',
  '内容': 'content',
  '优先级': 'priority',
  '状态': 'state',
  '标签': 'tags'
}

// 导入任务模板
export const getImportTemplate = () => {
  const wb = XLSX.utils.book_new()
  // 创建主工作表
  const ws = XLSX.utils.aoa_to_sheet([
    ['标题', '内容', '优先级', '状态', '标签'],
    ['示例任务', '这是任务内容', '高', '待办', '标签1,标签2']
  ])

  ws['!cols'] = [
    { wch: 20 }, // 标题
    { wch: 40 }, // 内容
    { wch: 10 }, // 优先级
    { wch: 10 }, // 状态
    { wch: 20 }, // 标签
  ]

  XLSX.utils.book_append_sheet(wb, ws, '导入模板')

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/octet-stream' })
  saveAs(blob, `任务导入模板.xlsx`)
}

// 解析导入的文件
export const parseImportFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        // 转换数据格式
        const tasks = jsonData.map(row => {
          const task = {}
          Object.entries(row).forEach(([key, value]) => {
            const field = IMPORT_FIELD_MAP[key]
            if (field) {
              if (field === 'tags') {
                task[field] = value.split(',').map(tag => tag.trim()).filter(Boolean)
              } else {
                task[field] = value
              }
            }
          })
          return task
        })

        resolve(tasks)
      } catch (error) {
        reject(new Error('文件解析失败，请确保使用正确的模板格式'))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsArrayBuffer(file)
  })
} 