# ZoteroPatch AI Reader

> Enhance the Zotero 7/8 PDF reader with an AI assistant

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Zotero](https://img.shields.io/badge/Zotero-7.0%20%7C%208.x-red.svg)](https://www.zotero.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)

## ✨ Features

ZoteroPatch AI Reader is a plugin for the Zotero 7/8 PDF reader that adds a powerful AI assistant in the right sidebar:

- 🌐 **Smart Translation** – Translate selected text quickly with multi-language support
- 📝 **Auto Summary** – One-click structured paper summary
- 💡 **Key Points Extraction** – Pull out key info, methods, and datasets
- ❓ **Contextual Q&A** – Ask questions based on the paper content
- 📄 **Write-back to Notes** – Send AI-generated content to Zotero notes (append or replace)

## 🚀 Quick Start

### Requirements

- Zotero 7.0+ or Zotero 8.x
- An OpenAI-compatible API key (OpenAI, domestic models, or local deployments)

### Installation

1. Download the latest `.xpi` from [Releases](https://github.com/bahayonghang/ZoteroPatch-AI-Reader/releases)
2. In Zotero, open `Tools` → `Add-ons`
3. Click the gear icon → `Install Add-on From File...`
4. Select the downloaded `.xpi` to install
5. Restart Zotero

### Configure API

1. After installation, open Zotero `Edit` → `Preferences` → `AI Reader Assistant`
2. Fill in:
   - **API Key**: Your OpenAI-compatible key
   - **API Endpoint**: Default `https://api.openai.com/v1` (can be customized)
   - **Model**: e.g., `gpt-3.5-turbo`, `gpt-4`, etc.
   - **Temperature**: Creativity (0–2, recommended 0.7)
3. Click **Test Connection** to verify

## 📖 Usage Guide

### Open the AI Assistant Panel

1. Open any PDF in Zotero
2. The **AI Assistant** panel appears in the right sidebar
3. Tabs:
   - **Chat**: Ask questions
   - **Summary**: View document summary
   - **Key Points**: See extracted highlights

### Use Selection Actions

1. Select any text in the PDF
2. Right-click the selection
3. Choose:
   - 🌐 **Translate** – Translate selected text
   - 💡 **Explain** – Let AI explain the selection
   - ❓ **Ask** – Ask questions based on the selection
   - 📝 **Summarize** – Summarize the selected paragraph

### Generate Summary

1. Click the **📝** button at the top of the panel
2. AI analyzes the current paper and generates a structured summary
3. Includes research question, method, conclusion, limitations, etc.
4. Click **Write to Note** to save to Zotero notes

### Smart Q&A

1. In the **Chat** tab, enter your question
2. Press `Enter` to send (`Shift + Enter` for a new line)
3. AI answers based on the paper content
4. Conversation history is saved per session

### Note Management

- AI-generated content can be written to Zotero notes in one click
- Two modes:
  - **Append Mode**: Add to the end of the existing note
  - **Replace Mode**: Replace the entire note
- Automatically adds timestamp and source marker

## 🏗️ Architecture

```
ZoteroPatch-AI-Reader/
├── src/
│   ├── index.ts              # Entry point, plugin lifecycle
│   ├── types/                # TypeScript type definitions
│   ├── panel/                # UI panels
│   │   ├── ReaderPanelManager.ts      # Sidebar panel management
│   │   └── SelectionMenuManager.ts    # Selection context menu
│   ├── services/             # Core services
│   │   ├── SessionManager.ts          # Session context and history
│   │   ├── ConfigManager.ts           # Preferences management
│   │   ├── LLMClient.ts              # OpenAI-compatible client
│   │   └── NotesSyncService.ts        # Write-back to notes
│   └── prefs/                # Preferences panel
│       └── PreferencesPanel.ts
├── bootstrap.js              # Zotero add-on bootstrap
├── manifest.json            # Add-on manifest
└── scripts/                 # Build scripts
    ├── build.js
    └── prepare.js
```

### Core Components

- **ReaderPanelManager**: Manages the AI assistant panel in the PDF sidebar
- **SelectionMenuManager**: Extends the context menu for text selection
- **SessionManager**: Handles per-document session context and history
- **LLMClient**: Wraps OpenAI-compatible API calls with retry and error handling
- **NotesSyncService**: Writes AI content back to Zotero notes
- **ConfigManager**: Manages plugin configuration via Zotero Preferences

## 🛠️ Development Guide

### Environment Setup

```bash
# Clone
git clone https://github.com/bahayonghang/ZoteroPatch-AI-Reader.git
cd ZoteroPatch-AI-Reader

# Install dependencies
npm install

# Prepare project directories
npm run prepare
```

### Development Mode

```bash
# Watch build (hot reload)
npm run build:watch

# Or shorthand
npm start
```

### Production Build

```bash
# Build production bundle
npm run build

# Output in build/
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Run tests
npm test
```

### Debug Tips

1. **Enable Zotero Developer Mode**:
   - Zotero → `Edit` → `Preferences` → `Advanced` → `Config Editor`
   - Search `extensions.zotero.debug.output` and set to `true`

2. **View Logs**:
   - Zotero → `Help` → `Debug Output Logging` → `View Output`
   - Logs are prefixed with `[AI Reader]`

3. **Hot Reload**:
   - Use `npm run build:watch`
   - After edits, disable and re-enable the add-on in Zotero

## 🔧 FAQ

### Q: The plugin fails to load?

A:
1. Ensure Zotero version is 7.0+
2. Make sure the add-on file is intact
3. Check Zotero Debug Output for errors

### Q: API call failures?

A:
1. Verify API Key
2. Check API endpoint accessibility
3. Confirm network connectivity
4. Ensure sufficient API quota

### Q: Sidebar panel does not appear?

A: Possible reasons:
1. Zotero Reader has not finished loading
2. Plugin initialization failed—check console logs
3. Conflicts with other add-ons—try disabling others

### Q: How to use a local model?

A:
1. Set the API endpoint to your local address (e.g., `http://localhost:8000/v1`)
2. Ensure the local service exposes an OpenAI-compatible API
3. Adjust the model name as needed

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [Zotero](https://www.zotero.org/) - Excellent reference manager
- [windingwind/zotero-plugin-template](https://github.com/windingwind/zotero-plugin-template) - Zotero add-on template
- OpenAI - Powerful AI capabilities

## 📮 Contact

- Issues: [GitHub Issues](https://github.com/bahayonghang/ZoteroPatch-AI-Reader/issues)
- Ideas: [GitHub Discussions](https://github.com/bahayonghang/ZoteroPatch-AI-Reader/discussions)

---

**Note**: This add-on is for academic research and personal study only. Please comply with the terms of your API provider.
