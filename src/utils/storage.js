// 存储适配器
class StorageAdapter {
  constructor() {
    this.isUTools = typeof utools !== 'undefined'
  }

  // 序列化数据，处理特殊对象和循环引用
  serialize(data) {
    try {
      // 先转换成字符串，再解析回对象，去除循环引用
      return JSON.parse(JSON.stringify(data))
    } catch (error) {
      console.error('Data serialization failed:', error)
      return null
    }
  }

  setItem(key, value) {
    if (this.isUTools) {
      // 对数据进行序列化处理
      const serializedValue = this.serialize(value)
      if (serializedValue === null) {
        console.error('Failed to store data:', key)
        return
      }
      return utools.dbStorage.setItem(key, serializedValue)
    }
    return localStorage.setItem(key, JSON.stringify(value))
  }

  getItem(key) {
    if (this.isUTools) {
      try {
        return utools.dbStorage.getItem(key)
      } catch (error) {
        console.error('Failed to get data:', key, error)
        return null
      }
    }
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error('Error parsing stored data:', error)
      return null
    }
  }

  removeItem(key) {
    if (this.isUTools) {
      return utools.dbStorage.removeItem(key)
    }
    return localStorage.removeItem(key)
  }
}

export const storage = new StorageAdapter()