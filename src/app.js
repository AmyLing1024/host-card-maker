const PAPER_SIZES = {
  A3: { label: "A3", widthMm: 297, heightMm: 420 },
  A4: { label: "A4", widthMm: 210, heightMm: 297 },
  A5: { label: "A5", widthMm: 148, heightMm: 210 },
  LETTER: { label: "Letter", widthMm: 215.9, heightMm: 279.4 },
};

const state = {
  document: {
    title: "",
    blocks: [],
  },
  settings: {
    fontSize: 24,
    lineHeight: 1.55,
    marginMm: 10,
    paperSize: "A4",
    paperOrientation: "portrait",
    layoutRows: 4,
    layoutColumns: 1,
  },
  pages: [],
  background: {
    url: "",
    name: "",
  },
};

const els = {
  fileInput: document.querySelector("#word-file"),
  dropZone: document.querySelector("#drop-zone"),
  sampleButton: document.querySelector("#sample-button"),
  backgroundInput: document.querySelector("#background-file"),
  backgroundPreview: document.querySelector("#background-preview"),
  backgroundPreviewImage: document.querySelector("#background-preview-image"),
  backgroundFileName: document.querySelector("#background-file-name"),
  removeBackgroundButton: document.querySelector("#remove-background-button"),
  fontSize: document.querySelector("#font-size"),
  fontSizeValue: document.querySelector("#font-size-value"),
  lineHeight: document.querySelector("#line-height"),
  lineHeightValue: document.querySelector("#line-height-value"),
  marginMm: document.querySelector("#margin-mm"),
  marginMmValue: document.querySelector("#margin-mm-value"),
  paperSize: document.querySelector("#paper-size"),
  paperSizeValue: document.querySelector("#paper-size-value"),
  paperOrientation: document.querySelector("#paper-orientation"),
  paperOrientationValue: document.querySelector("#paper-orientation-value"),
  layoutRows: document.querySelector("#layout-rows"),
  layoutRowsValue: document.querySelector("#layout-rows-value"),
  layoutColumns: document.querySelector("#layout-columns"),
  layoutColumnsValue: document.querySelector("#layout-columns-value"),
  stepperButtons: document.querySelectorAll(".stepper-button"),
  status: document.querySelector("#status-message"),
  printButton: document.querySelector("#print-button"),
  cardCount: document.querySelector("#card-count"),
  printLayoutSummary: document.querySelector("#print-layout-summary"),
  previewLayoutSummary: document.querySelector("#preview-layout-summary"),
  title: document.querySelector("#document-title"),
  emptyState: document.querySelector("#empty-state"),
  preview: document.querySelector("#cards-preview"),
  printRoot: document.querySelector("#print-root"),
  printPreviewModal: document.querySelector("#print-preview-modal"),
  printPreviewScroll: document.querySelector("#print-preview-scroll"),
  printPreviewPages: document.querySelector("#print-preview-pages"),
  previewSheetCount: document.querySelector("#preview-sheet-count"),
  previewPrintMode: document.querySelector("#preview-print-mode"),
  closePreviewButton: document.querySelector("#close-preview-button"),
  cancelPreviewButton: document.querySelector("#cancel-preview-button"),
  confirmPrintButton: document.querySelector("#confirm-print-button"),
  measure: document.querySelector("#measurement-card"),
};

function setStatus(message, isError = false) {
  els.status.textContent = message;
  els.status.classList.toggle("is-error", isError);
}

function clampLayoutValue(value) {
  return Math.max(1, Math.min(8, Number.parseInt(value, 10) || 1));
}

function getPaperDimensions(settings = state.settings) {
  const paper = PAPER_SIZES[settings.paperSize] || PAPER_SIZES.A4;
  const isLandscape = settings.paperOrientation === "landscape";
  return {
    label: paper.label,
    widthMm: isLandscape ? paper.heightMm : paper.widthMm,
    heightMm: isLandscape ? paper.widthMm : paper.heightMm,
  };
}

function getLayout(settings = state.settings) {
  const paper = getPaperDimensions(settings);
  const rows = Math.max(1, Number(settings.layoutRows) || 1);
  const columns = Math.max(1, Number(settings.layoutColumns) || 1);
  return {
    paper,
    rows,
    columns,
    cardsPerSheet: rows * columns,
    cardWidthMm: paper.widthMm / columns,
    cardHeightMm: paper.heightMm / rows,
  };
}

function setLayoutCssVars(node, layout = getLayout()) {
  node.style.setProperty("--paper-width", `${layout.paper.widthMm}mm`);
  node.style.setProperty("--paper-height", `${layout.paper.heightMm}mm`);
  node.style.setProperty("--card-width", `${layout.cardWidthMm}mm`);
  node.style.setProperty("--card-height", `${layout.cardHeightMm}mm`);
  node.style.setProperty("--layout-rows", String(layout.rows));
  node.style.setProperty("--layout-columns", String(layout.columns));
}

function updateScreenPreviewScale() {
  const layout = getLayout();
  const availableWidth = Math.max(els.preview?.parentElement?.clientWidth - 28 || 320, 240);
  const cardWidthPx = layout.cardWidthMm * (96 / 25.4);
  const scale = Math.min(1, Math.max(0.28, availableWidth / cardWidthPx));
  els.preview.style.setProperty("--screen-card-scale", scale.toFixed(4));
  els.preview.style.setProperty("--screen-card-offset", `${((scale - 1) * layout.cardHeightMm).toFixed(2)}mm`);
}

function getLayoutSummary(layout = getLayout()) {
  const orientationLabel = state.settings.paperOrientation === "landscape" ? "横排" : "竖排";
  return `${layout.paper.label} ${orientationLabel} ${layout.rows} 行 × ${layout.columns} 列`;
}

function syncCssSettings() {
  const layout = getLayout();
  const targetNodes = [document.documentElement, els.measure];
  for (const node of targetNodes) {
    node.style.setProperty("--card-font-size", `${state.settings.fontSize}pt`);
    node.style.setProperty("--card-line-height", String(state.settings.lineHeight));
    node.style.setProperty("--card-margin", `${state.settings.marginMm}mm`);
    setLayoutCssVars(node, layout);
  }

  els.fontSizeValue.textContent = `${state.settings.fontSize} pt`;
  els.lineHeightValue.textContent = state.settings.lineHeight.toFixed(2).replace(/0$/, "");
  els.marginMmValue.textContent = `${state.settings.marginMm} mm`;
  els.paperSizeValue.textContent = layout.paper.label;
  els.paperOrientationValue.textContent = state.settings.paperOrientation === "landscape" ? "横排" : "竖排";
  els.layoutRowsValue.textContent = `${layout.rows} 行`;
  els.layoutColumnsValue.textContent = `${layout.columns} 列`;
  els.layoutRows.value = String(layout.rows);
  els.layoutColumns.value = String(layout.columns);
  els.printLayoutSummary.textContent = getLayoutSummary(layout);
  els.previewLayoutSummary.textContent = `${getLayoutSummary(layout)}预览`;
  updateScreenPreviewScale();
}

function escapeText(text) {
  return text.replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[char];
  });
}

function escapeAttribute(text) {
  return escapeText(text).replace(/`/g, "&#096;");
}

function normalizeWhitespace(text) {
  return text.replace(/\u00a0/g, " ").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
}

function runsToUnits(runs) {
  const units = [];
  for (const run of runs) {
    for (const char of Array.from(run.text)) {
      units.push({ text: char, bold: Boolean(run.bold) });
    }
  }
  return units;
}

function unitsToRuns(units) {
  const runs = [];
  for (const unit of units) {
    const last = runs[runs.length - 1];
    if (last && Boolean(last.bold) === Boolean(unit.bold)) {
      last.text += unit.text;
    } else {
      runs.push({ text: unit.text, bold: Boolean(unit.bold) });
    }
  }
  return runs;
}

function getBlockText(block) {
  return block.runs.map((run) => run.text).join("");
}

function blockToHtml(block) {
  const runs = block.runs
    .map((run) => {
      const content = escapeText(run.text);
      return run.bold ? `<strong>${content}</strong>` : content;
    })
    .join("");
  return `<p class="card-block ${block.type === "heading" ? "heading" : "paragraph"}">${runs}</p>`;
}

function renderBlocks(container, blocks) {
  container.innerHTML = blocks.map(blockToHtml).join("");
}

function wouldFit(blocks) {
  renderBlocks(els.measure, blocks);
  return els.measure.scrollHeight <= els.measure.clientHeight + 1;
}

function splitBlockForPage(currentPage, block) {
  const units = runsToUnits(block.runs);
  let low = 0;
  let high = units.length;

  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    const candidateBlock = {
      type: block.type,
      runs: unitsToRuns(units.slice(0, mid)),
    };
    if (wouldFit([...currentPage, candidateBlock])) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  return {
    head: {
      type: block.type,
      runs: unitsToRuns(units.slice(0, low)),
    },
    tail: {
      type: block.type === "heading" ? "paragraph" : block.type,
      runs: unitsToRuns(units.slice(low)),
    },
    count: low,
  };
}

function paginateBlocks(blocks) {
  const pages = [];
  let page = [];

  for (const originalBlock of blocks) {
    let block = {
      type: originalBlock.type,
      runs: originalBlock.runs.filter((run) => run.text.length > 0),
    };

    if (!getBlockText(block).trim()) {
      continue;
    }

    while (getBlockText(block).length > 0) {
      if (wouldFit([...page, block])) {
        page.push(block);
        break;
      }

      if (page.length > 0) {
        const split = splitBlockForPage(page, block);
        if (split.count > 0 && getBlockText(split.head).trim()) {
          page.push(split.head);
          pages.push(page);
          page = [];
          block = split.tail;
        } else {
          pages.push(page);
          page = [];
        }
        continue;
      }

      const split = splitBlockForPage([], block);
      if (split.count === 0) {
        const units = runsToUnits(block.runs);
        page.push({
          type: block.type,
          runs: unitsToRuns(units.slice(0, 1)),
        });
        pages.push(page);
        page = [];
        block = {
          type: block.type === "heading" ? "paragraph" : block.type,
          runs: unitsToRuns(units.slice(1)),
        };
      } else {
        page.push(split.head);
        pages.push(page);
        page = [];
        block = split.tail;
      }
    }
  }

  if (page.length > 0) {
    pages.push(page);
  }

  return pages;
}

function renderCard(page, index) {
  return `
    <article class="host-card" data-page="${index + 1}">
      ${page.map(blockToHtml).join("")}
    </article>
  `;
}

function renderBackgroundCard(index) {
  return `
    <article class="host-card background-card" data-page="${index + 1}">
      <img class="background-card-image" src="${escapeAttribute(state.background.url)}" alt="" />
    </article>
  `;
}

function renderPreview() {
  const hasDocument = state.document.blocks.length > 0;
  els.emptyState.style.display = hasDocument ? "none" : "grid";
  els.preview.innerHTML = state.pages.map(renderCard).join("");
  els.cardCount.textContent = `${state.pages.length} 张`;
  els.title.textContent = state.document.title || (hasDocument ? "未命名主持稿" : "未导入文档");
  els.printButton.disabled = !hasDocument;
}

function renderBackgroundPreview() {
  const hasBackground = Boolean(state.background.url);
  els.backgroundPreview.hidden = !hasBackground;
  if (hasBackground) {
    els.backgroundPreviewImage.src = state.background.url;
    els.backgroundFileName.textContent = state.background.name;
  } else {
    els.backgroundPreviewImage.removeAttribute("src");
    els.backgroundFileName.textContent = "";
  }
}

function renderPrintRoot() {
  const layout = getLayout();
  const sheets = [];
  for (let index = 0; index < state.pages.length; index += layout.cardsPerSheet) {
    const frontSlots = Array.from({ length: layout.cardsPerSheet }, (_, slotIndex) => {
      const page = state.pages[index + slotIndex];
      return `<div class="print-slot">${page ? renderCard(page, index + slotIndex) : ""}</div>`;
    }).join("");
    sheets.push(`<section class="print-sheet front-sheet" data-side="正面">${frontSlots}</section>`);

    if (state.background.url) {
      const backSlots = Array.from({ length: layout.cardsPerSheet }, (_, slotIndex) => {
        const page = state.pages[index + slotIndex];
        return `<div class="print-slot">${page ? renderBackgroundCard(index + slotIndex) : ""}</div>`;
      }).join("");
      sheets.push(`<section class="print-sheet back-sheet" data-side="背面">${backSlots}</section>`);
    }
  }
  els.printRoot.innerHTML = sheets.join("");
}

function renderPrintPreview() {
  const layout = getLayout();
  renderPrintRoot();
  els.printPreviewPages.innerHTML = els.printRoot.innerHTML;
  setLayoutCssVars(els.printPreviewPages, layout);
  const frontSheetCount = Math.max(Math.ceil(state.pages.length / layout.cardsPerSheet), 0);
  const totalSheetCount = state.background.url ? frontSheetCount * 2 : frontSheetCount;
  els.previewSheetCount.textContent = `${totalSheetCount} 页 ${layout.paper.label}`;
  els.previewPrintMode.textContent = state.background.url
    ? `正面文字 + 背面图片，${getLayoutSummary(layout)}`
    : `${getLayoutSummary(layout)}，每页 ${layout.cardsPerSheet} 张手卡`;
  updatePrintPreviewScale();
}

function updatePrintPreviewScale() {
  if (!els.printPreviewScroll) {
    return;
  }

  const layout = getLayout();
  const paperWidthPx = layout.paper.widthMm * (96 / 25.4);
  const availableWidth = Math.max(els.printPreviewScroll.clientWidth - 24, 260);
  const scale = Math.min(0.82, Math.max(0.24, availableWidth / paperWidthPx));
  els.printPreviewPages.style.setProperty("--print-preview-scale", scale.toFixed(4));
  els.printPreviewPages.style.setProperty(
    "--print-preview-sheet-offset",
    `${((scale - 1) * layout.paper.heightMm).toFixed(2)}mm`,
  );
}

function openPrintPreview() {
  renderPrintPreview();
  els.printPreviewModal.hidden = false;
  document.body.classList.add("is-preview-open");
  requestAnimationFrame(updatePrintPreviewScale);
  els.confirmPrintButton.focus();
}

function closePrintPreview() {
  els.printPreviewModal.hidden = true;
  document.body.classList.remove("is-preview-open");
  els.printButton.focus();
}

function buildPrintDocumentHtml() {
  const layout = getLayout();
  const printMarginMm = 5;
  const printableWidthMm = layout.paper.widthMm - printMarginMm * 2;
  const printableHeightMm = layout.paper.heightMm - printMarginMm * 2 - 2;
  const printableCardWidthMm = printableWidthMm / layout.columns;
  const printableCardHeightMm = printableHeightMm / layout.rows;

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>手卡打印</title>
    <style>
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        width: ${printableWidthMm}mm;
        background: #ffffff;
      }
      @page {
        size: ${layout.paper.widthMm}mm ${layout.paper.heightMm}mm;
        margin: ${printMarginMm}mm;
      }
      .print-sheet {
        display: grid;
        grid-template-columns: repeat(${layout.columns}, ${printableCardWidthMm}mm);
        grid-template-rows: repeat(${layout.rows}, ${printableCardHeightMm}mm);
        width: ${printableWidthMm}mm;
        height: ${printableHeightMm}mm;
        overflow: hidden;
      }
      .print-sheet + .print-sheet {
        page-break-before: always;
        break-before: page;
      }
      .print-slot {
        position: relative;
        width: ${printableCardWidthMm}mm;
        height: ${printableCardHeightMm}mm;
      }
      .host-card {
        position: relative;
        width: ${printableCardWidthMm}mm;
        height: ${printableCardHeightMm}mm;
        padding: ${state.settings.marginMm}mm;
        overflow: hidden;
        background: #fffdf8;
        border: 0.25mm solid #969696;
        font-size: ${state.settings.fontSize}pt;
        line-height: ${state.settings.lineHeight};
        font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
      }
      .host-card::after {
        content: attr(data-page);
        position: absolute;
        right: 6mm;
        bottom: 4mm;
        color: #8a8170;
        font-size: 9pt;
        line-height: 1;
      }
      .background-card {
        padding: 0;
        background: #ffffff;
      }
      .background-card::after {
        display: none;
      }
      .background-card-image {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .card-block {
        margin: 0 0 0.55em;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .card-block:last-child {
        margin-bottom: 0;
      }
      .card-block.heading {
        font-weight: 800;
        font-size: 1.16em;
        line-height: 1.35;
      }
      .print-slot::before,
      .print-slot::after {
        content: "";
        position: absolute;
        z-index: 2;
        width: 7mm;
        height: 7mm;
        pointer-events: none;
      }
      .print-slot::before {
        left: 0;
        top: 0;
        border-left: 0.2mm solid #999;
        border-top: 0.2mm solid #999;
      }
      .print-slot::after {
        right: 0;
        bottom: 0;
        border-right: 0.2mm solid #999;
        border-bottom: 0.2mm solid #999;
      }
    </style>
  </head>
  <body>${els.printRoot.innerHTML}</body>
</html>`;
}

function printFromDedicatedDocument() {
  renderPrintRoot();

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    setStatus("浏览器拦截了打印窗口。请允许弹出窗口后再试一次。", true);
    return;
  }

  const printDocument = printWindow.document;
  printDocument.open();
  printDocument.write(buildPrintDocumentHtml());
  printDocument.close();

  const runPrint = () => {
    printWindow.focus();
    printWindow.print();
  };

  const images = [...printDocument.images];
  if (images.length === 0) {
    setTimeout(runPrint, 150);
    return;
  }

  Promise.all(
    images.map((image) => {
      if (image.complete) {
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
    }),
  ).then(() => setTimeout(runPrint, 150));
}

function repaginate() {
  syncCssSettings();
  state.pages = paginateBlocks(state.document.blocks);
  renderPreview();
  renderBackgroundPreview();
  renderPrintRoot();
}

function htmlNodeToRuns(node) {
  const runs = [];

  function walk(current, bold) {
    if (current.nodeType === Node.TEXT_NODE) {
      const text = normalizeWhitespace(current.textContent || "");
      if (text) {
        runs.push({ text, bold });
      }
      return;
    }

    if (current.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const tag = current.tagName.toLowerCase();
    const nextBold = bold || tag === "strong" || tag === "b";
    if (tag === "br") {
      runs.push({ text: "\n", bold: nextBold });
      return;
    }

    for (const child of current.childNodes) {
      walk(child, nextBold);
    }
  }

  walk(node, false);
  return runs;
}

function htmlToDocument(html, title) {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(html, "text/html");
  const nodes = [...parsed.body.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li")];
  const blocks = nodes
    .map((node) => {
      const runs = htmlNodeToRuns(node);
      const text = getBlockText({ runs });
      return {
        type: /^h[1-6]$/i.test(node.tagName) ? "heading" : "paragraph",
        runs,
        text,
      };
    })
    .filter((block) => block.text.trim())
    .map(({ type, runs }) => ({ type, runs }));

  return { title, blocks };
}

async function importDocx(file) {
  const extension = file.name.split(".").pop().toLowerCase();
  if (extension === "doc") {
    throw new Error("暂不支持 .doc 旧格式。请在 Word 中另存为 .docx 后再导入。");
  }
  if (extension !== "docx") {
    throw new Error("请选择 .docx Word 文件。");
  }
  if (!window.mammoth) {
    throw new Error("Word 解析库没有加载成功，请刷新页面后重试。");
  }

  setStatus("正在解析 Word 文档...");
  const arrayBuffer = await file.arrayBuffer();
  const result = await window.mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: [
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='标题 1'] => h1:fresh",
        "p[style-name='标题 2'] => h2:fresh",
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
      ],
    },
  );
  const title = file.name.replace(/\.docx$/i, "");
  const imported = htmlToDocument(result.value, title);
  if (imported.blocks.length === 0) {
    throw new Error("没有从这个 Word 文档中读到可排版的文字。");
  }

  state.document = imported;
  repaginate();
  const warningText = result.messages.length ? `；另有 ${result.messages.length} 条 Word 格式提示已忽略` : "";
  setStatus(`已导入 ${file.name}，生成 ${state.pages.length} 张手卡${warningText}。`);
}

function loadSample() {
  state.document = {
    title: "活动主持稿示例",
    blocks: [
      {
        type: "heading",
        runs: [{ text: "开场", bold: true }],
      },
      {
        type: "paragraph",
        runs: [
          { text: "尊敬的各位来宾、亲爱的朋友们，大家晚上好！欢迎来到本次活动现场。我是今天的主持人。" },
        ],
      },
      {
        type: "paragraph",
        runs: [
          { text: "接下来，请允许我隆重介绍今天到场的嘉宾：" },
          { text: "请大家以热烈的掌声欢迎他们。", bold: true },
        ],
      },
      {
        type: "heading",
        runs: [{ text: "环节提示", bold: true }],
      },
      {
        type: "paragraph",
        runs: [
          {
            text:
              "本环节结束后，请工作人员引导演讲嘉宾从舞台右侧上场。主持人停顿三秒，确认大屏内容切换完成后再继续串词。这里放一段较长的文字，用来验证自动分页时不会丢字，并且会在需要的时候拆到下一张手卡。",
          },
        ],
      },
    ],
  };
  repaginate();
  setStatus(`已载入示例，生成 ${state.pages.length} 张手卡。`);
}

function handleFile(file) {
  importDocx(file).catch((error) => {
    state.document = { title: "", blocks: [] };
    state.pages = [];
    renderPreview();
    renderPrintRoot();
    setStatus(error.message || "导入失败，请换一个 .docx 文件重试。", true);
  });
}

function handleBackgroundFile(file) {
  if (!file.type.startsWith("image/")) {
    setStatus("请选择图片文件作为手卡背面。", true);
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    state.background = {
      url: String(reader.result || ""),
      name: file.name,
    };
    renderBackgroundPreview();
    renderPrintRoot();
    if (!els.printPreviewModal.hidden) {
      renderPrintPreview();
    }
    setStatus(`已导入背面图片：${file.name}。`);
  });
  reader.addEventListener("error", () => {
    setStatus("背面图片读取失败，请换一张图片重试。", true);
  });
  reader.readAsDataURL(file);
}

function applyLayoutSettings(showStatus = true) {
  state.settings.paperSize = els.paperSize.value;
  state.settings.paperOrientation = els.paperOrientation.value;
  state.settings.layoutRows = clampLayoutValue(els.layoutRows.value);
  state.settings.layoutColumns = clampLayoutValue(els.layoutColumns.value);
  repaginate();
  if (!els.printPreviewModal.hidden) {
    renderPrintPreview();
  }
  if (showStatus && state.document.blocks.length) {
    setStatus(`已按 ${getLayoutSummary()} 重新排版，当前 ${state.pages.length} 张手卡。`);
  }
}

els.fileInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (file) {
    handleFile(file);
  }
});

els.dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  els.dropZone.classList.add("is-dragging");
});

els.dropZone.addEventListener("dragleave", () => {
  els.dropZone.classList.remove("is-dragging");
});

els.dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  els.dropZone.classList.remove("is-dragging");
  const file = event.dataTransfer.files?.[0];
  if (file) {
    handleFile(file);
  }
});

els.sampleButton.addEventListener("click", loadSample);

els.backgroundInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (file) {
    handleBackgroundFile(file);
  }
});

els.removeBackgroundButton.addEventListener("click", () => {
  state.background = { url: "", name: "" };
  els.backgroundInput.value = "";
  renderBackgroundPreview();
  renderPrintRoot();
  if (!els.printPreviewModal.hidden) {
    renderPrintPreview();
  }
  setStatus("已移除背面图片。");
});

for (const input of [els.fontSize, els.lineHeight, els.marginMm]) {
  input.addEventListener("input", () => {
    state.settings.fontSize = Number(els.fontSize.value);
    state.settings.lineHeight = Number(els.lineHeight.value);
    state.settings.marginMm = Number(els.marginMm.value);
    repaginate();
    if (state.document.blocks.length) {
      setStatus(`已重新排版，当前 ${state.pages.length} 张手卡。`);
    }
  });
}

for (const input of [els.paperSize, els.paperOrientation]) {
  input.addEventListener("input", () => {
    applyLayoutSettings();
  });
}

for (const input of [els.layoutRows, els.layoutColumns]) {
  input.addEventListener("input", () => {
    input.value = input.value.replace(/[^\d]/g, "").slice(0, 1);
    if (input.value) {
      applyLayoutSettings();
    }
  });
  input.addEventListener("blur", () => {
    input.value = String(clampLayoutValue(input.value));
    applyLayoutSettings();
  });
}

for (const button of els.stepperButtons) {
  button.addEventListener("click", () => {
    const target = button.dataset.stepTarget === "layout-columns" ? els.layoutColumns : els.layoutRows;
    const delta = Number(button.dataset.stepDelta) || 0;
    target.value = String(clampLayoutValue(clampLayoutValue(target.value) + delta));
    applyLayoutSettings();
  });
}

els.printButton.addEventListener("click", () => {
  openPrintPreview();
});

els.closePreviewButton.addEventListener("click", closePrintPreview);
els.cancelPreviewButton.addEventListener("click", closePrintPreview);

els.printPreviewModal.addEventListener("click", (event) => {
  if (event.target.matches("[data-close-print-preview]")) {
    closePrintPreview();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !els.printPreviewModal.hidden) {
    closePrintPreview();
  }
});

window.addEventListener("resize", () => {
  updateScreenPreviewScale();
  if (!els.printPreviewModal.hidden) {
    updatePrintPreviewScale();
  }
});

els.confirmPrintButton.addEventListener("click", () => {
  els.printPreviewModal.hidden = true;
  document.body.classList.remove("is-preview-open");
  printFromDedicatedDocument();
});

syncCssSettings();
renderPreview();
renderBackgroundPreview();
