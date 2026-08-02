const STORAGE_KEY = "custom-calendar-v1.0.0";
const LEGACY_STORAGE_KEYS = ["custom-calendar-stage10-v1", "custom-calendar-stage8-v1", "custom-calendar-stage7-v1", "custom-calendar-stage6-v1", "custom-calendar-stage5-v1", "custom-calendar-stage4-v1", "custom-calendar-stage3-v1", "custom-calendar-stage2-v1"];
const MAX_STATUSES = 12;
const MAX_FIELDS = 12;
const MAX_CALCULATIONS = 20;
const FIELD_TYPES = new Set(["text","number","currency","checkbox","select","time","date"]);

const TEMPLATE_VERSION = 1;
function field(id, name, type, extra = {}) {
  return { id, name, type, options: [], unit: "", required: false, defaultValue: type === "checkbox" ? false : "", min: null, max: null, ...extra };
}
function operand(type, sourceId = "", constant = 0) { return { type, sourceId, constant }; }
function calculation(id, name, scope, operator, left, right, suffix = "", showOnHome = false, decimals = 0) {
  return { id, name, scope, operator, left, right, multiply: 1, add: 0, decimals, suffix, showOnHome };
}
function templateLayout(overrides = {}) {
  return {
    calendarTitle: "나의 달력",
    quickActionTarget: "templates",
    navOrder: ["calendar", "summary", "settings"],
    navLabels: { calendar: "달력", summary: "요약", settings: "설정" },
    terms: { status: "날짜 상태", memo: "일정 및 메모", fields: "기록 항목", calculations: "계산 결과" },
    cellItems: [
      { id: "status", visible: true },
      { id: "memo", visible: true },
      { id: "field", visible: false },
      { id: "calculation", visible: false }
    ],
    cellFieldId: "",
    cellCalculationId: "",
    detailItems: [
      { id: "status", visible: true },
      { id: "memo", visible: true },
      { id: "fields", visible: true },
      { id: "calculations", visible: true }
    ],
    summaryItems: [
      { id: "daysInMonth", visible: true },
      { id: "savedDays", visible: true },
      { id: "statusDays", visible: true },
      { id: "memoDays", visible: true },
      { id: "filledFields", visible: true },
      { id: "fieldCount", visible: true }
    ],
    ...overrides
  };
}
const TEMPLATES = [
  {
    id: "general", version: TEMPLATE_VERSION, category: "general",
    name: "일반 달력", description: "일정, 중요 표시, 완료 여부와 장소를 기록하는 기본 달력",
    statuses: [
      { id: "schedule", name: "일정", shortName: "일정", color: "#365f73" },
      { id: "important", name: "중요", shortName: "중요", color: "#b75d54" },
      { id: "complete", name: "완료", shortName: "완료", color: "#62866e" }
    ],
    fields: [field("place","장소","text"), field("startTime","시작 시간","time"), field("complete","완료","checkbox")],
    pattern: { enabled:false, name:"일반 달력", sequence:[] },
    calculations: [],
    theme: { background:"#f5f6f8", surface:"#ffffff", accent:"#365f73", text:"#1d2228", radius:"balanced", density:"comfortable" },
    layout: templateLayout({ calendarTitle:"나의 달력", terms:{status:"일정 종류",memo:"일정 및 메모",fields:"일정 정보",calculations:"계산 결과"}, cellFieldId:"startTime" })
  },
  {
    id:"fourTeamTwoShift", version:TEMPLATE_VERSION, category:"shift",
    name:"4조 2교대근무", description:"주간 2일·야간 2일·휴무 4일의 8일 반복",
    statuses:[
      {id:"day",name:"주간",shortName:"주",color:"#d8e4f3"},
      {id:"night",name:"야간",shortName:"야",color:"#38435f"},
      {id:"off",name:"휴무",shortName:"휴",color:"#dceadf"},
      {id:"leave",name:"연차",shortName:"연",color:"#f4dfc7"}
    ],
    fields:[field("overtime","연장 시간","number",{unit:"시간",min:0,max:24}),field("workMemo","업무 메모","text")],
    pattern:{enabled:true,name:"주주야야휴휴휴휴",sequence:["day","day","night","night","off","off","off","off"]},
    calculations:[
      calculation("monthOvertime","이번 달 연장","month","add",operand("field","overtime"),operand("constant","",0),"시간",true,1),
      calculation("nightCount","이번 달 야간","month","add",operand("statusCount","night"),operand("constant","",0),"회",false,0)
    ],
    theme:{background:"#eef2f5",surface:"#ffffff",accent:"#405f7b",text:"#19242d",radius:"balanced",density:"compact"},
    layout:templateLayout({calendarTitle:"교대근무 달력",terms:{status:"근무 형태",memo:"근무 메모",fields:"근무 입력",calculations:"근무 집계"},cellItems:[{id:"status",visible:true},{id:"memo",visible:false},{id:"field",visible:false},{id:"calculation",visible:false}],cellFieldId:"overtime"})
  },
  {
    id:"fourTeamThreeShift", version:TEMPLATE_VERSION, category:"shift",
    name:"4조 3교대근무", description:"주간·오후·야간·휴무를 반복하는 3교대 예시",
    statuses:[
      {id:"day",name:"주간",shortName:"주",color:"#dbe8f4"},
      {id:"evening",name:"오후",shortName:"오",color:"#f1dfad"},
      {id:"night",name:"야간",shortName:"야",color:"#3b4563"},
      {id:"off",name:"휴무",shortName:"휴",color:"#dceadf"}
    ],
    fields:[field("overtime","연장 시간","number",{unit:"시간",min:0,max:24}),field("handover","인수인계","text")],
    pattern:{enabled:true,name:"주오야휴휴",sequence:["day","evening","night","off","off"]},
    calculations:[calculation("nightCount","이번 달 야간","month","add",operand("statusCount","night"),operand("constant","",0),"회",true)],
    theme:{background:"#f1f4f7",surface:"#ffffff",accent:"#526985",text:"#1d2530",radius:"balanced",density:"compact"},
    layout:templateLayout({calendarTitle:"3교대 달력",terms:{status:"근무 형태",memo:"인수인계 메모",fields:"근무 입력",calculations:"근무 집계"}})
  },
  {
    id:"sixOnTwoOff", version:TEMPLATE_VERSION, category:"shift",
    name:"6근 2휴", description:"주간 6일·휴무 2일·오후 6일·휴무 2일·야간 6일·휴무 2일의 24일 반복",
    statuses:[
      {id:"day",name:"주간",shortName:"주",color:"#d8e4f3"},
      {id:"evening",name:"오후",shortName:"오",color:"#f1dfad"},
      {id:"night",name:"야간",shortName:"야",color:"#38435f"},
      {id:"off",name:"휴무",shortName:"휴",color:"#dceadf"},
      {id:"leave",name:"연차",shortName:"연",color:"#f4dfc7"}
    ],
    fields:[field("overtime","연장 시간","number",{unit:"시간",min:0,max:24}),field("workMemo","업무 기록","text")],
    pattern:{enabled:true,name:"주6휴2·오6휴2·야6휴2",sequence:[
      "day","day","day","day","day","day","off","off",
      "evening","evening","evening","evening","evening","evening","off","off",
      "night","night","night","night","night","night","off","off"
    ]},
    calculations:[calculation("monthOvertime","이번 달 연장","month","add",operand("field","overtime"),operand("constant","",0),"시간",true,1)],
    theme:{background:"#eef3f3",surface:"#ffffff",accent:"#426d6d",text:"#1d2929",radius:"balanced",density:"compact"},
    layout:templateLayout({calendarTitle:"6근 2휴 달력",terms:{status:"근무 형태",memo:"업무 기록",fields:"기록 항목",calculations:"월간 집계"},cellFieldId:"overtime"})
  },
  {
    id:"workLog", version:TEMPLATE_VERSION, category:"work",
    name:"업무 기록 달력", description:"현장·사무·외근 상태와 작업시간, 완료율을 기록",
    statuses:[
      {id:"office",name:"사무",shortName:"사무",color:"#6683a8"},
      {id:"site",name:"현장",shortName:"현장",color:"#9a7653"},
      {id:"outside",name:"외근",shortName:"외근",color:"#658b72"},
      {id:"off",name:"휴무",shortName:"휴",color:"#d6dfda"}
    ],
    fields:[field("project","프로젝트","select",{options:["A 프로젝트","B 프로젝트","기타"]}),field("hours","작업 시간","number",{unit:"시간",min:0,max:24}),field("progress","완료율","number",{unit:"%",min:0,max:100})],
    pattern:{enabled:false,name:"업무 기록",sequence:[]},
    calculations:[calculation("monthHours","이번 달 작업시간","month","add",operand("field","hours"),operand("constant","",0),"시간",true,1)],
    theme:{background:"#f4f2ee",surface:"#fffdfa",accent:"#766247",text:"#2a251f",radius:"balanced",density:"comfortable"},
    layout:templateLayout({calendarTitle:"업무 달력",terms:{status:"업무 유형",memo:"업무 메모",fields:"업무 입력",calculations:"업무 집계"},cellFieldId:"project"})
  },
  {
    id:"routine", version:TEMPLATE_VERSION, category:"life",
    name:"루틴 달력", description:"운동·공부·휴식 루틴과 실행 시간을 관리",
    statuses:[
      {id:"exercise",name:"운동",shortName:"운동",color:"#6f8f7a"},
      {id:"study",name:"공부",shortName:"공부",color:"#647ba6"},
      {id:"rest",name:"휴식",shortName:"휴식",color:"#b58a63"}
    ],
    fields:[field("minutes","실행 시간","number",{unit:"분",min:0,max:1440}),field("done","완료","checkbox")],
    pattern:{enabled:true,name:"운동·공부·휴식",sequence:["exercise","study","exercise","study","exercise","rest","rest"]},
    calculations:[calculation("monthMinutes","이번 달 실행 시간","month","add",operand("field","minutes"),operand("constant","",0),"분",true)],
    theme:{background:"#f3f2ec",surface:"#fffef8",accent:"#6f8063",text:"#252820",radius:"round",density:"comfortable"},
    layout:templateLayout({calendarTitle:"루틴 달력",terms:{status:"오늘의 루틴",memo:"루틴 메모",fields:"실행 기록",calculations:"루틴 집계"},cellFieldId:"minutes"})
  },
  {
    id:"freelancer", version:TEMPLATE_VERSION, category:"work",
    name:"프리랜서 달력", description:"업무 유형, 작업시간, 시간당 금액과 예상 수입 관리",
    statuses:[
      {id:"work",name:"작업",shortName:"작업",color:"#365f73"},
      {id:"meeting",name:"미팅",shortName:"미팅",color:"#7762a8"},
      {id:"off",name:"휴식",shortName:"휴식",color:"#7f9a84"}
    ],
    fields:[field("hours","작업 시간","number",{unit:"시간",min:0,max:24}),field("hourlyRate","시간당 금액","currency",{unit:"원",min:0}),field("client","의뢰인","text")],
    pattern:{enabled:false,name:"프리랜서",sequence:[]},
    calculations:[
      calculation("dayIncome","오늘 예상 수입","date","multiply",operand("field","hours"),operand("field","hourlyRate"),"원",true),
      calculation("monthHours","이번 달 작업 시간","month","add",operand("field","hours"),operand("constant","",0),"시간",false,1)
    ],
    theme:{background:"#f4f1f7",surface:"#ffffff",accent:"#705b8d",text:"#211d27",radius:"balanced",density:"comfortable"},
    layout:templateLayout({calendarTitle:"프리랜서 달력",terms:{status:"업무 유형",memo:"업무 메모",fields:"정산 입력",calculations:"수입 계산"},cellFieldId:"client",cellCalculationId:"dayIncome",cellItems:[{id:"status",visible:true},{id:"memo",visible:false},{id:"field",visible:true},{id:"calculation",visible:true}]})
  },
  {
    id:"rider", version:TEMPLATE_VERSION, category:"work",
    name:"라이더 달력", description:"운행 상태, 운행시간, 건수, 매출과 비용을 기록",
    statuses:[
      {id:"delivery",name:"배달",shortName:"배달",color:"#d9784a"},
      {id:"rain",name:"우천 운행",shortName:"우천",color:"#527a9c"},
      {id:"off",name:"휴무",shortName:"휴",color:"#78917c"}
    ],
    fields:[field("hours","운행 시간","number",{unit:"시간",min:0,max:24}),field("orders","완료 건수","number",{unit:"건",min:0}),field("sales","매출","currency",{unit:"원",min:0}),field("expense","비용","currency",{unit:"원",min:0})],
    pattern:{enabled:false,name:"라이더",sequence:[]},
    calculations:[
      calculation("netIncome","순수익","date","subtract",operand("field","sales"),operand("field","expense"),"원",true),
      calculation("monthOrders","이번 달 완료 건수","month","add",operand("field","orders"),operand("constant","",0),"건",false)
    ],
    theme:{background:"#f7f2ec",surface:"#fffdf9",accent:"#c3663d",text:"#2d231e",radius:"round",density:"comfortable"},
    layout:templateLayout({calendarTitle:"라이더 달력",terms:{status:"운행 상태",memo:"운행 메모",fields:"운행 입력",calculations:"정산 결과"},cellFieldId:"orders",cellCalculationId:"netIncome",cellItems:[{id:"status",visible:true},{id:"memo",visible:false},{id:"field",visible:true},{id:"calculation",visible:true}]})
  },
  {
    id:"family", version:TEMPLATE_VERSION, category:"life",
    name:"가족 달력", description:"가족 구성원별 일정, 장소와 준비물을 한 달에 모아보기",
    statuses:[
      {id:"family",name:"가족 일정",shortName:"가족",color:"#b77855"},
      {id:"child",name:"아이 일정",shortName:"아이",color:"#ce8794"},
      {id:"couple",name:"부부 일정",shortName:"부부",color:"#8171a4"},
      {id:"school",name:"학교",shortName:"학교",color:"#6286a6"}
    ],
    fields:[field("person","대상","select",{options:["가족 전체","부모","아이"]}),field("place","장소","text"),field("ready","준비 완료","checkbox")],
    pattern:{enabled:false,name:"가족 달력",sequence:[]},
    calculations:[],
    theme:{background:"#f8f2f1",surface:"#ffffff",accent:"#a86466",text:"#2d2324",radius:"round",density:"comfortable"},
    layout:templateLayout({calendarTitle:"우리 가족 달력",terms:{status:"일정 종류",memo:"가족 메모",fields:"일정 정보",calculations:"집계"},cellFieldId:"person"})
  },
  {
    id:"nurse", version:TEMPLATE_VERSION, category:"shift",
    name:"간호사 달력", description:"반복 패턴 없이 날짜마다 Day·Evening·Night·Off를 직접 지정",
    statuses:[
      {id:"day",name:"Day",shortName:"D",color:"#dbe8f4"},
      {id:"evening",name:"Evening",shortName:"E",color:"#f1dfad"},
      {id:"night",name:"Night",shortName:"N",color:"#3b4563"},
      {id:"off",name:"Off",shortName:"O",color:"#dceadf"},
      {id:"leave",name:"연차",shortName:"연",color:"#f4dfc7"}
    ],
    fields:[field("ward","근무 병동","text"),field("overtime","연장 시간","number",{unit:"시간",min:0,max:24}),field("handover","인계 메모","text")],
    pattern:{enabled:false,name:"직접 근무표",sequence:[]},
    calculations:[
      calculation("nightCount","이번 달 Night","month","add",operand("statusCount","night"),operand("constant","",0),"회",true),
      calculation("monthOvertime","이번 달 연장","month","add",operand("field","overtime"),operand("constant","",0),"시간",false,1)
    ],
    theme:{background:"#eef4f6",surface:"#ffffff",accent:"#4e7684",text:"#1d292e",radius:"balanced",density:"compact"},
    layout:templateLayout({calendarTitle:"간호사 근무표",terms:{status:"근무 코드",memo:"인계 메모",fields:"근무 정보",calculations:"근무 집계"},cellFieldId:"ward"})
  },
  {
    id:"direct", version:TEMPLATE_VERSION, category:"general",
    name:"직접 구성", description:"최소 상태와 빈 기록 항목·패턴·계산 결과으로 처음부터 구성",
    statuses:[
      {id:"typeA",name:"상태 A",shortName:"A",color:"#6683a8"},
      {id:"typeB",name:"상태 B",shortName:"B",color:"#78917c"}
    ],
    fields:[],
    pattern:{enabled:false,name:"직접 구성",sequence:[]},
    calculations:[],
    theme:{background:"#f5f6f8",surface:"#ffffff",accent:"#365f73",text:"#1d2228",radius:"balanced",density:"comfortable"},
    layout:templateLayout({calendarTitle:"나의 달력"})
  }
];

const THEME_PRESETS = [
  { id: "calm", name: "Calm Blue", background: "#f5f6f8", surface: "#ffffff", accent: "#365f73", text: "#1d2228", radius: "balanced", density: "comfortable" },
  { id: "forest", name: "Soft Forest", background: "#f1f4ef", surface: "#fffef9", accent: "#58705b", text: "#202821", radius: "round", density: "comfortable" },
  { id: "lavender", name: "Lavender", background: "#f4f1f7", surface: "#ffffff", accent: "#705b8d", text: "#211d27", radius: "round", density: "comfortable" },
  { id: "mono", name: "Mono", background: "#f2f2f2", surface: "#ffffff", accent: "#343434", text: "#171717", radius: "compact", density: "compact" },
  { id: "sand", name: "Warm Sand", background: "#f5f1e8", surface: "#fffdf8", accent: "#8a6844", text: "#2b251e", radius: "balanced", density: "spacious" },
  { id: "night", name: "Deep Night", background: "#171b21", surface: "#222832", accent: "#7f9cc5", text: "#f1f4f8", radius: "balanced", density: "comfortable" }
];

const NAV_LABELS = { calendar: "달력", summary: "요약", settings: "설정" };
const TEMPLATE_CATEGORY_LABELS = { general:"일반", shift:"교대근무", work:"업무·수입", life:"생활·가족", custom:"내 템플릿" };
const CELL_ITEM_CATALOG = {
  status: { label: "날짜 상태", description: "상태 약칭 또는 반복 패턴 상태" },
  memo: { label: "메모", description: "메모 첫 줄" },
  field: { label: "기록 항목", description: "선택한 기록 항목 값" },
  calculation: { label: "계산 결과", description: "선택한 날짜 계산 결과 결과" }
};
const DETAIL_ITEM_CATALOG = {
  status: { label: "날짜 상태" },
  memo: { label: "일정 및 메모" },
  fields: { label: "기록 항목" },
  calculations: { label: "계산 결과" }
};
const SUMMARY_ITEM_CATALOG = {
  daysInMonth: { label: "이번 달 날짜" },
  savedDays: { label: "저장한 날짜" },
  statusDays: { label: "상태가 있는 날" },
  memoDays: { label: "메모가 있는 날" },
  filledFields: { label: "입력된 사용자 값" },
  fieldCount: { label: "기록 항목" }
};
const QUICK_ACTION_PANEL = {
  templates: "templateSettingsPanel",
  pattern: "patternSettingsPanel",
  calculations: "calculationSettingsPanel",
  statuses: "statusSettingsPanel",
  fields: "fieldSettingsPanel",
  theme: "themeSettingsPanel"
};

function createDefaultState() {
  const now = new Date();
  return {
    schemaVersion: 7,
    viewDate: localISO(createLocalDate(now.getFullYear(), now.getMonth(), 1)),
    selectedDate: localISO(now),
    activeView: "calendar",
    detailOpen: false,
    statuses: [
      { id: "work", name: "업무", shortName: "업무", color: "#365f73" },
      { id: "off", name: "휴식", shortName: "휴식", color: "#6f8f7a" },
      { id: "family", name: "가족", shortName: "가족", color: "#b77855" },
      { id: "routine", name: "루틴", shortName: "루틴", color: "#7762a8" }
    ],
    fields: [
      { id: "hours", name: "시간", type: "number", options: [], unit: "시간", required: false, defaultValue: "", min: 0, max: 24 },
      { id: "place", name: "장소", type: "text", options: [], unit: "", required: false, defaultValue: "", min: null, max: null },
      { id: "complete", name: "완료", type: "checkbox", options: [], unit: "", required: false, defaultValue: false, min: null, max: null }
    ],
    pattern: {
      enabled: false,
      name: "기본 패턴",
      anchorDate: localISO(now),
      sequence: []
    },
    calculations: [],
    customTemplates: [],
    theme: {
      background: "#f5f6f8",
      surface: "#ffffff",
      accent: "#365f73",
      text: "#1d2228",
      radius: "balanced",
      density: "comfortable"
    },
    layout: {
      calendarTitle: "나의 달력",
      quickActionTarget: "statuses",
      navOrder: ["calendar", "summary", "settings"],
      navLabels: { calendar: "달력", summary: "요약", settings: "설정" },
      terms: { status: "날짜 상태", memo: "일정 및 메모", fields: "기록 항목", calculations: "계산 결과" },
      cellItems: [
        { id: "status", visible: true },
        { id: "memo", visible: true },
        { id: "field", visible: false },
        { id: "calculation", visible: false }
      ],
      cellFieldId: "hours",
      cellCalculationId: "",
      detailItems: [
        { id: "status", visible: true },
        { id: "memo", visible: true },
        { id: "fields", visible: true },
        { id: "calculations", visible: true }
      ],
      summaryItems: [
        { id: "daysInMonth", visible: true },
        { id: "savedDays", visible: true },
        { id: "statusDays", visible: true },
        { id: "memoDays", visible: true },
        { id: "filledFields", visible: true },
        { id: "fieldCount", visible: true }
      ]
    },
    entries: {}
  };
}

function localISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function createLocalDate(year, month, day) { return new Date(year, month, day, 12, 0, 0, 0); }
function parseISO(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  if (!match) return new Date();
  return createLocalDate(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}
function sameDay(a, b) { return localISO(a) === localISO(b); }
function withSubjectParticle(value) {
  const text = String(value || "");
  if (!text) return "";
  const code = text.charCodeAt(text.length - 1);
  const hasBatchim = code >= 0xAC00 && code <= 0xD7A3 && ((code - 0xAC00) % 28 !== 0);
  return `${text}${hasBatchim ? "이" : "가"}`;
}
function safeId(value, fallback) {
  const cleaned = String(value || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40);
  return cleaned || fallback;
}
function safeColor(value, fallback = "#365f73") {
  return /^#[0-9A-Fa-f]{6}$/.test(String(value)) ? value : fallback;
}
function sanitizeField(item, index) {
  const type = FIELD_TYPES.has(item?.type) ? item.type : "text";
  const options = type === "select"
    ? [...new Set(String(item?.options || "").split(",").map(v => v.trim()).filter(Boolean))].slice(0, 30)
    : [];
  let min = Number.isFinite(Number(item?.min)) ? Number(item.min) : null;
  let max = Number.isFinite(Number(item?.max)) ? Number(item.max) : null;
  if (min !== null && max !== null && min > max) [min, max] = [max, min];
  return {
    id: safeId(item?.id, `field${index + 1}`),
    name: String(item?.name || `항목 ${index + 1}`).slice(0, 20),
    type,
    options,
    unit: String(item?.unit || "").slice(0, 10),
    required: item?.required === true,
    defaultValue: sanitizeFieldValue({ type, options, min, max }, item?.defaultValue),
    min,
    max
  };
}
function sanitizeFieldValue(field, value) {
  if (field.type === "checkbox") return value === true;
  if (field.type === "number" || field.type === "currency") {
    if (value === "" || value === null || value === undefined) return "";
    const n = Number(value);
    if (!Number.isFinite(n)) return "";
    return Math.min(field.max ?? n, Math.max(field.min ?? n, n));
  }
  if (field.type === "select") return field.options.includes(String(value)) ? String(value) : "";
  if (field.type === "time") return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value)) ? String(value) : "";
  if (field.type === "date") return /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? String(value) : "";
  return String(value ?? "").slice(0, 200);
}
function isNumericField(field) {
  return field?.type === "number" || field?.type === "currency";
}
function sanitizeOperand(raw = {}) {
  return {
    type: ["field", "statusCount", "constant"].includes(raw.type) ? raw.type : "constant",
    sourceId: safeId(raw.sourceId, ""),
    constant: Number.isFinite(Number(raw.constant)) ? Number(raw.constant) : 0
  };
}
function sanitizeCalculation(item, index) {
  const legacyLeft = {
    type: ["field","statusCount","constant"].includes(item?.sourceType) ? item.sourceType : "constant",
    sourceId: safeId(item?.sourceId, ""),
    constant: Number.isFinite(Number(item?.constant)) ? Number(item.constant) : 0
  };
  const left = sanitizeOperand(item?.left || legacyLeft);
  const right = sanitizeOperand(item?.right || { type: "constant", constant: 0 });
  return {
    id: safeId(item?.id, `calc${index + 1}`),
    name: String(item?.name || `계산 ${index + 1}`).slice(0, 30),
    scope: item?.scope === "month" ? "month" : "date",
    operator: ["add","subtract","multiply","divide","min","max"].includes(item?.operator) ? item.operator : "add",
    left,
    right,
    multiply: Number.isFinite(Number(item?.multiply)) ? Number(item.multiply) : 1,
    add: Number.isFinite(Number(item?.add)) ? Number(item.add) : 0,
    decimals: [0,1,2].includes(Number(item?.decimals)) ? Number(item.decimals) : 0,
    suffix: String(item?.suffix || "").slice(0, 10),
    showOnHome: item?.showOnHome === true
  };
}
function operandReferenceExists(operand, statuses, fields) {
  if (operand.type === "constant") return true;
  if (operand.type === "statusCount") return statuses.some(item => item.id === operand.sourceId);
  return fields.some(item => item.id === operand.sourceId && isNumericField(item));
}
function calculationReferencesExist(calculation, statuses, fields) {
  return operandReferenceExists(calculation.left, statuses, fields)
    && operandReferenceExists(calculation.right, statuses, fields);
}

function sanitizeState(raw) {
  const fallback = createDefaultState();
  if (!raw || typeof raw !== "object") return fallback;
  const statuses = Array.isArray(raw.statuses) ? raw.statuses.slice(0, MAX_STATUSES).map((item, index) => ({
    id: safeId(item?.id, `status${index + 1}`),
    name: String(item?.name || `상태 ${index + 1}`).slice(0, 20),
    shortName: String(item?.shortName || item?.name || `상태${index + 1}`).slice(0, 4),
    color: safeColor(item?.color)
  })) : fallback.statuses;
  const uniqueStatuses = [];
  const statusIds = new Set();
  for (const status of statuses) {
    if (!statusIds.has(status.id)) { statusIds.add(status.id); uniqueStatuses.push(status); }
  }

  const fields = Array.isArray(raw.fields)
    ? raw.fields.slice(0, MAX_FIELDS).map(sanitizeField)
    : fallback.fields.map((item, index) => sanitizeField(item, index));
  const uniqueFields = [];
  const fieldIds = new Set();
  for (const field of fields) {
    if (!fieldIds.has(field.id)) { fieldIds.add(field.id); uniqueFields.push(field); }
  }

  const entries = {};
  if (raw.entries && typeof raw.entries === "object" && !Array.isArray(raw.entries)) {
    for (const [dateKey, value] of Object.entries(raw.entries)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !value || typeof value !== "object") continue;
      const fieldValues = {};
      if (value.fields && typeof value.fields === "object") {
        for (const field of uniqueFields) {
          const fieldValue = value.fields[field.id];
          fieldValues[field.id] = sanitizeFieldValue(field, fieldValue);
        }
      }
      entries[dateKey] = {
        statusId: statusIds.has(value.statusId) ? value.statusId : "",
        memo: String(value.memo ?? "").slice(0, 300),
        fields: fieldValues
      };
    }
  }

  const rawPattern = raw.pattern && typeof raw.pattern === "object" ? raw.pattern : fallback.pattern;
  const pattern = {
    enabled: rawPattern.enabled === true,
    name: String(rawPattern.name || "기본 패턴").slice(0, 30),
    anchorDate: /^\d{4}-\d{2}-\d{2}$/.test(rawPattern.anchorDate) ? rawPattern.anchorDate : fallback.pattern.anchorDate,
    sequence: Array.isArray(rawPattern.sequence)
      ? rawPattern.sequence.filter(id => statusIds.has(id)).slice(0, 31)
      : []
  };

  const calculations = Array.isArray(raw.calculations)
    ? raw.calculations.slice(0, MAX_CALCULATIONS).map((item, index) => sanitizeCalculation(item, index)).filter(item => calculationReferencesExist(item, uniqueStatuses, uniqueFields))
    : [];

  const rawTheme = raw.theme && typeof raw.theme === "object" ? raw.theme : fallback.theme;
  const theme = {
    background: safeColor(rawTheme.background || fallback.theme.background),
    surface: safeColor(rawTheme.surface || fallback.theme.surface),
    accent: safeColor(rawTheme.accent || fallback.theme.accent),
    text: safeColor(rawTheme.text || fallback.theme.text),
    radius: ["compact", "balanced", "round"].includes(rawTheme.radius) ? rawTheme.radius : "balanced",
    density: ["compact", "comfortable", "spacious"].includes(rawTheme.density) ? rawTheme.density : "comfortable"
  };
  const rawLayout = raw.layout && typeof raw.layout === "object" ? raw.layout : fallback.layout;
  const navOrder = Array.isArray(rawLayout.navOrder)
    ? [...new Set(rawLayout.navOrder.filter(id => Object.hasOwn(NAV_LABELS, id)))]
    : [...fallback.layout.navOrder];
  for (const id of fallback.layout.navOrder) if (!navOrder.includes(id)) navOrder.push(id);
  const sanitizeOrderedItems = (rawItems, fallbackItems, catalog, minimumVisible = 0) => {
    const seen = new Set();
    const items = [];
    if (Array.isArray(rawItems)) {
      for (const item of rawItems) {
        if (!item || !Object.hasOwn(catalog, item.id) || seen.has(item.id)) continue;
        seen.add(item.id);
        items.push({ id: item.id, visible: item.visible !== false });
      }
    }
    for (const fallbackItem of fallbackItems) {
      if (!seen.has(fallbackItem.id)) items.push({ ...fallbackItem });
    }
    if (items.filter(item => item.visible).length < minimumVisible) {
      for (const item of items) {
        item.visible = true;
        if (items.filter(entry => entry.visible).length >= minimumVisible) break;
      }
    }
    return items;
  };
  const layout = {
    calendarTitle: String(rawLayout.calendarTitle || fallback.layout.calendarTitle).slice(0, 30),
    quickActionTarget: Object.hasOwn(QUICK_ACTION_PANEL, rawLayout.quickActionTarget) ? rawLayout.quickActionTarget : "statuses",
    navOrder: navOrder.slice(0, 3),
    navLabels: Object.fromEntries(Object.keys(NAV_LABELS).map(id => [
      id,
      String(rawLayout.navLabels?.[id] || NAV_LABELS[id]).slice(0, 10)
    ])),
    terms: {
      status: String(rawLayout.terms?.status || fallback.layout.terms.status).slice(0, 16),
      memo: String(rawLayout.terms?.memo || fallback.layout.terms.memo).slice(0, 16),
      fields: String(rawLayout.terms?.fields || fallback.layout.terms.fields).slice(0, 16),
      calculations: String(rawLayout.terms?.calculations || fallback.layout.terms.calculations).slice(0, 16)
    },
    cellItems: sanitizeOrderedItems(rawLayout.cellItems, fallback.layout.cellItems, CELL_ITEM_CATALOG, 0),
    cellFieldId: uniqueFields.some(field => field.id === rawLayout.cellFieldId) ? rawLayout.cellFieldId : (uniqueFields[0]?.id || ""),
    cellCalculationId: calculations.some(calc => calc.id === rawLayout.cellCalculationId && calc.scope === "date") ? rawLayout.cellCalculationId : "",
    detailItems: sanitizeOrderedItems(rawLayout.detailItems, fallback.layout.detailItems, DETAIL_ITEM_CATALOG, 1),
    summaryItems: sanitizeOrderedItems(rawLayout.summaryItems, fallback.layout.summaryItems, SUMMARY_ITEM_CATALOG, 1)
  };
  const customTemplateIds = new Set(TEMPLATES.map(template => template.id));
  const customTemplates = [];
  if (Array.isArray(raw.customTemplates)) {
    raw.customTemplates.slice(0, 20).forEach((template, index) => {
      const sanitized = sanitizeTemplate(template, `custom_${index + 1}`);
      if (customTemplateIds.has(sanitized.id)) {
        sanitized.id = makeUniqueId("template", [...customTemplateIds]);
      }
      customTemplateIds.add(sanitized.id);
      customTemplates.push(sanitized);
    });
  }

  return {
    schemaVersion: 7,
    viewDate: /^\d{4}-\d{2}-\d{2}$/.test(raw.viewDate) ? raw.viewDate : fallback.viewDate,
    selectedDate: /^\d{4}-\d{2}-\d{2}$/.test(raw.selectedDate) ? raw.selectedDate : fallback.selectedDate,
    activeView: ["calendar", "summary", "settings"].includes(raw.activeView) ? raw.activeView : "calendar",
    detailOpen: raw.detailOpen === true,
    statuses: uniqueStatuses,
    fields: uniqueFields,
    pattern,
    calculations,
    customTemplates,
    theme,
    layout,
    entries
  };
}

function sanitizeTemplate(template, fallbackId = "custom") {
  const fallback = createDefaultState();
  const safeTemplate = template && typeof template === "object" ? template : {};
  const statuses = Array.isArray(safeTemplate.statuses)
    ? safeTemplate.statuses.slice(0, MAX_STATUSES).map((item, index) => ({
        id: safeId(item?.id, `status${index + 1}`),
        name: String(item?.name || `상태 ${index + 1}`).slice(0, 20),
        shortName: String(item?.shortName || item?.name || "상태").slice(0, 4),
        color: safeColor(item?.color)
      }))
    : fallback.statuses.map(item => ({ ...item }));
  const statusIds = new Set(statuses.map(item => item.id));
  const fields = Array.isArray(safeTemplate.fields)
    ? safeTemplate.fields.slice(0, MAX_FIELDS).map(sanitizeField)
    : [];
  const numberFieldIds = new Set(fields.filter(isNumericField).map(item => item.id));
  const rawPattern = safeTemplate.pattern && typeof safeTemplate.pattern === "object" ? safeTemplate.pattern : {};
  const pattern = {
    enabled: rawPattern.enabled === true,
    name: String(rawPattern.name || "사용자 패턴").slice(0, 30),
    anchorDate: /^\d{4}-\d{2}-\d{2}$/.test(rawPattern.anchorDate) ? rawPattern.anchorDate : localISO(new Date()),
    sequence: Array.isArray(rawPattern.sequence) ? rawPattern.sequence.filter(id => statusIds.has(id)).slice(0, 31) : []
  };
  const calculations = Array.isArray(safeTemplate.calculations)
    ? safeTemplate.calculations.slice(0, MAX_CALCULATIONS).map((item, index) => sanitizeCalculation(item, index)).filter(item => calculationReferencesExist(item, statuses, fields))
    : [];
  const rawTheme = safeTemplate.theme && typeof safeTemplate.theme === "object" ? safeTemplate.theme : fallback.theme;
  return {
    id: safeId(safeTemplate.id, fallbackId),
    version: Number.isInteger(Number(safeTemplate.version)) ? Math.max(1, Math.min(999, Number(safeTemplate.version))) : 1,
    category: "custom",
    name: String(safeTemplate.name || "사용자 템플릿").slice(0, 30),
    description: String(safeTemplate.description || "사용자가 저장한 구성").slice(0, 80),
    custom: true,
    statuses,
    fields,
    pattern,
    calculations,
    theme: {
      background: safeColor(rawTheme.background || fallback.theme.background),
      surface: safeColor(rawTheme.surface || fallback.theme.surface),
      accent: safeColor(rawTheme.accent || fallback.theme.accent),
      text: safeColor(rawTheme.text || fallback.theme.text),
      radius: ["compact", "balanced", "round"].includes(rawTheme.radius) ? rawTheme.radius : "balanced",
      density: ["compact", "comfortable", "spacious"].includes(rawTheme.density) ? rawTheme.density : "comfortable"
    },
    layout: safeTemplate.layout && typeof safeTemplate.layout === "object"
      ? sanitizeTemplateLayout(safeTemplate.layout)
      : templateLayout()
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return sanitizeState(JSON.parse(saved));
    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      const legacy = localStorage.getItem(legacyKey);
      if (!legacy) continue;
      const migrated = sanitizeState(JSON.parse(legacy));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    return createDefaultState();
  } catch {
    return createDefaultState();
  }
}
let state = loadState();
let draftEntry = null;
let toastTimer = 0;
let modalLastFocus = null;
let patternDraft = [...state.pattern.sequence];
let layoutDraft = structuredClone(state.layout);
let layoutDraftDirty = false;
let previewTemplateId = "";
let dateAutosaveTimer = 0;
let dateSaveState = "saved";
const DATE_AUTOSAVE_DELAY = 550;

const holidays = new Map([
  ["2026-08-15", "광복절"],
  ["2026-08-17", "대체공휴일"]
]);

const elements = {
  calendarHeading: document.querySelector("#calendarHeading"),
  calendarGrid: document.querySelector("#calendarGrid"),
  detailContent: document.querySelector("#detailContent"),
  dateSheetBackdrop: document.querySelector("#dateSheetBackdrop"),
  dateSheet: document.querySelector("#dateSheet"),
  dateSheetTitle: document.querySelector("#dateSheetTitle"),
  dateSaveStatus: document.querySelector("#dateSaveStatus"),
  monthPickerButton: document.querySelector("#monthPickerButton"),
  monthPickerModal: document.querySelector("#monthPickerModal"),
  yearPickerInput: document.querySelector("#yearPickerInput"),
  monthPickerGrid: document.querySelector("#monthPickerGrid"),
  bootError: document.querySelector("#bootError"),
  calendarLoading: document.querySelector("#calendarLoading"),
  detailStatus: document.querySelector("#detailStatus"),
  detailStatusSwatch: document.querySelector("#detailStatusSwatch"),
  statusChoiceGrid: document.querySelector("#statusChoiceGrid"),
  detailMemoInput: document.querySelector("#detailMemoInput"),
  customFieldValues: document.querySelector("#customFieldValues"),
  customFieldEmpty: document.querySelector("#customFieldEmpty"),
  summaryGrid: document.querySelector("#summaryGrid"),
  statusSummaryList: document.querySelector("#statusSummaryList"),
  statusEditorList: document.querySelector("#statusEditorList"),
  fieldEditorList: document.querySelector("#fieldEditorList"),
  templateGrid: document.querySelector("#templateGrid"),
  patternEnabled: document.querySelector("#patternEnabled"),
  patternName: document.querySelector("#patternName"),
  patternAnchorDate: document.querySelector("#patternAnchorDate"),
  patternSequence: document.querySelector("#patternSequence"),
  patternPalette: document.querySelector("#patternPalette"),
  calculationEditorList: document.querySelector("#calculationEditorList"),
  dateCalculationResults: document.querySelector("#dateCalculationResults"),
  dateCalculationEmpty: document.querySelector("#dateCalculationEmpty"),
  monthCalculationResults: document.querySelector("#monthCalculationResults"),
  monthCalculationEmpty: document.querySelector("#monthCalculationEmpty"),
  todayButton: document.querySelector("#todayButton"),
  toast: document.querySelector("#toast"),
  editorModal: document.querySelector("#editorModal"),
  editorModalTitle: document.querySelector("#editorModalTitle"),
  editorForm: document.querySelector("#editorForm"),
  editorKind: document.querySelector("#editorKind"),
  editorId: document.querySelector("#editorId"),
  editorName: document.querySelector("#editorName"),
  editorShortName: document.querySelector("#editorShortName"),
  editorShortNameWrap: document.querySelector("#editorShortNameWrap"),
  editorColor: document.querySelector("#editorColor"),
  editorColorWrap: document.querySelector("#editorColorWrap"),
  editorType: document.querySelector("#editorType"),
  editorTypeWrap: document.querySelector("#editorTypeWrap"),
  editorOptions: document.querySelector("#editorOptions"),
  editorOptionsWrap: document.querySelector("#editorOptionsWrap"),
  editorUnit: document.querySelector("#editorUnit"),
  editorUnitWrap: document.querySelector("#editorUnitWrap"),
  editorMin: document.querySelector("#editorMin"),
  editorMax: document.querySelector("#editorMax"),
  editorNumberRulesWrap: document.querySelector("#editorNumberRulesWrap"),
  editorDefault: document.querySelector("#editorDefault"),
  editorDefaultWrap: document.querySelector("#editorDefaultWrap"),
  editorRequired: document.querySelector("#editorRequired"),
  calculationModal: document.querySelector("#calculationModal"),
  calculationForm: document.querySelector("#calculationForm"),
  calculationId: document.querySelector("#calculationId"),
  calculationName: document.querySelector("#calculationName"),
  calculationScope: document.querySelector("#calculationScope"),
  calculationOperator: document.querySelector("#calculationOperator"),
  calcLeftType: document.querySelector("#calcLeftType"),
  calcLeftSource: document.querySelector("#calcLeftSource"),
  calcLeftSourceWrap: document.querySelector("#calcLeftSourceWrap"),
  calcLeftConstant: document.querySelector("#calcLeftConstant"),
  calcLeftConstantWrap: document.querySelector("#calcLeftConstantWrap"),
  calcRightType: document.querySelector("#calcRightType"),
  calcRightSource: document.querySelector("#calcRightSource"),
  calcRightSourceWrap: document.querySelector("#calcRightSourceWrap"),
  calcRightConstant: document.querySelector("#calcRightConstant"),
  calcRightConstantWrap: document.querySelector("#calcRightConstantWrap"),
  calculationMultiply: document.querySelector("#calculationMultiply"),
  calculationAdd: document.querySelector("#calculationAdd"),
  calculationDecimals: document.querySelector("#calculationDecimals"),
  calculationSuffix: document.querySelector("#calculationSuffix"),
  calculationShowOnHome: document.querySelector("#calculationShowOnHome"),
  calculationPreview: document.querySelector("#calculationPreview"),
  homeCalculationCards: document.querySelector("#homeCalculationCards"),
  homeCalculationEmpty: document.querySelector("#homeCalculationEmpty"),
  themeColorMeta: document.querySelector("#themeColorMeta"),
  themePresetGrid: document.querySelector("#themePresetGrid"),
  themeBackground: document.querySelector("#themeBackground"),
  themeSurface: document.querySelector("#themeSurface"),
  themeAccent: document.querySelector("#themeAccent"),
  themeText: document.querySelector("#themeText"),
  themeRadius: document.querySelector("#themeRadius"),
  themeDensity: document.querySelector("#themeDensity"),
  calendarTitleInput: document.querySelector("#calendarTitleInput"),
  quickActionTarget: document.querySelector("#quickActionTarget"),
  navOrderEditor: document.querySelector("#navOrderEditor"),
  cellItemEditor: document.querySelector("#cellItemEditor"),
  detailItemEditor: document.querySelector("#detailItemEditor"),
  summaryItemEditor: document.querySelector("#summaryItemEditor"),
  cellFieldSelect: document.querySelector("#cellFieldSelect"),
  cellCalculationSelect: document.querySelector("#cellCalculationSelect"),
  termStatus: document.querySelector("#termStatus"),
  termMemo: document.querySelector("#termMemo"),
  termFields: document.querySelector("#termFields"),
  termCalculations: document.querySelector("#termCalculations"),
  templateFileInput: document.querySelector("#templateFileInput"),
  templateSearchInput: document.querySelector("#templateSearchInput"),
  templateCategoryFilter: document.querySelector("#templateCategoryFilter"),
  templatePreviewModal: document.querySelector("#templatePreviewModal"),
  templatePreviewTitle: document.querySelector("#templatePreviewTitle"),
  templatePreviewCategory: document.querySelector("#templatePreviewCategory"),
  templatePreviewDescription: document.querySelector("#templatePreviewDescription"),
  templatePreviewMeta: document.querySelector("#templatePreviewMeta"),
  templatePreviewStatuses: document.querySelector("#templatePreviewStatuses"),
  templatePreviewFields: document.querySelector("#templatePreviewFields"),
  templatePreviewPattern: document.querySelector("#templatePreviewPattern"),
  templatePreviewCalculations: document.querySelector("#templatePreviewCalculations"),
  templateNameModal: document.querySelector("#templateNameModal"),
  templateNameForm: document.querySelector("#templateNameForm"),
  customTemplateName: document.querySelector("#customTemplateName"),
  customTemplateDescription: document.querySelector("#customTemplateDescription")
};

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    showToast("저장 공간을 확인해 주세요.");
    return false;
  }
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
function getStatus(id) { return state.statuses.find(item => item.id === id) || null; }
function diffDays(fromDate, toDate) {
  const from = Date.UTC(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const to = Date.UTC(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
  return Math.round((to - from) / 86400000);
}
function getPatternStatusId(date) {
  if (!state.pattern.enabled || !state.pattern.sequence.length) return "";
  const delta = diffDays(parseISO(state.pattern.anchorDate), date);
  const length = state.pattern.sequence.length;
  return state.pattern.sequence[((delta % length) + length) % length] || "";
}
function getResolvedStatusId(iso) {
  const entry = getEntry(iso);
  if (entry.statusId) return entry.statusId;
  return getPatternStatusId(parseISO(iso));
}
function getEntry(iso) {
  return state.entries[iso] || { statusId: "", memo: "", fields: {} };
}
function cloneEntry(entry) {
  return { statusId: entry.statusId || "", memo: entry.memo || "", fields: { ...(entry.fields || {}) } };
}
function isEntryEmpty(entry) {
  if (entry.statusId || String(entry.memo || "").trim()) return false;
  return !Object.values(entry.fields || {}).some(value => value === true || String(value ?? "").trim() !== "");
}

function renderCalendar(refreshDetail = true) {
  const viewDate = parseISO(state.viewDate);
  const selectedDate = parseISO(state.selectedDate);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthLabel = formatMonth(viewDate);
  elements.calendarHeading.textContent = monthLabel;
  elements.monthPickerButton.setAttribute("aria-label", `${monthLabel}, 연도와 월 선택`);
  elements.calendarGrid.classList.remove("is-loading");
  elements.calendarGrid.replaceChildren();

  const today = new Date();
  const fragment = document.createDocumentFragment();
  for (const date of getMonthGrid(year, month)) {
    const iso = localISO(date);
    const holidayName = holidays.get(iso);
    const entry = getEntry(iso);
    const resolvedStatusId = getResolvedStatusId(iso);
    const status = getStatus(resolvedStatusId);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "day-cell";
    button.dataset.date = iso;
    button.setAttribute("role", "gridcell");
    const ariaParts = [formatDetailDate(date)];
    if (holidayName) ariaParts.push(holidayName);
    if (status) ariaParts.push(`${status.name}${entry.statusId ? ", 직접 설정" : state.pattern.enabled ? ", 반복 패턴" : ""}`);
    if (entry.memo) ariaParts.push("메모 있음");
    if (sameDay(date, today)) ariaParts.push("오늘");
    button.setAttribute("aria-label", ariaParts.join(", "));
    button.setAttribute("aria-selected", sameDay(date, selectedDate) ? "true" : "false");
    if (date.getMonth() !== month) button.classList.add("outside");
    if (sameDay(date, today)) button.classList.add("today");
    if (sameDay(date, selectedDate)) button.classList.add("selected");

    const number = document.createElement("span");
    number.className = "day-number";
    number.textContent = String(date.getDate());
    button.append(number);

    const lines = document.createElement("span");
    lines.className = "calendar-cell-lines";
    for (const item of state.layout.cellItems.filter(item => item.visible)) {
      const line = createCalendarCellLine(item.id, { iso, entry, status, holidayName });
      if (line) lines.append(line);
    }
    button.append(lines);
    fragment.append(button);
  }
  elements.calendarGrid.append(fragment);
  if (refreshDetail && !elements.dateSheetBackdrop.hidden) renderDetail();
}
function createCalendarCellLine(itemId, context) {
  const { iso, entry, status, holidayName } = context;
  const line = document.createElement("span");
  line.className = `cell-line ${itemId}`;
  if (itemId === "status") {
    if (!status && !holidayName) return null;
    line.textContent = status?.shortName || "휴일";
    line.style.background = status?.color || "#fff0ef";
    line.style.color = status ? getReadableTextColor(status.color) : "#b63834";
    return line;
  }
  if (itemId === "memo") {
    const value = holidayName || entry.memo;
    if (!value) return null;
    line.textContent = value;
    return line;
  }
  if (itemId === "field") {
    const field = state.fields.find(item => item.id === state.layout.cellFieldId);
    if (!field) return null;
    const value = entry.fields?.[field.id];
    if (value === "" || value === null || value === undefined || value === false) return null;
    line.textContent = `${field.name}: ${formatFieldDisplay(field, value)}`;
    return line;
  }
  if (itemId === "calculation") {
    const calculation = state.calculations.find(item => item.id === state.layout.cellCalculationId && item.scope === "date");
    if (!calculation) return null;
    line.textContent = `${calculation.name}: ${formatCalculationValue(calculation, evaluateCalculation(calculation, "date", iso))}`;
    return line;
  }
  return null;
}
function formatFieldDisplay(field, value) {
  if (field.type === "checkbox") return value ? "완료" : "";
  return `${value}${field.unit ? ` ${field.unit}` : ""}`;
}
function getReadableTextColor(hex) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0,2), 16);
  const g = parseInt(value.slice(2,4), 16);
  const b = parseInt(value.slice(4,6), 16);
  const luminance = (0.299*r + 0.587*g + 0.114*b) / 255;
  return luminance > .62 ? "#1d2228" : "#ffffff";
}

function openDateSheet(restoreFocus = true) {
  flushDateAutosave({ refreshSheet: false, silent: true });
  if (restoreFocus) {
    modalLastFocus = document.querySelector(`.day-cell[data-date="${state.selectedDate}"]`) || document.activeElement;
  }
  renderDetail();
  setDateSaveStatus("saved");
  elements.dateSheetBackdrop.hidden = false;
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => document.querySelector("#dateSheetClose").focus());
}
function closeDateSheet() {
  flushDateAutosave({ refreshSheet: false, silent: true });
  elements.dateSheetBackdrop.hidden = true;
  document.body.style.overflow = "";
  if (modalLastFocus instanceof HTMLElement) modalLastFocus.focus();
}
function setDateSaveStatus(status) {
  dateSaveState = status;
  const labels = {
    saving: "저장 중…",
    saved: "저장됨",
    error: "저장 실패 · 다시 시도"
  };
  elements.dateSaveStatus.dataset.saveStatus = status;
  elements.dateSaveStatus.textContent = labels[status] || labels.saved;
  elements.dateSaveStatus.disabled = status !== "error";
}
function collectDateSheetDraft() {
  if (!draftEntry) draftEntry = cloneEntry(getEntry(state.selectedDate));
  draftEntry.memo = elements.detailMemoInput.value.trim().slice(0, 300);
  collectCustomFieldDraft(draftEntry);
  for (const field of state.fields) {
    if (!Object.prototype.hasOwnProperty.call(draftEntry.fields, field.id)) continue;
    draftEntry.fields[field.id] = sanitizeFieldValue(field, draftEntry.fields[field.id]);
  }
  return draftEntry;
}
function scheduleDateAutosave({ immediate = false } = {}) {
  clearTimeout(dateAutosaveTimer);
  setDateSaveStatus("saving");
  if (immediate) {
    flushDateAutosave({ refreshSheet: false });
    return;
  }
  dateAutosaveTimer = window.setTimeout(
    () => flushDateAutosave({ refreshSheet: false }),
    DATE_AUTOSAVE_DELAY
  );
}
function flushDateAutosave({ refreshSheet = false, silent = false } = {}) {
  clearTimeout(dateAutosaveTimer);
  dateAutosaveTimer = 0;
  if (!draftEntry || !state.selectedDate) return true;
  collectDateSheetDraft();
  const nextEntry = cloneEntry(draftEntry);
  const previousEntry = cloneEntry(getEntry(state.selectedDate));
  const changed = JSON.stringify(previousEntry) !== JSON.stringify(nextEntry);
  if (!changed) {
    setDateSaveStatus("saved");
    return true;
  }

  const previousStored = state.entries[state.selectedDate]
    ? cloneEntry(state.entries[state.selectedDate])
    : null;
  if (isEntryEmpty(nextEntry)) delete state.entries[state.selectedDate];
  else state.entries[state.selectedDate] = nextEntry;

  if (!saveState()) {
    if (previousStored) state.entries[state.selectedDate] = previousStored;
    else delete state.entries[state.selectedDate];
    setDateSaveStatus("error");
    if (!silent) showToast("날짜 기록을 저장하지 못했습니다.");
    return false;
  }

  draftEntry = cloneEntry(getEntry(state.selectedDate));
  setDateSaveStatus("saved");
  renderCalendar(refreshSheet);
  renderSummary();
  if (!elements.dateSheetBackdrop.hidden) renderDateCalculations();
  return true;
}
function renderDetail() {
  const selectedDate = parseISO(state.selectedDate);
  const iso = state.selectedDate;
  const stored = getEntry(iso);
  draftEntry = cloneEntry(stored);
  const resolvedStatusId = draftEntry.statusId || getPatternStatusId(selectedDate);
  const status = getStatus(resolvedStatusId);
  const holidayName = holidays.get(iso);
  const isToday = sameDay(selectedDate, new Date());

  elements.dateSheetTitle.textContent = isToday ? `오늘 · ${formatDetailDate(selectedDate)}` : formatDetailDate(selectedDate);
  elements.detailStatus.textContent = status
    ? `${status.name}${draftEntry.statusId ? " · 직접 설정" : " · 반복 패턴"}`
    : "상태 없음";
  elements.detailStatusSwatch.style.background = status?.color || "#b4bec5";
  elements.detailMemoInput.value = draftEntry.memo;
  applyDetailLayout();
  renderStatusChoices();
  renderCustomFields();
  renderDateCalculations();
}
function applyDetailLayout() {
  const content = document.querySelector("#detailContent");
  const sections = new Map([...content.querySelectorAll("[data-detail-section]")].map(section => [section.dataset.detailSection, section]));
  for (const item of state.layout.detailItems) {
    const section = sections.get(item.id);
    if (!section) continue;
    section.hidden = !item.visible;
    content.append(section);
  }
  document.querySelector("#detailStatusSectionLabel").textContent = state.layout.terms.status;
  document.querySelector("#detailMemoSectionLabel").textContent = state.layout.terms.memo;
  document.querySelector("#detailFieldsSectionLabel").textContent = state.layout.terms.fields;
  document.querySelector("#detailCalculationsSectionLabel").textContent = state.layout.terms.calculations;
}
function renderStatusChoices() {
  elements.statusChoiceGrid.replaceChildren();
  const noneButton = document.createElement("button");
  noneButton.type = "button";
  noneButton.className = `status-choice${draftEntry.statusId ? "" : " active"}`;
  noneButton.dataset.statusId = "";
  noneButton.textContent = state.pattern.enabled ? "반복 패턴 사용" : "상태 없음";
  elements.statusChoiceGrid.append(noneButton);
  for (const status of state.statuses) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `status-choice${draftEntry.statusId === status.id ? " active" : ""}`;
    button.dataset.statusId = status.id;
    button.textContent = status.name;
    button.style.background = status.color;
    button.style.color = getReadableTextColor(status.color);
    elements.statusChoiceGrid.append(button);
  }
}
function collectCustomFieldDraft(target = draftEntry) {
  for (const input of elements.customFieldValues.querySelectorAll("[data-field-id]")) {
    const field = state.fields.find(item => item.id === input.dataset.fieldId);
    if (!field) continue;
    target.fields[field.id] = field.type === "checkbox" ? input.checked : input.value;
  }
  return target;
}
function renderCustomFields() {
  elements.customFieldValues.replaceChildren();
  elements.customFieldEmpty.hidden = state.fields.length > 0;
  for (const field of state.fields) {
    const row = document.createElement("div");
    row.className = "custom-field-row";
    const currentValue = Object.prototype.hasOwnProperty.call(draftEntry.fields, field.id)
      ? draftEntry.fields[field.id]
      : field.defaultValue;

    if (field.type === "checkbox") {
      const label = document.createElement("label");
      label.className = "checkbox-row";
      const text = document.createElement("span");
      text.textContent = field.name;
      if (field.required) {
        const required = document.createElement("span");
        required.className = "required-mark";
        required.textContent = "*";
        text.append(required);
      }
      const input = document.createElement("input");
      input.type = "checkbox";
      input.dataset.fieldId = field.id;
      input.checked = currentValue === true;
      label.append(text, input);
      row.append(label);
    } else {
      const label = document.createElement("label");
      label.htmlFor = `field-${field.id}`;
      label.textContent = field.name;
      if (field.required) {
        const required = document.createElement("span");
        required.className = "required-mark";
        required.textContent = "*";
        label.append(required);
      }
      if (field.unit) {
        const unit = document.createElement("span");
        unit.className = "field-unit";
        unit.textContent = field.unit;
        label.append(unit);
      }
      let input;
      if (field.type === "select") {
        input = document.createElement("select");
        const empty = document.createElement("option");
        empty.value = "";
        empty.textContent = "선택";
        input.append(empty);
        for (const optionText of field.options) {
          const option = document.createElement("option");
          option.value = optionText;
          option.textContent = optionText;
          input.append(option);
        }
      } else {
        input = document.createElement("input");
        const typeMap = { number: "number", currency: "number", time: "time", date: "date", text: "text" };
        input.type = typeMap[field.type] || "text";
        if (isNumericField(field)) {
          if (field.min !== null) input.min = String(field.min);
          if (field.max !== null) input.max = String(field.max);
          input.step = "any";
          input.inputMode = "decimal";
        }
      }
      input.id = `field-${field.id}`;
      input.className = "custom-input";
      input.dataset.fieldId = field.id;
      input.value = currentValue ?? "";
      input.required = field.required;
      if (field.type === "text") input.maxLength = 200;
      row.append(label, input);
    }
    elements.customFieldValues.append(row);
  }
}

function evaluateOperand(operand, scope, dateIso) {
  if (operand.type === "constant") return operand.constant;
  if (operand.type === "field") {
    if (scope === "date") {
      const value = getEntry(dateIso).fields?.[operand.sourceId];
      return Number.isFinite(Number(value)) ? Number(value) : 0;
    }
    const viewDate = parseISO(state.viewDate);
    const prefix = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, "0")}-`;
    return Object.entries(state.entries)
      .filter(([iso]) => iso.startsWith(prefix))
      .reduce((sum, [, entry]) => {
        const value = entry.fields?.[operand.sourceId];
        return sum + (Number.isFinite(Number(value)) ? Number(value) : 0);
      }, 0);
  }
  if (scope === "date") return getResolvedStatusId(dateIso) === operand.sourceId ? 1 : 0;
  const viewDate = parseISO(state.viewDate);
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  let count = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = localISO(createLocalDate(viewDate.getFullYear(), viewDate.getMonth(), day));
    if (getResolvedStatusId(iso) === operand.sourceId) count++;
  }
  return count;
}
function evaluateCalculation(calculation, scope, dateIso = state.selectedDate) {
  const left = evaluateOperand(calculation.left, scope, dateIso);
  const right = evaluateOperand(calculation.right, scope, dateIso);
  let combined = 0;
  switch (calculation.operator) {
    case "subtract": combined = left - right; break;
    case "multiply": combined = left * right; break;
    case "divide": combined = right === 0 ? 0 : left / right; break;
    case "min": combined = Math.min(left, right); break;
    case "max": combined = Math.max(left, right); break;
    default: combined = left + right;
  }
  const value = combined * calculation.multiply + calculation.add;
  return Number.isFinite(value) ? value : 0;
}
function formatCalculationValue(calculation, value) {
  return `${Number(value).toLocaleString("ko-KR", {
    minimumFractionDigits: calculation.decimals,
    maximumFractionDigits: calculation.decimals
  })}${calculation.suffix ? ` ${calculation.suffix}` : ""}`;
}
function renderDateCalculations() {
  const calculations = state.calculations.filter(item => item.scope === "date");
  elements.dateCalculationResults.replaceChildren();
  elements.dateCalculationEmpty.hidden = calculations.length > 0;
  for (const calculation of calculations) {
    elements.dateCalculationResults.append(createCalculationResult(
      calculation.name,
      formatCalculationValue(calculation, evaluateCalculation(calculation, "date"))
    ));
  }
}
function renderMonthCalculations() {
  const calculations = state.calculations.filter(item => item.scope === "month");
  elements.monthCalculationResults.replaceChildren();
  elements.monthCalculationEmpty.hidden = calculations.length > 0;
  for (const calculation of calculations) {
    elements.monthCalculationResults.append(createCalculationResult(
      calculation.name,
      formatCalculationValue(calculation, evaluateCalculation(calculation, "month"))
    ));
  }
}
function renderHomeCalculations() {
  const calculations = state.calculations.filter(item => item.showOnHome);
  elements.homeCalculationCards.replaceChildren();
  elements.homeCalculationEmpty.hidden = calculations.length > 0;
  for (const calculation of calculations) {
    const card = document.createElement("article");
    card.className = "home-calculation-card";
    const label = document.createElement("span");
    label.textContent = `${calculation.scope === "month" ? "이번 달" : "선택 날짜"} · ${calculation.name}`;
    const strong = document.createElement("strong");
    strong.textContent = formatCalculationValue(calculation, evaluateCalculation(calculation, calculation.scope));
    card.append(label, strong);
    elements.homeCalculationCards.append(card);
  }
}
function createCalculationResult(name, value) {
  const row = document.createElement("div");
  row.className = "calculation-result";
  const label = document.createElement("span");
  label.textContent = name;
  const strong = document.createElement("strong");
  strong.textContent = value;
  row.append(label, strong);
  return row;
}

function retryDateAutosave() {
  if (dateSaveState === "error") flushDateAutosave({ refreshSheet: false });
}
function clearSelectedDate() {
  clearTimeout(dateAutosaveTimer);
  dateAutosaveTimer = 0;
  delete state.entries[state.selectedDate];
  draftEntry = { statusId: "", memo: "", fields: {} };
  if (!saveState()) {
    setDateSaveStatus("error");
    return;
  }
  setDateSaveStatus("saved");
  renderCalendar(false);
  renderSummary();
  renderDetail();
  showToast("선택한 날짜의 기록을 지웠습니다.");
}

function renderSummary() {
  renderHomeCalculations();
  const viewDate = parseISO(state.viewDate);
  const prefix = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, "0")}-`;
  const monthEntries = Object.entries(state.entries).filter(([iso]) => iso.startsWith(prefix));
  const memoCount = monthEntries.filter(([, entry]) => String(entry.memo || "").trim()).length;
  const filledFields = monthEntries.reduce((sum, [, entry]) => sum + Object.values(entry.fields || {}).filter(value => value === true || String(value ?? "").trim() !== "").length, 0);
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  let statusCount = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = localISO(createLocalDate(viewDate.getFullYear(), viewDate.getMonth(), day));
    if (getResolvedStatusId(iso)) statusCount++;
  }

  const summaryValues = {
    daysInMonth: [SUMMARY_ITEM_CATALOG.daysInMonth.label, `${daysInMonth}일`],
    savedDays: [SUMMARY_ITEM_CATALOG.savedDays.label, `${monthEntries.length}일`],
    statusDays: [`${withSubjectParticle(state.layout.terms.status)} 있는 날`, `${statusCount}일`],
    memoDays: [`${withSubjectParticle(state.layout.terms.memo)} 있는 날`, `${memoCount}일`],
    filledFields: ["입력된 사용자 값", `${filledFields}개`],
    fieldCount: [state.layout.terms.fields, `${state.fields.length}개`]
  };
  const cards = state.layout.summaryItems.filter(item => item.visible).map(item => summaryValues[item.id]);
  elements.summaryGrid.replaceChildren();
  for (const [label, value] of cards) {
    const card = document.createElement("article");
    card.className = "summary-card";
    const span = document.createElement("span");
    span.textContent = label;
    const strong = document.createElement("strong");
    strong.textContent = value;
    card.append(span, strong);
    elements.summaryGrid.append(card);
  }

  renderMonthCalculations();
  elements.statusSummaryList.replaceChildren();
  for (const status of state.statuses) {
    let count = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = localISO(createLocalDate(viewDate.getFullYear(), viewDate.getMonth(), day));
      if (getResolvedStatusId(iso) === status.id) count++;
    }
    const row = document.createElement("div");
    row.className = "status-summary-item";
    const dot = document.createElement("span");
    dot.className = "status-summary-dot";
    dot.style.background = status.color;
    const name = document.createElement("span");
    name.textContent = status.name;
    const strong = document.createElement("strong");
    strong.textContent = `${count}일`;
    row.append(dot, name, strong);
    elements.statusSummaryList.append(row);
  }
  if (!state.statuses.length) {
    const empty = document.createElement("p");
    empty.className = "empty-copy";
    empty.textContent = "등록된 날짜 상태가 없습니다.";
    elements.statusSummaryList.append(empty);
  }
}

function renderSettings() {
  renderTemplates();
  if (!layoutDraftDirty) layoutDraft = structuredClone(state.layout);
  renderPatternEditor();
  renderCalculationEditor();
  renderThemeEditor();
  renderLayoutEditor();
  renderStatusEditor();
  renderFieldEditor();
}
function renderTemplates() {
  elements.templateGrid.replaceChildren();
  const query = elements.templateSearchInput?.value.trim().toLowerCase() || "";
  const category = elements.templateCategoryFilter?.value || "all";
  const templates = [...TEMPLATES, ...state.customTemplates].filter(template => {
    const templateCategory = template.custom ? "custom" : template.category;
    const categoryMatches = category === "all" || category === templateCategory;
    const queryMatches = !query || `${template.name} ${template.description}`.toLowerCase().includes(query);
    return categoryMatches && queryMatches;
  });
  for (const template of templates) {
    const card = document.createElement("article");
    card.className = "template-card";
    card.dataset.templateId = template.id;
    if (template.custom) card.dataset.custom = "true";
    const name = document.createElement("strong");
    name.textContent = template.name;
    const description = document.createElement("p");
    description.textContent = template.description;
    const categoryBadge = document.createElement("span");
    categoryBadge.className = "template-card-category";
    categoryBadge.textContent = TEMPLATE_CATEGORY_LABELS[template.custom ? "custom" : template.category] || "템플릿";
    const version = document.createElement("small");
    version.className = "template-card-version";
    version.textContent = `v${template.version || 1}`;
    const actions = document.createElement("div");
    actions.className = "template-card-actions";
    for (const [action, label] of [["preview","미리보기"],["apply","적용"],["duplicate","복제"]]) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.templateAction = action;
      button.textContent = label;
      actions.append(button);
    }
    if (template.custom) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.dataset.templateAction = "delete";
      remove.textContent = "삭제";
      actions.append(remove);
    }
    card.append(name, description, categoryBadge, version, actions);
    elements.templateGrid.append(card);
  }
  if (!templates.length) appendEmpty(elements.templateGrid, "조건에 맞는 템플릿이 없습니다.");
}
function renderPatternEditor() {
  elements.patternEnabled.checked = state.pattern.enabled;
  elements.patternName.value = state.pattern.name;
  elements.patternAnchorDate.value = state.pattern.anchorDate;
  patternDraft = [...state.pattern.sequence];
  renderPatternDraft();
  elements.patternPalette.replaceChildren();
  for (const status of state.statuses) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pattern-add";
    button.dataset.statusId = status.id;
    button.textContent = status.name;
    button.style.background = status.color;
    button.style.color = getReadableTextColor(status.color);
    elements.patternPalette.append(button);
  }
}
function renderPatternDraft() {
  elements.patternSequence.replaceChildren();
  patternDraft.forEach((statusId, index) => {
    const status = getStatus(statusId);
    if (!status) return;
    const token = document.createElement("span");
    token.className = "pattern-token";
    token.style.background = status.color;
    token.style.color = getReadableTextColor(status.color);
    const order = document.createElement("small");
    order.textContent = `${index + 1}`;
    token.append(order, document.createTextNode(status.shortName));
    elements.patternSequence.append(token);
  });
  if (!patternDraft.length) appendEmpty(elements.patternSequence, "상태를 눌러 반복 순서를 만드세요.");
}
function renderCalculationEditor() {
  elements.calculationEditorList.replaceChildren();
  state.calculations.forEach((calculation, index) => {
    const row = document.createElement("div");
    row.className = "calculation-editor-row";
    const copy = document.createElement("div");
    copy.className = "editor-copy";
    const strong = document.createElement("strong");
    strong.textContent = calculation.name;
    const small = document.createElement("small");
    small.textContent = `${calculation.scope === "month" ? "월간" : "날짜"} · ${describeExpression(calculation)}`;
    copy.append(strong, small);
    if (calculation.showOnHome) {
      const badge = document.createElement("span");
      badge.className = "source-badge";
      badge.textContent = "홈 카드";
      copy.append(badge);
    }
    const actions = document.createElement("div");
    actions.className = "editor-actions";
    const buttons = [
      ["up", "↑", index === 0],
      ["down", "↓", index === state.calculations.length - 1],
      ["duplicate", "복제", false],
      ["edit", "편집", false],
      ["delete", "삭제", false]
    ];
    for (const [action, text, disabled] of buttons) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.action = action;
      button.dataset.kind = "calculation";
      button.dataset.id = calculation.id;
      button.textContent = text;
      button.disabled = disabled;
      if (action === "delete") button.className = "delete";
      actions.append(button);
    }
    row.append(copy, actions);
    elements.calculationEditorList.append(row);
  });
  if (!state.calculations.length) appendEmpty(elements.calculationEditorList, "계산 결과이 없습니다.");
}
function operandLabel(operand) {
  if (operand.type === "constant") return String(operand.constant);
  if (operand.type === "field") return state.fields.find(item => item.id === operand.sourceId)?.name || "삭제된 기록 항목";
  return `${state.statuses.find(item => item.id === operand.sourceId)?.name || "삭제된 상태"} 횟수`;
}
function describeExpression(calculation) {
  const operatorLabels = { add: "+", subtract: "−", multiply: "×", divide: "÷", min: "min", max: "max" };
  return `${operandLabel(calculation.left)} ${operatorLabels[calculation.operator]} ${operandLabel(calculation.right)}`;
}
function renderThemeEditor() {
  elements.themePresetGrid.replaceChildren();
  for (const preset of THEME_PRESETS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-preset-button";
    button.dataset.themePreset = preset.id;
    const preview = document.createElement("span");
    preview.className = "theme-preset-preview";
    for (const color of [preset.background, preset.surface, preset.accent]) {
      const swatch = document.createElement("span");
      swatch.style.background = color;
      preview.append(swatch);
    }
    const name = document.createElement("strong");
    name.textContent = preset.name;
    button.append(preview, name);
    elements.themePresetGrid.append(button);
  }
  elements.themeBackground.value = state.theme.background;
  elements.themeSurface.value = state.theme.surface;
  elements.themeAccent.value = state.theme.accent;
  elements.themeText.value = state.theme.text;
  elements.themeRadius.value = state.theme.radius;
  elements.themeDensity.value = state.theme.density;
}
function renderLayoutEditor() {
  elements.calendarTitleInput.value = layoutDraft.calendarTitle;
  elements.quickActionTarget.value = layoutDraft.quickActionTarget;
  elements.termStatus.value = layoutDraft.terms.status;
  elements.termMemo.value = layoutDraft.terms.memo;
  elements.termFields.value = layoutDraft.terms.fields;
  elements.termCalculations.value = layoutDraft.terms.calculations;

  populateSelect(elements.cellFieldSelect, state.fields, layoutDraft.cellFieldId, "표시할 기록 항목 없음");
  populateSelect(
    elements.cellCalculationSelect,
    state.calculations.filter(item => item.scope === "date"),
    layoutDraft.cellCalculationId,
    "표시할 계산 결과 없음"
  );

  renderOrderedEditor(elements.cellItemEditor, layoutDraft.cellItems, CELL_ITEM_CATALOG, "cell");
  renderOrderedEditor(elements.detailItemEditor, layoutDraft.detailItems, DETAIL_ITEM_CATALOG, "detail");
  renderOrderedEditor(elements.summaryItemEditor, layoutDraft.summaryItems, SUMMARY_ITEM_CATALOG, "summary");

  elements.navOrderEditor.replaceChildren();
  layoutDraft.navOrder.forEach((id, index) => {
    const row = document.createElement("div");
    row.className = "nav-order-row";
    row.dataset.navId = id;
    const labelInput = document.createElement("input");
    labelInput.className = "nav-label-input";
    labelInput.dataset.navLabel = id;
    labelInput.maxLength = 10;
    labelInput.value = layoutDraft.navLabels[id];
    labelInput.setAttribute("aria-label", `${NAV_LABELS[id]} 메뉴 이름`);
    const actions = document.createElement("div");
    actions.className = "nav-order-actions";
    const up = document.createElement("button");
    up.type = "button";
    up.dataset.navMove = "-1";
    up.setAttribute("aria-label", `${NAV_LABELS[id]} 위로 이동`);
    up.textContent = "↑";
    up.disabled = index === 0;
    const down = document.createElement("button");
    down.type = "button";
    down.dataset.navMove = "1";
    down.setAttribute("aria-label", `${NAV_LABELS[id]} 아래로 이동`);
    down.textContent = "↓";
    down.disabled = index === layoutDraft.navOrder.length - 1;
    actions.append(up, down);
    row.append(labelInput, actions);
    elements.navOrderEditor.append(row);
  });
}
function populateSelect(select, items, selectedId, emptyLabel) {
  select.replaceChildren();
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = emptyLabel;
  select.append(empty);
  for (const item of items) {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.name;
    select.append(option);
  }
  if (items.some(item => item.id === selectedId)) select.value = selectedId;
}
function renderOrderedEditor(container, items, catalog, group) {
  container.replaceChildren();
  items.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "layout-order-row";
    row.dataset.layoutGroup = group;
    row.dataset.itemId = item.id;
    const copy = document.createElement("div");
    copy.className = "layout-order-copy";
    const strong = document.createElement("strong");
    strong.textContent = catalog[item.id].label;
    const small = document.createElement("small");
    small.textContent = catalog[item.id].description || `${index + 1}번째`;
    copy.append(strong, small);
    const actions = document.createElement("div");
    actions.className = "layout-order-actions";
    const up = document.createElement("button");
    up.type = "button";
    up.dataset.layoutMove = "-1";
    up.textContent = "↑";
    up.disabled = index === 0;
    const down = document.createElement("button");
    down.type = "button";
    down.dataset.layoutMove = "1";
    down.textContent = "↓";
    down.disabled = index === items.length - 1;
    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.className = "layout-toggle";
    toggle.dataset.layoutToggle = item.id;
    toggle.checked = item.visible;
    toggle.setAttribute("aria-label", `${catalog[item.id].label} 표시`);
    actions.append(up, down, toggle);
    row.append(copy, actions);
    container.append(row);
  });
}
function updateQuickActionLabel() {
  const labels = {
    templates: "템플릿 설정 바로가기",
    pattern: "반복 패턴 설정 바로가기",
    calculations: "계산 결과 설정 바로가기",
    statuses: "날짜 상태 설정 바로가기",
    fields: "기록 항목 설정 바로가기",
    theme: "테마 설정 바로가기"
  };
  document.querySelector("#quickActionButton").setAttribute("aria-label", labels[state.layout.quickActionTarget] || "설정 바로가기");
}
function renderNavigation() {
  const nav = document.querySelector("#bottomNav");
  const itemsById = new Map([...nav.querySelectorAll(".nav-item")].map(item => [item.dataset.target, item]));
  for (const id of state.layout.navOrder) {
    const item = itemsById.get(id);
    if (!item) continue;
    const label = item.querySelector("span");
    if (label) label.textContent = state.layout.navLabels[id];
    nav.append(item);
  }
}
function saveLayout() {
  layoutDraft.calendarTitle = elements.calendarTitleInput.value.trim().slice(0, 30) || "나의 달력";
  layoutDraft.quickActionTarget = Object.hasOwn(QUICK_ACTION_PANEL, elements.quickActionTarget.value)
    ? elements.quickActionTarget.value
    : "statuses";
  layoutDraft.terms = {
    status: elements.termStatus.value.trim().slice(0, 16) || "날짜 상태",
    memo: elements.termMemo.value.trim().slice(0, 16) || "일정 및 메모",
    fields: elements.termFields.value.trim().slice(0, 16) || "기록 항목",
    calculations: elements.termCalculations.value.trim().slice(0, 16) || "계산 결과"
  };
  layoutDraft.cellFieldId = state.fields.some(item => item.id === elements.cellFieldSelect.value)
    ? elements.cellFieldSelect.value : "";
  layoutDraft.cellCalculationId = state.calculations.some(item => item.id === elements.cellCalculationSelect.value && item.scope === "date")
    ? elements.cellCalculationSelect.value : "";
  document.querySelectorAll("[data-nav-label]").forEach(input => {
    const id = input.dataset.navLabel;
    layoutDraft.navLabels[id] = input.value.trim().slice(0, 10) || NAV_LABELS[id];
  });
  if (layoutDraft.detailItems.filter(item => item.visible).length < 1) {
    showToast("상세보기 항목은 최소 1개가 필요합니다.");
    return;
  }
  if (layoutDraft.summaryItems.filter(item => item.visible).length < 1) {
    showToast("요약 카드는 최소 1개가 필요합니다.");
    return;
  }
  state.layout = structuredClone(layoutDraft);
  layoutDraftDirty = false;
  saveState();
  document.querySelector("#appTitle").textContent = state.layout.calendarTitle;
  updateQuickActionLabel();
  renderNavigation();
  renderCalendar();
  renderSummary();
  showToast("화면 구성을 저장했습니다.");
}
function renderStatusEditor() {
  elements.statusEditorList.replaceChildren();
  for (const status of state.statuses) {
    const row = createEditorRow({
      color: status.color,
      title: status.name,
      subtitle: `달력 표시: ${status.shortName}`,
      kind: "status",
      id: status.id
    });
    elements.statusEditorList.append(row);
  }
  if (!state.statuses.length) appendEmpty(elements.statusEditorList, "날짜 상태가 없습니다.");
}
function renderFieldEditor() {
  const typeLabels = { text: "텍스트", number: "숫자", currency: "금액", checkbox: "체크", select: "선택 목록", time: "시간", date: "날짜" };
  elements.fieldEditorList.replaceChildren();
  for (const field of state.fields) {
    const row = createEditorRow({
      title: field.name,
      subtitle: `입력 형식: ${typeLabels[field.type]}`,
      kind: "field",
      id: field.id
    });
    elements.fieldEditorList.append(row);
  }
  if (!state.fields.length) appendEmpty(elements.fieldEditorList, "기록 항목이 없습니다.");
}
function createEditorRow({ color, title, subtitle, kind, id }) {
  const row = document.createElement("div");
  row.className = "editor-row";
  if (color) {
    const dot = document.createElement("span");
    dot.className = "editor-color";
    dot.style.background = color;
    row.append(dot);
  }
  const copy = document.createElement("div");
  copy.className = "editor-copy";
  const strong = document.createElement("strong");
  strong.textContent = title;
  const small = document.createElement("small");
  small.textContent = subtitle;
  copy.append(strong, small);

  const actions = document.createElement("div");
  actions.className = "editor-actions";
  const edit = document.createElement("button");
  edit.type = "button";
  edit.dataset.action = "edit";
  edit.dataset.kind = kind;
  edit.dataset.id = id;
  edit.textContent = "편집";
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "delete";
  remove.dataset.action = "delete";
  remove.dataset.kind = kind;
  remove.dataset.id = id;
  remove.textContent = "삭제";
  actions.append(edit, remove);
  row.append(copy, actions);
  return row;
}
function appendEmpty(container, message) {
  const empty = document.createElement("p");
  empty.className = "empty-copy";
  empty.textContent = message;
  container.append(empty);
}


function sanitizeTemplateLayout(rawLayout) {
  const fallback = createDefaultState().layout;
  const source = rawLayout && typeof rawLayout === "object" ? rawLayout : fallback;
  const sanitizeItems = (items, fallbackItems, catalog, minVisible = 0) => {
    const seen = new Set();
    const result = [];
    if (Array.isArray(items)) {
      for (const item of items) {
        if (!item || !Object.hasOwn(catalog, item.id) || seen.has(item.id)) continue;
        seen.add(item.id);
        result.push({ id:item.id, visible:item.visible !== false });
      }
    }
    for (const item of fallbackItems) if (!seen.has(item.id)) result.push({ ...item });
    if (result.filter(item => item.visible).length < minVisible) result[0].visible = true;
    return result;
  };
  const navOrder = [...new Set((Array.isArray(source.navOrder) ? source.navOrder : fallback.navOrder).filter(id => Object.hasOwn(NAV_LABELS,id)))];
  for (const id of fallback.navOrder) if (!navOrder.includes(id)) navOrder.push(id);
  return {
    calendarTitle:String(source.calendarTitle || fallback.calendarTitle).slice(0,30),
    quickActionTarget:Object.hasOwn(QUICK_ACTION_PANEL,source.quickActionTarget) ? source.quickActionTarget : "templates",
    navOrder:navOrder.slice(0,3),
    navLabels:Object.fromEntries(Object.keys(NAV_LABELS).map(id => [id,String(source.navLabels?.[id] || NAV_LABELS[id]).slice(0,10)])),
    terms:{
      status:String(source.terms?.status || fallback.terms.status).slice(0,16),
      memo:String(source.terms?.memo || fallback.terms.memo).slice(0,16),
      fields:String(source.terms?.fields || fallback.terms.fields).slice(0,16),
      calculations:String(source.terms?.calculations || fallback.terms.calculations).slice(0,16)
    },
    cellItems:sanitizeItems(source.cellItems,fallback.cellItems,CELL_ITEM_CATALOG,0),
    cellFieldId:safeId(source.cellFieldId,""),
    cellCalculationId:safeId(source.cellCalculationId,""),
    detailItems:sanitizeItems(source.detailItems,fallback.detailItems,DETAIL_ITEM_CATALOG,1),
    summaryItems:sanitizeItems(source.summaryItems,fallback.summaryItems,SUMMARY_ITEM_CATALOG,1)
  };
}
function analyzeTemplateApplication(template, options) {
  const targetStatuses = options.statuses ? template.statuses : state.statuses;
  const targetFields = options.fields ? template.fields : state.fields;
  const statusIds = new Set(targetStatuses.map(item => item.id));
  const numericFieldIds = new Set(targetFields.filter(isNumericField).map(item => item.id));
  let excluded = 0;
  if (options.pattern) excluded += template.pattern.sequence.filter(id => !statusIds.has(id)).length;
  if (options.calculations) {
    for (const calculation of template.calculations) {
      const valid = operand => operand.type === "constant"
        || (operand.type === "statusCount" && statusIds.has(operand.sourceId))
        || (operand.type === "field" && numericFieldIds.has(operand.sourceId));
      if (!valid(calculation.left) || !valid(calculation.right)) excluded++;
    }
  }
  return { excluded };
}
function applyTemplate(templateId) {
  const template = [...TEMPLATES, ...state.customTemplates].find(item => item.id === templateId);
  if (!template) return;
  const options = {
    statuses: document.querySelector("#applyTemplateStatuses").checked,
    fields: document.querySelector("#applyTemplateFields").checked,
    pattern: document.querySelector("#applyTemplatePattern").checked,
    calculations: document.querySelector("#applyTemplateCalculations").checked,
    theme: document.querySelector("#applyTemplateTheme").checked,
    layout: document.querySelector("#applyTemplateLayout").checked
  };
  if (!Object.values(options).some(Boolean)) {
    showToast("적용할 구성을 하나 이상 선택해 주세요.");
    return;
  }
  const selectedNames = [
    options.statuses && "상태", options.fields && "기록 항목", options.pattern && "패턴",
    options.calculations && "계산 결과", options.theme && "테마", options.layout && "화면 구성·용어"
  ].filter(Boolean).join(", ");
  const preview = analyzeTemplateApplication(template, options);
  const warning = preview.excluded
    ? `\n참조 항목이 없어 제외될 구성: ${preview.excluded}개`
    : "";
  if (!confirm(`${template.name} 템플릿의 ${selectedNames} 구성을 적용할까요?\n날짜별 기록은 유지됩니다.${warning}`)) return;

  if (options.statuses) state.statuses = template.statuses.map(item => ({ ...item }));
  if (options.fields) state.fields = template.fields.map(item => ({ ...item }));
  if (options.pattern) {
    state.pattern = {
      enabled: template.pattern.enabled,
      name: template.pattern.name,
      anchorDate: state.selectedDate,
      sequence: [...template.pattern.sequence]
    };
  }
  if (options.calculations) state.calculations = template.calculations.map(item => ({ ...item }));
  if (options.theme && template.theme) state.theme = { ...template.theme };
  if (options.layout && template.layout) state.layout = sanitizeTemplateLayout(template.layout);

  repairReferences();
  state.layout = sanitizeTemplateLayout(state.layout);
  repairReferences();
  layoutDraft = structuredClone(state.layout);
  layoutDraftDirty = false;
  patternDraft = [...state.pattern.sequence];
  saveState();
  applyTheme(state.theme);
  renderAll();
  showToast(`${template.name} 템플릿을 적용했습니다.`);
}

function repairReferences() {
  const statusIds = new Set(state.statuses.map(item => item.id));
  const numericFieldIds = new Set(state.fields.filter(isNumericField).map(item => item.id));
  state.pattern.sequence = state.pattern.sequence.filter(id => statusIds.has(id));
  for (const entry of Object.values(state.entries)) {
    if (!statusIds.has(entry.statusId)) entry.statusId = "";
    const nextFields = {};
    for (const field of state.fields) {
      if (Object.prototype.hasOwnProperty.call(entry.fields || {}, field.id)) {
        nextFields[field.id] = sanitizeFieldValue(field, entry.fields[field.id]);
      }
    }
    entry.fields = nextFields;
  }
  state.calculations = state.calculations.filter(calculation => {
    const operandValid = operand => operand.type === "constant"
      || (operand.type === "field" && numericFieldIds.has(operand.sourceId))
      || (operand.type === "statusCount" && statusIds.has(operand.sourceId));
    return operandValid(calculation.left) && operandValid(calculation.right);
  });
  if (!state.fields.some(item => item.id === state.layout.cellFieldId)) {
    state.layout.cellFieldId = state.fields[0]?.id || "";
  }
  if (!state.calculations.some(item => item.id === state.layout.cellCalculationId && item.scope === "date")) {
    state.layout.cellCalculationId = "";
  }
}
function savePattern() {
  if (elements.patternEnabled.checked && !patternDraft.length) {
    showToast("반복 패턴은 한 항목 이상 필요합니다.");
    return;
  }
  state.pattern = {
    enabled: elements.patternEnabled.checked,
    name: elements.patternName.value.trim().slice(0, 30) || "기본 패턴",
    anchorDate: /^\d{4}-\d{2}-\d{2}$/.test(elements.patternAnchorDate.value)
      ? elements.patternAnchorDate.value
      : state.selectedDate,
    sequence: [...patternDraft].slice(0, 31)
  };
  saveState();
  renderCalendar();
  renderSummary();
  showToast("반복 패턴을 저장했습니다.");
}
function openCalculationEditor(id = "") {
  modalLastFocus = document.activeElement;
  const calculation = state.calculations.find(item => item.id === id);
  document.querySelector("#calculationModalTitle").textContent = id ? "계산 결과 편집" : "계산 결과 추가";
  elements.calculationId.value = id;
  elements.calculationName.value = calculation?.name || "";
  elements.calculationScope.value = calculation?.scope || "date";
  elements.calculationOperator.value = calculation?.operator || "add";
  elements.calcLeftType.value = calculation?.left?.type || "field";
  elements.calcRightType.value = calculation?.right?.type || "constant";
  elements.calcLeftConstant.value = calculation?.left?.constant ?? 0;
  elements.calcRightConstant.value = calculation?.right?.constant ?? 0;
  elements.calculationMultiply.value = calculation?.multiply ?? 1;
  elements.calculationAdd.value = calculation?.add ?? 0;
  elements.calculationDecimals.value = String(calculation?.decimals ?? 0);
  elements.calculationSuffix.value = calculation?.suffix || "";
  elements.calculationShowOnHome.checked = calculation?.showOnHome === true;
  updateOperandOptions("left", calculation?.left?.sourceId || "");
  updateOperandOptions("right", calculation?.right?.sourceId || "");
  updateCalculationPreview();
  elements.calculationModal.hidden = false;
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => elements.calculationName.focus());
}
function updateOperandOptions(side, selectedId = "") {
  const isLeft = side === "left";
  const typeElement = isLeft ? elements.calcLeftType : elements.calcRightType;
  const sourceElement = isLeft ? elements.calcLeftSource : elements.calcRightSource;
  const sourceWrap = isLeft ? elements.calcLeftSourceWrap : elements.calcRightSourceWrap;
  const constantWrap = isLeft ? elements.calcLeftConstantWrap : elements.calcRightConstantWrap;
  const type = typeElement.value;
  sourceWrap.hidden = type === "constant";
  constantWrap.hidden = type !== "constant";
  sourceElement.replaceChildren();
  const items = type === "field" ? state.fields.filter(isNumericField) : state.statuses;
  for (const item of items) {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.name;
    sourceElement.append(option);
  }
  if (selectedId && items.some(item => item.id === selectedId)) sourceElement.value = selectedId;
  updateCalculationPreview();
}
function operandFromForm(side) {
  const isLeft = side === "left";
  const type = (isLeft ? elements.calcLeftType : elements.calcRightType).value;
  return {
    type,
    sourceId: type === "constant" ? "" : (isLeft ? elements.calcLeftSource : elements.calcRightSource).value,
    constant: type === "constant" ? Number(isLeft ? elements.calcLeftConstant.value : elements.calcRightConstant.value) || 0 : 0
  };
}
function updateCalculationPreview() {
  if (!elements.calculationPreview) return;
  const left = operandFromForm("left");
  const right = operandFromForm("right");
  const operatorLabels = { add: "+", subtract: "−", multiply: "×", divide: "÷", min: "최솟값", max: "최댓값" };
  const fake = { left, right, operator: elements.calculationOperator.value };
  elements.calculationPreview.textContent =
    `${describeExpression(fake)} → 결과 × ${Number(elements.calculationMultiply.value) || 0} + ${Number(elements.calculationAdd.value) || 0}`;
}
function closeCalculationEditor() {
  elements.calculationModal.hidden = true;
  document.body.style.overflow = "";
  if (modalLastFocus instanceof HTMLElement) modalLastFocus.focus();
}
function submitCalculation() {
  const id = elements.calculationId.value;
  const name = elements.calculationName.value.trim().slice(0, 30);
  if (!name) { showToast("계산 결과 이름을 입력해 주세요."); return; }
  if (!id && state.calculations.length >= MAX_CALCULATIONS) { showToast("계산 결과는 최대 20개입니다."); return; }
  const left = operandFromForm("left");
  const right = operandFromForm("right");
  if ((left.type !== "constant" && !left.sourceId) || (right.type !== "constant" && !right.sourceId)) {
    showToast("계산할 대상 항목을 선택해 주세요.");
    return;
  }
  const calculation = {
    id: id || makeUniqueId("calc", state.calculations.map(item => item.id)),
    name,
    scope: elements.calculationScope.value === "month" ? "month" : "date",
    operator: elements.calculationOperator.value,
    left,
    right,
    multiply: Number.isFinite(Number(elements.calculationMultiply.value)) ? Number(elements.calculationMultiply.value) : 1,
    add: Number.isFinite(Number(elements.calculationAdd.value)) ? Number(elements.calculationAdd.value) : 0,
    decimals: [0,1,2].includes(Number(elements.calculationDecimals.value)) ? Number(elements.calculationDecimals.value) : 0,
    suffix: elements.calculationSuffix.value.trim().slice(0, 10),
    showOnHome: elements.calculationShowOnHome.checked
  };
  const index = state.calculations.findIndex(item => item.id === id);
  if (index >= 0) state.calculations[index] = calculation;
  else state.calculations.push(calculation);
  saveState();
  renderCalculationEditor();
  renderDateCalculations();
  renderMonthCalculations();
  renderHomeCalculations();
  closeCalculationEditor();
  showToast("계산 결과를 저장했습니다.");
}

function updateFieldEditorVisibility() {
  const type = elements.editorType.value;
  const isStatus = elements.editorKind.value === "status";
  elements.editorOptionsWrap.hidden = isStatus || type !== "select";
  elements.editorUnitWrap.hidden = isStatus || !["number","currency"].includes(type);
  elements.editorNumberRulesWrap.hidden = isStatus || !["number","currency"].includes(type);
  elements.editorDefaultWrap.hidden = isStatus || type === "checkbox";
  document.querySelector("#editorRequiredWrap").hidden = isStatus;
}
const RECORD_PRESETS = {
  workTime:{name:"작업 시간",type:"number",unit:"시간",min:0,max:24},
  money:{name:"금액",type:"currency",unit:"원",min:0,max:null},
  place:{name:"장소",type:"text",unit:"",min:null,max:null},
  done:{name:"완료 여부",type:"checkbox",unit:"",min:null,max:null},
  choice:{name:"선택 항목",type:"select",unit:"",min:null,max:null,options:["항목 1","항목 2"]}
};
function openRecordPreset(presetId) {
  if (presetId === "custom") { openEditor("field"); return; }
  const preset = RECORD_PRESETS[presetId];
  if (!preset) return;
  openEditor("field");
  elements.editorName.value = preset.name;
  elements.editorType.value = preset.type;
  elements.editorUnit.value = preset.unit || "";
  elements.editorMin.value = preset.min ?? "";
  elements.editorMax.value = preset.max ?? "";
  elements.editorOptions.value = (preset.options || []).join("\n");
  updateFieldEditorVisibility();
}
function openEditor(kind, id = "") {
  modalLastFocus = document.activeElement;
  elements.editorKind.value = kind;
  elements.editorId.value = id;
  const isStatus = kind === "status";
  elements.editorModalTitle.textContent = id ? `${isStatus ? "날짜 상태" : "기록 항목"} 편집` : `${isStatus ? "날짜 상태" : "기록 항목"} 추가`;
  elements.editorShortNameWrap.hidden = !isStatus;
  elements.editorColorWrap.hidden = !isStatus;
  elements.editorTypeWrap.hidden = isStatus;
  const item = isStatus ? state.statuses.find(entry => entry.id === id) : state.fields.find(entry => entry.id === id);
  elements.editorName.value = item?.name || "";
  elements.editorShortName.value = item?.shortName || "";
  elements.editorColor.value = item?.color || "#365f73";
  elements.editorType.value = item?.type || "text";
  elements.editorOptions.value = (item?.options || []).join(", ");
  elements.editorUnit.value = item?.unit || "";
  elements.editorMin.value = item?.min ?? "";
  elements.editorMax.value = item?.max ?? "";
  elements.editorDefault.value = item?.defaultValue === false ? "" : (item?.defaultValue ?? "");
  elements.editorRequired.checked = item?.required === true;
  updateFieldEditorVisibility();
  elements.editorModal.hidden = false;
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => elements.editorName.focus());
}
function closeEditor() {
  elements.editorModal.hidden = true;
  document.body.style.overflow = "";
  if (modalLastFocus instanceof HTMLElement) modalLastFocus.focus();
}
function submitEditor() {
  const kind = elements.editorKind.value;
  const id = elements.editorId.value;
  const name = elements.editorName.value.trim().slice(0, 20);
  if (!name) { showToast("이름을 입력해 주세요."); return; }

  if (kind === "status") {
    if (!id && state.statuses.length >= MAX_STATUSES) { showToast("날짜 상태는 최대 12개입니다."); return; }
    const item = {
      id: id || makeUniqueId("status", state.statuses.map(entry => entry.id)),
      name,
      shortName: (elements.editorShortName.value.trim() || name).slice(0, 4),
      color: safeColor(elements.editorColor.value)
    };
    const index = state.statuses.findIndex(entry => entry.id === id);
    if (index >= 0) state.statuses[index] = item;
    else state.statuses.push(item);
  } else {
    if (!id && state.fields.length >= MAX_FIELDS) { showToast("기록 항목은 최대 12개입니다."); return; }
    const previous = state.fields.find(entry => entry.id === id);
    const type = FIELD_TYPES.has(elements.editorType.value) ? elements.editorType.value : "text";
    const minValue = elements.editorMin.value === "" ? null : Number(elements.editorMin.value);
    const maxValue = elements.editorMax.value === "" ? null : Number(elements.editorMax.value);
    if (["number", "currency"].includes(type) && minValue !== null && maxValue !== null && minValue > maxValue) {
      showToast("최솟값은 최댓값보다 클 수 없습니다.");
      elements.editorMin.focus();
      return;
    }
    const item = sanitizeField({
      id: id || makeUniqueId("field", state.fields.map(entry => entry.id)),
      name,
      type,
      options: elements.editorOptions.value,
      unit: elements.editorUnit.value,
      required: elements.editorRequired.checked,
      defaultValue: type === "checkbox" ? false : elements.editorDefault.value,
      min: elements.editorMin.value,
      max: elements.editorMax.value
    }, state.fields.length);
    const index = state.fields.findIndex(entry => entry.id === id);
    if (index >= 0) state.fields[index] = item;
    else state.fields.push(item);
    if (previous && previous.type !== item.type) repairReferences();
  }
  saveState();
  renderSettings();
  renderCalendar();
  closeEditor();
  showToast("설정을 저장했습니다.");
}
function makeUniqueId(prefix, existingIds) {
  let index = Date.now().toString(36);
  let id = `${prefix}_${index}`;
  let suffix = 1;
  while (existingIds.includes(id)) id = `${prefix}_${index}_${suffix++}`;
  return id;
}
function deleteEditorItem(kind, id) {
  if (kind === "status") {
    const item = state.statuses.find(entry => entry.id === id);
    if (!item) return;
    const entryCount = Object.values(state.entries).filter(entry => entry.statusId === id).length;
    const patternCount = state.pattern.sequence.filter(statusId => statusId === id).length;
    const calculationCount = state.calculations.filter(calc => [calc.left, calc.right].some(op => op.type === "statusCount" && op.sourceId === id)).length;
    const details = [
      entryCount && `날짜 기록 ${entryCount}건의 직접 상태 해제`,
      patternCount && `반복 패턴 ${patternCount}칸 제거`,
      calculationCount && `연결 계산 결과 ${calculationCount}개 제거`
    ].filter(Boolean);
    if (!confirm(`${item.name} 상태를 삭제할까요?${details.length ? `\n함께 정리: ${details.join(", ")}` : ""}`)) return;
    state.statuses = state.statuses.filter(entry => entry.id !== id);
  } else {
    const item = state.fields.find(entry => entry.id === id);
    if (!item) return;
    const calculationCount = state.calculations.filter(calc => [calc.left, calc.right].some(op => op.type === "field" && op.sourceId === id)).length;
    if (!confirm(`${item.name} 입력 항목을 삭제할까요?\n저장된 날짜 값이 제거됩니다.${calculationCount ? `\n연결 계산 결과 ${calculationCount}개도 함께 제거됩니다.` : ""}`)) return;
    state.fields = state.fields.filter(entry => entry.id !== id);
  }
  repairReferences();
  patternDraft = [...state.pattern.sequence];
  saveState();
  renderSettings();
  renderCalendar();
  renderSummary();
  showToast("항목과 연결 참조를 안전하게 정리했습니다.");
}


function getTemplateById(templateId) {
  return [...TEMPLATES, ...state.customTemplates].find(item => item.id === templateId) || null;
}
function openTemplatePreview(templateId) {
  const template = getTemplateById(templateId);
  if (!template) return;
  previewTemplateId = templateId;
  modalLastFocus = document.activeElement;
  elements.templatePreviewTitle.textContent = template.name;
  elements.templatePreviewCategory.textContent = `${TEMPLATE_CATEGORY_LABELS[template.custom ? "custom" : template.category] || "템플릿"} · v${template.version || 1}`;
  elements.templatePreviewDescription.textContent = template.description;
  elements.templatePreviewMeta.replaceChildren();
  for (const [label, value] of [["상태",template.statuses.length],["기록 항목",template.fields.length],["계산 결과",template.calculations.length]]) {
    const card = document.createElement("article");
    const small = document.createElement("span"); small.textContent = label;
    const strong = document.createElement("strong"); strong.textContent = String(value);
    card.append(small,strong); elements.templatePreviewMeta.append(card);
  }
  elements.templatePreviewStatuses.replaceChildren();
  for (const status of template.statuses) {
    const chip = document.createElement("span");
    chip.className = "template-preview-chip";
    chip.textContent = status.name;
    chip.style.background = status.color;
    chip.style.color = getReadableTextColor(status.color);
    elements.templatePreviewStatuses.append(chip);
  }
  elements.templatePreviewFields.replaceChildren();
  for (const item of template.fields) {
    const row = document.createElement("span");
    row.textContent = `${item.name} · ${item.type}`;
    elements.templatePreviewFields.append(row);
  }
  if (!template.fields.length) appendEmpty(elements.templatePreviewFields,"기록 항목 없음");
  elements.templatePreviewPattern.textContent = template.pattern.enabled
    ? `${template.pattern.name} · ${template.pattern.sequence.length}일 반복`
    : "반복 패턴 없음";
  elements.templatePreviewCalculations.replaceChildren();
  for (const item of template.calculations) {
    const row = document.createElement("span");
    row.textContent = `${item.name} · ${item.scope === "month" ? "월간" : "날짜"}`;
    elements.templatePreviewCalculations.append(row);
  }
  if (!template.calculations.length) appendEmpty(elements.templatePreviewCalculations,"계산 결과 없음");
  elements.templatePreviewModal.hidden = false;
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => document.querySelector("#templatePreviewClose").focus());
}
function closeTemplatePreview() {
  elements.templatePreviewModal.hidden = true;
  document.body.style.overflow = "";
  previewTemplateId = "";
  if (modalLastFocus instanceof HTMLElement) modalLastFocus.focus();
}
function duplicateTemplate(templateId) {
  const source = getTemplateById(templateId);
  if (!source) return;
  if (state.customTemplates.length >= 20) {
    showToast("사용자 템플릿은 최대 20개입니다.");
    return;
  }
  const ids = [...TEMPLATES.map(item => item.id), ...state.customTemplates.map(item => item.id)];
  const duplicate = sanitizeTemplate({
    ...structuredClone(source),
    id: makeUniqueId("template", ids),
    version: 1,
    name: `${source.name} 복사`.slice(0,30),
    description: `${source.description} · 복제본`.slice(0,80)
  });
  state.customTemplates.push(duplicate);
  saveState();
  renderTemplates();
  showToast("내 템플릿으로 복제했습니다.");
}
function openTemplateNameModal() {
  modalLastFocus = document.activeElement;
  elements.customTemplateName.value = "";
  elements.customTemplateDescription.value = "";
  elements.templateNameModal.hidden = false;
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => elements.customTemplateName.focus());
}
function closeTemplateNameModal() {
  elements.templateNameModal.hidden = true;
  document.body.style.overflow = "";
  if (modalLastFocus instanceof HTMLElement) modalLastFocus.focus();
}
function saveCustomTemplate() {
  if (state.customTemplates.length >= 20) {
    showToast("사용자 템플릿은 최대 20개입니다.");
    return;
  }
  const name = elements.customTemplateName.value.trim().slice(0, 30);
  if (!name) {
    showToast("템플릿 이름을 입력해 주세요.");
    return;
  }
  const template = sanitizeTemplate({
    id: makeUniqueId("template", [...TEMPLATES.map(item => item.id), ...state.customTemplates.map(item => item.id)]),
    name,
    version: 1,
    category: "custom",
    description: elements.customTemplateDescription.value.trim().slice(0, 80) || "사용자가 저장한 현재 구성",
    statuses: state.statuses,
    fields: state.fields,
    pattern: state.pattern,
    calculations: state.calculations,
    theme: state.theme,
    layout: state.layout
  });
  state.customTemplates.push(template);
  saveState();
  renderTemplates();
  closeTemplateNameModal();
  showToast("현재 구성을 사용자 템플릿으로 저장했습니다.");
}
function deleteCustomTemplate(templateId) {
  const template = state.customTemplates.find(item => item.id === templateId);
  if (!template || !confirm(`${template.name} 템플릿을 삭제할까요?`)) return;
  state.customTemplates = state.customTemplates.filter(item => item.id !== templateId);
  saveState();
  renderTemplates();
}
function exportTemplates() {
  if (!state.customTemplates.length) {
    showToast("내보낼 사용자 템플릿이 없습니다.");
    return;
  }
  const payload = {
    exportFormat: "custom-calendar-templates",
    exportVersion: 2,
    createdAt: new Date().toISOString(),
    templates: state.customTemplates
  };
  downloadJson(payload, `custom-calendar-templates-${localISO(new Date())}.json`);
  showToast("사용자 템플릿 파일을 만들었습니다.");
}
async function importTemplates(file) {
  if (!file) return;
  if (file.size > 1024 * 1024) {
    showToast("템플릿 파일은 1MB 이하여야 합니다.");
    return;
  }
  try {
    const payload = JSON.parse(await file.text());
    if (payload?.exportFormat !== "custom-calendar-templates" || !Array.isArray(payload.templates)) {
      throw new Error("format");
    }
    const imported = payload.templates.slice(0, 20).map((item, index) => sanitizeTemplate(item, `imported_${index + 1}`));
    const existingIds = new Set([...TEMPLATES.map(item => item.id), ...state.customTemplates.map(item => item.id)]);
    for (const template of imported) {
      if (existingIds.has(template.id)) template.id = makeUniqueId("template", [...existingIds]);
      existingIds.add(template.id);
    }
    const beforeCount = state.customTemplates.length;
    state.customTemplates = [...state.customTemplates, ...imported].slice(0, 20);
    const addedCount = state.customTemplates.length - beforeCount;
    const skippedCount = imported.length - addedCount;
    saveState();
    renderTemplates();
    showToast(skippedCount > 0 ? `${addedCount}개를 가져왔고 ${skippedCount}개는 저장 한도로 제외했습니다.` : `${addedCount}개 템플릿을 가져왔습니다.`);
  } catch {
    showToast("올바른 템플릿 파일이 아닙니다.");
  } finally {
    elements.templateFileInput.value = "";
  }
}
function downloadJson(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function changeMonth(delta) {
  const viewDate = parseISO(state.viewDate);
  const next = createLocalDate(viewDate.getFullYear(), viewDate.getMonth() + delta, 1);
  state.viewDate = localISO(next);
  state.selectedDate = localISO(next);
  saveState();
  renderCalendar();
  renderSummary();
}
function goToday() {
  const now = new Date();
  state.viewDate = localISO(createLocalDate(now.getFullYear(), now.getMonth(), 1));
  state.selectedDate = localISO(now);
  saveState();
  renderCalendar();
  renderSummary();
}
function setView(target) {
  if (state.activeView === "settings" && target !== "settings" && layoutDraftDirty) {
    const discard = confirm("저장하지 않은 화면 구성 변경이 있습니다.\n변경을 취소하고 이동할까요?");
    if (!discard) return;
    layoutDraft = structuredClone(state.layout);
    layoutDraftDirty = false;
  }
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
  if (target === "summary") renderSummary();
  if (target === "settings") {
    layoutDraft = structuredClone(state.layout);
    layoutDraftDirty = false;
    renderSettings();
  }
  saveState();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 1800);
}
function exportData() {
  const payload = {
    exportFormat: "custom-calendar-stage10",
    createdAt: new Date().toISOString(),
    data: state
  };
  downloadJson(payload, `custom-calendar-stage10-${localISO(new Date())}.json`);
  showToast("JSON 백업 파일을 만들었습니다.");
}
function resetData() {
  if (!confirm("10단계에서 저장한 템플릿, 화면 구성, 기록 항목, 계산 결과, 패턴, 테마와 날짜별 기록을 모두 초기화할까요?")) return;
  state = createDefaultState();
  saveState();
  setView("calendar");
  renderAll();
  showToast("10단계 데이터를 초기화했습니다.");
}
function renderAll() {
  applyTheme(state.theme);
  updateQuickActionLabel();
  document.querySelector("#appTitle").textContent = state.layout.calendarTitle;
  renderNavigation();
  renderCalendar();
  renderSummary();
  renderSettings();
  setView(state.activeView);
}

let pickerMonth = 0;
let swipeStartX = 0, swipeStartY = 0, swipeConsumed = false;
function openMonthPicker() {
  const current = parseISO(state.viewDate);
  elements.yearPickerInput.value = String(current.getFullYear());
  pickerMonth = current.getMonth();
  renderMonthPicker();
  modalLastFocus = document.activeElement;
  elements.monthPickerModal.hidden = false;
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => elements.yearPickerInput.focus());
}
function renderMonthPicker() {
  const year = Math.max(1900, Math.min(2200, Number(elements.yearPickerInput.value) || new Date().getFullYear()));
  elements.yearPickerInput.value = String(year);
  elements.monthPickerGrid.replaceChildren();
  for (let month=0; month<12; month++) {
    const button=document.createElement("button"); button.type="button"; button.dataset.month=String(month);
    button.textContent=`${month+1}월`; button.classList.toggle("active",month===pickerMonth);
    elements.monthPickerGrid.append(button);
  }
}
function closeMonthPicker() { elements.monthPickerModal.hidden=true; document.body.style.overflow=""; if(modalLastFocus instanceof HTMLElement) modalLastFocus.focus(); }
function applyMonthPicker() {
  const year=Math.max(1900,Math.min(2200,Number(elements.yearPickerInput.value)||new Date().getFullYear()));
  const next = createLocalDate(year, pickerMonth, 1);
  state.viewDate = localISO(next);
  state.selectedDate = localISO(next);
  saveState();
  renderCalendar();
  renderSummary();
  closeMonthPicker();
}
document.querySelector("#prevMonthButton").addEventListener("click", () => changeMonth(-1));
document.querySelector("#nextMonthButton").addEventListener("click", () => changeMonth(1));
document.querySelector("#todayButton").addEventListener("click", goToday);
document.querySelector("#quickActionButton").addEventListener("click", () => {
  setView("settings");
  const panelId = QUICK_ACTION_PANEL[state.layout.quickActionTarget] || "statusSettingsPanel";
  document.querySelector(`#${panelId}`).scrollIntoView({ behavior: "smooth", block: "start" });
});
elements.dateSaveStatus.addEventListener("click", retryDateAutosave);
document.querySelector("#clearDateButton").addEventListener("click", clearSelectedDate);
document.querySelector("#addStatusButton").addEventListener("click", () => openEditor("status"));
document.querySelector("#addFieldButton").addEventListener("click", () => openEditor("field"));
document.querySelector("#exportButton").addEventListener("click", exportData);
document.querySelector("#resetButton").addEventListener("click", resetData);
elements.templateSearchInput.addEventListener("input", renderTemplates);
elements.templateCategoryFilter.addEventListener("change", renderTemplates);
document.querySelector("#templatePreviewClose").addEventListener("click", closeTemplatePreview);
document.querySelector("#templatePreviewApply").addEventListener("click", () => {
  const id = previewTemplateId;
  closeTemplatePreview();
  if (id) applyTemplate(id);
});
document.querySelector("#templatePreviewDuplicate").addEventListener("click", () => {
  const id = previewTemplateId;
  closeTemplatePreview();
  if (id) duplicateTemplate(id);
});
elements.templatePreviewModal.addEventListener("click", event => {
  if (event.target === elements.templatePreviewModal) closeTemplatePreview();
});
document.querySelector("#saveCurrentTemplateButton").addEventListener("click", openTemplateNameModal);
document.querySelector("#exportTemplateButton").addEventListener("click", exportTemplates);
document.querySelector("#importTemplateButton").addEventListener("click", () => elements.templateFileInput.click());
elements.templateFileInput.addEventListener("change", () => importTemplates(elements.templateFileInput.files?.[0]));
elements.templateNameForm.addEventListener("submit", event => {
  event.preventDefault();
  saveCustomTemplate();
});
document.querySelector("#templateNameModalClose").addEventListener("click", closeTemplateNameModal);
document.querySelector("#templateNameModalCancel").addEventListener("click", closeTemplateNameModal);
elements.templateNameModal.addEventListener("click", event => {
  if (event.target === elements.templateNameModal) closeTemplateNameModal();
});
elements.themePresetGrid.addEventListener("click", event => {
  const button = event.target.closest("[data-theme-preset]");
  if (!button) return;
  const preset = THEME_PRESETS.find(item => item.id === button.dataset.themePreset);
  if (!preset) return;
  elements.themeBackground.value = preset.background;
  elements.themeSurface.value = preset.surface;
  elements.themeAccent.value = preset.accent;
  elements.themeText.value = preset.text;
  elements.themeRadius.value = preset.radius;
  elements.themeDensity.value = preset.density;
  applyTheme(themeFromInputs());
});
for (const input of [elements.themeBackground, elements.themeSurface, elements.themeAccent, elements.themeText, elements.themeRadius, elements.themeDensity]) {
  input.addEventListener("input", () => applyTheme(themeFromInputs()));
  input.addEventListener("change", () => applyTheme(themeFromInputs()));
}
document.querySelector("#saveThemeButton").addEventListener("click", () => {
  applyTheme(themeFromInputs(), true);
  showToast("테마를 저장했습니다.");
});
document.querySelector("#resetThemeButton").addEventListener("click", () => {
  const preset = THEME_PRESETS[0];
  Object.assign(state.theme, preset);
  applyTheme(state.theme, true);
  renderThemeEditor();
  showToast("기본 테마로 복원했습니다.");
});
elements.navOrderEditor.addEventListener("click", event => {
  const button = event.target.closest("[data-nav-move]");
  const row = event.target.closest(".nav-order-row");
  if (!button || !row) return;
  const index = layoutDraft.navOrder.indexOf(row.dataset.navId);
  const next = index + Number(button.dataset.navMove);
  if (index < 0 || next < 0 || next >= layoutDraft.navOrder.length) return;
  [layoutDraft.navOrder[index], layoutDraft.navOrder[next]] = [layoutDraft.navOrder[next], layoutDraft.navOrder[index]];
  layoutDraftDirty = true;
  renderLayoutEditor();
});
for (const container of [elements.cellItemEditor, elements.detailItemEditor, elements.summaryItemEditor]) {
  container.addEventListener("click", event => {
    const button = event.target.closest("[data-layout-move]");
    const row = event.target.closest("[data-layout-group]");
    if (!button || !row) return;
    const groupMap = { cell: "cellItems", detail: "detailItems", summary: "summaryItems" };
    const key = groupMap[row.dataset.layoutGroup];
    const items = layoutDraft[key];
    const index = items.findIndex(item => item.id === row.dataset.itemId);
    const next = index + Number(button.dataset.layoutMove);
    if (index < 0 || next < 0 || next >= items.length) return;
    [items[index], items[next]] = [items[next], items[index]];
    layoutDraftDirty = true;
  renderLayoutEditor();
  });
  container.addEventListener("change", event => {
    const toggle = event.target.closest("[data-layout-toggle]");
    const row = event.target.closest("[data-layout-group]");
    if (!toggle || !row) return;
    const groupMap = { cell: "cellItems", detail: "detailItems", summary: "summaryItems" };
    const items = layoutDraft[groupMap[row.dataset.layoutGroup]];
    const item = items.find(entry => entry.id === toggle.dataset.layoutToggle);
    if (!item) return;
    item.visible = toggle.checked;
    layoutDraftDirty = true;
    if (row.dataset.layoutGroup !== "cell" && items.filter(entry => entry.visible).length < 1) {
      item.visible = true;
      toggle.checked = true;
      showToast(row.dataset.layoutGroup === "detail" ? "상세보기 항목은 최소 1개가 필요합니다." : "요약 카드는 최소 1개가 필요합니다.");
    }
  });
}
for (const input of [
  elements.calendarTitleInput, elements.quickActionTarget,
  elements.termStatus, elements.termMemo, elements.termFields, elements.termCalculations,
  elements.cellFieldSelect, elements.cellCalculationSelect
]) {
  input.addEventListener("input", () => { layoutDraftDirty = true; });
  input.addEventListener("change", () => { layoutDraftDirty = true; });
}
elements.navOrderEditor.addEventListener("input", event => {
  if (event.target.matches("[data-nav-label]")) layoutDraftDirty = true;
});
document.querySelector("#saveLayoutButton").addEventListener("click", saveLayout);

document.querySelector("#templateGrid").addEventListener("click", event => {
  const action = event.target.closest("[data-template-action]");
  const card = event.target.closest(".template-card");
  if (!card || !action) return;
  if (action.dataset.templateAction === "preview") openTemplatePreview(card.dataset.templateId);
  if (action.dataset.templateAction === "apply") applyTemplate(card.dataset.templateId);
  if (action.dataset.templateAction === "duplicate") duplicateTemplate(card.dataset.templateId);
  if (action.dataset.templateAction === "delete") deleteCustomTemplate(card.dataset.templateId);
});
document.querySelector("#patternPalette").addEventListener("click", event => {
  const button = event.target.closest(".pattern-add");
  if (!button) return;
  if (patternDraft.length >= 31) { showToast("반복 패턴은 최대 31개입니다."); return; }
  patternDraft.push(button.dataset.statusId);
  renderPatternDraft();
});
document.querySelector("#removePatternLastButton").addEventListener("click", () => {
  patternDraft.pop();
  renderPatternDraft();
});
document.querySelector("#savePatternButton").addEventListener("click", savePattern);
document.querySelector("#addCalculationButton").addEventListener("click", () => openCalculationEditor());
elements.calcLeftType.addEventListener("change", () => updateOperandOptions("left"));
elements.calcRightType.addEventListener("change", () => updateOperandOptions("right"));
for (const input of [
  elements.calcLeftSource, elements.calcRightSource, elements.calcLeftConstant, elements.calcRightConstant,
  elements.calculationOperator, elements.calculationMultiply, elements.calculationAdd
]) {
  input.addEventListener("input", updateCalculationPreview);
  input.addEventListener("change", updateCalculationPreview);
}
elements.editorType.addEventListener("change", updateFieldEditorVisibility);

elements.calculationForm.addEventListener("submit", event => {
  event.preventDefault();
  submitCalculation();
});
document.querySelector("#calculationModalClose").addEventListener("click", closeCalculationEditor);
document.querySelector("#calculationModalCancel").addEventListener("click", closeCalculationEditor);
elements.calculationModal.addEventListener("click", event => {
  if (event.target === elements.calculationModal) closeCalculationEditor();
});

elements.calendarGrid.addEventListener("click", event => {
  const cell = event.target.closest(".day-cell");
  if (!cell || swipeConsumed) return;
  const date = parseISO(cell.dataset.date);
  state.selectedDate = cell.dataset.date;
  const currentView = parseISO(state.viewDate);
  if (date.getFullYear() !== currentView.getFullYear() || date.getMonth() !== currentView.getMonth()) {
    state.viewDate = localISO(createLocalDate(date.getFullYear(), date.getMonth(), 1));
  }
  saveState();
  renderCalendar();
  openDateSheet();
});
elements.statusChoiceGrid.addEventListener("click", event => {
  const button = event.target.closest(".status-choice");
  if (!button) return;
  draftEntry.statusId = button.dataset.statusId;
  const resolvedStatusId = draftEntry.statusId || getPatternStatusId(parseISO(state.selectedDate));
  const status = getStatus(resolvedStatusId);
  elements.detailStatus.textContent = status
    ? `${status.name}${draftEntry.statusId ? " · 직접 설정" : " · 반복 패턴"}`
    : "상태 없음";
  elements.detailStatusSwatch.style.background = status?.color || "#b4bec5";
  renderStatusChoices();
  scheduleDateAutosave();
});
elements.detailMemoInput.addEventListener("input", () => scheduleDateAutosave());
elements.customFieldValues.addEventListener("input", () => scheduleDateAutosave());
elements.customFieldValues.addEventListener("change", () => scheduleDateAutosave());
elements.customFieldValues.addEventListener("focusout", () => {
  if (!elements.dateSheetBackdrop.hidden) scheduleDateAutosave({ immediate: true });
});
elements.monthPickerButton.addEventListener("click", openMonthPicker);
document.querySelector("#monthPickerClose").addEventListener("click", closeMonthPicker);
document.querySelector("#monthPickerApply").addEventListener("click", applyMonthPicker);
document.querySelector("#monthPickerToday").addEventListener("click", () => { const now=new Date(); elements.yearPickerInput.value=String(now.getFullYear()); pickerMonth=now.getMonth(); renderMonthPicker(); });
document.querySelector("#yearPrevButton").addEventListener("click", () => { elements.yearPickerInput.value=String(Math.max(1900,Number(elements.yearPickerInput.value)-1)); renderMonthPicker(); });
document.querySelector("#yearNextButton").addEventListener("click", () => { elements.yearPickerInput.value=String(Math.min(2200,Number(elements.yearPickerInput.value)+1)); renderMonthPicker(); });
elements.monthPickerGrid.addEventListener("click", event => { const b=event.target.closest("[data-month]"); if(!b)return; pickerMonth=Number(b.dataset.month); renderMonthPicker(); });
elements.yearPickerInput.addEventListener("change", renderMonthPicker);
elements.monthPickerModal.addEventListener("click", event => { if(event.target===elements.monthPickerModal) closeMonthPicker(); });
document.querySelector("#dateSheetClose").addEventListener("click", () => closeDateSheet());
elements.dateSheetBackdrop.addEventListener("click", event => { if(event.target===elements.dateSheetBackdrop) closeDateSheet(); });
document.querySelector("#dateSelectGuide").addEventListener("click", () => openDateSheet());
document.querySelector("#recordPresetGrid").addEventListener("click", event => { const b=event.target.closest("[data-record-preset]"); if(b) openRecordPreset(b.dataset.recordPreset); });
elements.calendarGrid.addEventListener("touchstart", event => { const t=event.changedTouches[0]; swipeStartX=t.clientX; swipeStartY=t.clientY; swipeConsumed=false; }, {passive:true});
elements.calendarGrid.addEventListener("touchend", event => { const t=event.changedTouches[0]; const dx=t.clientX-swipeStartX, dy=t.clientY-swipeStartY; if(Math.abs(dx)>=48 && Math.abs(dx)>Math.abs(dy)*1.25){ swipeConsumed=true; changeMonth(dx<0?1:-1); setTimeout(()=>{swipeConsumed=false},80); } }, {passive:true});
document.querySelector("#bootRetryButton").addEventListener("click", () => location.reload());
document.querySelector("#bottomNav").addEventListener("click", event => {
  const button = event.target.closest(".nav-item");
  if (!button) return;
  setView(button.dataset.target);
});
document.querySelector("#settingsView").addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  if (button.dataset.kind === "calculation") {
    const index = state.calculations.findIndex(item => item.id === button.dataset.id);
    if (index < 0) return;
    if (button.dataset.action === "edit") openCalculationEditor(button.dataset.id);
    if (button.dataset.action === "delete") {
      const calculation = state.calculations[index];
      if (confirm(`${calculation.name} 계산 결과를 삭제할까요?`)) state.calculations.splice(index, 1);
    }
    if (button.dataset.action === "duplicate") {
      if (state.calculations.length >= MAX_CALCULATIONS) { showToast("계산 결과는 최대 20개입니다."); return; }
      const copy = structuredClone(state.calculations[index]);
      copy.id = makeUniqueId("calc", state.calculations.map(item => item.id));
      copy.name = `${copy.name} 복사`.slice(0, 30);
      state.calculations.splice(index + 1, 0, copy);
    }
    if (button.dataset.action === "up" && index > 0) {
      [state.calculations[index - 1], state.calculations[index]] = [state.calculations[index], state.calculations[index - 1]];
    }
    if (button.dataset.action === "down" && index < state.calculations.length - 1) {
      [state.calculations[index + 1], state.calculations[index]] = [state.calculations[index], state.calculations[index + 1]];
    }
    saveState();
    renderCalculationEditor();
    renderDateCalculations();
    renderMonthCalculations();
    renderHomeCalculations();
    return;
  }
  if (button.dataset.action === "edit") openEditor(button.dataset.kind, button.dataset.id);
  if (button.dataset.action === "delete") deleteEditorItem(button.dataset.kind, button.dataset.id);
});
elements.editorForm.addEventListener("submit", event => {
  event.preventDefault();
  submitEditor();
});
document.querySelector("#modalCloseButton").addEventListener("click", closeEditor);
document.querySelector("#modalCancelButton").addEventListener("click", closeEditor);
elements.editorModal.addEventListener("click", event => {
  if (event.target === elements.editorModal) closeEditor();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !elements.editorModal.hidden) closeEditor();
  if (event.key === "Escape" && !elements.calculationModal.hidden) closeCalculationEditor();
  if (event.key === "Escape" && !elements.templateNameModal.hidden) closeTemplateNameModal();
  if (event.key === "Escape" && !elements.templatePreviewModal.hidden) closeTemplatePreview();
  if (event.key === "Escape" && !elements.monthPickerModal.hidden) closeMonthPicker();
  if (event.key === "Escape" && !elements.dateSheetBackdrop.hidden) closeDateSheet();
});
window.addEventListener("pagehide", () => {
  flushDateAutosave({ refreshSheet: false, silent: true });
  saveState();
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    flushDateAutosave({ refreshSheet: false, silent: true });
    saveState();
  }
});

try {
  renderAll();
  document.documentElement.dataset.appReady = "true";
} catch (error) {
  console.error("Custom Calendar boot failed", error);
  elements.bootError.hidden = false;
}


// Public lifecycle hooks used by the local PWA controller.
window.CustomCalendarApp = Object.freeze({
  version: "1.0.0",
  flush() {
    return flushDateAutosave({ refreshSheet: false, silent: true }) && saveState();
  },
  showToast(message) {
    showToast(String(message || ""));
  }
});
