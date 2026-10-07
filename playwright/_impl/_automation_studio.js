(() => {
  const bindingName = "__PW_AUTOMATION_STUDIO_BINDING__";
  const hostId = "__PW_AUTOMATION_STUDIO_HOST_ID__";
  const bridgeToken = "__PW_AUTOMATION_STUDIO_TOKEN__";

  // Page init scripts also run inside frames. The studio belongs to the tab,
  // not to every embedded frame.
  if (window.top !== window || typeof window[bindingName] !== "function") return;

  const install = () => {
    if (!document.documentElement || document.getElementById(hostId)) return;

    const host = document.createElement("div");
    host.id = hostId;
    host.style.position = "fixed";
    host.style.inset = "0";
    host.style.zIndex = "2147483647";
    host.style.pointerEvents = "none";

    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>
        :host { all: initial; color-scheme: light; }
        * { box-sizing: border-box; }
        button, input, select, textarea { font: inherit; }
        button { cursor: pointer; }
        [hidden] { display: none !important; }
        #panel {
          position: fixed; top: 14px; right: 14px; width: 356px;
          max-width: calc(100vw - 28px); max-height: calc(100vh - 28px);
          display: flex; flex-direction: column; overflow: hidden;
          color: #e8eefb; background: #101827;
          border: 1px solid rgba(173, 190, 220, .2); border-radius: 18px;
          box-shadow: 0 18px 60px rgba(3, 8, 20, .38);
          font: 13px/1.55 Inter, ui-sans-serif, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", sans-serif;
          direction: rtl; pointer-events: auto;
        }
        #header {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; padding: 14px 15px 12px;
          border-bottom: 1px solid rgba(173, 190, 220, .13);
          background: linear-gradient(135deg, #18243b, #111a2a 76%);
        }
        .brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .brand-mark {
          width: 34px; height: 34px; display: grid; place-items: center;
          flex: 0 0 auto; border-radius: 11px; color: #fff;
          background: linear-gradient(145deg, #8c72ff, #6048dd);
          font-size: 18px; font-weight: 800;
          box-shadow: 0 5px 18px rgba(114, 86, 238, .3);
        }
        .brand h2 { margin: 0; color: #f7f8ff; font-size: 14px; font-weight: 750; }
        .brand small { display: block; margin-top: 1px; color: #9aabc6; font-size: 10px; }
        .icon-button {
          width: 30px; height: 30px; display: grid; place-items: center;
          padding: 0; border: 1px solid rgba(173,190,220,.18); border-radius: 9px;
          color: #c6d2e8; background: rgba(255,255,255,.04); font-size: 17px;
        }
        .icon-button:hover { background: rgba(255,255,255,.1); }
        #content { overflow: auto; padding: 13px; }
        .intro {
          margin: 0 0 11px; padding: 9px 10px; border-radius: 11px;
          color: #b8c6dc; background: rgba(255,255,255,.045); font-size: 11px;
        }
        .picker-row { display: flex; gap: 8px; margin-bottom: 12px; }
        .button {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 6px; min-height: 34px; padding: 7px 10px;
          border: 1px solid rgba(173,190,220,.18); border-radius: 10px;
          color: #dce6f7; background: rgba(255,255,255,.05);
          font-size: 11px; font-weight: 650; transition: .15s ease;
        }
        .button:hover { border-color: rgba(173,190,220,.38); background: rgba(255,255,255,.1); }
        .button:disabled { cursor: not-allowed; opacity: .45; }
        .button.primary {
          color: #fff; border-color: #7460e8;
          background: linear-gradient(135deg, #8069f0, #614ad7);
          box-shadow: 0 4px 12px rgba(93, 70, 208, .19);
        }
        .button.primary:hover { background: linear-gradient(135deg, #907df6, #705ae5); }
        .button.danger { color: #ffc5c8; border-color: rgba(239, 92, 102, .3); }
        .button.small { min-height: 28px; padding: 4px 8px; font-size: 10px; }
        .section-title {
          display: flex; align-items: center; justify-content: space-between;
          margin: 12px 1px 7px; color: #c6d2e7; font-size: 11px; font-weight: 750;
        }
        .field { margin-bottom: 9px; }
        .field label { display: block; margin-bottom: 4px; color: #a9bad2; font-size: 10px; font-weight: 600; }
        input, select, textarea {
          width: 100%; min-height: 34px; padding: 7px 9px;
          border: 1px solid rgba(173,190,220,.19); border-radius: 9px;
          outline: none; color: #edf2fb; background: #182337; font-size: 11px;
        }
        input:focus, select:focus, textarea:focus { border-color: #8a76f5; box-shadow: 0 0 0 2px rgba(125,103,236,.15); }
        input::placeholder, textarea::placeholder { color: #71829c; }
        select option { color: #edf2fb; background: #182337; }
        textarea { min-height: 62px; resize: vertical; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .picker-note { min-height: 15px; margin: -3px 2px 8px; color: #9daec7; font-size: 10px; }
        #steps {
          display: flex; flex-direction: column; gap: 6px; margin: 0; padding: 0;
          list-style: none;
        }
        .empty-state {
          padding: 13px 10px; border: 1px dashed rgba(173,190,220,.22);
          border-radius: 11px; color: #8496b1; text-align: center; font-size: 10px;
        }
        .step {
          display: grid; grid-template-columns: 23px minmax(0,1fr) auto;
          align-items: center; gap: 7px; padding: 7px 8px;
          border: 1px solid rgba(173,190,220,.12); border-radius: 10px;
          background: rgba(255,255,255,.035);
        }
        .step-index {
          width: 22px; height: 22px; display: grid; place-items: center;
          border-radius: 7px; color: #d1c9ff; background: rgba(125,103,236,.2);
          font-size: 10px; font-weight: 750;
        }
        .step-copy { min-width: 0; }
        .step-title { overflow: hidden; color: #e5ecf7; font-size: 10px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
        .step-detail { overflow: hidden; color: #92a3bd; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; direction: ltr; text-align: right; }
        .step-tools { display: flex; gap: 3px; }
        .step-tools button {
          width: 22px; height: 23px; display: grid; place-items: center; padding: 0;
          border: 0; border-radius: 6px; color: #aab9ce; background: transparent; font-size: 12px;
        }
        .step-tools button:hover { color: #fff; background: rgba(255,255,255,.1); }
        .step-tools button:disabled { opacity: .25; cursor: not-allowed; }
        .check-row { display: flex; align-items: center; gap: 7px; color: #b8c6dc; font-size: 10px; }
        .check-row input { width: 14px; min-height: 14px; height: 14px; margin: 0; accent-color: #8069f0; }
        .actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-top: 11px; }
        #status {
          min-height: 34px; margin-top: 11px; padding: 7px 9px;
          border: 1px solid rgba(173,190,220,.12); border-radius: 9px;
          color: #aab9cf; background: rgba(255,255,255,.035); font-size: 10px;
          overflow-wrap: anywhere;
        }
        #status[data-kind="success"] { color: #9ce4c3; border-color: rgba(88,210,154,.2); }
        #status[data-kind="error"] { color: #ffafb5; border-color: rgba(239,92,102,.22); }
        #status[data-kind="running"] { color: #d1c9ff; border-color: rgba(125,103,236,.26); }
        #url { display: block; overflow: hidden; margin-top: 6px; color: #7386a0; direction: ltr; text-align: left; text-overflow: ellipsis; white-space: nowrap; font-size: 9px; }
        #reopen {
          position: fixed; top: 14px; right: 14px; display: flex; align-items: center; gap: 7px;
          min-height: 38px; padding: 7px 12px; border: 1px solid rgba(173,190,220,.23);
          border-radius: 12px; color: #fff; background: #141e30; box-shadow: 0 8px 28px rgba(3,8,20,.35);
          font: 700 11px/1.2 Inter, ui-sans-serif, system-ui, sans-serif; direction: rtl;
          pointer-events: auto;
        }
        #reopen span:first-child { color: #b7aaff; font-size: 15px; }
        #highlight {
          position: fixed; display: none; border: 2px solid #8c76ff;
          border-radius: 4px; background: rgba(122, 98, 255, .13);
          box-shadow: 0 0 0 2px rgba(122, 98, 255, .16), 0 2px 12px rgba(30,20,85,.2);
          pointer-events: none;
        }
        @media (max-width: 560px) {
          #panel { top: auto; right: 10px; bottom: 10px; width: calc(100vw - 20px); max-height: 82vh; }
          #reopen { top: auto; right: 10px; bottom: 10px; }
        }
      </style>
      <aside id="panel" dir="rtl" aria-label="استودیو اتوماسیون Playwright">
        <header id="header">
          <div class="brand">
            <div class="brand-mark">✦</div>
            <div><h2>استودیو اتوماسیون</h2><small>ساخت و اجرای گردش‌کار در همین تب</small></div>
          </div>
          <button class="icon-button" id="hide" type="button" aria-label="جمع کردن پنل">−</button>
        </header>
        <div id="content">
          <p class="intro">عنصر را انتخاب کنید، مراحل را مرتب کنید و با Playwright اجرا یا خروجی بگیرید.</p>
          <div class="picker-row">
            <button class="button" id="pick" type="button">⌖ انتخاب عنصر از صفحه</button>
            <button class="button small" id="clearAll" type="button">پاک‌کردن مراحل</button>
          </div>
          <div id="pickerNote" class="picker-note" aria-live="polite"></div>

          <div class="section-title"><span>۱. تعریف مرحله</span><span style="color:#788ba7;font-size:9px">هدف را انتخاب یا دستی وارد کنید</span></div>
          <div class="field">
            <label for="actionType">نوع عملیات</label>
            <select id="actionType">
              <option value="click">کلیک</option>
              <option value="double_click">دابل‌کلیک</option>
              <option value="hover">رفتن روی عنصر</option>
              <option value="fill">پرکردن سریع فیلد</option>
              <option value="type">تایپ مرحله‌ای</option>
              <option value="clear">پاک‌کردن فیلد</option>
              <option value="press">فشردن کلید</option>
              <option value="select">انتخاب از فهرست</option>
              <option value="check">فعال‌کردن چک‌باکس</option>
              <option value="uncheck">غیرفعال‌کردن چک‌باکس</option>
              <option value="wait">انتظار برای عنصر</option>
              <option value="scroll">اسکرول تا عنصر</option>
              <option value="delay">مکث</option>
              <option value="navigate">رفتن به نشانی</option>
              <option value="screenshot">گرفتن اسکرین‌شات</option>
            </select>
          </div>

          <div id="targetEditor">
            <div class="two-col">
              <div class="field">
                <label for="selectorKind">روش پیدا کردن عنصر</label>
                <select id="selectorKind">
                  <option value="role">نقش دسترس‌پذیری</option>
                  <option value="label">برچسب فیلد</option>
                  <option value="placeholder">متن راهنما</option>
                  <option value="text">متن روی صفحه</option>
                  <option value="testid">Test ID</option>
                  <option value="title">عنوان (title)</option>
                  <option value="css">CSS selector</option>
                </select>
              </div>
              <div class="field">
                <label id="selectorValueLabel" for="selectorValue">نقش (مثل button یا textbox)</label>
                <input id="selectorValue" type="text" autocomplete="off" placeholder="مثلاً button" />
              </div>
            </div>
            <div class="field" id="roleNameWrap">
              <label for="roleName">نام دکمه/عنصر (اختیاری)</label>
              <input id="roleName" type="text" autocomplete="off" placeholder="مثلاً ورود" />
            </div>
          </div>

          <div class="field" id="valueWrap">
            <label id="valueLabel" for="actionValue">متن</label>
            <textarea id="actionValue" placeholder="متن موردنظر را وارد کنید"></textarea>
          </div>
          <div class="field" id="waitWrap" hidden>
            <label for="waitState">وضعیت مورد انتظار</label>
            <select id="waitState">
              <option value="visible">نمایان شود</option>
              <option value="hidden">مخفی شود</option>
              <option value="attached">به صفحه اضافه شود</option>
              <option value="detached">از صفحه حذف شود</option>
            </select>
          </div>
          <div class="field" id="delayWrap" hidden>
            <label for="delayValue">مدت مکث (میلی‌ثانیه)</label>
            <input id="delayValue" type="number" min="0" max="120000" value="1000" />
          </div>
          <div class="field" id="screenshotWrap" hidden>
            <label for="screenshotPath">نام فایل اسکرین‌شات</label>
            <input id="screenshotPath" type="text" value="automation-screenshot.png" />
            <label class="check-row" style="margin-top:7px"><input id="fullPage" type="checkbox" /> کل صفحه</label>
          </div>
          <button class="button primary" id="addStep" type="button" style="width:100%">＋ افزودن به گردش‌کار</button>

          <div class="section-title"><span>۲. مراحل گردش‌کار</span><span id="stepCount" style="color:#8f9fb8;font-size:9px">۰ مرحله</span></div>
          <ol id="steps"></ol>

          <div class="actions-grid">
            <button class="button primary" id="run" type="button">▶ اجرای گردش‌کار</button>
            <button class="button danger" id="stop" type="button" hidden>■ توقف</button>
            <button class="button" id="exportJson" type="button">↓ خروجی JSON</button>
            <button class="button" id="exportPython" type="button">{ } خروجی پایتون</button>
            <button class="button small" id="importJson" type="button" style="grid-column:1 / -1">↑ ورود گردش‌کار JSON</button>
          </div>
          <input id="fileInput" type="file" accept="application/json,.json" hidden />
          <div id="status" role="status" aria-live="polite">آمادهٔ ساخت گردش‌کار</div>
          <span id="url"></span>
        </div>
      </aside>
      <button id="reopen" type="button" hidden><span>✦</span><span>استودیو اتوماسیون</span></button>
      <div id="highlight" aria-hidden="true"></div>
    `;
    document.documentElement.appendChild(host);

    const $ = (selector) => shadow.querySelector(selector);
    const panel = $("#panel");
    const reopen = $("#reopen");
    const status = $("#status");
    const urlLabel = $("#url");
    const stepsList = $("#steps");
    const stepCount = $("#stepCount");
    const actionType = $("#actionType");
    const selectorKind = $("#selectorKind");
    const selectorValue = $("#selectorValue");
    const selectorValueLabel = $("#selectorValueLabel");
    const roleName = $("#roleName");
    const roleNameWrap = $("#roleNameWrap");
    const targetEditor = $("#targetEditor");
    const valueWrap = $("#valueWrap");
    const valueLabel = $("#valueLabel");
    const actionValue = $("#actionValue");
    const waitWrap = $("#waitWrap");
    const delayWrap = $("#delayWrap");
    const screenshotWrap = $("#screenshotWrap");
    const pickButton = $("#pick");
    const pickerNote = $("#pickerNote");
    const runButton = $("#run");
    const stopButton = $("#stop");
    const highlighter = $("#highlight");

    const actionLabels = {
      click: "کلیک", double_click: "دابل‌کلیک", hover: "رفتن روی عنصر",
      fill: "پرکردن فیلد", type: "تایپ مرحله‌ای", clear: "پاک‌کردن فیلد",
      press: "فشردن کلید", select: "انتخاب از فهرست", check: "فعال‌کردن چک‌باکس",
      uncheck: "غیرفعال‌کردن چک‌باکس", wait: "انتظار برای عنصر", scroll: "اسکرول تا عنصر",
      delay: "مکث", navigate: "رفتن به نشانی", screenshot: "اسکرین‌شات"
    };
    const selectorLabels = {
      role: "نقش", label: "برچسب", placeholder: "متن راهنما", text: "متن",
      testid: "Test ID", title: "عنوان", css: "CSS"
    };
    const actionsWithTarget = new Set([
      "click", "double_click", "hover", "fill", "type", "clear", "press", "select",
      "check", "uncheck", "wait", "scroll"
    ]);
    const actionsWithValue = new Set(["fill", "type", "press", "select"]);
    let workflow = [];
    let picking = false;
    let statusTimer = null;
    let statusRequestPending = false;

    const bridge = (message) => {
      if (typeof window[bindingName] !== "function") {
        return Promise.reject(new Error("ارتباط پنل با Playwright برقرار نیست"));
      }
      return window[bindingName]({ ...message, token: bridgeToken });
    };

    function setStatus(message, kind = "") {
      status.textContent = message || "";
      status.dataset.kind = kind;
    }

    function stopStatusPolling() {
      if (statusTimer !== null) {
        clearInterval(statusTimer);
        statusTimer = null;
      }
    }

    function startStatusPolling() {
      if (statusTimer !== null) return;
      statusTimer = setInterval(() => {
        if (!host.isConnected || statusRequestPending) return;
        statusRequestPending = true;
        bridge({ command: "status" }).then((result) => {
          if (result && result.ok) applyState(result);
        }).catch((error) => {
          stopStatusPolling();
          setStatus(error.message || "ارتباط استودیو قطع شد", "error");
        }).finally(() => { statusRequestPending = false; });
      }, 700);
    }

    function applyState(state) {
      if (!state) return;
      const labels = {
        ready: "آماده", running: "در حال اجرا", stopping: "در حال توقف",
        completed: "کامل شد", stopped: "متوقف شد", error: "خطا"
      };
      const title = labels[state.status] || "وضعیت";
      let text = `${title} — ${state.message || ""}`;
      if (state.current && state.total) text += ` (${state.current}/${state.total})`;
      if (state.error) text += `: ${state.error}`;
      setStatus(text, state.status === "error" ? "error" :
        state.status === "completed" ? "success" :
        state.status === "running" || state.status === "stopping" ? "running" : "");
      runButton.disabled = state.status === "running" || state.status === "stopping";
      stopButton.hidden = state.status !== "running" && state.status !== "stopping";
      urlLabel.textContent = state.url || window.location.href;
      urlLabel.title = state.url || window.location.href;
      if (state.status === "running" || state.status === "stopping") startStatusPolling();
      else stopStatusPolling();
    }

    function updateActionFields() {
      const type = actionType.value;
      const needsTarget = actionsWithTarget.has(type);
      targetEditor.hidden = !needsTarget;
      roleNameWrap.hidden = selectorKind.value !== "role" || !needsTarget;
      selectorValueLabel.textContent = selectorKind.value === "role"
        ? "نقش (مثل button یا textbox)"
        : `مقدار ${selectorLabels[selectorKind.value] || "انتخابگر"}`;
      selectorValue.placeholder = selectorKind.value === "role"
        ? "مثلاً button" : "انتخاب یا وارد کنید";
      valueWrap.hidden = !actionsWithValue.has(type) && type !== "navigate";
      waitWrap.hidden = type !== "wait";
      delayWrap.hidden = type !== "delay";
      screenshotWrap.hidden = type !== "screenshot";
      const valueLabels = {
        fill: "متنی که فیلد با آن پر می‌شود",
        type: "متنی که حرف‌به‌حرف تایپ می‌شود",
        press: "نام کلید (مثلاً Enter یا Control+A)",
        select: "مقدار گزینهٔ فهرست",
        navigate: "نشانی مقصد"
      };
      valueLabel.textContent = valueLabels[type] || "مقدار";
      actionValue.placeholder = type === "press" ? "مثلاً Enter" :
        type === "select" ? "مثلاً value گزینه" :
        type === "navigate" ? "مثلاً https://example.com" : "متن موردنظر را وارد کنید";
    }

    function describeTarget(target) {
      if (!target) return "";
      let value = target.value || "";
      if (target.kind === "role" && target.name) value += ` «${target.name}»`;
      return `${selectorLabels[target.kind] || target.kind}: ${value}`;
    }

    function describeStep(step) {
      let detail = "";
      if (step.target) detail = describeTarget(step.target);
      if (step.type === "fill" || step.type === "type" || step.type === "press" || step.type === "select") {
        detail = `${detail}${detail ? " ← " : ""}${step.value}`;
      } else if (step.type === "delay") {
        detail = `${step.milliseconds} میلی‌ثانیه`;
      } else if (step.type === "navigate") {
        detail = step.url;
      } else if (step.type === "screenshot") {
        detail = step.path;
      } else if (step.type === "wait") {
        detail = `${detail} · ${step.state}`;
      }
      return detail;
    }

    function renderSteps() {
      stepsList.replaceChildren();
      stepCount.textContent = `${workflow.length} مرحله`;
      if (!workflow.length) {
        const empty = document.createElement("li");
        empty.className = "empty-state";
        empty.textContent = "هنوز مرحله‌ای اضافه نشده است";
        stepsList.appendChild(empty);
        return;
      }
      workflow.forEach((step, index) => {
        const item = document.createElement("li");
        item.className = "step";
        const number = document.createElement("span");
        number.className = "step-index";
        number.textContent = String(index + 1);
        const copy = document.createElement("div");
        copy.className = "step-copy";
        const title = document.createElement("div");
        title.className = "step-title";
        title.textContent = actionLabels[step.type] || step.type;
        const detail = document.createElement("div");
        detail.className = "step-detail";
        detail.textContent = describeStep(step);
        copy.append(title, detail);
        const tools = document.createElement("div");
        tools.className = "step-tools";
        const up = document.createElement("button");
        up.type = "button"; up.textContent = "↑"; up.title = "انتقال به بالا";
        up.setAttribute("aria-label", `انتقال مرحلهٔ ${index + 1} به بالا`);
        up.disabled = index === 0;
        up.addEventListener("click", () => moveStep(index, -1));
        const down = document.createElement("button");
        down.type = "button"; down.textContent = "↓"; down.title = "انتقال به پایین";
        down.setAttribute("aria-label", `انتقال مرحلهٔ ${index + 1} به پایین`);
        down.disabled = index === workflow.length - 1;
        down.addEventListener("click", () => moveStep(index, 1));
        const remove = document.createElement("button");
        remove.type = "button"; remove.textContent = "×"; remove.title = "حذف مرحله";
        remove.setAttribute("aria-label", `حذف مرحلهٔ ${index + 1}`);
        remove.addEventListener("click", () => {
          workflow.splice(index, 1);
          persistWorkflow();
        });
        tools.append(up, down, remove);
        item.append(number, copy, tools);
        stepsList.appendChild(item);
      });
    }

    function persistWorkflow() {
      renderSteps();
      bridge({ command: "save", actions: workflow }).then((result) => {
        if (!result.ok) setStatus(result.message || "ذخیرهٔ گردش‌کار ناموفق بود", "error");
      }).catch((error) => setStatus(error.message, "error"));
    }

    function moveStep(index, offset) {
      const next = index + offset;
      if (next < 0 || next >= workflow.length) return;
      [workflow[index], workflow[next]] = [workflow[next], workflow[index]];
      persistWorkflow();
    }

    function readTarget() {
      const kind = selectorKind.value;
      const value = selectorValue.value.trim();
      if (!value) return null;
      const target = { kind, value };
      if (kind === "role") {
        const name = roleName.value.trim();
        if (name) target.name = name;
        target.exact = true;
      } else if (kind !== "css") {
        target.exact = true;
      }
      return target;
    }

    function addStep() {
      const type = actionType.value;
      const step = { type };
      if (actionsWithTarget.has(type)) {
        step.target = readTarget();
        if (!step.target) {
          setStatus("ابتدا عنصر هدف را از صفحه انتخاب یا مشخص کنید", "error");
          return;
        }
      }
      if (actionsWithValue.has(type)) {
        const value = actionValue.value;
        if (type !== "fill" && !value.trim()) {
          setStatus("مقدار این مرحله نمی‌تواند خالی باشد", "error");
          return;
        }
        step.value = value;
      }
      if (type === "wait") step.state = $("#waitState").value;
      if (type === "delay") {
        const milliseconds = Number($("#delayValue").value);
        if (!Number.isFinite(milliseconds) || milliseconds < 0 || milliseconds > 120000) {
          setStatus("مدت مکث باید بین صفر تا ۱۲۰٬۰۰۰ میلی‌ثانیه باشد", "error");
          return;
        }
        step.milliseconds = Math.trunc(milliseconds);
      }
      if (type === "navigate") {
        const url = actionValue.value.trim();
        if (!url) {
          setStatus("نشانی صفحه را وارد کنید", "error");
          return;
        }
        step.url = url;
      }
      if (type === "screenshot") {
        step.path = $("#screenshotPath").value.trim() || "automation-screenshot.png";
        step.full_page = $("#fullPage").checked;
      }
      if (workflow.length >= 100) {
        setStatus("حداکثر ۱۰۰ مرحله در یک گردش‌کار مجاز است", "error");
        return;
      }
      workflow.push(step);
      persistWorkflow();
      setStatus(`مرحلهٔ «${actionLabels[type]}» اضافه شد`);
    }

    function downloadFile(filename, contents, type) {
      const blob = new Blob([contents], { type });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }

    function pythonString(value) {
      return JSON.stringify(String(value))
        .replace(/\u2028/g, "\\u2028")
        .replace(/\u2029/g, "\\u2029");
    }

    function pythonLocator(target) {
      const value = pythonString(target.value);
      if (target.kind === "role") {
        const name = target.name ? `, name=${pythonString(target.name)}` : "";
        return `page.get_by_role(${value}${name}, exact=${target.exact !== false ? "True" : "False"})`;
      }
      const methods = {
        label: "get_by_label", placeholder: "get_by_placeholder", text: "get_by_text",
        testid: "get_by_test_id", title: "get_by_title"
      };
      if (target.kind === "css") return `page.locator(${pythonString(`css=${target.value}`)})`;
      const method = methods[target.kind];
      if (target.kind === "testid") return `page.${method}(${value})`;
      return `page.${method}(${value}, exact=${target.exact !== false ? "True" : "False"})`;
    }

    function pythonCode(actions) {
      const lines = [
        "# Generated by Playwright Automation Studio",
        "# Assumes `page` is an async Playwright Page.",
        "",
        "async def run_automation(page):"
      ];
      if (!actions.length) {
        lines.push("    pass");
        return lines.join("\n") + "\n";
      }
      actions.forEach((step, index) => {
        const prefix = `    # Step ${index + 1}: ${actionLabels[step.type] || step.type}`;
        lines.push(prefix);
        const locator = step.target ? pythonLocator(step.target) : "";
        switch (step.type) {
          case "click": lines.push(`    await ${locator}.click()`); break;
          case "double_click": lines.push(`    await ${locator}.dblclick()`); break;
          case "hover": lines.push(`    await ${locator}.hover()`); break;
          case "fill": lines.push(`    await ${locator}.fill(${pythonString(step.value)})`); break;
          case "type": lines.push(`    await ${locator}.press_sequentially(${pythonString(step.value)})`); break;
          case "clear": lines.push(`    await ${locator}.clear()`); break;
          case "press": lines.push(`    await ${locator}.press(${pythonString(step.value)})`); break;
          case "select": lines.push(`    await ${locator}.select_option(value=${pythonString(step.value)})`); break;
          case "check": lines.push(`    await ${locator}.check()`); break;
          case "uncheck": lines.push(`    await ${locator}.uncheck()`); break;
          case "wait": lines.push(`    await ${locator}.wait_for(state=${pythonString(step.state || "visible")}, timeout=10000)`); break;
          case "scroll": lines.push(`    await ${locator}.scroll_into_view_if_needed()`); break;
          case "delay": lines.push(`    await page.wait_for_timeout(${Math.trunc(step.milliseconds || 0)})`); break;
          case "navigate": lines.push(`    await page.goto(${pythonString(step.url)})`); break;
          case "screenshot": lines.push(`    await page.screenshot(path=${pythonString(step.path || "automation-screenshot.png")}, full_page=${step.full_page ? "True" : "False"})`); break;
        }
        lines.push("");
      });
      return lines.join("\n").replace(/\n+$/, "\n");
    }

    function runWorkflow() {
      if (!workflow.length) {
        setStatus("ابتدا دست‌کم یک مرحله اضافه کنید", "error");
        return;
      }
      runButton.disabled = true;
      stopButton.hidden = false;
      setStatus("در حال اجرای مراحل با Playwright…", "running");
      startStatusPolling();
      bridge({ command: "run", actions: workflow }).then((result) => {
        applyState(result);
        if (!result.ok && result.message) setStatus(result.message, "error");
      }).catch((error) => setStatus(error.message || "اجرای گردش‌کار ناموفق بود", "error"))
        .finally(() => {
          if (!document.getElementById(hostId)) return;
          runButton.disabled = false;
          stopButton.hidden = true;
        });
    }

    function stopWorkflow() {
      stopButton.disabled = true;
      bridge({ command: "stop" }).then(applyState)
        .catch((error) => setStatus(error.message, "error"))
        .finally(() => { stopButton.disabled = false; });
    }

    function textOf(element) {
      return (element?.innerText || element?.textContent || "").replace(/\s+/g, " ").trim().slice(0, 100);
    }

    function labelOf(element) {
      if (element.labels && element.labels.length) {
        const labels = Array.from(element.labels).map(textOf).filter(Boolean);
        if (labels.length) return labels.join(" ");
      }
      const labelledBy = element.getAttribute("aria-labelledby");
      if (labelledBy) {
        const text = labelledBy.split(/\s+/).map((id) => textOf(document.getElementById(id))).filter(Boolean).join(" ");
        if (text) return text;
      }
      return "";
    }

    function roleOf(element) {
      const explicit = element.getAttribute("role");
      if (explicit) return explicit.split(/\s+/)[0];
      const tag = element.tagName.toLowerCase();
      if (tag === "button" || tag === "summary") return "button";
      if (tag === "a" && element.hasAttribute("href")) return "link";
      if (tag === "textarea") return "textbox";
      if (tag === "select") return element.multiple ? "listbox" : "combobox";
      if (/^h[1-6]$/.test(tag)) return "heading";
      if (tag === "img") return "img";
      if (tag === "input") {
        const type = (element.getAttribute("type") || "text").toLowerCase();
        if (type === "checkbox") return "checkbox";
        if (type === "radio") return "radio";
        if (["button", "submit", "reset", "image"].includes(type)) return "button";
        if (type === "search") return "searchbox";
        if (["hidden", "file", "range", "color"].includes(type)) return "";
        return "textbox";
      }
      return "";
    }

    function cssEscape(value) {
      if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(value);
      return String(value).replace(/([^a-zA-Z0-9_-])/g, "\\$1");
    }

    function cssPath(element) {
      if (element.id) return `#${cssEscape(element.id)}`;
      const parts = [];
      let current = element;
      while (current && current.nodeType === 1 && current !== document.documentElement) {
        let part = current.localName;
        if (current.id) {
          part += `#${cssEscape(current.id)}`;
          parts.unshift(part);
          break;
        }
        const parent = current.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter((child) => child.localName === current.localName);
          if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
        }
        parts.unshift(part);
        current = parent;
      }
      return parts.join(" > ");
    }

    function locatorForElement(element) {
      let candidate = element;
      if (candidate && candidate.nodeType !== 1) candidate = candidate.parentElement;
      if (!candidate) return null;
      const interactive = candidate.closest(
        "button,a[href],input,textarea,select,[role='button'],[role='link'],[role='checkbox'],[role='radio'],[tabindex]:not([tabindex='-1'])"
      );
      if (interactive) candidate = interactive;

      const testid = candidate.getAttribute("data-testid");
      if (testid) return { kind: "testid", value: testid };
      const label = labelOf(candidate);
      const ariaLabel = candidate.getAttribute("aria-label");
      const placeholder = candidate.getAttribute("placeholder");
      const isControl = /^(INPUT|TEXTAREA|SELECT)$/.test(candidate.tagName);
      if (isControl && (label || ariaLabel)) return { kind: "label", value: label || ariaLabel };
      if (isControl && placeholder) return { kind: "placeholder", value: placeholder };

      const role = roleOf(candidate);
      const accessibleName = ariaLabel || label || placeholder || textOf(candidate) ||
        candidate.getAttribute("alt") || candidate.getAttribute("value") || candidate.getAttribute("title") || "";
      if (role && accessibleName) return { kind: "role", value: role, name: accessibleName, exact: true };
      if (candidate.getAttribute("title")) return { kind: "title", value: candidate.getAttribute("title"), exact: true };
      if (candidate.id) return { kind: "css", value: cssPath(candidate) };
      if (textOf(candidate)) return { kind: "text", value: textOf(candidate), exact: true };
      return { kind: "css", value: cssPath(candidate) };
    }

    function beginPicking() {
      picking = !picking;
      pickButton.classList.toggle("primary", picking);
      pickerNote.textContent = picking ? "روی عنصر موردنظر در صفحه کلیک کنید؛ کلیک واقعی اجرا نمی‌شود." : "";
      highlighter.style.display = picking ? "block" : "none";
    }

    function pageElementFromEvent(event) {
      const path = typeof event.composedPath === "function" ? event.composedPath() : [];
      if (path.includes(host)) return null;
      let element = path[0] || event.target;
      if (element && element.nodeType !== 1) element = element.parentElement;
      if (!element || element === document.documentElement) return null;
      return element;
    }

    const onPointerMove = (event) => {
      if (!picking) return;
      const element = pageElementFromEvent(event);
      if (!element) return;
      const rect = element.getBoundingClientRect();
      highlighter.style.display = "block";
      highlighter.style.left = `${rect.left}px`;
      highlighter.style.top = `${rect.top}px`;
      highlighter.style.width = `${Math.max(rect.width, 2)}px`;
      highlighter.style.height = `${Math.max(rect.height, 2)}px`;
    };

    const onPickClick = (event) => {
      if (!picking) return;
      const element = pageElementFromEvent(event);
      if (!element) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const selected = locatorForElement(element);
      if (selected) {
        selectorKind.value = selected.kind;
        selectorValue.value = selected.value;
        roleName.value = selected.name || "";
        updateActionFields();
        pickerNote.textContent = `انتخاب شد: ${describeTarget(selected)}`;
        setStatus(`عنصر انتخاب شد: ${describeTarget(selected)}`);
      }
      picking = false;
      pickButton.classList.remove("primary");
      highlighter.style.display = "none";
    };
    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("click", onPickClick, true);
    host.__pwAutomationStudioDispose = () => {
      document.removeEventListener("pointermove", onPointerMove, true);
      document.removeEventListener("click", onPickClick, true);
      stopStatusPolling();
      picking = false;
    };

    $("#hide").addEventListener("click", () => { panel.hidden = true; reopen.hidden = false; });
    reopen.addEventListener("click", () => { panel.hidden = false; reopen.hidden = true; });
    pickButton.addEventListener("click", beginPicking);
    actionType.addEventListener("change", updateActionFields);
    selectorKind.addEventListener("change", updateActionFields);
    $("#addStep").addEventListener("click", addStep);
    runButton.addEventListener("click", runWorkflow);
    stopButton.addEventListener("click", stopWorkflow);
    $("#clearAll").addEventListener("click", () => {
      workflow = [];
      persistWorkflow();
      setStatus("همهٔ مراحل پاک شدند");
    });
    $("#exportJson").addEventListener("click", () => {
      downloadFile("playwright-workflow.json", JSON.stringify(workflow, null, 2), "application/json");
      setStatus("فایل JSON گردش‌کار آماده شد", "success");
    });
    $("#exportPython").addEventListener("click", () => {
      downloadFile("playwright-workflow.py", pythonCode(workflow), "text/x-python");
      setStatus("کد پایتون گردش‌کار آماده شد", "success");
    });
    $("#importJson").addEventListener("click", () => $("#fileInput").click());
    $("#fileInput").addEventListener("change", async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (!Array.isArray(data)) throw new Error("ساختار فایل باید یک آرایه از مراحل باشد");
        if (data.length > 100) throw new Error("حداکثر ۱۰۰ مرحله مجاز است");
        const result = await bridge({ command: "save", actions: data });
        if (!result.ok) throw new Error(result.message || "فایل معتبر نیست");
        workflow = result.actions || data;
        renderSteps();
        setStatus("گردش‌کار از فایل JSON وارد شد", "success");
      } catch (error) {
        setStatus(error.message || "خواندن فایل ناموفق بود", "error");
      } finally {
        event.target.value = "";
      }
    });

    updateActionFields();
    renderSteps();
    bridge({ command: "load" }).then((result) => {
      if (!result.ok) {
        setStatus(result.message || "وضعیت استودیو دریافت نشد", "error");
        return;
      }
      workflow = Array.isArray(result.actions) ? result.actions : [];
      renderSteps();
      applyState(result);
    }).catch((error) => setStatus(error.message || "اتصال به Playwright ناموفق بود", "error"));
  };

  if (document.documentElement) install();
  else document.addEventListener("DOMContentLoaded", install, { once: true });
})();
