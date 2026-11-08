# dsh-constitution

A global constitution for [DeepSeek Harness](https://github.com/deepseek-ai). Write your standing
rules once in the sidebar panel; every session carries them in its system prompt — the dsh
counterpart of Codex's `AGENTS.md` and Claude Code's `CLAUDE.md`, except the file is edited where
you use it and takes effect without restarting anything.

[中文说明](#中文说明)

## What it does

- **Sidebar entry → panel.** One text box for your personal defaults: answer language, review and
  commit rules, tool preferences, hard constraints.
- **One file.** Saving writes `~/.dsh/constitution.md` (plain Markdown; edit it in any editor, the
  panel picks it up on next open).
- **Injected into every session.** The Host half registers the file as a `systemPrompt` prompt
  context named `constitution` at `order: -100`, re-reading it whenever its mtime changes. Each
  model step therefore sees the current text, wrapped in a `<constitution>` block with a one-line
  framing sentence.
- **Empty means silent.** If the file is empty or missing, the context contributes an empty string
  and costs nothing.

## Install

```sh
dsh plugin add dsh-constitution          # from npm (once published)
dsh plugin add owner/dsh-constitution    # straight from GitHub
```

Or in the app: **Plugins → Add plugin**, paste the package name or the repository URL.

## Requirements

- DeepSeek Harness with the `systemPrompt` and `connection` services (0.2.x web/desktop builds).
- The Host half registers two Fetch routes and one prompt context, so it needs no client-side
  credential or token.

## Files

```
index.js             Host half: reads/writes the constitution file, registers the prompt context
client.js            Client half: sidebar icon + main panel (load, save, autosave, retry)
cordis.patch.yml     one `insert` row mounting this package
locale/{zh,en}.json  marketplace title and description
icon.svg             sidebar icon (original artwork)
assets/icon-180.png  raster tile for the marketplace listing
```

The Host half exposes two exact routes used by the panel:

| Route | Body | Response |
| --- | --- | --- |
| `POST /api/dsh-constitution/state` | `{}` | `{ ok, value: { text, path, chars, updatedAt } }` |
| `POST /api/dsh-constitution/save` | `{ text }` | the same snapshot |

## Privacy

The plugin touches exactly one path, `$DSH_HOME/constitution.md` (default `~/.dsh/constitution.md`).
It reads it before each model step and writes it only when you press **Save** or stop typing for
700 ms in the panel. Nothing is sent anywhere else; there is no telemetry and no network access.

## Development

```sh
node --check index.js && node --check client.js
```

Build the harness: `dsh plugin add <path-to-this-dir>`. Editing `client.js` is picked up by
reloading the window; editing `index.js` (the Host half) requires reloading the plugin — disable and
re-enable its row, or restart the app.

## License

MIT

---

## 中文说明

一句话：**侧栏里写一份全局准则，每个会话自动带上。**

- 侧栏入口「全局宪法」→ 主面板一个文本框，写你的个性化设置、做事准则和硬约束。
- 保存后落在 `~/.dsh/constitution.md`，纯 Markdown，可以直接用编辑器改。
- Host 半把这份文件注册成 `systemPrompt` 的一个 prompt context（`constitution`，`order: -100`），
  文件 mtime 变化时重新读取，**每个会话的每次模型调用**都会带上它，包在 `<constitution>` 块里。
- 文件为空时不注入任何内容。

安装：`dsh plugin add dsh-constitution`，或在应用里「插件 → 添加插件」粘贴包名 / 仓库地址。

只读写 `~/.dsh/constitution.md` 这一个路径，无遥测、无额外网络请求。

### 实现里值得记一笔的坑

不要用 `ctx.inject(['systemPrompt'], cb)` 注册：在这套运行时里它的回调不会执行，服务其实已经就绪。
正确写法是取服务再挂 effect：

```js
const prompt = ctx.get('systemPrompt');
ctx.effect(() => prompt.context({ name: 'constitution', order: -100, required: false, interpolate: false, text: () => render() }));
```
