/**
 * Bootstrap entry for Zotero 7 AI Reader Assistant
 * This file handles plugin lifecycle: install, startup, shutdown, uninstall
 */

// eslint-disable-next-line no-unused-vars
var chromeHandle;

// Global plugin instance reference
var pluginInstance = null;

// Store rootURI for use in other functions
var rootURI;

/**
 * Called when the plugin is installed
 */
// eslint-disable-next-line no-unused-vars
function install(data, reason) {
  // eslint-disable-next-line no-undef
  Zotero.debug('[AI Reader] Plugin installed');
}

/**
 * Called when the plugin starts up
 * @param {Object} data - Plugin startup data
 * @param {number} reason - Reason code for startup
 */
// eslint-disable-next-line no-unused-vars
async function startup({ id, version, resourceURI, rootURI: _rootURI }, reason) {
  rootURI = _rootURI;

  // eslint-disable-next-line no-undef
  Zotero.debug(`[AI Reader] Starting up v${version}, rootURI: ${rootURI}`);

  // Wait for Zotero to be ready
  // eslint-disable-next-line no-undef
  await Zotero.initializationPromise;

  // Load default preferences
  try {
    const defaultPrefsPath = rootURI + 'chrome/defaults/preferences/prefs.js';
    // eslint-disable-next-line no-undef
    Services.scriptloader.loadSubScript(defaultPrefsPath);
    // eslint-disable-next-line no-undef
    Zotero.debug('[AI Reader] Default preferences loaded');
  } catch (e) {
    // eslint-disable-next-line no-undef
    Zotero.debug('[AI Reader] Could not load default preferences: ' + e);
  }

  // Register chrome resources
  // eslint-disable-next-line no-undef
  const aomStartup = Components.classes[
    '@mozilla.org/addons/addon-manager-startup;1'
  ].getService(Components.interfaces.amIAddonManagerStartup);

  const manifestURI = Services.io.newURI(rootURI + 'manifest.json');
  chromeHandle = aomStartup.registerChrome(manifestURI, [
    ['content', 'aireader', rootURI + 'chrome/content/'],
    ['skin', 'aireader', 'classic/1.0', rootURI + 'skin/'],
  ]);

  // Load compiled plugin code - index.js is in the root of the XPI
  try {
    // eslint-disable-next-line no-undef
    Services.scriptloader.loadSubScript(rootURI + 'index.js');

    // Initialize plugin instance if exported from index.ts
    // eslint-disable-next-line no-undef
    if (typeof Zotero !== 'undefined' && Zotero.AIReader) {
      // eslint-disable-next-line no-undef
      pluginInstance = Zotero.AIReader;
      await pluginInstance.startup();
      // eslint-disable-next-line no-undef
      Zotero.debug('[AI Reader] Plugin startup complete');
    } else {
      // eslint-disable-next-line no-undef
      Zotero.debug('[AI Reader] Warning: Zotero.AIReader not found after loading index.js');
    }
  } catch (error) {
    // eslint-disable-next-line no-undef
    Zotero.debug('[AI Reader] Failed to load plugin: ' + error);
    // eslint-disable-next-line no-undef
    Zotero.logError(error);
  }
}

/**
 * Called when the plugin shuts down
 * @param {Object} data - Plugin data
 * @param {number} reason - Reason code for shutdown
 */
// eslint-disable-next-line no-unused-vars
async function shutdown({ id, version, rootURI: _rootURI }, reason) {
  // eslint-disable-next-line no-undef
  Zotero.debug(`[AI Reader] Shutting down v${version}`);

  if (pluginInstance) {
    await pluginInstance.shutdown();
    pluginInstance = null;
  }

  // Clean up any global references
  // eslint-disable-next-line no-undef
  if (typeof Zotero !== 'undefined' && Zotero.AIReader) {
    // eslint-disable-next-line no-undef
    delete Zotero.AIReader;
  }

  // Unregister chrome
  if (chromeHandle) {
    chromeHandle.destruct();
    chromeHandle = null;
  }
}

/**
 * Called when the plugin is uninstalled
 */
// eslint-disable-next-line no-unused-vars
function uninstall(data, reason) {
  // eslint-disable-next-line no-undef
  Zotero.debug('[AI Reader] Plugin uninstalled');
}
