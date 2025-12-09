/**
 * Bootstrap entry for Zotero 7 AI Reader Assistant
 * This file handles plugin lifecycle: install, startup, shutdown, uninstall
 */

// Global plugin instance reference
let pluginInstance = null;

/**
 * Called when the plugin is installed
 */
function install() {
  console.log('[AI Reader] Plugin installed');
}

/**
 * Called when the plugin starts up
 * @param {Object} data - Plugin startup data
 * @param {number} reason - Reason code for startup
 */
async function startup({ id, version, rootURI }, reason) {
  console.log(`[AI Reader] Starting up v${version}`);

  // Load compiled plugin code
  try {
    Services.scriptloader.loadSubScript(rootURI + 'build/index.js');

    // Initialize plugin instance if exported from index.ts
    if (typeof Zotero !== 'undefined' && Zotero.AIReader) {
      pluginInstance = Zotero.AIReader;
      await pluginInstance.startup();
    }
  } catch (error) {
    console.error('[AI Reader] Failed to load plugin:', error);
  }
}

/**
 * Called when the plugin shuts down
 * @param {Object} data - Plugin data
 * @param {number} reason - Reason code for shutdown
 */
async function shutdown({ id, version, rootURI }, reason) {
  console.log(`[AI Reader] Shutting down v${version}`);

  if (pluginInstance) {
    await pluginInstance.shutdown();
    pluginInstance = null;
  }

  // Clean up any global references
  if (typeof Zotero !== 'undefined' && Zotero.AIReader) {
    delete Zotero.AIReader;
  }
}

/**
 * Called when the plugin is uninstalled
 */
function uninstall() {
  console.log('[AI Reader] Plugin uninstalled');
}
