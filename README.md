# 手卡制作器

本地网页工具，用于把 `.docx` 主持稿自动排版成 A4 四乘一横版手卡，并通过浏览器打印导出为 A4 拼版 PDF。

## 启动

```bash
/Users/amy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node server.js
```

然后打开：

```text
http://127.0.0.1:4173
```

## 功能

- 导入 `.docx` Word 文档。
- 保留段落、标题感、换行和加粗。
- 可设置纸张大小、纸张方向，以及手卡在纸上的行数和列数。
- 可调字号、行距、边距。
- 可导入一张图片作为手卡背面背景。
- 打印时按设置的行列自动拼版，并带裁切参考边界。
- 导入背面图片后，打印预览和 PDF 会按“正面文字页、背面图片页”成对输出。

## 注意

`.doc` 旧格式不直接支持，请先在 Word 中另存为 `.docx`。
