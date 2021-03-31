import ArrayUtil from './ArrayUtil'

class ProcessUtil {
  printMemoryUsage = () => {
    const used = process.memoryUsage()
    
    const messages: string[] = []
    
    Object.entries(used).forEach(([key, value]) => {
      messages.push(`${key}: ${Math.round(value /1024 / 1024 * 100) / 100}MB`)
    })

    console.log('Memory:', messages.join(', '))
  }
}

export default new ProcessUtil