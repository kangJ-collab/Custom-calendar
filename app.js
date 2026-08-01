const state = {
  viewDate: new Date(),
  selectedDate: new Date(),
  activeView: "calendar",
  detailOpen: false
};

const holidays = new Map([
  ["2026-08-15", "광복절"],
  ["2026-08-17", "대체공휴일"]
]);

const demoEntries = new Map([
  ["2026-08-03", { status: "회의", note: "월간 일정 검토", kind: "event" }],
  ["2026-08-08", { status: "가족", note: "가족 일정", kind: "event" }],
  ["2026-08-12", { status: "메모", note: "준비물 확인", kind: "memo" }],
  ["2026-08-21", { status: "루틴", note: "운동 기록", kind: "event" }]
]);

const elements = {
  calendarHeading: document.querySelector("#calendarHeading"),
  calendarGrid: document.querySelector("#calendarGrid"),
  detailToggle: document.querySelector("#detailToggle"),
  detailContent: document.querySelector("#detailContent"),
  detailSummaryTitle: document.querySelector("#detailSummaryTitle"),
  detailSummaryMeta: document.querySelector("#detailSummaryMeta"),
  detailStatus: document.querySelector("#detailStatus"),
  detailStatusSwatch: document.querySelector("#detailStatusSwatch"),
  detailMemo: document.querySelector("#detailMemo"),
  daysInMonthValue: document.querySelector("#daysInMonthValue"),
  markedDaysValue: document.querySelector("#markedDaysValue"),
  todayButton: document.querySelector("#todayButton"),
  toast: document.querySelector("#toast")
};

function localISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function createLocalDate(year, month, day) {
  return new Date(year, month, day, 12, 0, 0, 0);
}

function sameDay(a, b) {
  return localISO(a) === localISO(b);
}

function formatMonth(date) {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long" }).format(date);
}

function formatDetailDate(date) {
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "long" }).format(date);
}

function getMonthGrid(year, month) {
  const first = createLocalDate(year, month, 1);
  const start = createLocalDate(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => createLocalDate(start.getFullYear(), start.getMonth(), start.getDate() + index));
}

function renderCalendar() {
  const year = state.viewDate.getFullYear();
  const month = state.viewDate.getMonth();
  const monthLabel = formatMonth(state.viewDate);
  elements.calendarHeading.textContent = monthLabel;
  elements.todayButton.setAttribute("aria-label", `${monthLabel}, 오늘로 이동`);
  elements.daysInMonthValue.textContent = `${new Date(year, month + 1, 0).getDate()}일`;
  const markedDays = [...demoEntries.keys()].filter(iso => iso.startsWith(`${year}-${String(month + 1).padStart(2, "0")}-`)).length;
  elements.markedDaysValue.textContent = `${markedDays}일`;
  elements.calendarGrid.replaceChildren();

  const today = new Date();
  const fragment = document.createDocumentFragment();
  for (const date of getMonthGrid(year, month)) {
    const iso = localISO(date);
    const holidayName = holidays.get(iso);
    const entry = demoEntries.get(iso);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "day-cell";
    button.dataset.date = iso;
    button.setAttribute("role", "gridcell");
    button.setAttribute("aria-label", `${formatDetailDate(date)}${holidayName ? `, ${holidayName}` : ""}${entry ? `, ${entry.status}` : ""}`);
    button.setAttribute("aria-selected", sameDay(date, state.selectedDate) ? "true" : "false");

    if (date.getMonth() !== month) button.classList.add("outside");
    if (sameDay(date, today)) button.classList.add("today");
    if (sameDay(date, state.selectedDate)) button.classList.add("selected");

    const number = document.createElement("span");
    number.className = "day-number";
    number.textContent = String(date.getDate());
    button.append(number);

    const status = document.createElement("span");
    status.className = "cell-status";
    if (holidayName) {
      status.classList.add("holiday");
      status.textContent = "휴";
    } else if (entry) {
      status.classList.add("has-event");
      status.textContent = entry.status.slice(0, 2);
    } else {
      status.textContent = "";
    }
    button.append(status);

    if (holidayName) {
      const holiday = document.createElement("span");
      holiday.className = "holiday-label";
      holiday.textContent = holidayName;
      button.append(holiday);
    } else if (entry) {
      const note = document.createElement("span");
      note.className = "cell-note";
      note.textContent = entry.note;
      button.append(note);
      if (entry.kind === "memo") {
        const dot = document.createElement("span");
        dot.className = "memo-dot";
        button.append(dot);
      }
    }
    fragment.append(button);
  }
  elements.calendarGrid.append(fragment);
  renderDetail();
}

function renderDetail() {
  const selectedISO = localISO(state.selectedDate);
  const entry = demoEntries.get(selectedISO);
  const holidayName = holidays.get(selectedISO);
  const isToday = sameDay(state.selectedDate, new Date());

  elements.detailSummaryTitle.textContent = isToday
    ? "오늘 일정 및 메모 상세보기"
    : `${formatDetailDate(state.selectedDate)} 일정 및 메모 상세보기`;
  elements.detailSummaryMeta.textContent = holidayName || entry?.note || "선택한 날짜의 상세 내용을 확인합니다";
  elements.detailStatus.textContent = holidayName || entry?.status || "일정 없음";
  elements.detailMemo.textContent = entry?.note || (holidayName ? `${holidayName} 공휴일입니다.` : "이 날짜에 저장된 일정과 메모가 없습니다.");
  elements.detailStatusSwatch.style.background = holidayName ? "#d54843" : entry ? "#3768c5" : "#b4bec5";
}

function changeMonth(delta) {
  state.viewDate = createLocalDate(state.viewDate.getFullYear(), state.viewDate.getMonth() + delta, 1);
  state.selectedDate = createLocalDate(state.viewDate.getFullYear(), state.viewDate.getMonth(), 1);
  renderCalendar();
}

function goToday() {
  const now = new Date();
  state.viewDate = createLocalDate(now.getFullYear(), now.getMonth(), 1);
  state.selectedDate = createLocalDate(now.getFullYear(), now.getMonth(), now.getDate());
  renderCalendar();
}

function setView(target) {
  state.activeView = target;
  document.querySelectorAll(".view").forEach(view => {
    const active = view.dataset.view === target;
    view.hidden = !active;
    view.classList.toggle("active", active);
  });
  document.querySelectorAll(".nav-item").forEach(button => {
    const active = button.dataset.target === target;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

let toastTimer;
function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 1800);
}

document.querySelector("#prevMonthButton").addEventListener("click", () => changeMonth(-1));
document.querySelector("#nextMonthButton").addEventListener("click", () => changeMonth(1));
document.querySelector("#todayButton").addEventListener("click", goToday);
document.querySelector("#quickActionButton").addEventListener("click", () => setView("settings"));
document.querySelector("#templateCtaButton").addEventListener("click", () => {
  setView("settings");
  showToast("2단계에서 템플릿 설정 화면이 연결됩니다.");
});

elements.calendarGrid.addEventListener("click", event => {
  const cell = event.target.closest(".day-cell");
  if (!cell) return;
  const [year, month, day] = cell.dataset.date.split("-").map(Number);
  state.selectedDate = createLocalDate(year, month - 1, day);
  if (state.selectedDate.getMonth() !== state.viewDate.getMonth() || state.selectedDate.getFullYear() !== state.viewDate.getFullYear()) {
    state.viewDate = createLocalDate(year, month - 1, 1);
  }
  renderCalendar();
});

elements.detailToggle.addEventListener("click", () => {
  state.detailOpen = !state.detailOpen;
  elements.detailToggle.setAttribute("aria-expanded", String(state.detailOpen));
  elements.detailContent.hidden = !state.detailOpen;
});

document.querySelector("#bottomNav").addEventListener("click", event => {
  const button = event.target.closest(".nav-item");
  if (!button) return;
  setView(button.dataset.target);
});

renderCalendar();
