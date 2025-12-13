# ZoteroPatch AI Reader - Justfile
# 项目构建和开发任务管理

# 默认任务：显示帮助
default:
    @just --list

# 显示详细的帮助信息
help:
    @echo "╔══════════════════════════════════════════════════════════════════╗"
    @echo "║         ZoteroPatch AI Reader - 命令参考                        ║"
    @echo "╚══════════════════════════════════════════════════════════════════╝"
    @echo ""
    @echo "📦 设置和安装"
    @echo "  just install          - 安装 npm 依赖"
    @echo "  just setup            - 完整设置（清理 + 安装 + 构建）"
    @echo "  just prepare          - 准备项目目录"
    @echo ""
    @echo "🔨 构建和开发"
    @echo "  just dev              - 启动开发模式（监听和自动重建）"
    @echo "  just build            - 构建 TypeScript 到 build/ 目录"
    @echo "                          （用于开发，不是 Zotero 安装）"
    @echo "  just check            - 运行所有检查（lint + 类型检查）"
    @echo "  just lint             - 运行 ESLint"
    @echo "  just lint-fix         - 运行 ESLint 自动修复"
    @echo "  just typecheck        - 运行 TypeScript 类型检查"
    @echo "  just format           - 使用 Prettier 格式化代码"
    @echo ""
    @echo "🧪 测试"
    @echo "  just test             - 运行测试"
    @echo "  just test-coverage    - 运行测试并生成覆盖率报告"
    @echo ""
    @echo "📦 Zotero 打包"
    @echo "  just package          - ⭐ 构建 + 创建 .xpi 文件用于 Zotero"
    @echo "                          （使用此命令创建可安装的插件！）"
    @echo "  just size             - 显示构建大小"
    @echo ""
    @echo "  ⚠️  重要：要在 Zotero 中安装，请使用 'just package' 而不是 'just build'"
    @echo "      - 'just build'   → 创建 build/ 文件夹（用于开发）"
    @echo "      - 'just package' → 创建 .xpi 文件（用于 Zotero 安装）"
    @echo ""
    @echo "🔧 Zotero 集成"
    @echo "  just install-zotero   - 安装到 Zotero（需要 ZOTERO_PLUGIN_DIR）"
    @echo "  just uninstall-zotero - 从 Zotero 卸载"
    @echo "  just quick-dev        - 快速开发：构建 + 安装到 Zotero"
    @echo "                          （用于快速测试，需要环境变量）"
    @echo ""
    @echo "📚 文档"
    @echo "  just docs-dev         - 启动文档开发服务器"
    @echo "  just docs-build       - 构建文档"
    @echo "  just docs-preview     - 预览文档构建"
    @echo "  just docs-ci          - 安装 + 构建文档（CI 兼容）"
    @echo "  just docs-install     - 安装文档依赖"
    @echo ""
    @echo "🚀 发布"
    @echo "  just pre-release      - 运行所有检查 + 构建 + 测试 + 打包"
    @echo "  just release-patch    - 发布补丁版本（0.1.0 -> 0.1.1）"
    @echo "  just release-minor    - 发布次版本（0.1.0 -> 0.2.0）"
    @echo "  just release-major    - 发布主版本（0.1.0 -> 1.0.0）"
    @echo ""
    @echo "🧹 清理"
    @echo "  just clean            - 清理构建产物"
    @echo "  just clean-all        - 清理所有内容（包括 node_modules）"
    @echo ""
    @echo "ℹ️  其他"
    @echo "  just status           - 显示项目状态"
    @echo "  just log              - 显示最近的 git 日志"
    @echo "  just --list           - 列出所有可用命令"
    @echo ""
    @echo "💡 快速开始："
    @echo "  1. 首次使用：        just setup"
    @echo "  2. 开发：            just dev"
    @echo "  3. 安装到 Zotero：   just package  （创建 .xpi 文件）"
    @echo "  4. 在 Zotero 测试：  在 Zotero 中安装 .xpi → 工具 → 附加组件"
    @echo ""
    @echo "🔑 环境变量："
    @echo "  ZOTERO_PLUGIN_DIR - Zotero 扩展目录的路径"
    @echo "                      （'just install-zotero' 需要）"
    @echo ""

# 安装依赖
install:
    @echo "📦 正在安装依赖..."
    npm install

# 准备项目目录
prepare:
    @echo "🔧 正在准备项目目录..."
    npm run prepare

# 开发模式：监听文件并自动构建
dev:
    @echo "👀 启动开发模式..."
    npm run build:watch

# 同步版本号（与 package.json 保持一致）
sync-version:
    @echo "🔄 正在同步版本号到 manifest 和偏好界面..."
    @node -e "const fs = require('fs'); const version = require('./package.json').version; const manifestPath = 'manifest.json'; const prefPath = 'chrome/content/preferences.xhtml'; try { const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); if (manifest.version !== version) { manifest.version = version; fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\\n'); console.log('✅ manifest.json 已同步版本', version); } else { console.log('ℹ️ manifest.json 已是版本', version); } } catch (e) { console.error('❌ 同步 manifest 失败', e); process.exit(1); } try { const prefContent = fs.readFileSync(prefPath, 'utf8'); const updated = prefContent.replace(/(id=\\\"aireader-version\\\"[^>]*>v)([0-9\\.]+)/, (_m, prefix) => prefix + version); if (updated !== prefContent) { fs.writeFileSync(prefPath, updated); console.log('✅ preferences.xhtml 已同步版本', version); } else { console.log('ℹ️ preferences.xhtml 已是版本', version); } } catch (e) { console.error('❌ 同步 preferences.xhtml 失败', e); process.exit(1); }"

# 构建生产版本
build: sync-version
    @echo "🚀 正在构建生产版本..."
    npm run build

# 清理构建产物
clean:
    @echo "🧹 正在清理构建产物..."
    rm -rf build/ dist/ addon/ coverage/
    rm -f *.xpi *.zip

# 完整清理（包括 node_modules）
clean-all: clean
    @echo "🧹 正在清理所有产物和依赖..."
    rm -rf node_modules/

# 运行代码检查
lint:
    @echo "🔍 正在运行 ESLint..."
    npm run lint

# 运行检查并自动修复
lint-fix:
    @echo "🔧 正在运行 ESLint 自动修复..."
    npx eslint src --ext .ts,.tsx --fix

# 运行测试
test:
    @echo "🧪 正在运行测试..."
    npm test

# 运行测试并生成覆盖率报告
test-coverage:
    @echo "📊 正在运行测试并生成覆盖率..."
    npm test -- --coverage

# 运行 TypeScript 类型检查
typecheck:
    @echo "📝 正在运行 TypeScript 类型检查..."
    npx tsc --noEmit

# 完整检查（lint + typecheck + test）
check: lint typecheck
    @echo "✅ 所有检查通过！"

# 将插件打包为 .xpi 文件
package: build
    @echo "📦 正在创建 .xpi 包..."
    cd build && zip -r ../zoteropatch-ai-reader.xpi .
    @echo "✅ 包已创建：zoteropatch-ai-reader.xpi"

# 安装到 Zotero（需要 ZOTERO_PLUGIN_DIR 环境变量）
install-zotero: build
    @echo "📥 正在安装到 Zotero..."
    @if [ -z "$ZOTERO_PLUGIN_DIR" ]; then \
        echo "❌ 错误：ZOTERO_PLUGIN_DIR 未设置"; \
        echo "请将其设置为你的 Zotero 配置文件扩展目录"; \
        exit 1; \
    fi
    rm -rf "$ZOTERO_PLUGIN_DIR/ai-reader@zoteropatch.com"
    cp -r build "$ZOTERO_PLUGIN_DIR/ai-reader@zoteropatch.com"
    @echo "✅ 已安装到 Zotero"

# 从 Zotero 卸载
uninstall-zotero:
    @echo "📤 正在从 Zotero 卸载..."
    @if [ -z "$ZOTERO_PLUGIN_DIR" ]; then \
        echo "❌ 错误：ZOTERO_PLUGIN_DIR 未设置"; \
        exit 1; \
    fi
    rm -rf "$ZOTERO_PLUGIN_DIR/ai-reader@zoteropatch.com"
    @echo "✅ 已从 Zotero 卸载"

# 开发工作流：clean -> install -> prepare -> build
setup: clean install prepare build
    @echo "✅ 开发环境设置完成！"

# 发布前检查
pre-release: clean check build test package
    @echo "✅ 发布前检查通过！"
    @echo "📦 包已准备好：zoteropatch-ai-reader.xpi"

# 显示项目状态
status:
    @echo "📊 项目状态"
    @echo "===================="
    @echo "Node 版本：$(node --version)"
    @echo "npm 版本：$(npm --version)"
    @if [ -d "node_modules" ]; then echo "✅ 依赖已安装"; else echo "❌ 依赖未安装"; fi
    @if [ -d "build" ]; then echo "✅ 构建存在"; else echo "❌ 未找到构建"; fi
    @if [ -f "zoteropatch-ai-reader.xpi" ]; then echo "✅ 包存在"; else echo "❌ 未找到包"; fi

# 启动文档开发服务器
docs-dev:
    @echo "📚 启动文档开发服务器..."
    cd docs && npm run dev

# 构建文档
docs-build:
    @echo "📚 正在构建文档..."
    cd docs && npm run build

# CI 风格的文档构建（安装 + 构建）
docs-ci: docs-install docs-build
    @echo "✅ 文档安装 + 构建完成（CI 兼容）"

# 预览文档构建
docs-preview:
    @echo "📚 正在预览文档构建..."
    cd docs && npm run preview

# 安装文档依赖
docs-install:
    @echo "📦 正在安装文档依赖..."
    cd docs && npm install

# 初始化文档
docs-init: docs-install
    @echo "✅ 文档已初始化！"

# 显示构建大小
size:
    @echo "📊 构建大小分析："
    @if [ -f "build/index.js" ]; then \
        du -h build/index.js; \
    else \
        echo "❌ 未找到构建，请先运行 'just build'"; \
    fi

# 格式化代码
format:
    @echo "✨ 正在格式化代码..."
    npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,md}"

# 显示最近的 git 日志
log:
    @git log --oneline --graph --decorate -10

# 更新版本（私有任务）
[private]
bump-version version:
    @echo "📝 正在更新版本到 {{version}}"
    npm version {{version}} --no-git-tag-version
    @echo "✅ 版本已更新到 {{version}}"

# 发布补丁版本（0.1.0 -> 0.1.1）
release-patch: pre-release
    @just bump-version patch
    @echo "✅ 补丁版本已准备好！"

# 发布次版本（0.1.0 -> 0.2.0）
release-minor: pre-release
    @just bump-version minor
    @echo "✅ 次版本已准备好！"

# 发布主版本（0.1.0 -> 1.0.0）
release-major: pre-release
    @just bump-version major
    @echo "✅ 主版本已准备好！"

# 快速开发周期：构建并安装到 Zotero
quick-dev: build install-zotero
    @echo "✅ 快速开发周期完成！"
    @echo "💡 重启 Zotero 以查看更改"

# 监听变更并自动安装到 Zotero
watch-install:
    @echo "👀 正在监听变更并自动安装..."
    @while true; do \
        npm run build:watch & \
        BUILD_PID=$$!; \
        trap "kill $$BUILD_PID" EXIT; \
        inotifywait -e modify -r src/; \
        just install-zotero; \
    done
