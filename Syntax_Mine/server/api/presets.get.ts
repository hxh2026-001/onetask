import { defineEventHandler } from 'h3'

export interface Preset {
  id: number
  name: string
  description: string
  sentence: string
  keywords: string[]
  errorType?: string
}

const presets: Preset[] = [
  {
    id: 1,
    name: '花园路径句',
    description: '经典的花园路径句，句法分析容易陷入局部最优',
    sentence: '旧书拍卖掉了',
    keywords: ['花园路径', '局部最优', '歧义'],
    errorType: 'local-optimum'
  },
  {
    id: 2,
    name: '中心词悬空',
    description: '中心词在句尾悬空，导致长距离依赖分析困难',
    sentence: '我看见那只狗在公园里跑',
    keywords: ['中心词悬空', '长距离依赖', '注意力溢出'],
    errorType: 'attention-overflow'
  },
  {
    id: 3,
    name: '并列结构歧义',
    description: '并列结构造成的歧义，多个可能的依存关系',
    sentence: '他和她的父母住在南京和北京',
    keywords: ['并列结构', '歧义', '多义词'],
    errorType: 'polysemy'
  },
  {
    id: 4,
    name: '长距离依赖',
    description: '主语和动词之间的长距离依赖导致栈溢出',
    sentence: '那个被银行雇佣的律师为他的客户在法庭上辩护关于复杂的金融交易案件',
    keywords: ['长距离依赖', '栈溢出', '递归崩溃'],
    errorType: 'recursion-crash'
  }
]

export default defineEventHandler(() => {
  return presets
})
