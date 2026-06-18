const views = Array.from(document.querySelectorAll(".view"));
const tabs = Array.from(document.querySelectorAll(".tab"));
const toast = document.querySelector(".toast");
const pourStage = document.querySelector("[data-pour-stage]");
const pourHint = document.querySelector("[data-pour-hint]");
const modal = document.querySelector("[data-edit-modal]");
const modalTitle = document.querySelector("[data-edit-title]");
const modalInput = document.querySelector("[data-edit-input]");
const ratingOptions = document.querySelector("[data-rating-options]");
const modalNoteEditor = document.querySelector("[data-modal-note-editor]");
const modalNoteTags = document.querySelector("[data-modal-note-tags]");
const modalNoteCustomInput = document.querySelector("[data-modal-note-custom]");
const deleteModal = document.querySelector("[data-delete-modal]");
const growthModal = document.querySelector("[data-growth-modal]");
const uploadInput = document.querySelector("[data-upload-image]");
const captureInput = document.querySelector("[data-capture-image]");
const generatedSticker = document.querySelector("[data-generated-sticker]");
const editSticker = document.querySelector("[data-edit-sticker]");
const flowerStageImg = document.querySelector("[data-flower-stage-img]");
const flowerStageLabel = document.querySelector("[data-flower-stage]");
const flowerDrops = document.querySelector("[data-flower-drops]");
const flowerProgress = document.querySelector("[data-flower-progress]");
const flowerNext = document.querySelector("[data-flower-next]");
const flowerMonth = document.querySelector("[data-flower-month]");
const flowerPending = document.querySelector("[data-flower-pending]");
const flowerWaterButton = document.querySelector('[data-action="water-flower"]');
const noteInput = document.getElementById("noteInput");
const noteTags = document.querySelector("[data-note-tags]");
const noteCustomInput = document.getElementById("noteCustomInput");
const CUTOUT_HOST = location.hostname && location.hostname !== "localhost"
  ? location.hostname
  : "127.0.0.1";
const CONFIGURED_CUTOUT_ENDPOINT = window.ALCOHOLIC_CUTOUT_ENDPOINT;
const CUTOUT_ENDPOINTS = Array.from(new Set([
  CONFIGURED_CUTOUT_ENDPOINT,
  `http://${CUTOUT_HOST}:8787/api/cutout`,
  "http://127.0.0.1:8787/api/cutout",
  "http://localhost:8787/api/cutout"
].filter(Boolean)));
const MAX_NOTE_TAGS = 3;
const MAX_NOTE_TAG_LENGTH = 6;
const NOTE_TAG_EMOJI = {
  下次还喝: "🥂",
  仅限一杯: "☝️",
  后劲很阴: "🌀",
  拍照比喝好: "📸",
  朋友局专用: "🫂",
  失恋慎点: "💔",
  适合装懂: "🧐",
  有点危险: "⚠️",
  酒吧不错: "🍸",
  这杯有故事: "📖"
};
const NOTE_TAG_EMOJI_RULES = [
  [/苦橙|橙皮|橙|柑|橘/, "🍊"],
  [/杏桃|桃/, "🍑"],
  [/香草|草本|薄荷|青柠/, "🌿"],
  [/橡木|木|桶/, "🪵"],
  [/金巴利|威士忌|白兰地|朗姆|伏特加|龙舌兰|酒/, "🥃"],
  [/红色|红|莓|樱桃/, "🔴"],
  [/夜景|夜|霓虹/, "🌃"],
  [/米香|米|清酒|冷泉|清亮|泉/, "🍶"],
  [/焦糖|甜|蜂蜜|奶油/, "🍯"],
  [/烟熏|烟|泥煤/, "🌫️"],
  [/酸|柠檬/, "🍋"],
  [/辣|辛口|热/, "🌶️"],
  [/花|玫瑰|茉莉/, "🌸"],
  [/咖啡|可可|巧克力/, "☕"],
  [/危险|上头|后劲/, "⚠️"]
];
const FLOWER_STAGES = [
  {
    name: "种子",
    target: 50,
    nextName: "花苞",
    image: "./assets/cyber-bottle-plant/stage-01-seedling.svg"
  },
  {
    name: "花苞",
    target: 110,
    nextName: "开花",
    image: "./assets/cyber-bottle-plant/stage-02-bud.svg"
  },
  {
    name: "开花",
    target: 250,
    nextName: "结果",
    image: "./assets/cyber-bottle-plant/stage-03-bloom.svg"
  },
  {
    name: "结果",
    target: 500,
    nextName: "满格",
    image: "./assets/cyber-bottle-plant/stage-04-fruit.svg"
  }
];
let activeEditButton = null;
let uploadedImageUrl = null;
let pendingDeleteCard = null;
let latestStickerUrl = null;
let pourFlowTimers = [];
let pourProgressTimer = null;
let waterClickStreak = 0;
let waterStreakTimer = null;
let waterLongPressTimer = null;
let waterLongPressUnlocked = false;
let suppressNextWaterClick = false;

function showToast(message = "已保存到本地") {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 1700);
}

function showView(name) {
  views.forEach((view) => view.classList.toggle("active", view.dataset.view === name));
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.target === name));
  cleanStickerCopy();
  if (name === "cabinet") replayCabinetEntrance();
}

function cleanStickerCopy() {
  document.querySelectorAll(".sticker-card").forEach((card) => {
    Array.from(card.children).forEach((child) => {
      if (!child.matches(".sticker-bottle")) child.remove();
    });
  });
}

function replayCabinetEntrance() {
  const list = document.querySelector(".drink-list");
  if (!list) return;
  list.classList.remove("cabinet-entering");
  void list.offsetWidth;
  list.classList.add("cabinet-entering");
}

function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(date = new Date()) {
  return `${date.getMonth() + 1}月养花`;
}

function getFlowerStorageKey(month = getMonthKey()) {
  return `alcoholic-flower-watered-${month}`;
}

function getWateredDrops(month = getMonthKey()) {
  return Math.max(0, Number(localStorage.getItem(getFlowerStorageKey(month)) || 0));
}

function setWateredDrops(value, month = getMonthKey()) {
  localStorage.setItem(getFlowerStorageKey(month), String(Math.max(0, Math.floor(value))));
}

function parseAbvValue(value = "") {
  const match = String(value).match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function getCardAbv(card) {
  const backValue = card.querySelector('[data-edit="abv"] strong')?.textContent;
  const frontValue = card.querySelector(".field-meta")?.textContent;
  return parseAbvValue(backValue || frontValue || "");
}

function getWaterDropsFromAbv(value) {
  return Math.floor(parseAbvValue(value) / 3);
}

function updateReceiptWaterDrops(card) {
  if (!card) return;
  const textBlock = card.querySelector(".receipt-small-front > div:first-child");
  const metaLine = card.querySelector(".field-meta");
  if (!textBlock || !metaLine) return;

  let dropsLine = card.querySelector(".field-drops");
  if (!dropsLine) {
    dropsLine = document.createElement("p");
    dropsLine.className = "field-line field-drops";
    metaLine.insertAdjacentElement("afterend", dropsLine);
  }
  const drops = getWaterDropsFromAbv(metaLine.textContent);
  dropsLine.textContent = `${drops} 水滴`;
}

function updateAllReceiptWaterDrops() {
  document.querySelectorAll("[data-drink-card]").forEach(updateReceiptWaterDrops);
}

function getTagsFromNote(value = "") {
  return splitNoteTags(value)
    .map((tag) => tag.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ""))
    .filter(Boolean)
    .slice(0, MAX_NOTE_TAGS);
}

function getNoteValue(buttonOrStrong) {
  const strong = buttonOrStrong?.matches?.("strong")
    ? buttonOrStrong
    : buttonOrStrong?.querySelector?.("strong");
  return strong?.dataset.noteValue || strong?.textContent || "";
}

function getTagEmoji(tag = "") {
  if (NOTE_TAG_EMOJI[tag]) return NOTE_TAG_EMOJI[tag];
  return NOTE_TAG_EMOJI_RULES.find(([pattern]) => pattern.test(tag))?.[1] || "🏷️";
}

function renderTagsWithEmoji(tags = [], separator = " ") {
  return tags
    .map((tag) => {
      const label = escapeHtml(tag);
      return `${getTagEmoji(tag)} ${label}`;
    })
    .join(separator);
}

function renderNoteWithEmoji(value = "") {
  return renderTagsWithEmoji(getTagsFromNote(value), "、");
}

function setNoteEditValue(button, value) {
  const strong = button?.querySelector("strong");
  if (!strong) return;
  strong.dataset.noteValue = value;
  strong.innerHTML = renderNoteWithEmoji(value) || escapeHtml(value);
}

function updateReceiptTags(card) {
  if (!card) return;
  const textBlock = card.querySelector(".receipt-small-front > div:first-child");
  const dropsLine = card.querySelector(".field-drops");
  const noteValue = getNoteValue(card.querySelector('[data-edit="note"]'));
  if (!textBlock || !dropsLine) return;

  let tagsLine = card.querySelector(".field-tags");
  if (!tagsLine) {
    tagsLine = document.createElement("p");
    tagsLine.className = "field-line field-tags";
    dropsLine.insertAdjacentElement("afterend", tagsLine);
  }

  const tags = getTagsFromNote(noteValue);
  tagsLine.innerHTML = `<span>${renderTagsWithEmoji(tags)}</span>`;
  tagsLine.hidden = tags.length === 0;
}

function updateAllReceiptTags() {
  document.querySelectorAll("[data-drink-card]").forEach(updateReceiptTags);
}

function getFlowerStage(drops) {
  if (drops >= 250) return FLOWER_STAGES[3];
  if (drops >= 110) return FLOWER_STAGES[2];
  if (drops >= 50) return FLOWER_STAGES[1];
  return FLOWER_STAGES[0];
}

function updateMonthlyFlower() {
  if (!flowerStageImg || !flowerStageLabel || !flowerDrops || !flowerProgress || !flowerNext) return;

  const currentMonth = getMonthKey();
  const cards = Array.from(document.querySelectorAll("[data-drink-card]"));
  const monthlyAbv = cards.reduce((sum, card) => {
    const cardMonth = card.dataset.entryMonth || currentMonth;
    return cardMonth === currentMonth ? sum + getCardAbv(card) : sum;
  }, 0);
  const availableDrops = Math.floor(monthlyAbv / 3);
  const savedDrops = getWateredDrops(currentMonth);
  const drops = Math.min(savedDrops, availableDrops);
  if (savedDrops !== drops) setWateredDrops(drops, currentMonth);
  const pendingDrops = Math.max(0, availableDrops - drops);
  const stage = getFlowerStage(drops);
  const previousTarget = FLOWER_STAGES[FLOWER_STAGES.indexOf(stage) - 1]?.target || 0;
  const stageRange = Math.max(1, stage.target - previousTarget);
  const stageProgress = Math.min(1, Math.max(0, (drops - previousTarget) / stageRange));
  const totalProgress = Math.min(1, drops / FLOWER_STAGES[3].target);
  const remaining = Math.max(0, stage.target - drops);

  if (flowerMonth) flowerMonth.textContent = getMonthLabel();
  flowerStageImg.src = stage.image;
  flowerStageImg.alt = `本月花朵阶段：${stage.name}`;
  flowerStageLabel.textContent = stage.name;
  flowerDrops.textContent = String(drops);
  flowerProgress.style.width = `${Math.round(totalProgress * 100)}%`;
  flowerNext.textContent = drops >= FLOWER_STAGES[3].target
    ? "本月已经结果完成"
    : pendingDrops > 0
      ? `可浇 ${pendingDrops} 滴，距离${stage.nextName}还差 ${remaining} 滴`
      : `距离${stage.nextName}还差 ${remaining} 滴`;
  if (flowerPending) flowerPending.textContent = pendingDrops > 0 ? `浇水 +${Math.min(3, pendingDrops)}` : "已浇完";
  if (flowerWaterButton) {
    flowerWaterButton.disabled = pendingDrops <= 0;
    flowerWaterButton.classList.toggle("long-press-ready", waterLongPressUnlocked && pendingDrops > 0);
    if (waterLongPressUnlocked && pendingDrops > 0 && flowerPending) {
      flowerPending.textContent = "长按浇完";
    }
  }
  flowerProgress.parentElement?.style.setProperty("--stage-progress", String(stageProgress));
}

function getMonthlyWaterStats() {
  const currentMonth = getMonthKey();
  const cards = Array.from(document.querySelectorAll("[data-drink-card]"));
  const availableDrops = Math.floor(cards.reduce((sum, card) => {
    const cardMonth = card.dataset.entryMonth || currentMonth;
    return cardMonth === currentMonth ? sum + getCardAbv(card) : sum;
  }, 0) / 3);
  const currentDrops = Math.min(getWateredDrops(currentMonth), availableDrops);
  const pendingDrops = Math.max(0, availableDrops - currentDrops);
  return { currentMonth, availableDrops, currentDrops, pendingDrops };
}

function resetWaterLongPressState() {
  waterClickStreak = 0;
  waterLongPressUnlocked = false;
  window.clearTimeout(waterStreakTimer);
  updateMonthlyFlower();
}

function markWaterClickStreak() {
  waterClickStreak += 1;
  window.clearTimeout(waterStreakTimer);
  if (waterClickStreak >= 3) {
    waterLongPressUnlocked = true;
    showToast("可长按一键浇完");
  }
  waterStreakTimer = window.setTimeout(resetWaterLongPressState, 4200);
  updateMonthlyFlower();
}

function waterMonthlyFlower({ all = false } = {}) {
  const { currentMonth, availableDrops, currentDrops, pendingDrops } = getMonthlyWaterStats();
  if (!pendingDrops) {
    showToast("本月水滴已浇完");
    return;
  }
  const nextPour = all ? pendingDrops : Math.min(3, pendingDrops);
  setWateredDrops(currentDrops + nextPour, currentMonth);
  if (all || currentDrops + nextPour >= availableDrops) {
    waterClickStreak = 0;
    waterLongPressUnlocked = false;
    window.clearTimeout(waterStreakTimer);
  } else if (!all) {
    markWaterClickStreak();
  }
  updateMonthlyFlower();
  showToast(`已浇水 ${nextPour} 滴`);
}

function enhancePourActionButtons() {
  const icons = {
    "open-camera": `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 8h10l1 3v7H6v-7l1-3Z"></path>
        <path d="M9 8V5h6v3"></path>
        <path d="M10 13h4"></path>
      </svg>
      <span>开酒</span>
    `,
    "pour-shot": `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 4h6l2 4-5 11H7l5-11H8V4Z"></path>
        <path d="M16 14c2 1 3 2.2 3 4"></path>
      </svg>
      <span>倒酒</span>
    `
  };

  Object.entries(icons).forEach(([action, markup]) => {
    const button = document.querySelector(`[data-action="${action}"]`);
    if (!button) return;
    button.classList.add("action-with-icon");
    button.innerHTML = markup;
  });

  const upload = document.querySelector(".upload-action");
  if (upload) {
    const input = upload.querySelector("input");
    upload.classList.add("action-with-icon");
    upload.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 16V5"></path>
        <path d="M8 9l4-4 4 4"></path>
        <path d="M5 15v4h14v-4"></path>
      </svg>
      <span>本地上传</span>
    `;
    if (input) upload.appendChild(input);
  }
}

function enhanceEditableLines() {
  document.querySelectorAll(".edit-line").forEach((button) => {
    button.type = "button";
    if (button.dataset.edit === "note") setNoteEditValue(button, getNoteValue(button));
  });
}

function openModal(button) {
  activeEditButton = button;
  const field = button.dataset.edit;
  const currentValue = field === "note" ? getNoteValue(button) : button.querySelector("strong").textContent;
  modalTitle.textContent = `编辑${button.querySelector("span").textContent}`;
  modalInput.type = field === "abv" ? "number" : "text";
  modalInput.inputMode = field === "abv" ? "decimal" : "text";
  modalInput.step = field === "abv" ? "0.1" : "";
  modalInput.min = field === "abv" ? "0" : "";
  modalInput.max = field === "abv" ? "100" : "";
  modalInput.value = field === "abv" ? String(parseAbvValue(currentValue) || "") : currentValue;
  modalInput.placeholder = field === "abv" ? "输入酒精度数" : "";
  const isRating = field === "rating";
  const isNote = field === "note";
  modalInput.hidden = isRating || isNote;
  if (ratingOptions) {
    ratingOptions.hidden = !isRating;
    ratingOptions.querySelectorAll("[data-rating-option]").forEach((option) => {
      option.classList.toggle("active", option.dataset.ratingOption === normalizeRating(currentValue));
    });
  }
  if (modalNoteEditor) {
    modalNoteEditor.hidden = !isNote;
    if (isNote) syncModalNoteOptions(currentValue);
  }
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  if (isRating) ratingOptions?.querySelector(".active")?.focus();
  else if (isNote) modalNoteEditor?.querySelector(".active, [data-modal-note-custom]")?.focus();
  else modalInput.focus();
}

function closeModal() {
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  modalInput.hidden = false;
  modalInput.type = "text";
  modalInput.inputMode = "text";
  modalInput.placeholder = "";
  if (ratingOptions) ratingOptions.hidden = true;
  if (modalNoteEditor) modalNoteEditor.hidden = true;
  activeEditButton = null;
}

function normalizeRating(value) {
  const rating = value.trim().toUpperCase();
  return ["SSS", "S", "A", "B"].includes(rating) ? rating : "";
}

function syncRatingStamp(button, value) {
  const rating = normalizeRating(value);
  if (!rating) return;
  const card = button.closest("[data-drink-card]");
  if (!card) return;
  card.dataset.ratingRank = String(getRatingRank(rating));

  card.querySelectorAll('[data-edit="rating"] strong').forEach((node) => {
    node.textContent = rating;
  });

  card.querySelectorAll(".stamp").forEach((stamp) => {
    stamp.textContent = rating;
    stamp.classList.remove("stamp-sss", "stamp-s", "stamp-a", "stamp-b");
    stamp.classList.add(`stamp-${rating.toLowerCase()}`);
  });
}

function openDeleteModal(card) {
  pendingDeleteCard = card;
  deleteModal.classList.add("show");
  deleteModal.setAttribute("aria-hidden", "false");
}

function closeDeleteModal() {
  deleteModal.classList.remove("show");
  deleteModal.setAttribute("aria-hidden", "true");
  pendingDeleteCard = null;
}

function openGrowthPath() {
  growthModal?.classList.add("show");
  growthModal?.setAttribute("aria-hidden", "false");
}

function closeGrowthPath() {
  growthModal?.classList.remove("show");
  growthModal?.setAttribute("aria-hidden", "true");
}

function deletePendingCard() {
  if (!pendingDeleteCard) return;
  const card = pendingDeleteCard;
  closeDeleteModal();
  card.classList.add("removing");
  window.setTimeout(() => {
    card.remove();
    updateMonthlyFlower();
  }, 220);
  showToast("已从酒柜删除");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getInputValue(id, fallback = "") {
  const node = document.getElementById(id);
  return node && node.value.trim() ? node.value.trim() : fallback;
}

function splitNoteTags(value = "") {
  return String(value)
    .split(/[、，,。.\s]+/)
    .map((tag) => tag.trim().slice(0, MAX_NOTE_TAG_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_NOTE_TAGS);
}

function getSelectedNoteTags(container = noteTags) {
  if (!container) return [];
  return Array.from(container.querySelectorAll("[data-note-tag].active"))
    .map((tag) => tag.dataset.noteTag)
    .filter(Boolean);
}

function syncNoteInput(container = noteTags, input = noteInput) {
  if (!input) return;
  input.value = getSelectedNoteTags(container).join("、");
}

function createNoteTagButton(value) {
  const tag = document.createElement("button");
  const emoji = getTagEmoji(value);
  const isDefault = Boolean(NOTE_TAG_EMOJI[value]);
  tag.type = "button";
  tag.dataset.noteTag = value;
  if (!isDefault) tag.dataset.customTag = "true";
  tag.innerHTML = isDefault
    ? `<span class="note-emoji">${emoji}</span><span>${escapeHtml(value)}</span>`
    : `<span class="note-emoji">${emoji}</span><span>${escapeHtml(value)}</span><span class="note-tag-remove" data-note-tag-remove aria-label="删除 ${escapeHtml(value)}">×</span>`;
  return tag;
}

function setNoteTagActive(button, active) {
  if (!button) return false;
  const container = button.closest("[data-note-tags], [data-modal-note-tags]");
  const input = container === modalNoteTags ? modalInput : noteInput;
  if (active && !button.classList.contains("active") && getSelectedNoteTags(container).length >= MAX_NOTE_TAGS) {
    showToast("最多添加 3 个标签");
    return false;
  }
  button.classList.toggle("active", active);
  syncNoteInput(container, input);
  return true;
}

function addCustomNoteTag(customInput = noteCustomInput, container = noteTags) {
  if (!customInput || !container) return;
  const value = customInput.value.trim().slice(0, MAX_NOTE_TAG_LENGTH);
  if (!value) return;

  let tag = container.querySelector(`[data-note-tag="${CSS.escape(value)}"]`);
  if (!tag) {
    tag = createNoteTagButton(value);
    container.appendChild(tag);
  }

  if (setNoteTagActive(tag, true)) customInput.value = "";
}

function removeCustomNoteTag(removeButton) {
  const tag = removeButton?.closest("[data-note-tag][data-custom-tag]");
  const container = tag?.closest("[data-note-tags], [data-modal-note-tags]");
  if (!tag || !container) return;
  const input = container === modalNoteTags ? modalInput : noteInput;
  tag.remove();
  syncNoteInput(container, input);
}

function syncModalNoteOptions(value) {
  if (!modalNoteTags) return;
  const selectedTags = splitNoteTags(value);
  modalNoteTags.querySelectorAll("[data-note-tag]").forEach((tag) => {
    tag.classList.toggle("active", selectedTags.includes(tag.dataset.noteTag));
  });

  selectedTags.forEach((value) => {
    let tag = modalNoteTags.querySelector(`[data-note-tag="${CSS.escape(value)}"]`);
    if (!tag) {
      tag = createNoteTagButton(value);
      modalNoteTags.appendChild(tag);
    }
    tag.classList.add("active");
  });
  syncNoteInput(modalNoteTags, modalInput);
}

function getRatingRank(value) {
  return { SSS: 4, S: 3, A: 2, B: 1 }[normalizeRating(value)] || 0;
}

async function freezeStickerUrl(url) {
  if (!url || url.startsWith("data:")) return url;
  try {
    const blob = await fetch(url).then((response) => response.blob());
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn(error);
    return url;
  }
}

function createDrinkCard({ rating, name, bar, abv, note, stickerUrl }) {
  const safeRating = normalizeRating(rating) || "A";
  const safeName = escapeHtml(name || "新酒单");
  const safeBar = escapeHtml(bar || "未命名酒馆");
  const safeAbv = escapeHtml(abv || "--");
  const safeNote = escapeHtml(note || "今晚的味道，先存进酒柜。");

  const card = document.createElement("article");
  card.className = "receipt-card receipt-small flip-card";
  card.dataset.drinkCard = "";
  card.dataset.ratingRank = String(getRatingRank(safeRating));
  card.dataset.entryMonth = getMonthKey();
  card.innerHTML = `
    <div class="flip-inner small-flip">
      <button class="drink-face receipt-face receipt-small-front" data-action="flip" aria-label="查看 ${safeName} 详情">
        <div>
          <h2 class="field-line field-name">${safeName}</h2>
          <p class="field-line field-bar">${safeBar}</p>
          <p class="field-line field-meta">${safeAbv} ABV</p>
          <p class="field-line field-drops">${getWaterDropsFromAbv(safeAbv)} 水滴</p>
          <p class="field-line field-tags"><span>${renderTagsWithEmoji(getTagsFromNote(safeNote))}</span></p>
        </div>
        <div class="photo-sticker generated-cabinet-sticker" data-sticker-tech="image-to-sticker" aria-hidden="true">
          <span class="cabinet-generated-photo"></span>
        </div>
        <div class="stamp stamp-${safeRating.toLowerCase()}">${safeRating}</div>
      </button>
      <div class="drink-face receipt-face receipt-small-back">
        <button class="close-detail" data-action="flip">×</button>
        <button class="edit-line" data-edit="rating"><span>评分</span><strong>${safeRating}</strong></button>
        <button class="edit-line" data-edit="name"><span>名称</span><strong>${safeName}</strong></button>
        <button class="edit-line" data-edit="bar"><span>酒馆 / 城市</span><strong>${safeBar}</strong></button>
        <button class="edit-line" data-edit="abv"><span>度数</span><strong>${safeAbv}</strong></button>
        <button class="edit-line" data-edit="note"><span>评语</span><strong data-note-value="${safeNote}">${renderNoteWithEmoji(safeNote) || safeNote}</strong></button>
        <div class="receipt-actions compact-actions">
          <button class="delete-icon delete-receipt" data-action="request-delete" aria-label="删除 ${safeName}">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16"></path><path d="M9 7V5h6v2"></path><path d="M7 7l1 13h8l1-13"></path><path d="M10 11v5"></path><path d="M14 11v5"></path>
            </svg>
          </button>
          <button class="save-image" data-action="save-image">下载小票</button>
        </div>
      </div>
    </div>
    <button class="delete-icon delete-chip" data-action="request-delete" aria-label="删除 ${safeName}">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h16"></path><path d="M9 7V5h6v2"></path><path d="M7 7l1 13h8l1-13"></path><path d="M10 11v5"></path><path d="M14 11v5"></path>
      </svg>
    </button>
  `;

  const sticker = card.querySelector(".cabinet-generated-photo");
  if (sticker && stickerUrl) {
    sticker.style.setProperty("--saved-sticker-image", `url("${stickerUrl}")`);
    sticker.classList.add("has-saved-image");
  }
  card.querySelectorAll(".edit-line").forEach((button) => {
    button.type = "button";
  });

  return card;
}

function sortCabinetReceipts(list) {
  const cards = Array.from(list.querySelectorAll(".receipt-small"));
  cards
    .sort((a, b) => {
      const aRank = Number(a.dataset.ratingRank || getRatingRank(a.querySelector(".stamp")?.textContent || ""));
      const bRank = Number(b.dataset.ratingRank || getRatingRank(b.querySelector(".stamp")?.textContent || ""));
      return bRank - aRank;
    })
    .forEach((card) => list.appendChild(card));
}

async function addCurrentDrinkToCabinet() {
  const list = document.querySelector(".drink-list");
  if (!list) return;

  const rating = normalizeRating(getInputValue("ratingInput", "A")) || "A";
  const stickerUrl = await freezeStickerUrl(latestStickerUrl || editSticker?.style.getPropertyValue("--cutout-image").slice(4, -1).replaceAll('"', ""));
  const card = createDrinkCard({
    rating,
    name: getInputValue("nameInput", "新酒单"),
    bar: getInputValue("barInput", "未命名酒馆"),
    abv: getInputValue("abvInput", "--"),
    note: getInputValue("noteInput", "今晚的味道，先存进酒柜。"),
    stickerUrl
  });

  const firstSmallCard = list.querySelector(".receipt-small");
  if (firstSmallCard) list.insertBefore(card, firstSmallCard);
  else list.appendChild(card);
  sortCabinetReceipts(list);
  updateMonthlyFlower();
  updateReceiptWaterDrops(card);
}

function clearPourFlowTimers() {
  pourFlowTimers.forEach((timer) => window.clearTimeout(timer));
  pourFlowTimers = [];
  window.clearInterval(pourProgressTimer);
  pourProgressTimer = null;
}

function setPourProgress(value) {
  const progress = Math.max(0, Math.min(1, value));
  pourStage?.style.setProperty("--pour-progress", progress.toFixed(3));
  pourStage?.style.setProperty("--pour-progress-percent", `${(progress * 100).toFixed(1)}%`);
}

function startLoadingPourProgress() {
  window.clearInterval(pourProgressTimer);
  setPourProgress(.06);
  let progress = .06;
  pourProgressTimer = window.setInterval(() => {
    const remaining = .88 - progress;
    progress += Math.max(.006, remaining * .08);
    setPourProgress(Math.min(.88, progress));
  }, 180);
}

function completePourProgress(duration = 1900) {
  window.clearInterval(pourProgressTimer);
  pourProgressTimer = null;
  const raw = Number.parseFloat(pourStage?.style.getPropertyValue("--pour-progress") || "0");
  const from = Number.isFinite(raw) ? raw : 0;
  const start = window.performance.now();
  const tick = () => {
    const elapsed = window.performance.now() - start;
    const t = Math.min(1, elapsed / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    setPourProgress(from + (1 - from) * eased);
    if (t < 1) pourFlowTimers.push(window.setTimeout(tick, 32));
  };
  tick();
}

function resetPourState({ clearImages = false } = {}) {
  clearPourFlowTimers();
  pourStage.classList.remove("pouring", "done", "cutting", "transitioning", "camera-open", "uploaded-local");
  setPourProgress(0);
  pourHint.textContent = "点击「开酒」拍照，或从本地上传图片";

  if (clearImages) {
    if (uploadedImageUrl) URL.revokeObjectURL(uploadedImageUrl);
    uploadedImageUrl = null;
    pourStage.style.removeProperty("--uploaded-image");
    [generatedSticker, editSticker].forEach((node) => {
      if (!node) return;
      node.classList.remove("has-generated-image");
      node.style.removeProperty("--cutout-image");
    });
    if (latestStickerUrl && latestStickerUrl.startsWith("blob:")) URL.revokeObjectURL(latestStickerUrl);
    latestStickerUrl = null;
    if (uploadInput) uploadInput.value = "";
    if (captureInput) captureInput.value = "";
  }
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve({ image, url });
    image.onerror = reject;
    image.src = url;
  });
}

function loadImageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => resolve({ image, url });
    image.onerror = reject;
    image.src = url;
  });
}

function drawImageCover(ctx, image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  ctx.drawImage(
    image,
    x + (width - drawWidth) / 2,
    y + (height - drawHeight) / 2,
    drawWidth,
    drawHeight
  );
}

function rgbDistance(data, index, color) {
  const dr = data[index] - color[0];
  const dg = data[index + 1] - color[1];
  const db = data[index + 2] - color[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function buildBackgroundPalette(data, size) {
  const buckets = new Map();
  const step = 4;
  const add = (x, y) => {
    const index = (y * size + x) * 4;
    const key = [
      Math.round(data[index] / 24),
      Math.round(data[index + 1] / 24),
      Math.round(data[index + 2] / 24)
    ].join("-");
    const bucket = buckets.get(key) || { count: 0, r: 0, g: 0, b: 0 };
    bucket.count += 1;
    bucket.r += data[index];
    bucket.g += data[index + 1];
    bucket.b += data[index + 2];
    buckets.set(key, bucket);
  };

  for (let p = 0; p < size; p += step) {
    add(p, 0);
    add(p, size - 1);
    add(0, p);
    add(size - 1, p);
  }

  return Array.from(buckets.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((bucket) => [bucket.r / bucket.count, bucket.g / bucket.count, bucket.b / bucket.count]);
}

function edgeStrength(data, size, x, y) {
  const left = (y * size + Math.max(0, x - 1)) * 4;
  const right = (y * size + Math.min(size - 1, x + 1)) * 4;
  const top = (Math.max(0, y - 1) * size + x) * 4;
  const bottom = (Math.min(size - 1, y + 1) * size + x) * 4;
  return (
    Math.abs(data[left] - data[right]) +
    Math.abs(data[left + 1] - data[right + 1]) +
    Math.abs(data[left + 2] - data[right + 2]) +
    Math.abs(data[top] - data[bottom]) +
    Math.abs(data[top + 1] - data[bottom + 1]) +
    Math.abs(data[top + 2] - data[bottom + 2])
  ) / 6;
}

function segmentSubject(data, size) {
  const palette = buildBackgroundPalette(data, size);
  const total = size * size;
  const background = new Uint8Array(total);
  const visited = new Uint8Array(total);
  const queue = [];
  const center = (size - 1) / 2;

  const minBgDistance = (pixel) => palette.reduce(
    (min, color) => Math.min(min, rgbDistance(data, pixel * 4, color)),
    Infinity
  );
  const canBeBackground = (pixel, fromEdge = false) => {
    const x = pixel % size;
    const y = Math.floor(pixel / size);
    const dist = minBgDistance(pixel);
    const edge = edgeStrength(data, size, x, y);
    const dx = Math.abs(x - center) / center;
    const dy = Math.abs(y - center) / center;
    const centerPenalty = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy));
    const threshold = (fromEdge ? 48 : 34) - centerPenalty * 16;
    if (edge > 20 && centerPenalty > 0.08) return false;
    return dist < threshold && edge < 22;
  };
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const pixel = y * size + x;
    if (visited[pixel]) return;
    visited[pixel] = 1;
    if (canBeBackground(pixel, true)) queue.push(pixel);
  };

  for (let p = 0; p < size; p++) {
    push(p, 0);
    push(p, size - 1);
    push(0, p);
    push(size - 1, p);
  }

  for (let head = 0; head < queue.length; head++) {
    const pixel = queue[head];
    background[pixel] = 1;
    const x = pixel % size;
    const y = Math.floor(pixel / size);
    const next = [pixel - 1, pixel + 1, pixel - size, pixel + size];
    for (const candidate of next) {
      if (candidate < 0 || candidate >= total || visited[candidate]) continue;
      const nx = candidate % size;
      const ny = Math.floor(candidate / size);
      if (Math.abs(nx - x) + Math.abs(ny - y) !== 1) continue;
      visited[candidate] = 1;
      if (canBeBackground(candidate)) queue.push(candidate);
    }
  }

  const foreground = new Uint8Array(total);
  for (let i = 0; i < total; i++) {
    const x = i % size;
    const y = Math.floor(i / size);
    const dx = Math.abs(x - center) / center;
    const dy = Math.abs(y - center) / center;
    const centerWeight = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy));
    const detailEdge = edgeStrength(data, size, x, y);
    const detailDistance = minBgDistance(i);
    foreground[i] = background[i] && !(centerWeight > 0.18 && detailEdge > 36 && detailDistance > 24) ? 0 : 1;
  }
  return smoothMask(protectSubjectEnvelope(foreground, data, size), size);
}

function protectSubjectEnvelope(foreground, data, size) {
  const protectedMask = new Uint8Array(foreground);
  const center = (size - 1) / 2;
  let minX = size;
  let minY = size;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const pixel = y * size + x;
      const dx = Math.abs(x - center) / center;
      const dy = Math.abs(y - center) / center;
      const centerWeight = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy));
      const edge = edgeStrength(data, size, x, y);
      if (foreground[pixel] || (edge > 18 && centerWeight > 0.12)) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX <= minX || maxY <= minY) return fallbackSubjectMask(size);

  minX = Math.max(2, minX - 18);
  minY = Math.max(2, minY - 18);
  maxX = Math.min(size - 3, maxX + 18);
  maxY = Math.min(size - 3, maxY + 18);

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const pixel = y * size + x;
      const dx = Math.abs(x - center) / center;
      const dy = Math.abs(y - center) / center;
      const centerWeight = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy));
      const edge = edgeStrength(data, size, x, y);
      const inCore = dx < 0.46 && dy < 0.72;
      if (foreground[pixel] || edge > 10 || (inCore && centerWeight > 0.22)) {
        protectedMask[pixel] = 1;
      }
    }
  }

  return dilateMask(protectedMask, size, 1);
}

function fallbackSubjectMask(size) {
  const mask = new Uint8Array(size * size);
  const center = (size - 1) / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - center) / (size * 0.34);
      const dy = (y - center) / (size * 0.42);
      if (dx * dx + dy * dy < 1) mask[y * size + x] = 1;
    }
  }
  return mask;
}

function ensureMinimumSubjectAlpha(alpha, data, size) {
  let visible = 0;
  for (const value of alpha) if (value > 24) visible += 1;
  if (visible / alpha.length >= 0.2) return alpha;

  const fallback = fallbackSubjectMask(size);
  const protectedFallback = protectSubjectEnvelope(fallback, data, size);
  return smoothMask(protectedFallback, size);
}

function keepMainSubject(mask, data, size) {
  const total = size * size;
  const seen = new Uint8Array(total);
  const keep = new Uint8Array(total);
  const center = (size - 1) / 2;
  const components = [];

  for (let i = 0; i < total; i++) {
    if (!mask[i] || seen[i]) continue;
    const queue = [i];
    const pixels = [];
    let minX = size;
    let minY = size;
    let maxX = 0;
    let maxY = 0;
    let centerScore = 0;
    let edgeScore = 0;
    seen[i] = 1;

    for (let head = 0; head < queue.length; head++) {
      const pixel = queue[head];
      const x = pixel % size;
      const y = Math.floor(pixel / size);
      pixels.push(pixel);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      const dx = (x - center) / center;
      const dy = (y - center) / center;
      centerScore += Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy));
      edgeScore += edgeStrength(data, size, x, y);

      for (const candidate of [pixel - 1, pixel + 1, pixel - size, pixel + size]) {
        if (candidate < 0 || candidate >= total || seen[candidate] || !mask[candidate]) continue;
        const nx = candidate % size;
        const ny = Math.floor(candidate / size);
        if (Math.abs(nx - x) + Math.abs(ny - y) !== 1) continue;
        seen[candidate] = 1;
        queue.push(candidate);
      }
    }

    const area = pixels.length;
    if (area < total * 0.003) continue;
    const touchesBorder = minX < 4 || minY < 4 || maxX > size - 5 || maxY > size - 5;
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const shapeScore = Math.min(width, height) / Math.max(width, height);
    const score = area * 0.9 + centerScore * 16 + edgeScore * 0.08 + shapeScore * 900 - (touchesBorder ? area * 0.55 : 0);
    components.push({ pixels, score });
  }

  components.sort((a, b) => b.score - a.score);
  const selected = components.slice(0, 8);
  for (const component of selected) {
    if (component.score < (selected[0] && selected[0].score) * 0.08) continue;
    for (const pixel of component.pixels) keep[pixel] = 1;
  }
  return closeMask(keep, size);
}

function restoreSubjectDetails(subjectMask, foreground, data, size) {
  const restored = new Uint8Array(subjectMask);
  const detailArea = dilateMask(subjectMask, size, 14);
  const center = (size - 1) / 2;

  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const pixel = y * size + x;
      if (!detailArea[pixel] || !foreground[pixel]) continue;
      const dx = Math.abs(x - center) / center;
      const dy = Math.abs(y - center) / center;
      const centerWeight = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy));
      const edge = edgeStrength(data, size, x, y);
      if (subjectMask[pixel] || edge > 18 || centerWeight > 0.24) restored[pixel] = 1;
    }
  }

  return restored;
}

function closeMask(mask, size) {
  return dilateMask(mask, size, 1);
}

function dilateMask(mask, size, rounds = 1) {
  let source = mask;
  for (let round = 0; round < rounds; round++) {
    const next = new Uint8Array(source);
    for (let y = 1; y < size - 1; y++) {
      for (let x = 1; x < size - 1; x++) {
        const pixel = y * size + x;
        if (source[pixel]) continue;
        if (source[pixel - 1] || source[pixel + 1] || source[pixel - size] || source[pixel + size]) {
          next[pixel] = 1;
        }
      }
    }
    source = next;
  }
  return source;
}

function erodeMask(mask, size, rounds = 1) {
  let source = mask;
  for (let round = 0; round < rounds; round++) {
    const next = new Uint8Array(source);
    for (let y = 1; y < size - 1; y++) {
      for (let x = 1; x < size - 1; x++) {
        const pixel = y * size + x;
        if (!source[pixel]) continue;
        if (!source[pixel - 1] || !source[pixel + 1] || !source[pixel - size] || !source[pixel + size]) {
          next[pixel] = 0;
        }
      }
    }
    source = next;
  }
  return source;
}

function smoothMask(mask, size) {
  const alpha = new Uint8ClampedArray(size * size);
  const softened = dilateMask(mask, size, 1);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const pixel = y * size + x;
      if (mask[pixel]) {
        alpha[pixel] = 255;
        continue;
      }
      if (!softened[pixel]) continue;
      let neighbors = 0;
      for (let oy = -2; oy <= 2; oy++) {
        for (let ox = -2; ox <= 2; ox++) {
          const nx = x + ox;
          const ny = y + oy;
          if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
          neighbors += mask[ny * size + nx] ? 1 : 0;
        }
      }
      alpha[pixel] = Math.min(180, neighbors * 9);
    }
  }
  return alpha;
}

function paintMask(ctx, alpha, size, color) {
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  for (let i = 0; i < alpha.length; i++) {
    const index = i * 4;
    data[index] = color[0];
    data[index + 1] = color[1];
    data[index + 2] = color[2];
    data[index + 3] = Math.round(alpha[i] * color[3]);
  }
  ctx.putImageData(imageData, 0, 0);
}

function cleanCutoutAlpha(imageData) {
  const { width, height, data } = imageData;
  const total = width * height;
  const edgeConnected = new Uint8Array(total);
  const visited = new Uint8Array(total);
  const queue = [];

  const isWeakBackground = (pixel) => {
    const index = pixel * 4;
    const alpha = data[index + 3];
    if (alpha < 42) return true;
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max - min;
    const bluePaper = b > r + 14 && b > g - 8 && max > 150 && saturation < 80;
    const palePaper = max > 205 && saturation < 42;
    return alpha < 190 && (bluePaper || palePaper);
  };
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const pixel = y * width + x;
    if (visited[pixel]) return;
    visited[pixel] = 1;
    if (isWeakBackground(pixel)) queue.push(pixel);
  };

  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  for (let head = 0; head < queue.length; head++) {
    const pixel = queue[head];
    edgeConnected[pixel] = 1;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    for (const next of [pixel - 1, pixel + 1, pixel - width, pixel + width]) {
      if (next < 0 || next >= total || visited[next]) continue;
      const nx = next % width;
      const ny = Math.floor(next / width);
      if (Math.abs(nx - x) + Math.abs(ny - y) !== 1) continue;
      visited[next] = 1;
      if (isWeakBackground(next)) queue.push(next);
    }
  }

  const alpha = new Uint8ClampedArray(total);
  for (let pixel = 0; pixel < total; pixel++) {
    const index = pixel * 4;
    const original = data[index + 3];
    alpha[pixel] = edgeConnected[pixel] ? 0 : original < 34 ? 0 : original;
  }
  return alpha;
}

function alphaBounds(alpha, width, height) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = alpha[y * width + x];
      if (value < 18) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) return { x: 0, y: 0, width, height };
  const pad = 64;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function alphaCenter(alpha, width, height, sourceRect) {
  let weight = 0;
  let sumX = 0;
  let sumY = 0;
  const startX = Math.max(0, sourceRect.x);
  const startY = Math.max(0, sourceRect.y);
  const endX = Math.min(width, sourceRect.x + sourceRect.width);
  const endY = Math.min(height, sourceRect.y + sourceRect.height);

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const value = alpha[y * width + x];
      if (value < 20) continue;
      weight += value;
      sumX += x * value;
      sumY += y * value;
    }
  }

  if (!weight) {
    return {
      x: sourceRect.x + sourceRect.width / 2,
      y: sourceRect.y + sourceRect.height / 2
    };
  }
  return { x: sumX / weight, y: sumY / weight };
}

function dilateAlpha(alpha, width, height, radius) {
  const output = new Uint8ClampedArray(alpha.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let maxAlpha = 0;
      for (let oy = -radius; oy <= radius; oy++) {
        for (let ox = -radius; ox <= radius; ox++) {
          if (ox * ox + oy * oy > radius * radius) continue;
          const nx = x + ox;
          const ny = y + oy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          maxAlpha = Math.max(maxAlpha, alpha[ny * width + nx]);
        }
      }
      output[y * width + x] = maxAlpha;
    }
  }
  return output;
}

function softenAlpha(alpha, width, height) {
  const output = new Uint8ClampedArray(alpha.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let total = 0;
      let count = 0;
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const nx = x + ox;
          const ny = y + oy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          total += alpha[ny * width + nx];
          count += 1;
        }
      }
      output[y * width + x] = Math.round(total / count);
    }
  }
  return output;
}

function drawAlphaLayer(ctx, alpha, width, height, sourceRect, draw, color) {
  const layer = document.createElement("canvas");
  layer.width = width;
  layer.height = height;
  const layerCtx = layer.getContext("2d");
  paintMask(layerCtx, alpha, width, color);
  ctx.drawImage(
    layer,
    sourceRect.x,
    sourceRect.y,
    sourceRect.width,
    sourceRect.height,
    draw.x,
    draw.y,
    draw.width,
    draw.height
  );
}

function createCleanSubjectCanvas(source, alpha) {
  const subject = document.createElement("canvas");
  subject.width = source.width;
  subject.height = source.height;
  const subjectCtx = subject.getContext("2d");
  const clean = new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
  for (let i = 0; i < alpha.length; i++) clean.data[i * 4 + 3] = alpha[i];
  subjectCtx.putImageData(clean, 0, 0);
  return subject;
}

async function processImageToSticker(file) {
  const cutoutBlob = await requestCutoutService(file);
  return createStickerFromCutoutBlob(cutoutBlob);
}

async function requestCutoutService(file) {
  let response;
  let networkError = null;
  for (const endpoint of CUTOUT_ENDPOINTS) {
    const formData = new FormData();
    formData.append("image", file, file.name || "drink-photo.jpg");
    try {
      response = await fetch(endpoint, {
        method: "POST",
        body: formData
      });
      if (response) break;
    } catch (error) {
      networkError = error;
    }
  }

  if (!response) {
    console.warn(networkError);
    throw new Error("本机高精度抠图服务未启动");
  }

  if (!response.ok) {
    let message = "高精度抠图服务暂不可用";
    try {
      const payload = await response.json();
      if (payload && payload.error) message = payload.error;
    } catch (error) {
      // Keep the default user-facing message.
    }
    throw new Error(message);
  }

  return response.blob();
}

async function createStickerFromCutoutBlob(blob) {
  const { image, url } = await loadImageFromBlob(blob);
  const size = 640;
  const workSize = 512;
  const workCanvas = document.createElement("canvas");
  workCanvas.width = workSize;
  workCanvas.height = workSize;
  const workCtx = workCanvas.getContext("2d", { willReadFrequently: true });
  workCtx.clearRect(0, 0, workSize, workSize);
  const sourceBounds = fitImageContain(image, 32, 32, workSize - 64, workSize - 64);
  workCtx.drawImage(image, sourceBounds.x, sourceBounds.y, sourceBounds.width, sourceBounds.height);
  const source = workCtx.getImageData(0, 0, workSize, workSize);
  const alpha = softenAlpha(softenAlpha(cleanCutoutAlpha(source), workSize, workSize), workSize, workSize);
  const borderAlpha = softenAlpha(
    softenAlpha(
      softenAlpha(dilateAlpha(alpha, workSize, workSize, 18), workSize, workSize),
      workSize,
      workSize
    ),
    workSize,
    workSize
  );
  const bounds = alphaBounds(alpha, workSize, workSize);
  const borderBounds = alphaBounds(borderAlpha, workSize, workSize);
  const subjectCanvas = createCleanSubjectCanvas(source, alpha);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, size, size);

  const draw = fitImageContain(borderBounds, 44, 40, 552, 560);
  const center = alphaCenter(borderAlpha, workSize, workSize, borderBounds);
  const sourceCenterX = borderBounds.x + borderBounds.width / 2;
  const sourceCenterY = borderBounds.y + borderBounds.height / 2;
  const scaleX = draw.width / borderBounds.width;
  const scaleY = draw.height / borderBounds.height;
  draw.x += (sourceCenterX - center.x) * scaleX;
  draw.y += (sourceCenterY - center.y) * scaleY;
  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = workSize;
  cropCanvas.height = workSize;
  const cropCtx = cropCanvas.getContext("2d");
  cropCtx.drawImage(subjectCanvas, 0, 0);

  drawAlphaLayer(ctx, borderAlpha, workSize, workSize, borderBounds, draw, [255, 255, 255, 1]);
  ctx.drawImage(
    cropCanvas,
    borderBounds.x,
    borderBounds.y,
    borderBounds.width,
    borderBounds.height,
    draw.x,
    draw.y,
    draw.width,
    draw.height
  );

  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  for (let i = 0; i < 1500; i++) {
    const x = draw.x + Math.random() * draw.width;
    const y = draw.y + Math.random() * draw.height;
    const tone = Math.random() > 0.5 ? 255 : 18;
    const alphaValue = tone === 255 ? 0.12 : 0.045;
    ctx.fillStyle = `rgba(${tone},${tone},${tone},${alphaValue})`;
    ctx.fillRect(x, y, 1.45, 1.45);
  }
  ctx.fillStyle = "rgba(255,255,255,.08)";
  for (let y = draw.y; y < draw.y + draw.height; y += 4) {
    ctx.fillRect(draw.x, y, draw.width, 1);
  }
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  const gloss = ctx.createRadialGradient(draw.x + draw.width * .28, draw.y + draw.height * .18, 8, draw.x + draw.width * .28, draw.y + draw.height * .18, 180);
  gloss.addColorStop(0, "rgba(255,255,255,.82)");
  gloss.addColorStop(0.34, "rgba(255,255,255,.28)");
  gloss.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gloss;
  ctx.fillRect(draw.x, draw.y, draw.width, draw.height);
  ctx.restore();

  URL.revokeObjectURL(url);
  return canvas.toDataURL("image/png");
}

function fitImageContain(image, x, y, width, height) {
  const scale = Math.min(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  return {
    x: x + (width - drawWidth) / 2,
    y: y + (height - drawHeight) / 2,
    width: drawWidth,
    height: drawHeight
  };
}

async function processImageToStickerFallback(file) {
  const { image, url } = await loadImageFromFile(file);
  const size = 420;
  const outputSize = 640;
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = size;
  sourceCanvas.height = size;
  const sourceCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
  sourceCtx.fillStyle = "#fff";
  sourceCtx.fillRect(0, 0, size, size);
  drawImageCover(sourceCtx, image, 0, 0, size, size);
  const source = sourceCtx.getImageData(0, 0, size, size);
  const alpha = ensureMinimumSubjectAlpha(segmentSubject(source.data, size), source.data, size);
  const borderAlpha = dilateMask(alpha.map((value) => value > 8 ? 1 : 0), size, 8);

  const cutout = document.createElement("canvas");
  cutout.width = size;
  cutout.height = size;
  const cutoutCtx = cutout.getContext("2d");
  const borderCanvas = document.createElement("canvas");
  borderCanvas.width = size;
  borderCanvas.height = size;
  const borderCtx = borderCanvas.getContext("2d");
  paintMask(borderCtx, borderAlpha.map((value) => value ? 255 : 0), size, [255, 255, 255, 1]);

  const subject = new ImageData(new Uint8ClampedArray(source.data), size, size);
  for (let i = 0; i < alpha.length; i++) subject.data[i * 4 + 3] = alpha[i];
  cutoutCtx.putImageData(subject, 0, 0);

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, outputSize, outputSize);

  ctx.drawImage(borderCanvas, 70, 42, 500, 500);
  ctx.drawImage(cutout, 70, 42, 500, 500);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const gloss = ctx.createRadialGradient(236, 106, 8, 236, 106, 180);
  gloss.addColorStop(0, "rgba(255,255,255,.82)");
  gloss.addColorStop(0.34, "rgba(255,255,255,.28)");
  gloss.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gloss;
  ctx.fillRect(70, 42, 500, 500);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = "rgba(255,215,0,.08)";
  ctx.fillRect(70, 42, 500, 500);
  ctx.restore();

  URL.revokeObjectURL(url);
  return canvas.toDataURL("image/png");
}

function applyStickerImage(stickerUrl) {
  if (latestStickerUrl && latestStickerUrl.startsWith("blob:")) URL.revokeObjectURL(latestStickerUrl);
  latestStickerUrl = stickerUrl;
  [generatedSticker, editSticker].forEach((node) => {
    if (!node) return;
    node.classList.add("has-generated-image");
    node.style.setProperty("--cutout-image", `url("${stickerUrl}")`);
  });
}

function finishStickerFlow(source = "scan") {
  clearPourFlowTimers();
  pourStage.classList.add("pouring");
  completePourProgress(1900);
  pourHint.textContent = source === "upload"
    ? "正在智能抠出酒杯主体，生成磨砂光泽贴纸"
    : "正在识别酒杯主体，酒液填满后完成抠图";
  pourFlowTimers.push(window.setTimeout(() => {
    pourStage.classList.add("done");
    pourHint.textContent = source === "upload"
      ? "酒杯主体已抠出，并生成白边磨砂贴纸"
      : "酒杯主体抠图完成，已生成贴纸";
  }, 1900));
  pourFlowTimers.push(window.setTimeout(() => {
    pourStage.classList.add("transitioning");
    pourHint.textContent = "贴纸已浮出，正在打印酒单";
  }, 2050));
  pourFlowTimers.push(window.setTimeout(() => showView("edit"), 2230));
}

async function handleImageFile(file, source) {
  if (!file) return;
  if (uploadedImageUrl) URL.revokeObjectURL(uploadedImageUrl);
  uploadedImageUrl = URL.createObjectURL(file);
  resetPourState();
  pourStage.classList.add("camera-open", "uploaded-local", "cutting");
  startLoadingPourProgress();
  pourStage.style.setProperty("--uploaded-image", `url("${uploadedImageUrl}")`);
  pourHint.textContent = source === "camera"
    ? "照片已拍摄，正在调用高精度抠图服务"
    : "图片已选择，正在调用高精度抠图服务";
  showToast(source === "camera" ? "已获取拍照图片" : "已选择本地图片");
  try {
    const stickerUrl = await processImageToSticker(file);
    applyStickerImage(stickerUrl);
    pourStage.classList.remove("cutting");
    finishStickerFlow(source === "camera" ? "scan" : "upload");
  } catch (error) {
    console.warn(error);
    pourStage.classList.remove("pouring", "done", "cutting", "transitioning");
    setPourProgress(0);
    pourHint.textContent = error.message || "请先启动高精度抠图服务";
    showToast("高精度抠图服务未启动");
  }
}

if (uploadInput) {
  uploadInput.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    handleImageFile(file, "upload");
  });
}

if (captureInput) {
  captureInput.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    handleImageFile(file, "camera");
  });
}

if (noteCustomInput) {
  noteCustomInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addCustomNoteTag();
  });
}

if (modalNoteCustomInput) {
  modalNoteCustomInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addCustomNoteTag(modalNoteCustomInput, modalNoteTags);
  });
}

if (flowerWaterButton) {
  flowerWaterButton.addEventListener("pointerdown", () => {
    if (!waterLongPressUnlocked || flowerWaterButton.disabled) return;
    window.clearTimeout(waterLongPressTimer);
    waterLongPressTimer = window.setTimeout(() => {
      suppressNextWaterClick = true;
      waterMonthlyFlower({ all: true });
    }, 620);
  });

  ["pointerup", "pointerleave", "pointercancel"].forEach((eventName) => {
    flowerWaterButton.addEventListener(eventName, () => {
      window.clearTimeout(waterLongPressTimer);
    });
  });
}

document.addEventListener("click", async (event) => {
  const removeNoteTag = event.target.closest("[data-note-tag-remove]");
  if (removeNoteTag) {
    event.preventDefault();
    event.stopPropagation();
    removeCustomNoteTag(removeNoteTag);
    return;
  }

  const noteTag = event.target.closest("[data-note-tag]");
  if (noteTag) {
    setNoteTagActive(noteTag, !noteTag.classList.contains("active"));
    return;
  }

  const ratingOption = event.target.closest("[data-rating-option]");
  if (ratingOption) {
    ratingOptions?.querySelectorAll("[data-rating-option]").forEach((option) => {
      option.classList.toggle("active", option === ratingOption);
    });
    modalInput.value = ratingOption.dataset.ratingOption;
    return;
  }

  const editLine = event.target.closest("[data-edit]");
  if (editLine) {
    openModal(editLine);
    return;
  }

  const target = event.target.closest("[data-target]");
  if (target) {
    const nextView = target.dataset.target;
    if (nextView === "pour") resetPourState({ clearImages: true });
    showView(nextView);
    return;
  }

  const action = event.target.closest("[data-action]");
  if (!action) return;

  const value = action.dataset.action;
  if (value === "flip") {
    action.closest("[data-drink-card]").classList.toggle("flipped");
  } else if (value === "save-image") {
    showToast("小票已下载到本地相册");
  } else if (value === "request-delete") {
    const card = action.closest("[data-drink-card], .receipt-card");
    if (card) openDeleteModal(card);
  } else if (value === "cancel-delete") {
    closeDeleteModal();
  } else if (value === "confirm-delete") {
    deletePendingCard();
  } else if (value === "water-flower") {
    if (suppressNextWaterClick) {
      suppressNextWaterClick = false;
      return;
    }
    waterMonthlyFlower();
  } else if (value === "open-growth-path") {
    openGrowthPath();
  } else if (value === "close-growth-path") {
    closeGrowthPath();
  } else if (value === "add-note-tag") {
    addCustomNoteTag();
  } else if (value === "add-modal-note-tag") {
    addCustomNoteTag(modalNoteCustomInput, modalNoteTags);
  } else if (value === "open-camera") {
    resetPourState({ clearImages: true });
    pourStage.classList.add("camera-open");
    pourHint.textContent = "相机已打开，可拍照或点击「倒酒」模拟拍摄";
    if (captureInput) captureInput.click();
  } else if (value === "pour-shot") {
    finishStickerFlow("scan");
  } else if (value === "save-drink") {
    await addCurrentDrinkToCabinet();
    resetPourState({ clearImages: true });
    showToast("已加入酒柜");
    showView("cabinet");
  } else if (value === "close-modal") {
    closeModal();
  } else if (value === "confirm-edit") {
    if (activeEditButton) {
      const field = activeEditButton.dataset.edit;
      const nextValue = field === "rating"
        ? normalizeRating(modalInput.value) || modalInput.value
        : field === "abv"
          ? `${parseAbvValue(modalInput.value)}%`
          : modalInput.value;
      if (field === "note") setNoteEditValue(activeEditButton, nextValue);
      else activeEditButton.querySelector("strong").textContent = nextValue;
      if (field === "rating") syncRatingStamp(activeEditButton, nextValue);
      if (field === "abv") {
        const card = activeEditButton.closest("[data-drink-card]");
        const metaLine = card?.querySelector(".field-meta");
        if (metaLine) metaLine.textContent = `${nextValue} ABV`;
        updateReceiptWaterDrops(card);
        updateMonthlyFlower();
      }
      if (field === "note") updateReceiptTags(activeEditButton.closest("[data-drink-card]"));
    }
    closeModal();
    showToast("信息已更新");
  } else {
    showToast("本地原型反馈");
  }
});

cleanStickerCopy();
enhancePourActionButtons();
enhanceEditableLines();
syncNoteInput();
updateAllReceiptWaterDrops();
updateAllReceiptTags();
updateMonthlyFlower();
replayCabinetEntrance();
