<template>
  <div class="task-statistics">
    <div class="overview-section">
      <div class="stats-container">
        <div v-for="stat in overviewStats" :key="stat.label" class="stat-card">
          <div class="stat-icon" :style="{ backgroundColor: stat.color }">
            <el-icon><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </div>
    <el-row :gutter="20">
      <el-col :span="12">
        <div class="chart-card">
          <h3>任务状态分布</h3>
          <v-chart class="chart" :option="stateChartOption" autoresize />
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-card">
          <h3>优先级分布</h3>
          <v-chart class="chart" :option="priorityChartOption" autoresize />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useProjectStore } from '../store/project'
import { List, Star, Tickets } from '@element-plus/icons-vue'

const store = useProjectStore()

// 状态分布图表配置
const stateChartOption = computed(() => {
  const currentProject = store.currentProject
  if (!currentProject) return {}

  const isArchived = store.archivedProjects.some(p => p.id === currentProject.id)
  const tasks = isArchived ? currentProject.tasks : store.tasks.filter(t => t.projectId === currentProject.id)

  const data = currentProject.states.map(state => ({
    name: state.name,
    value: tasks.filter(task => task.stateId === state.id).length,
    itemStyle: {
      color: state.color
    }
  }))

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
      backgroundColor: 'var(--echarts-tooltip-bg)',
      borderColor: 'var(--echarts-tooltip-border)',
      textStyle: {
        color: 'var(--echarts-text-color)'
      }
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: {
        color: 'var(--echarts-text-color)'
      }
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}: {c}'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '16',
            fontWeight: 'bold'
          }
        },
        data
      }
    ]
  }
})

// 优先级分布图表配置
const priorityChartOption = computed(() => {
  const currentProject = store.currentProject
  if (!currentProject) return {}

  const isArchived = store.archivedProjects.some(p => p.id === currentProject.id)
  const tasks = isArchived ? currentProject.tasks : store.tasks.filter(t => t.projectId === currentProject.id)

  const priorityColors = {
    '高': '#F56C6C',
    '中': '#E6A23C',
    '低': '#67C23A'
  }

  const data = ['高', '中', '低'].map(priority => ({
    name: priority,
    value: tasks.filter(task => task.priority === priority).length,
    itemStyle: {
      color: priorityColors[priority]
    }
  }))

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      backgroundColor: 'var(--echarts-tooltip-bg)',
      borderColor: 'var(--echarts-tooltip-border)',
      textStyle: {
        color: 'var(--echarts-text-color)'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.name),
      axisLine: {
        lineStyle: {
          color: 'var(--echarts-axis-line-color)'
        }
      },
      axisLabel: {
        color: 'var(--echarts-text-color)'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: 'var(--echarts-axis-line-color)'
        }
      },
      axisLabel: {
        color: 'var(--echarts-text-color)'
      },
      splitLine: {
        lineStyle: {
          color: 'var(--el-border-color-light)'
        }
      }
    },
    series: [
      {
        type: 'bar',
        data,
        label: {
          show: true,
          position: 'top'
        }
      }
    ]
  }
})

// 总体统计数据
const overviewStats = computed(() => {
  const currentProject = store.currentProject
  if (!currentProject) return []

  const isArchived = store.archivedProjects.some(p => p.id === currentProject.id)
  const tasks = isArchived ? currentProject.tasks : store.tasks.filter(t => t.projectId === currentProject.id)

  // 基础统计（总任务数和高优先级）
  const baseStats = [
    {
      label: '总任务数',
      value: tasks.length,
      icon: 'List',
      color: '#409EFF'
    },
    {
      label: '高优先级',
      value: tasks.filter(t => t.priority === '高').length,
      icon: 'Star',
      color: '#F56C6C'
    }
  ]

  // 用户自定义状态的统计
  const stateStats = currentProject.states.map(state => ({
    label: state.name,
    value: tasks.filter(t => t.stateId === state.id).length,
    icon: 'Tickets',
    color: state.color
  }))

  return [...baseStats, ...stateStats]
})

// 修改布局以适应更多的统计卡片
const cardSpan = computed(() => {
  const totalCards = overviewStats.value.length
  // 根据卡片总数动态计算每个卡片的宽度
  return Math.max(Math.floor(24 / Math.min(totalCards, 4)), 6)
})
</script>

<style scoped>
.task-statistics {
  padding: 24px;
  background-color: var(--el-bg-color);
  min-width: 750px;
}

.overview-section {
  margin-bottom: 20px;
}

.stats-container {
  display: flex;
  gap: 20px;
  margin: 0 -12px;
  flex-wrap: wrap;
}

.stat-card {
  flex: 1;
  min-width: 200px;
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--el-box-shadow-light);
  border: 1px solid var(--el-border-color-light);
  margin: 0 12px 12px;
}

.chart-card {
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  padding: 20px;
  box-shadow: var(--el-box-shadow-light);
  border: 1px solid var(--el-border-color-light);
  height: 100%;
}

.chart-card h3 {
  color: var(--el-text-color-primary);
  margin-bottom: 16px;
}

.chart {
  height: 300px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-icon .el-icon {
  font-size: 24px;
}

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--el-text-color-primary);
  line-height: 1;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
}

.timeline-card {
  margin-top: 20px;
}

.timeline-chart {
  height: 400px;
}

/* 暗色模式下的图表主题配置 */
:deep(.dark) {
  --echarts-bg-color: transparent;
  --echarts-text-color: var(--el-text-color-regular);
  --echarts-axis-line-color: var(--el-border-color);
  --echarts-tooltip-bg: var(--el-bg-color-overlay);
  --echarts-tooltip-border: var(--el-border-color-light);
}
</style> 