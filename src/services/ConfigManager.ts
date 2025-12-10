/**
 * Configuration Manager
 * Manages plugin preferences stored in Zotero's preference system
 */

import type { PluginConfig, PromptTemplates } from '../types';

export class ConfigManager {
  private readonly PREF_PREFIX = 'extensions.aireader.';
  private config: PluginConfig | null = null;

  private readonly DEFAULT_TEMPLATES: PromptTemplates = {
    translation: `请将以下文本翻译成{{language}}：\n\n{{text}}`,
    summary: `请为以下文本生成简洁的摘要：\n\n{{text}}`,
    keyPoints: `请提取以下文本的关键要点：\n\n{{text}}`,
    qa: `基于以下上下文回答问题：\n\n上下文：{{context}}\n\n问题：{{question}}`
  };

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
        temperature: this.getPref('temperature', 0.7),
        defaultLanguage: this.getPref('defaultLanguage', 'zh-CN'),
        enableTranslation: this.getPref('enableTranslation', true),
        enableSummary: this.getPref('enableSummary', true),
        enableQA: this.getPref('enableQA', true),
        templates: this.loadTemplates(),
      };

      console.log('[ConfigManager] Configuration loaded');
      return this.config;
    } catch (error) {
      console.error('[ConfigManager] Failed to load configuration:', error);
      throw error;
    }
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
      temperature: 0.7,
      defaultLanguage: 'zh-CN',
      enableTranslation: true,
      enableSummary: true,
      enableQA: true,
      templates: { ...this.DEFAULT_TEMPLATES },
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
}
