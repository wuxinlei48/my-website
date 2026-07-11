const DEFAULT_API_BASE = "https://xiaoji.baziapi.site/v1";
const STORAGE_KEY = "yunhe_image_api_key";
const STORAGE_BASE = "yunhe_image_api_base";
const CITY_KEY = "yunhe_current_city";
const PROVINCE_CITIES = {
  安徽省: ["合肥", "芜湖", "蚌埠", "淮南", "马鞍山", "淮北", "铜陵", "安庆", "黄山", "滁州", "阜阳", "宿州", "六安", "亳州", "池州", "宣城"],
  江苏省: ["南京", "无锡", "徐州", "常州", "苏州", "南通", "连云港", "淮安", "盐城", "扬州", "镇江", "泰州", "宿迁"],
};
const ALLOWED_CITIES = Object.values(PROVINCE_CITIES).flat();
const DEFAULT_CITY = "合肥";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function initCitySwitch() {
  const cityBlocks = $$(".city");
  if (!cityBlocks.length) return;

  ensureCityDialog();
  updateCityDisplay();

  cityBlocks.forEach((block) => {
    block.addEventListener("click", (event) => {
      if (event.target.closest("button")) {
        $("#cityDialog").showModal();
      }
    });
  });
}

function ensureCityDialog() {
  if ($("#cityDialog")) return;

  const dialog = document.createElement("dialog");
  dialog.className = "city-dialog";
  dialog.id = "cityDialog";
  dialog.innerHTML = `
    <form method="dialog" class="city-modal">
      <button class="dialog-close" type="submit" aria-label="关闭">×</button>
      <p class="eyebrow">CITY</p>
      <h2>选择服务城市</h2>
      <div class="city-current">当前城市：<strong id="cityCurrentText">${getCurrentCity()}</strong></div>
      <section>
        <h3>安徽省</h3>
        <div class="city-grid">
          ${PROVINCE_CITIES["安徽省"].map(getCityButton).join("")}
        </div>
      </section>
      <section>
        <h3>江苏省</h3>
        <div class="city-grid">
          ${PROVINCE_CITIES["江苏省"].map(getCityButton).join("")}
        </div>
      </section>
      <p class="city-note">当前仅开放安徽省、江苏省服务城市。切换城市后，顶部城市、报价弹窗和本地浏览器记录会同步更新。</p>
    </form>
  `;

  document.body.appendChild(dialog);

  dialog.querySelectorAll("[data-city]").forEach((button) => {
    button.addEventListener("click", () => {
      setCurrentCity(button.dataset.city);
      dialog.close();
    });
  });
}

function getCityButton(city) {
  return `<button type="button" data-city="${city}">${city}</button>`;
}

function getCurrentCity() {
  const savedCity = localStorage.getItem(CITY_KEY);
  if (ALLOWED_CITIES.includes(savedCity)) return savedCity;
  localStorage.setItem(CITY_KEY, DEFAULT_CITY);
  return DEFAULT_CITY;
}

function setCurrentCity(city) {
  if (!ALLOWED_CITIES.includes(city)) city = DEFAULT_CITY;
  localStorage.setItem(CITY_KEY, city);
  updateCityDisplay();
}

function updateCityDisplay() {
  const city = getCurrentCity();
  $$(".city").forEach((block) => {
    block.innerHTML = `<span class="current-city">${city}</span> <button type="button">切换城市</button>`;
  });

  const currentText = $("#cityCurrentText");
  if (currentText) currentText.textContent = city;

  const modalCity = $("#modalCity");
  if (modalCity) {
    const exists = Array.from(modalCity.options).some((option) => option.value === city || option.textContent === city);
    if (!exists) modalCity.add(new Option(city, city));
    modalCity.value = city;
  }
}

const filters = { room: "all", style: "all", area: "all" };

function initCaseFilters() {
  const filterButtons = $$(".filter-row button[data-group]");
  const caseCards = $$(".case-card");
  const caseCount = $("#caseCount");
  const keywordInput = $("#keyword");
  const searchBtn = $("#searchBtn");

  if (!caseCards.length) return;

  function applyFilters() {
    const keyword = keywordInput ? keywordInput.value.trim().toLowerCase() : "";
    let visibleCount = 0;

    caseCards.forEach((card) => {
      const matchesRoom = filters.room === "all" || card.dataset.room === filters.room;
      const matchesStyle = filters.style === "all" || card.dataset.style === filters.style;
      const matchesArea = filters.area === "all" || card.dataset.area === filters.area;
      const matchesKeyword = !keyword || (card.dataset.keywords || "").toLowerCase().includes(keyword);
      const isVisible = matchesRoom && matchesStyle && matchesArea && matchesKeyword;

      card.classList.toggle("hidden", !isVisible);
      if (isVisible) visibleCount += 1;
    });

    if (caseCount) caseCount.textContent = `${visibleCount} 套案例`;
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.dataset.group;
      filters[group] = button.dataset.value;
      $$(`button[data-group="${group}"]`).forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      applyFilters();
    });
  });

  searchBtn?.addEventListener("click", applyFilters);
  keywordInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") applyFilters();
  });

  applyFilters();
}

function initLeadAndDetails() {
  $("#quoteForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    $("#quoteNote").textContent = "已收到预约信息，稍后为你安排方案沟通。";
  });

  const leadDialog = $("#leadDialog");
  const leadTitle = $("#leadTitle");
  const leadEyebrow = $("#leadEyebrow");
  const modalArea = $("#modalArea");
  const modalBudget = $("#modalBudget");
  const modalSubmit = $("#modalSubmit");
  const modalNote = $("#modalNote");

  function updateModalBudget() {
    if (!modalArea || !modalBudget) return;
    const area = Number(modalArea.value || 100);
    modalBudget.textContent = `${((area * 980) / 10000).toFixed(1)} 万起`;
  }

  $$("[data-lead]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!leadDialog) return;
      leadTitle.textContent = button.dataset.lead;
      leadEyebrow.textContent = "FREE SERVICE";
      updateCityDisplay();
      updateModalBudget();
      leadDialog.showModal();
    });
  });

  $$(".lead-options button").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".lead-options button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
    });
  });

  modalArea?.addEventListener("input", updateModalBudget);
  modalSubmit?.addEventListener("click", () => {
    modalNote.textContent = "已收到需求，稍后为你安排顾问沟通。";
  });

  const detailDialog = $("#detailDialog");
  const detailType = $("#detailType");
  const detailTitle = $("#detailTitle");
  const detailCopy = $("#detailCopy");

  $$("[data-detail]").forEach((item) => {
    item.addEventListener("click", () => {
      if (!detailDialog) return;
      detailType.textContent = item.dataset.type || "DETAIL";
      detailTitle.textContent = item.dataset.detail || "详情";
      detailCopy.textContent = item.dataset.copy || "这里可以展示更完整的内容。";
      detailDialog.showModal();
    });
  });
}

function initBudgetCalculator() {
  const areaInput = $("#calcArea");
  const budgetValue = $("#budgetValue");
  const unitPriceValue = $("#unitPriceValue");
  const durationValue = $("#durationValue");
  const houseCondition = $("#houseCondition");
  const wetAreaCount = $("#wetAreaCount");
  const budgetBreakdown = $("#budgetBreakdown");
  const quoteAdvice = $("#quoteAdvice");
  const materialLevelText = $("#materialLevelText");
  const levelButtons = $$(".level-options button");
  const materialSelects = $$(".material-select");
  let pricePerSquare = 980;
  let levelName = "实用型";

  const levelAdvice = {
    实用型: "适合基础整装，建议重点确认主材品牌、收纳定制和水电点位数量。",
    品质型: "适合改善型家庭，建议把柜体、厨卫五金、照明系统和环保材料列入重点清单。",
    改善型: "适合高品质整装，建议提前锁定定制、智能设备、软装和个性化造型的预算边界。",
  };

  const breakdownRules = [
    ["人工辅材", 0.28],
    ["主材设备", 0.32],
    ["定制收纳", 0.18],
    ["设计管理", 0.12],
    ["软装预留", 0.1],
  ];

  function updateBudget() {
    if (!areaInput || !budgetValue) return;
    const area = clampNumber(Number(areaInput.value), 40, 500);
    const conditionRate = Number(houseCondition?.value || 1);
    const wetAreaRate = Number(wetAreaCount?.value || 1);
    const materialRate = getMaterialRate();
    const total = area * pricePerSquare * conditionRate * wetAreaRate * materialRate;
    const low = total * 0.93;
    const high = total * 1.09;
    const durationBase = Math.round(48 + area * 0.34 + (conditionRate - 1) * 54 + (wetAreaRate - 0.96) * 86 + (materialRate - 1) * 42);
    const durationLow = Math.max(45, durationBase - 6);
    const durationHigh = Math.max(durationLow + 8, durationBase + 6);

    budgetValue.textContent = `${formatWan(low)}-${formatWan(high)} 万`;
    if (unitPriceValue) unitPriceValue.textContent = `约 ${Math.round(total / area)} 元/m²`;
    if (durationValue) durationValue.textContent = `预计 ${durationLow}-${durationHigh} 天`;
    if (quoteAdvice) quoteAdvice.textContent = getQuoteAdvice(materialRate);
    if (materialLevelText) materialLevelText.textContent = getMaterialLevelText(materialRate);
    if (budgetBreakdown) {
      budgetBreakdown.innerHTML = getBreakdownRules(materialRate).map(([name, rate]) => {
        const value = formatWan(total * rate);
        const percent = Math.round(rate * 100);
        return `
          <article>
            <div><span>${name}</span><strong>${value} 万</strong></div>
            <i style="--bar:${percent}%"></i>
          </article>
        `;
      }).join("");
    }
  }

  areaInput?.addEventListener("input", () => {
    if (Number(areaInput.value) > 500) areaInput.value = 500;
    updateBudget();
  });
  areaInput?.addEventListener("blur", () => {
    areaInput.value = clampNumber(Number(areaInput.value), 40, 500);
    updateBudget();
  });
  houseCondition?.addEventListener("change", updateBudget);
  wetAreaCount?.addEventListener("change", updateBudget);
  materialSelects.forEach((select) => select.addEventListener("change", updateBudget));
  levelButtons.forEach((button) => {
    button.addEventListener("click", () => {
      levelButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      pricePerSquare = Number(button.dataset.price);
      levelName = button.textContent.trim();
      updateBudget();
    });
  });

  updateBudget();

  function getMaterialRate() {
    if (!materialSelects.length) return 1;
    const totalRate = materialSelects.reduce((sum, select) => sum + Number(select.value || 1), 0);
    return totalRate / materialSelects.length;
  }

  function getMaterialLevelText(rate) {
    if (rate < 0.99) return "当前：经济耐用";
    if (rate < 1.06) return "当前：品牌舒适";
    if (rate < 1.12) return "当前：品质改善";
    return "当前：高端定制";
  }

  function getBreakdownRules(materialRate) {
    const materialLift = Math.max(0, materialRate - 1);
    const rawRules = breakdownRules.map(([name, rate]) => {
      if (name === "主材设备") return [name, rate + materialLift * 0.16];
      if (name === "定制收纳") return [name, rate + materialLift * 0.08];
      if (name === "软装预留") return [name, Math.max(0.07, rate - materialLift * 0.08)];
      return [name, rate];
    });
    const totalRate = rawRules.reduce((sum, [, rate]) => sum + rate, 0);
    return rawRules.map(([name, rate]) => [name, rate / totalRate]);
  }

  function getQuoteAdvice(materialRate) {
    const materialTip = materialRate >= 1.08
      ? "当前选材偏品质，建议把材料型号、五金品牌、环保等级和替代方案写进报价单。"
      : "当前选材偏实用，建议重点确认主材品牌、收纳定制和水电点位数量。";
    return `${levelAdvice[levelName]} ${materialTip}`;
  }
}

function formatWan(value) {
  return (value / 10000).toFixed(1);
}

function clampNumber(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function initAiStudio() {
  const keyToggle = $("#keyToggle");
  const keyPanel = $("#keyPanel");
  const apiBaseInput = $("#apiBase");
  const apiKeyInput = $("#apiKey");
  const saveKeyButton = $("#saveKey");
  const imageForm = $("#imageForm");
  const promptInput = $("#prompt");
  const statusText = $("#statusText");
  const generateButton = $("#generateBtn");
  const resultGrid = $("#resultGrid");
  const clearResults = $("#clearResults");
  const referenceInput = $("#referenceInput");
  const referenceList = $("#referenceList");

  if (!imageForm) return;

  if (apiBaseInput) apiBaseInput.value = localStorage.getItem(STORAGE_BASE) || DEFAULT_API_BASE;
  if (apiKeyInput) apiKeyInput.value = localStorage.getItem(STORAGE_KEY) || "";

  keyToggle?.addEventListener("click", () => {
    keyPanel.hidden = !keyPanel.hidden;
  });

  saveKeyButton?.addEventListener("click", () => {
    localStorage.setItem(STORAGE_BASE, apiBaseInput.value.trim() || DEFAULT_API_BASE);
    localStorage.setItem(STORAGE_KEY, apiKeyInput.value.trim());
    setStatus(apiKeyInput.value.trim() ? "设置已保存，可以开始真实生成。" : "未填写秘钥，将继续展示案例预览。");
  });

  $$("[data-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
      const text = button.dataset.prompt;
      promptInput.value = promptInput.value.trim() ? `${promptInput.value.trim()}，${text}` : text;
      promptInput.focus();
    });
  });

  const references = [];
  referenceInput?.addEventListener("change", async () => {
    const files = Array.from(referenceInput.files || []).slice(0, 3);
    references.splice(0, references.length, ...files);
    referenceList.innerHTML = files.map((file) => `<article class="reference-card"><span>${file.name}</span></article>`).join("");
    referenceInput.value = "";
    setStatus(files.length ? `已添加 ${files.length} 张参考图。` : "参考图已清空。");
  });

  clearResults?.addEventListener("click", () => {
    resultGrid.innerHTML = getEmptyResult();
    setStatus("结果已清空，可以开始新的 AI 效果图生成。");
  });

  imageForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const apiKey = apiKeyInput.value.trim();
    const prompt = buildPrompt();

    if (!prompt.trim()) {
      setStatus("请先填写想要的装修效果。");
      return;
    }

    setLoading(true);

    try {
      if (!apiKey) {
        await wait(450);
        renderPreviewResults();
        setStatus("当前未配置接口，已展示案例预览。配置接口后即可真实生成。");
        return;
      }

      const images = await generateImages({
        apiBase: apiBaseInput.value.trim() || DEFAULT_API_BASE,
        apiKey,
        model: $("#model")?.value || "gpt-image-1",
        prompt,
        size: normalizeSize($("#size")?.value || "1024x1024", $("#model")?.value || "gpt-image-1"),
        n: Number($("#count")?.value || 1),
        speedMode: $("#speedMode")?.value || "fast",
      });

      resultGrid.innerHTML = images.map((source, index) => getImageCard(source, `AI效果图${index + 1}`)).join("");
      setStatus(`生成完成，共返回 ${images.length} 张图片。`);
    } catch (error) {
      setStatus(formatErrorMessage(error.message));
    } finally {
      setLoading(false);
    }
  });

  function buildPrompt() {
    return [
      $("#spaceType")?.value,
      $("#styleType")?.value,
      promptInput.value.trim(),
      "真实室内摄影质感，空间比例自然，灯光舒适，材质清晰，适合装修客户沟通方案",
    ].filter(Boolean).join("，");
  }

  function setStatus(message) {
    if (statusText) statusText.textContent = message;
  }

  function setLoading(isLoading) {
    generateButton.disabled = isLoading;
    generateButton.querySelector("span").textContent = isLoading ? "正在生成..." : "立即生成效果图";
    const progressLine = $("#progressLine");
    if (progressLine) progressLine.hidden = !isLoading;
  }

  function renderPreviewResults() {
    const previews = ["assets/hero-interior.png", "assets/case-cream-home.png", "assets/case-modern-flat.png", "assets/case-old-renovation.png"];
    const count = Number($("#count")?.value || 1);
    resultGrid.innerHTML = previews.slice(0, count).map((source, index) => getImageCard(source, `预览图${index + 1}`)).join("");
  }

  function getEmptyResult() {
    return `<article class="empty-result"><span>AI</span><h3>等待生成</h3><p>选择风格、添加参考图后，效果图会显示在这里。</p></article>`;
  }

  function getImageCard(source, title) {
    return `
      <article class="result-card">
        <img src="${source}" alt="${title}" />
        <div>
          <span>${title}</span>
          <a href="${source}" target="_blank" rel="noreferrer">打开大图</a>
          <a href="${source}" download="${title}.png">下载</a>
        </div>
      </article>
    `;
  }
}

function initVrViewer() {
  const viewer = $("#vrViewer");
  const buttons = $$(".vr-hotspot[data-vr-room]");
  const title = $("#vrRoomTitle");
  const copy = $("#vrRoomCopy");
  if (!viewer || !buttons.length) return;

  const image = viewer.querySelector("img");
  const roomCopy = {
    客厅: ["现代自然客厅", "公共区域采用通透布局，适合查看采光、收纳墙和软装氛围。"],
    餐厨: ["开放餐厨空间", "重点查看餐厨联动、餐边柜、动线和灯光层次。"],
    卧室: ["舒适卧室空间", "查看卧室收纳、床头背景和休息区氛围。"],
    旧改: ["旧房焕新空间", "查看老房扩容、厨卫改造和收纳更新思路。"],
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      if (image && button.dataset.vrImage) image.src = button.dataset.vrImage;
      const [nextTitle, nextCopy] = roomCopy[button.dataset.vrRoom] || roomCopy.客厅;
      if (title) title.textContent = nextTitle;
      if (copy) copy.textContent = nextCopy;
    });
  });
}

async function generateImages({ apiBase, apiKey, model, prompt, size, n, speedMode }) {
  const response = await fetch("/api/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiBase,
      apiKey,
      model,
      prompt,
      n,
      size,
      speedMode,
      response_format: "url",
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.error?.message || payload.message || `接口返回 ${response.status}`;
    throw new Error(message);
  }

  const images = (payload.data || [])
    .map((item) => item.url || item.b64_json)
    .filter(Boolean)
    .map((source) => (source.startsWith("http") || source.startsWith("data:") ? source : `data:image/png;base64,${source}`));

  if (!images.length) throw new Error("接口没有返回图片。");
  return images;
}

function normalizeSize(size, model) {
  if (model === "dall-e-3") {
    return size === "1536x1024" ? "1792x1024" : size === "1024x1536" ? "1024x1792" : size;
  }
  return size === "1792x1024" ? "1536x1024" : size === "1024x1792" ? "1024x1536" : size;
}

function formatErrorMessage(message) {
  const lower = String(message).toLowerCase();
  if (message.includes("请求较多") || lower.includes("rate") || lower.includes("busy")) {
    return "生成失败：接口当前请求较多，建议稍等 1-3 分钟再试，或保持快速模式生成 1 张。";
  }
  if (message.includes("API Key") || message.includes("密钥") || message.includes("秘钥") || lower.includes("unauthorized")) {
    return `生成失败：${message}。请检查接口设置里的 API Key 是否正确。`;
  }
  return `生成失败：${message}`;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

initCitySwitch();
initCaseFilters();
initLeadAndDetails();
initBudgetCalculator();
initAiStudio();
initVrViewer();
