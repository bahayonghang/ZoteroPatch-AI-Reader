/**
 * Preferences Panel
 * UI for managing AI Reader Assistant settings
 */

import type { PreferencePaneConfig } from '../types';

export class PreferencesPanel {
  private readonly PREF_WINDOW_URL = 'chrome://aireader/content/preferences.xhtml';

  constructor() {
    console.log('[PreferencesPanel] Initialized');
  }

  /**
   * Register preferences window
   */
  register(): void {
    try {
      // Register preferences pane in Zotero preferences
      if (typeof Zotero !== 'undefined' && Zotero.PreferencePanes) {
        const config: PreferencePaneConfig = {
          pluginID: 'ai-reader@zoteropatch.com',
          src: this.PREF_WINDOW_URL,
          label: 'AI Reader Assistant',
          image: 'chrome://aireader/skin/icon.png',
        };
        Zotero.PreferencePanes.register(config);

        console.log('[PreferencesPanel] Preferences pane registered');
      }
    } catch (error) {
      console.error('[PreferencesPanel] Failed to register preferences:', error);
    }
  }

  /**
   * Open preferences window
   */
  open(): void {
    try {
      // Open Zotero preferences with AI Reader tab
      if (Zotero.Prefs?.openPreferences) {
        Zotero.Prefs.openPreferences('aireader');
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
      // Update temperature value display
      const temperatureScale = document.getElementById('aireader-temperature');
      const temperatureLabel = document.getElementById('aireader-temperature-value');

      temperatureScale.addEventListener('change', () => {
        temperatureLabel.value = temperatureScale.value;
      });

      // Test API connection
      function testAPIConnection() {
        const apiKey = document.getElementById('aireader-apiKey').value;
        const apiEndpoint = document.getElementById('aireader-apiEndpoint').value;
        const model = document.getElementById('aireader-model').value;

        if (!apiKey || !apiEndpoint) {
          alert('请先填写 API Key 和端点');
          return;
        }

        // TODO: Implement actual API test
        alert('正在测试连接...');
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

          alert('设置已重置为默认值');
        }
      }
    ]]>
  </script>

</vbox>`;
  }
}
