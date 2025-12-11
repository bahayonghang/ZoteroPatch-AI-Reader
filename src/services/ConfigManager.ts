/**
 * Configuration Manager
 * Manages plugin preferences stored in Zotero's preference system
 */

import type { PluginConfig, PromptTemplates, PromptTemplate, TemplatePlaceholders } from '../types';

export class ConfigManager {
  private readonly PREF_PREFIX = 'extensions.aireader.';
  private config: PluginConfig | null = null;

  private readonly DEFAULT_TEMPLATES: PromptTemplates = {
    translation: `请将以下文本翻译成{{language}}：\n\n{{text}}`,
    summary: `请为以下文本生成简洁的摘要：\n\n{{text}}`,
    keyPoints: `请提取以下文本的关键要点：\n\n{{text}}`,
    qa: `基于以下上下文回答问题：\n\n上下文：{{context}}\n\n问题：{{question}}`
  };

  private readonly DEFAULT_PROMPT_TEMPLATES: PromptTemplate[] = [
    {
      id: 'default-translation',
      name: '默认翻译',
      type: 'translation',
      content: '请将以下文本翻译成{{language}}，保持原文的格式和专业术语：\n\n{{text}}',
      isDefault: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'default-summary',
      name: '默认摘要',
      type: 'summary',
      content: '请为以下学术论文内容生成简洁的中文摘要，包含主要观点和结论：\n\n标题：{{title}}\n作者：{{author}}\n\n内容：\n{{text}}',
      isDefault: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'default-keypoints',
      name: '默认要点',
      type: 'keyPoints',
      content: '请提取以下文本的关键要点，以简洁的条目形式列出：\n\n{{text}}',
      isDefault: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'default-qa',
      name: '默认问答',
      type: 'qa',
      content: '基于以下上下文回答问题。如果上下文中没有相关信息，请明确说明。\n\n上下文：\n{{context}}\n\n问题：{{question}}',
      isDefault: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ];

  constructor() {
    console.log('[ConfigManager] Initialized');
  }

  /**
   * Load configuration from Zotero preferences
   */
  async load(): Promise<PluginConfig> {
    try {
      this.config = {
        apiKey: this.getPref('apiKey', ''),
        apiEndpoint: this.getPref('apiEndpoint', 'https://api.openai.com/v1'),
        model: this.getPref('model', 'gpt-3.5-turbo'),
        customModel: this.getPref('customModel', ''),
        temperature: this.getPref('temperature', 0.7),
        defaultLanguage: this.getPref('defaultLanguage', 'zh-CN'),
        enableTranslation: this.getPref('enableTranslation', true),
        enableSummary: this.getPref('enableSummary', true),
        enableQA: this.getPref('enableQA', true),
        enableStreaming: this.getPref('enableStreaming', true),
        autoSaveHistory: this.getPref('autoSaveHistory', false),
        maxTokens: this.getPref('maxTokens', 2000),
        timeout: this.getPref('timeout', 30),
        maxHistory: this.getPref('maxHistory', 10),
        debugMode: this.getPref('debugMode', false),
        templates: this.loadTemplates(),
        promptTemplates: this.loadPromptTemplates(),
      };

      console.log('[ConfigManager] Configuration loaded');
      return this.config;
    } catch (error) {
      console.error('[ConfigManager] Failed to load configuration:', error);
      throw error;
    }
  }

  /**
   * Get the actual model name (handles custom model)
   */
  getActualModel(): string {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    if (this.config.model === 'custom' && this.config.customModel) {
      return this.config.customModel;
    }
    return this.config.model;
  }

  /**
   * Save configuration to Zotero preferences
   */
  async save(config: Partial<PluginConfig>): Promise<void> {
    try {
      if (!this.config) {
        await this.load();
      }

      // Validate API Endpoint URL if provided
      if (config.apiEndpoint !== undefined && !this.isValidUrl(config.apiEndpoint)) {
        throw new Error('Invalid API Endpoint URL format');
      }

      // Clamp temperature to valid range [0, 2]
      if (config.temperature !== undefined) {
        config.temperature = this.clampTemperature(config.temperature);
      }

      // Update config
      this.config = { ...this.config!, ...config };

      // Save to preferences
      Object.entries(config).forEach(([key, value]) => {
        if (key === 'templates') {
          this.saveTemplates(value as PromptTemplates);
        } else {
          this.setPref(key, value as string | number | boolean);
        }
      });

      console.log('[ConfigManager] Configuration saved');
    } catch (error) {
      console.error('[ConfigManager] Failed to save configuration:', error);
      throw error;
    }
  }

  /**
   * Get configuration
   */
  getConfig(): PluginConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    return { ...this.config };
  }

  /**
   * Get a single preference value
   */
  private getPref<T extends string | number | boolean>(key: string, defaultValue: T): T {
    try {
      const prefKey = this.PREF_PREFIX + key;

      if (typeof defaultValue === 'string') {
        return (Zotero.Prefs?.get(prefKey, true) as T) || defaultValue;
      } else if (typeof defaultValue === 'number') {
        return (Zotero.Prefs?.get(prefKey, true) as T) ?? defaultValue;
      } else if (typeof defaultValue === 'boolean') {
        return (Zotero.Prefs?.get(prefKey, true) as T) ?? defaultValue;
      }

      return defaultValue;
    } catch (error) {
      console.warn(`[ConfigManager] Failed to get preference ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Set a single preference value
   */
  private setPref(key: string, value: string | number | boolean): void {
    try {
      const prefKey = this.PREF_PREFIX + key;

      // Security: Don't log sensitive data
      if (key !== 'apiKey') {
        console.log(`[ConfigManager] Setting preference ${key}:`, value);
      }

      Zotero.Prefs?.set(prefKey, value, true);
    } catch (error) {
      console.error(`[ConfigManager] Failed to set preference ${key}:`, error);
      throw error;
    }
  }

  /**
   * Validate configuration
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config) {
      errors.push('Configuration not loaded');
      return { valid: false, errors };
    }

    // API Key validation
    if (!this.config.apiKey || this.config.apiKey.trim() === '') {
      errors.push('API Key is required');
    }

    // API Endpoint validation
    if (!this.config.apiEndpoint || !this.isValidUrl(this.config.apiEndpoint)) {
      errors.push('API Endpoint must be a valid URL');
    }

    // Model validation
    if (!this.config.model || this.config.model.trim() === '') {
      errors.push('Model name is required');
    }

    // Temperature validation
    if (this.config.temperature < 0 || this.config.temperature > 2) {
      errors.push('Temperature must be between 0 and 2');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if string is a valid URL
   */
  private isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      // Only accept HTTP and HTTPS protocols for API endpoints
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Clamp temperature value to valid range [0, 2]
   */
  private clampTemperature(temperature: number): number {
    return Math.max(0, Math.min(2, temperature));
  }

  /**
   * Validate URL format (public method for external validation)
   */
  validateUrl(url: string): boolean {
    return this.isValidUrl(url);
  }

  /**
   * Reset configuration to defaults
   */
  async resetToDefaults(): Promise<void> {
    const defaultConfig: PluginConfig = {
      apiKey: '',
      apiEndpoint: 'https://api.openai.com/v1',
      model: 'gpt-3.5-turbo',
      customModel: '',
      temperature: 0.7,
      defaultLanguage: 'zh-CN',
      enableTranslation: true,
      enableSummary: true,
      enableQA: true,
      enableStreaming: true,
      autoSaveHistory: false,
      maxTokens: 2000,
      timeout: 30,
      maxHistory: 10,
      debugMode: false,
      templates: { ...this.DEFAULT_TEMPLATES },
      promptTemplates: [...this.DEFAULT_PROMPT_TEMPLATES],
    };

    await this.save(defaultConfig);
    console.log('[ConfigManager] Configuration reset to defaults');
  }

  /**
   * Load templates from preferences
   */
  private loadTemplates(): PromptTemplates {
    try {
      const templatesJson = this.getPref('templates', '') as string;
      if (templatesJson && templatesJson.trim() !== '') {
        const parsed = JSON.parse(templatesJson);
        return {
          translation: parsed.translation || this.DEFAULT_TEMPLATES.translation,
          summary: parsed.summary || this.DEFAULT_TEMPLATES.summary,
          keyPoints: parsed.keyPoints || this.DEFAULT_TEMPLATES.keyPoints,
          qa: parsed.qa || this.DEFAULT_TEMPLATES.qa,
        };
      }
    } catch (error) {
      console.warn('[ConfigManager] Failed to parse templates, using defaults:', error);
    }
    return { ...this.DEFAULT_TEMPLATES };
  }

  /**
   * Save templates to preferences
   */
  private saveTemplates(templates: PromptTemplates): void {
    try {
      const templatesJson = JSON.stringify(templates);
      this.setPref('templates', templatesJson);
    } catch (error) {
      console.error('[ConfigManager] Failed to save templates:', error);
      throw error;
    }
  }

  /**
   * Get a specific template
   */
  getTemplate(type: keyof PromptTemplates): string {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    return this.config.templates[type];
  }

  /**
   * Update a specific template
   */
  async updateTemplate(type: keyof PromptTemplates, content: string): Promise<void> {
    if (!this.config) {
      await this.load();
    }
    this.config!.templates[type] = content;
    this.saveTemplates(this.config!.templates);
    console.log(`[ConfigManager] Template ${type} updated`);
  }

  /**
   * Reset a specific template to default
   */
  async resetTemplate(type: keyof PromptTemplates): Promise<void> {
    if (!this.config) {
      await this.load();
    }
    this.config!.templates[type] = this.DEFAULT_TEMPLATES[type];
    this.saveTemplates(this.config!.templates);
    console.log(`[ConfigManager] Template ${type} reset to default`);
  }

  /**
   * Reset all templates to defaults
   */
  async resetAllTemplates(): Promise<void> {
    if (!this.config) {
      await this.load();
    }
    this.config!.templates = { ...this.DEFAULT_TEMPLATES };
    this.saveTemplates(this.config!.templates);
    console.log('[ConfigManager] All templates reset to defaults');
  }

  // ========================================
  // Prompt Templates (new system)
  // ========================================

  /**
   * Load prompt templates from preferences
   */
  private loadPromptTemplates(): PromptTemplate[] {
    try {
      const templatesJson = this.getPref('templates', '') as string;
      if (templatesJson && templatesJson.trim() !== '') {
        const parsed = JSON.parse(templatesJson);
        // Check if it's the new format (array)
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('[ConfigManager] Failed to parse prompt templates, using defaults:', error);
    }
    return [...this.DEFAULT_PROMPT_TEMPLATES];
  }

  /**
   * Save prompt templates to preferences
   */
  savePromptTemplates(templates: PromptTemplate[]): void {
    try {
      const templatesJson = JSON.stringify(templates);
      this.setPref('templates', templatesJson);
      if (this.config) {
        this.config.promptTemplates = templates;
      }
    } catch (error) {
      console.error('[ConfigManager] Failed to save prompt templates:', error);
      throw error;
    }
  }

  /**
   * Get all prompt templates
   */
  getPromptTemplates(): PromptTemplate[] {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    return this.config.promptTemplates || [...this.DEFAULT_PROMPT_TEMPLATES];
  }

  /**
   * Get prompt template by ID
   */
  getPromptTemplateById(id: string): PromptTemplate | undefined {
    const templates = this.getPromptTemplates();
    return templates.find(t => t.id === id);
  }

  /**
   * Get prompt templates by type
   */
  getPromptTemplatesByType(type: PromptTemplate['type']): PromptTemplate[] {
    const templates = this.getPromptTemplates();
    return templates.filter(t => t.type === type);
  }

  /**
   * Add a new prompt template
   */
  addPromptTemplate(template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>): PromptTemplate {
    const templates = this.getPromptTemplates();
    const newTemplate: PromptTemplate = {
      ...template,
      id: 'custom-' + Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    templates.push(newTemplate);
    this.savePromptTemplates(templates);
    console.log('[ConfigManager] Prompt template added:', newTemplate.id);
    return newTemplate;
  }

  /**
   * Update a prompt template
   */
  updatePromptTemplate(id: string, updates: Partial<PromptTemplate>): void {
    const templates = this.getPromptTemplates();
    const index = templates.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error(`Template not found: ${id}`);
    }
    templates[index] = {
      ...templates[index],
      ...updates,
      updatedAt: Date.now(),
    };
    this.savePromptTemplates(templates);
    console.log('[ConfigManager] Prompt template updated:', id);
  }

  /**
   * Delete a prompt template
   */
  deletePromptTemplate(id: string): void {
    const templates = this.getPromptTemplates();
    const template = templates.find(t => t.id === id);
    if (template?.isDefault) {
      throw new Error('Cannot delete default template');
    }
    const filtered = templates.filter(t => t.id !== id);
    this.savePromptTemplates(filtered);
    console.log('[ConfigManager] Prompt template deleted:', id);
  }

  /**
   * Reset a default template to its original content
   */
  resetDefaultTemplate(id: string): void {
    const templates = this.getPromptTemplates();
    const index = templates.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error(`Template not found: ${id}`);
    }
    const defaultTemplate = this.DEFAULT_PROMPT_TEMPLATES.find(t => t.id === id);
    if (defaultTemplate) {
      templates[index] = { ...defaultTemplate, updatedAt: Date.now() };
      this.savePromptTemplates(templates);
      console.log('[ConfigManager] Default template reset:', id);
    }
  }

  /**
   * Apply placeholder variables to a template
   */
  applyPlaceholders(templateContent: string, placeholders: TemplatePlaceholders): string {
    let result = templateContent;
    for (const [key, value] of Object.entries(placeholders)) {
      if (value !== undefined) {
        const placeholder = `{{${key}}}`;
        result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
      }
    }
    return result;
  }

  /**
   * Get rendered template content with placeholders applied
   */
  getRenderedTemplate(templateId: string, placeholders: TemplatePlaceholders): string {
    const template = this.getPromptTemplateById(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    return this.applyPlaceholders(template.content, placeholders);
  }
}
