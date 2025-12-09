import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'ZoteroPatch AI Reader',
  description: 'AI助手增强Zotero 7 PDF阅读器',
  base: '/ZoteroPatch-AI-Reader/',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }]
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: '指南', link: '/guide/' },
      { text: '开发', link: '/development/' },
      { text: 'API', link: '/api/' },
      {
        text: 'v0.1.0',
        items: [
          { text: '更新日志', link: '/changelog' },
          { text: '贡献指南', link: '/contributing' }
        ]
      }
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始使用',
          items: [
            { text: '介绍', link: '/guide/' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装配置', link: '/guide/installation' },
            { text: '基础使用', link: '/guide/basic-usage' }
          ]
        },
        {
          text: '功能详解',
          items: [
            { text: '智能翻译', link: '/guide/translation' },
            { text: '自动摘要', link: '/guide/summary' },
            { text: '要点提取', link: '/guide/key-points' },
            { text: '智能问答', link: '/guide/qa' },
            { text: '笔记管理', link: '/guide/notes' }
          ]
        },
        {
          text: '高级功能',
          items: [
            { text: '自定义配置', link: '/guide/configuration' },
            { text: '本地模型', link: '/guide/local-models' },
            { text: '快捷键', link: '/guide/shortcuts' }
          ]
        },
        {
          text: '常见问题',
          items: [
            { text: 'FAQ', link: '/guide/faq' },
            { text: '故障排查', link: '/guide/troubleshooting' }
          ]
        }
      ],

      '/development/': [
        {
          text: '开发指南',
          items: [
            { text: '介绍', link: '/development/' },
            { text: '环境准备', link: '/development/setup' },
            { text: '项目结构', link: '/development/structure' },
            { text: '开发工作流', link: '/development/workflow' }
          ]
        },
        {
          text: '核心概念',
          items: [
            { text: '插件架构', link: '/development/architecture' },
            { text: '生命周期', link: '/development/lifecycle' },
            { text: '会话管理', link: '/development/sessions' },
            { text: '事件系统', link: '/development/events' }
          ]
        },
        {
          text: '测试与调试',
          items: [
            { text: '测试指南', link: '/development/testing' },
            { text: '调试技巧', link: '/development/debugging' },
            { text: '性能优化', link: '/development/performance' }
          ]
        },
        {
          text: '发布',
          items: [
            { text: '构建打包', link: '/development/building' },
            { text: '版本管理', link: '/development/versioning' },
            { text: '发布流程', link: '/development/releasing' }
          ]
        }
      ],

      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '概览', link: '/api/' },
            { text: 'AIReaderPlugin', link: '/api/plugin' },
            { text: 'ReaderPanelManager', link: '/api/panel-manager' },
            { text: 'SelectionMenuManager', link: '/api/selection-manager' }
          ]
        },
        {
          text: '服务 API',
          items: [
            { text: 'SessionManager', link: '/api/session-manager' },
            { text: 'ConfigManager', link: '/api/config-manager' },
            { text: 'LLMClient', link: '/api/llm-client' },
            { text: 'NotesSyncService', link: '/api/notes-sync' }
          ]
        },
        {
          text: '类型定义',
          items: [
            { text: '接口和类型', link: '/api/types' },
            { text: '配置选项', link: '/api/config-types' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/yourusername/ZoteroPatch-AI-Reader' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present ZoteroPatch AI Reader Contributors'
    },

    search: {
      provider: 'local'
    },

    outline: {
      level: [2, 3],
      label: '页面导航'
    }
  },

  markdown: {
    lineNumbers: true
  }
})
