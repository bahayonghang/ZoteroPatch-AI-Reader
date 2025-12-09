/**
 * Configuration Manager
 * Manages plugin preferences stored in Zotero's preference system
 */

import type { PluginConfig } from '../types';

export class ConfigManager {
  private readonly PREF_PREFIX = 'extensions.aireader.';
  private config: PluginConfig | null = null;

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

      // Update config
      this.config = { ...this.config!, ...config };

      // Save to preferences
      Object.entries(config).forEach(([key, value]) => {
        this.setPref(key, value);
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
      new URL(url);
      return true;
    } catch {
      return false;
    }
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
    };

    await this.save(defaultConfig);
    console.log('[ConfigManager] Configuration reset to defaults');
  }
}
