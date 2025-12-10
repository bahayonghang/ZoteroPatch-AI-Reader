/**
 * Preferences Panel
 * UI for managing AI Reader Assistant settings
 * Note: Registration is now handled in src/index.ts using Zotero 7 API
 */

export class PreferencesPanel {
  private readonly PREF_WINDOW_URL = 'chrome://aireader/content/preferences.xhtml';

  constructor() {
    console.log('[PreferencesPanel] Initialized');
  }

  /**
   * Register preferences window
   * Note: This is now a no-op as registration is handled in index.ts
   */
  register(): void {
    // Registration is now handled in src/index.ts using Zotero.PreferencePanes.register
    console.log('[PreferencesPanel] register() called - handled by index.ts');
  }

  /**
   * Open preferences window
   */
  open(): void {
    try {
      // Open Zotero preferences with AI Reader tab
      if (Zotero.Prefs?.openPreferences) {
        Zotero.Prefs.openPreferences('ai-reader@zoteropatch.com');
        console.log('[PreferencesPanel] Preferences window opened');
      }
    } catch (error) {
      console.error('[PreferencesPanel] Failed to open preferences:', error);
    }
  }

  /**
   * Create preferences XUL content
   */
  static createXULContent(): string {
    return `<?xml version="1.0"?>
<?xml-stylesheet href="chrome://global/skin/" type="text/css"?>
<?xml-stylesheet href="chrome://zotero/skin/preferences.css" type="text/css"?>

<vbox xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul"
      id="aireader-prefs">

  <groupbox>
    <caption label="API 设置"/>

    <grid>
      <columns>
        <column/>
        <column flex="1"/>
      </columns>
      <rows>
        <row align="center">
          <label value="API Key:"/>
          <textbox id="aireader-apiKey"
                   preference="extensions.aireader.apiKey"
                   type="password"
                   placeholder="输入您的 API Key"/>
        </row>

        <row align="center">
          <label value="API 端点:"/>
          <textbox id="aireader-apiEndpoint"
                   preference="extensions.aireader.apiEndpoint"
                   placeholder="https://api.openai.com/v1"/>
        </row>

        <row align="center">
          <label value="模型:"/>
          <menulist id="aireader-model"
                    preference="extensions.aireader.model">
            <menupopup>
              <menuitem label="gpt-3.5-turbo" value="gpt-3.5-turbo"/>
              <menuitem label="gpt-4" value="gpt-4"/>
              <menuitem label="gpt-4-turbo" value="gpt-4-turbo"/>
              <menuitem label="自定义模型" value="custom"/>
            </menupopup>
          </menulist>
        </row>

        <row align="center">
          <label value="温度 (0-2):"/>
          <hbox align="center">
            <scale id="aireader-temperature"
                   preference="extensions.aireader.temperature"
                   min="0"
                   max="2"
                   increment="0.1"
                   flex="1"/>
            <label id="aireader-temperature-value" value="0.7"/>
          </hbox>
        </row>
      </rows>
    </grid>
  </groupbox>

  <groupbox>
    <caption label="功能设置"/>

    <checkbox id="aireader-enableTranslation"
              preference="extensions.aireader.enableTranslation"
              label="启用翻译功能"/>

    <checkbox id="aireader-enableSummary"
              preference="extensions.aireader.enableSummary"
              label="启用摘要功能"/>

    <checkbox id="aireader-enableQA"
              preference="extensions.aireader.enableQA"
              label="启用问答功能"/>

    <hbox align="center">
      <label value="默认语言:"/>
      <menulist id="aireader-defaultLanguage"
                preference="extensions.aireader.defaultLanguage">
        <menupopup>
          <menuitem label="简体中文" value="zh-CN"/>
          <menuitem label="繁体中文" value="zh-TW"/>
          <menuitem label="English" value="en"/>
          <menuitem label="日本語" value="ja"/>
        </menupopup>
      </menulist>
    </hbox>
  </groupbox>

  <groupbox>
    <caption label="提示词模板"/>

    <vbox>
      <label value="翻译模板:"/>
      <textbox id="aireader-template-translation"
               multiline="true"
               rows="3"
               placeholder="请将以下文本翻译成{{language}}：&#10;&#10;{{text}}"/>
      <hbox>
        <spacer flex="1"/>
        <button label="重置为默认" oncommand="resetTemplate('translation');"/>
      </hbox>
    </vbox>

    <separator class="thin"/>

    <vbox>
      <label value="摘要模板:"/>
      <textbox id="aireader-template-summary"
               multiline="true"
               rows="3"
               placeholder="请为以下文本生成简洁的摘要：&#10;&#10;{{text}}"/>
      <hbox>
        <spacer flex="1"/>
        <button label="重置为默认" oncommand="resetTemplate('summary');"/>
      </hbox>
    </vbox>

    <separator class="thin"/>

    <vbox>
      <label value="要点提取模板:"/>
      <textbox id="aireader-template-keyPoints"
               multiline="true"
               rows="3"
               placeholder="请提取以下文本的关键要点：&#10;&#10;{{text}}"/>
      <hbox>
        <spacer flex="1"/>
        <button label="重置为默认" oncommand="resetTemplate('keyPoints');"/>
      </hbox>
    </vbox>

    <separator class="thin"/>

    <vbox>
      <label value="问答模板:"/>
      <textbox id="aireader-template-qa"
               multiline="true"
               rows="3"
               placeholder="基于以下上下文回答问题：&#10;&#10;上下文：{{context}}&#10;&#10;问题：{{question}}"/>
      <hbox>
        <spacer flex="1"/>
        <button label="重置为默认" oncommand="resetTemplate('qa');"/>
      </hbox>
    </vbox>
  </groupbox>

  <groupbox>
    <caption label="关于"/>
    <description>
      ZoteroPatch AI Reader v0.1.0
    </description>
    <description>
      在 Zotero 7 PDF 阅读器中提供 AI 助手功能
    </description>
    <hbox>
      <button label="测试连接" oncommand="testAPIConnection();"/>
      <button label="重置为默认值" oncommand="resetToDefaults();"/>
    </hbox>
  </groupbox>

  <script type="application/javascript">
    <![CDATA[
      // Default templates
      const DEFAULT_TEMPLATES = {
        translation: '请将以下文本翻译成{{language}}：\\n\\n{{text}}',
        summary: '请为以下文本生成简洁的摘要：\\n\\n{{text}}',
        keyPoints: '请提取以下文本的关键要点：\\n\\n{{text}}',
        qa: '基于以下上下文回答问题：\\n\\n上下文：{{context}}\\n\\n问题：{{question}}'
      };

      // Load templates on init
      window.addEventListener('load', () => {
        loadTemplates();
      });

      // Update temperature value display
      const temperatureScale = document.getElementById('aireader-temperature');
      const temperatureLabel = document.getElementById('aireader-temperature-value');

      temperatureScale.addEventListener('change', () => {
        temperatureLabel.value = temperatureScale.value;
      });

      // Load templates from preferences
      function loadTemplates() {
        try {
          const templatesJson = Zotero.Prefs.get('extensions.aireader.templates', true);
          let templates = DEFAULT_TEMPLATES;

          if (templatesJson && typeof templatesJson === 'string' && templatesJson.trim() !== '') {
            const parsed = JSON.parse(templatesJson);
            templates = {
              translation: parsed.translation || DEFAULT_TEMPLATES.translation,
              summary: parsed.summary || DEFAULT_TEMPLATES.summary,
              keyPoints: parsed.keyPoints || DEFAULT_TEMPLATES.keyPoints,
              qa: parsed.qa || DEFAULT_TEMPLATES.qa
            };
          }

          // Set template values
          document.getElementById('aireader-template-translation').value = templates.translation;
          document.getElementById('aireader-template-summary').value = templates.summary;
          document.getElementById('aireader-template-keyPoints').value = templates.keyPoints;
          document.getElementById('aireader-template-qa').value = templates.qa;

          // Add change listeners to save templates
          ['translation', 'summary', 'keyPoints', 'qa'].forEach(type => {
            const element = document.getElementById('aireader-template-' + type);
            element.addEventListener('change', () => saveTemplates());
          });
        } catch (error) {
          console.error('[PreferencesPanel] Failed to load templates:', error);
        }
      }

      // Save templates to preferences
      function saveTemplates() {
        try {
          const templates = {
            translation: document.getElementById('aireader-template-translation').value,
            summary: document.getElementById('aireader-template-summary').value,
            keyPoints: document.getElementById('aireader-template-keyPoints').value,
            qa: document.getElementById('aireader-template-qa').value
          };

          const templatesJson = JSON.stringify(templates);
          Zotero.Prefs.set('extensions.aireader.templates', templatesJson, true);
          console.log('[PreferencesPanel] Templates saved');
        } catch (error) {
          console.error('[PreferencesPanel] Failed to save templates:', error);
          alert('保存模板失败: ' + error.message);
        }
      }

      // Reset a specific template to default
      function resetTemplate(type) {
        if (confirm('确定要重置此模板为默认值吗?')) {
          const element = document.getElementById('aireader-template-' + type);
          element.value = DEFAULT_TEMPLATES[type];
          saveTemplates();
        }
      }

      // Test API connection
      async function testAPIConnection() {
        const apiKey = document.getElementById('aireader-apiKey').value;
        const apiEndpoint = document.getElementById('aireader-apiEndpoint').value;
        const model = document.getElementById('aireader-model').value;
        const temperatureValue = parseFloat(document.getElementById('aireader-temperature').value) || 0.7;

        if (!apiKey || !apiEndpoint) {
          alert('请先填写 API Key 和端点');
          return;
        }

        // Disable button during test
        const testButton = document.querySelector('button[oncommand="testAPIConnection();"]');
        if (testButton) {
          testButton.disabled = true;
          testButton.label = '测试中...';
        }

        try {
          // Dynamically import LLMClient
          const { LLMClient } = ChromeUtils.import('chrome://aireader/content/services/LLMClient.js');

          // Create temporary client for testing
          const testClient = new LLMClient({
            apiKey: apiKey,
            apiEndpoint: apiEndpoint,
            model: model,
            temperature: temperatureValue,
          });

          // Test connection
          const result = await testClient.testConnection();

          if (result.success) {
            alert('✓ ' + result.message);
          } else {
            alert('✗ ' + result.message);
          }
        } catch (error) {
          console.error('[PreferencesPanel] Connection test error:', error);
          alert('测试失败: ' + (error.message || error));
        } finally {
          // Re-enable button
          if (testButton) {
            testButton.disabled = false;
            testButton.label = '测试连接';
          }
        }
      }

      // Reset to defaults
      function resetToDefaults() {
        if (confirm('确定要重置所有设置为默认值吗?')) {
          document.getElementById('aireader-apiKey').value = '';
          document.getElementById('aireader-apiEndpoint').value = 'https://api.openai.com/v1';
          document.getElementById('aireader-model').value = 'gpt-3.5-turbo';
          document.getElementById('aireader-temperature').value = '0.7';
          document.getElementById('aireader-defaultLanguage').value = 'zh-CN';
          document.getElementById('aireader-enableTranslation').checked = true;
          document.getElementById('aireader-enableSummary').checked = true;
          document.getElementById('aireader-enableQA').checked = true;

          // Reset templates
          document.getElementById('aireader-template-translation').value = DEFAULT_TEMPLATES.translation;
          document.getElementById('aireader-template-summary').value = DEFAULT_TEMPLATES.summary;
          document.getElementById('aireader-template-keyPoints').value = DEFAULT_TEMPLATES.keyPoints;
          document.getElementById('aireader-template-qa').value = DEFAULT_TEMPLATES.qa;
          saveTemplates();

          alert('设置已重置为默认值');
        }
      }
    ]]>
  </script>

</vbox>`;
  }
}
