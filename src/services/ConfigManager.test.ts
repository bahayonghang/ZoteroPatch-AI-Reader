/**
 * Property-Based Tests for ConfigManager
 * Feature: settings-panel-and-icon
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { ConfigManager } from './ConfigManager';
import type { PluginConfig, PromptTemplates } from '../types';

// Mock Zotero global
const mockPrefs = new Map<string, unknown>();

interface MockZoteroGlobal {
  Prefs: {
    get(key: string, global?: boolean): unknown;
    set(key: string, value: unknown, global?: boolean): void;
  };
}

(globalThis as unknown as { Zotero: MockZoteroGlobal }).Zotero = {
  Prefs: {
    get: (key: string, _global?: boolean) => mockPrefs.get(key),
    set: (key: string, value: unknown, _global?: boolean) => {
      mockPrefs.set(key, value);
    },
  },
};

describe('ConfigManager Property-Based Tests', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    mockPrefs.clear();
    configManager = new ConfigManager();
  });

  /**
   * Property 1: URL Validation
   * Validates: Requirements 2.3
   * 
   * For any string input to the API Endpoint field, if the string is not a valid
   * URL format, then the validation should reject the input.
   */
  it('Property 1: URL validation', async () => {
    // Test with invalid URL strings
    const invalidUrlArbitrary = fc.oneof(
      fc.constant(''),
      fc.constant('not-a-url'),
      fc.constant('ftp://invalid'),
      fc.constant('just some text'),
      fc.constant('://missing-protocol'),
      fc.constant('http://'),
      fc.string().filter((s: string) => {
        try {
          new URL(s);
          return false;
        } catch {
          return true;
        }
      })
    );

    await fc.assert(
      fc.asyncProperty(invalidUrlArbitrary, async (invalidUrl: string) => {
        // Attempt to save config with invalid URL
        await expect(
          configManager.save({ apiEndpoint: invalidUrl })
        ).rejects.toThrow('Invalid API Endpoint URL format');
      }),
      { numRuns: 100 }
    );

    // Test with valid URLs
    const validUrlArbitrary = fc.webUrl();

    await fc.assert(
      fc.asyncProperty(validUrlArbitrary, async (validUrl: string) => {
        // Should not throw for valid URLs
        await expect(
          configManager.save({ apiEndpoint: validUrl })
        ).resolves.not.toThrow();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Configuration Persistence Round-Trip
   * Validates: Requirements 3.4, 6.1
   * 
   * For any valid configuration object, saving to preferences and then loading
   * should produce an equivalent configuration.
   */
  it('Property 3: Config round-trip', async () => {
    // Arbitrary for PromptTemplates
    const promptTemplatesArbitrary = fc.record({
      translation: fc.string({ minLength: 1, maxLength: 500 }),
      summary: fc.string({ minLength: 1, maxLength: 500 }),
      keyPoints: fc.string({ minLength: 1, maxLength: 500 }),
      qa: fc.string({ minLength: 1, maxLength: 500 }),
    });

    // Arbitrary for PluginConfig
    const configArbitrary = fc.record({
      apiKey: fc.string({ maxLength: 200 }),
      apiEndpoint: fc.webUrl(),
      model: fc.string({ minLength: 1, maxLength: 100 }),
      temperature: fc.double({ min: 0, max: 2, noNaN: true }),
      defaultLanguage: fc.constantFrom('zh-CN', 'en-US', 'ja-JP', 'fr-FR'),
      enableTranslation: fc.boolean(),
      enableSummary: fc.boolean(),
      enableQA: fc.boolean(),
      templates: promptTemplatesArbitrary,
    });

    await fc.assert(
      fc.asyncProperty(configArbitrary, async (config: PluginConfig) => {
        // Save the configuration
        await configManager.save(config);

        // Load the configuration
        const loaded = await configManager.load();

        // Check that all fields match
        expect(loaded.apiKey).toBe(config.apiKey);
        expect(loaded.apiEndpoint).toBe(config.apiEndpoint);
        expect(loaded.model).toBe(config.model);
        expect(loaded.temperature).toBeCloseTo(config.temperature, 10);
        expect(loaded.defaultLanguage).toBe(config.defaultLanguage);
        expect(loaded.enableTranslation).toBe(config.enableTranslation);
        expect(loaded.enableSummary).toBe(config.enableSummary);
        expect(loaded.enableQA).toBe(config.enableQA);
        
        // Check templates
        expect(loaded.templates.translation).toBe(config.templates.translation);
        expect(loaded.templates.summary).toBe(config.templates.summary);
        expect(loaded.templates.keyPoints).toBe(config.templates.keyPoints);
        expect(loaded.templates.qa).toBe(config.templates.qa);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4: Template Reset Idempotence
   * Validates: Requirements 3.3
   * 
   * For any template, clicking "Reset to Default" should always return the
   * template to its default value.
   */
  it('Property 4: Template reset idempotence', async () => {
    // Default template values (must match ConfigManager)
    const DEFAULT_TEMPLATES: PromptTemplates = {
      translation: `请将以下文本翻译成{{language}}：\n\n{{text}}`,
      summary: `请为以下文本生成简洁的摘要：\n\n{{text}}`,
      keyPoints: `请提取以下文本的关键要点：\n\n{{text}}`,
      qa: `基于以下上下文回答问题：\n\n上下文：{{context}}\n\n问题：{{question}}`
    };

    // Arbitrary for template types
    const templateTypeArbitrary = fc.constantFrom(
      'translation' as const,
      'summary' as const,
      'keyPoints' as const,
      'qa' as const
    );

    // Arbitrary for custom template content
    const customTemplateArbitrary = fc.string({ minLength: 1, maxLength: 500 });

    await fc.assert(
      fc.asyncProperty(
        templateTypeArbitrary,
        customTemplateArbitrary,
        async (templateType: keyof PromptTemplates, customContent: string) => {
          // Load initial config
          await configManager.load();

          // Set a custom template value
          await configManager.updateTemplate(templateType, customContent);

          // Verify custom value was set
          let config = configManager.getConfig();
          expect(config.templates[templateType]).toBe(customContent);

          // Reset the template
          await configManager.resetTemplate(templateType);

          // Verify it's back to default
          config = configManager.getConfig();
          expect(config.templates[templateType]).toBe(DEFAULT_TEMPLATES[templateType]);

          // Reset again (idempotence test)
          await configManager.resetTemplate(templateType);

          // Should still be the default value
          config = configManager.getConfig();
          expect(config.templates[templateType]).toBe(DEFAULT_TEMPLATES[templateType]);
        }
      ),
      { numRuns: 100 }
    );
  });
});