// ===== DEFAULTS =====
const DEFAULT_MONTH=()=>({
  income:[{id:1,name:'월급',category:'급여',amount:2197223}],
  fixed:[
    {id:1,name:'월세',category:'주거',amount:460000,isSavings:false},
    {id:2,name:'공과금 (전기)',category:'공과금',amount:25710,isSavings:false},
    {id:3,name:'공과금 (가스)',category:'공과금',amount:7650,isSavings:false},
    {id:4,name:'기부/주차',category:'기타',amount:10000,isSavings:false},
    {id:5,name:'보험+휴대폰',category:'보험/통신',amount:120000,isSavings:false},
    {id:6,name:'국민은행 적금',category:'저축',amount:1200000,isSavings:true},
    {id:7,name:'주택청약',category:'저축',amount:50000,isSavings:true},
  ],
  variable:[],
});

const DEFAULT_DATA=()=>{
  const _n=new Date();const _y=_n.getFullYear();const _m=_n.getMonth()+1;
  return ({
  monthlyData:{},creditCards:[],assets:[],
  stocks:[
    {id:1,name:'삼성전자우',ticker:'005935',sector:'반도체',buyPrice:109472,currentPrice:109472,targetPrice:0,quantity:1,stockType:'domestic'},
    {id:2,name:'삼성전자',ticker:'005930',sector:'반도체',buyPrice:156700,currentPrice:156700,targetPrice:0,quantity:1,stockType:'domestic'},
    {id:3,name:'미국 나스닥 ETF',ticker:'QQQ',sector:'ETF',buyPrice:49145,currentPrice:49145,targetPrice:0,quantity:1,stockType:'foreign',buyAmount:49145,currentAmount:49145},
    {id:4,name:'426030',ticker:'426030',sector:'ETF',buyPrice:55780,currentPrice:55780,targetPrice:0,quantity:1,stockType:'domestic'},
  ],
  consumptionCalendar:{},savingsGoals:{},foodCalendar:{},foodDirectSet:{},
  cardSettings:[{
    id:1,name:'신한카드 MR.LIFE',
    rates:[
      {id:1,minMonths:2,maxMonths:2,rate:5.9},
      {id:2,minMonths:3,maxMonths:3,rate:7.9},
      {id:3,minMonths:4,maxMonths:6,rate:10.9},
      {id:4,minMonths:7,maxMonths:12,rate:13.9},
      {id:5,minMonths:13,maxMonths:24,rate:15.9},
    ]
  }],
  currentMonths:{dashboard:{y:_y,m:_m},income:{y:_y,m:_m},credit:{y:_y,m:_m},food:{y:_y,m:_m},ledger:{y:_y,m:_m}},
  calYear:_y,ledger:{},subscriptions:[],automations:[],closedMonths:{},ledgerFilter:null,ledgerTagFilter:null,
  budgetCategories:[
    {id:101,name:'식비',budget:200000,synced:true,syncFrom:'',linkedCategories:[]},
    {id:102,name:'생필품',budget:200000,synced:true,syncFrom:'',linkedCategories:[]},
    {id:103,name:'문화/여가',budget:200000,synced:true,syncFrom:'',linkedCategories:[]},
    {id:104,name:'기타',budget:200000,synced:true,syncFrom:'',linkedCategories:[]},
  ],
  monthBudgets:{},
  assetCategories:['계좌','적금','주식'],
  remainingBudgetSettings:{label:'현재 남은 예산',amount:0},
  fundCalc:{amount:0,items:[],assetLinked:false,assetLinkedAt:null,linkedAssetIds:[]},
  stockAssetDirect:false,
  stockAssetAutoId:null,
  defaultItems:{income:[],fixed:[]},
  calFoodSync:{},
  ledgerCategories:[
    {id:1,name:'🍚 식비',isSavings:false},
    {id:2,name:'🧴 생활용품',isSavings:false},
    {id:3,name:'🏠 주거·공과금',isSavings:false},
    {id:4,name:'🚗 교통·차량',isSavings:false},
    {id:5,name:'💪 건강',isSavings:false},
    {id:6,name:'🎨 문화·취미',isSavings:false},
    {id:7,name:'👕 패션·미용',isSavings:false},
    {id:8,name:'💰 금융',isSavings:false},
    {id:9,name:'✈ 여행',isSavings:false},
    {id:10,name:'🎁 경조사',isSavings:false},
    {id:11,name:'📦 기타',isSavings:false},
  ],
});};

let S=null;

function loadState(){
  try{
    const raw=localStorage.getItem('kakeibo_v4');
    if(raw){
      S=JSON.parse(raw);
      const D=DEFAULT_DATA();
      if(!S.monthlyData)S.monthlyData={};
      if(!S.cardSettings)S.cardSettings=D.cardSettings;
      if(!S.currentMonths)S.currentMonths=D.currentMonths;
      if(!S.calYear)S.calYear=new Date().getFullYear();
      if(!S.savingsGoals)S.savingsGoals={};
      if(!S.foodDirectSet)S.foodDirectSet={};
      if(!S.foodCalendar)S.foodCalendar={};
      if(!S.creditCards)S.creditCards=[];
      if(!S.assets)S.assets=[];
      if(!S.stocks)S.stocks=D.stocks;
      if(!S.consumptionCalendar)S.consumptionCalendar={};
      if(!S.ledger)S.ledger={};
      if(!S.subscriptions)S.subscriptions=[];
      if(!S.automations)S.automations=[];
      // Migrate automations: add type/memo/tags for old entries
      S.automations=S.automations.map(a=>({type:'expense',memo:a.name||'',tags:[],...a}));
      if(!S.autoSkippedIds)S.autoSkippedIds=[];
      if(!S.closedMonths)S.closedMonths={};
      if(!S.budgetCategories)S.budgetCategories=DEFAULT_DATA().budgetCategories;
      if(!S.monthBudgets)S.monthBudgets={};
      if(!S.assetCategories)S.assetCategories=['계좌','적금','주식'];
      if(!S.remainingBudgetSettings)S.remainingBudgetSettings={label:'현재 남은 예산',amount:0};
      // Migrate per-category sync: add synced/syncFrom/linkedCategories to old categories
      S.budgetCategories=S.budgetCategories.map(c=>({synced:true,syncFrom:'',linkedCategories:[],...c}));
      if(!S.ledgerCategories)S.ledgerCategories=DEFAULT_DATA().ledgerCategories;
      // Migrate fundCalc: add assetLinked field
      if(!S.fundCalc)S.fundCalc={amount:0,items:[],assetLinked:false,assetLinkedAt:null,linkedAssetIds:[]};
      if(S.fundCalc.assetLinked===undefined)S.fundCalc.assetLinked=false;
      if(S.fundCalc.assetLinkedAt===undefined)S.fundCalc.assetLinkedAt=null;
      if(!S.fundCalc.linkedAssetIds)S.fundCalc.linkedAssetIds=[];
      if(S.stockAssetDirect===undefined)S.stockAssetDirect=false;
      if(S.stockAssetAutoId===undefined)S.stockAssetAutoId=null;
      if(!S.calFoodSync)S.calFoodSync={};
      // 예산 카테고리 강제 리셋 (식비/생필품/문화여가/기타 각 20만)
      if(!S._budget_reset_v2){
        S.budgetCategories=[
          {id:201,name:'식비',budget:200000,synced:true,syncFrom:'',linkedCategories:[]},
          {id:202,name:'생필품',budget:200000,synced:true,syncFrom:'',linkedCategories:[]},
          {id:203,name:'문화/여가',budget:200000,synced:true,syncFrom:'',linkedCategories:[]},
          {id:204,name:'기타',budget:200000,synced:true,syncFrom:'',linkedCategories:[]},
        ];
        S.monthBudgets={};
        S._budget_reset_v2=true;
      }
      if(S.ledgerFilter===undefined)S.ledgerFilter=null;
      if(S.ledgerTagFilter===undefined)S.ledgerTagFilter=null;
      if(!S.currentMonths.ledger)S.currentMonths.ledger={...S.currentMonths.dashboard};
      // 가계부 카테고리 기본값 재설정 (v1: 식비/생활/주거/교통/문화/저축투자/기타)
      if(!S._lcat_reset_v1){
        S.ledgerCategories=[
          {id:1,name:'식비',isSavings:false},
          {id:2,name:'생활',isSavings:false},
          {id:3,name:'주거/공과',isSavings:false},
          {id:4,name:'교통',isSavings:false},
          {id:5,name:'문화/여가',isSavings:false},
          {id:6,name:'저축/투자',isSavings:true},
          {id:7,name:'기타',isSavings:false},
        ];
        S._lcat_reset_v1=true;
      }
      // 가계부 카테고리 이모지 버전으로 재설정 (v2: 11개 이모지 카테고리)
      if(!S._lcat_reset_v2){
        S.ledgerCategories=[
          {id:1,name:'🍚 식비',isSavings:false},
          {id:2,name:'🧴 생활용품',isSavings:false},
          {id:3,name:'🏠 주거·공과금',isSavings:false},
          {id:4,name:'🚗 교통·차량',isSavings:false},
          {id:5,name:'💪 건강',isSavings:false},
          {id:6,name:'🎨 문화·취미',isSavings:false},
          {id:7,name:'👕 패션·미용',isSavings:false},
          {id:8,name:'💰 금융',isSavings:false},
          {id:9,name:'✈ 여행',isSavings:false},
          {id:10,name:'🎁 경조사',isSavings:false},
          {id:11,name:'📦 기타',isSavings:false},
        ];
        S._lcat_reset_v2=true;
      }
      S.stocks=S.stocks.map(st=>{
        const isKrTicker=/^\d{6}$/.test(st.ticker);
        const defaultType=isKrTicker?'domestic':'foreign';
        return {sector:'',targetPrice:0,stockType:defaultType,...st};
      });
      // Migrate savingsGoals old format
      for(const y of Object.keys(S.savingsGoals)){
        const val=S.savingsGoals[y];
        if(val&&!Array.isArray(val)){
          const flat=[];
          for(const m of Object.keys(val)){if(Array.isArray(val[m]))val[m].forEach(g=>flat.push({...g,id:genId()}))}
          S.savingsGoals[y]=flat;
        }
      }
      // DATA MIGRATION: remove 커피+샐러드, autoFromFood; add isSavings to fixed items
      if(!S._migrated_v2){
        for(const key of Object.keys(S.monthlyData)){
          const d=S.monthlyData[key];
          if(d.variable){
            d.variable=d.variable.filter(v=>v.name!=='커피+샐러드'&&!v.autoFromFood);
          }
          if(d.fixed){
            d.fixed=d.fixed.map(f=>({isSavings:f.category==='저축'||f.isSavings===true,...f}));
          }
        }
        S._migrated_v2=true;
        saveState();
      }
    } else {
      const oldRaw=localStorage.getItem('kakeibo_v3');
      if(oldRaw){
        const old=JSON.parse(oldRaw);
        S=DEFAULT_DATA();
        S.creditCards=old.creditCards||[];S.assets=old.assets||[];
        S.stocks=(old.stocks||DEFAULT_DATA().stocks).map(st=>{
        const isKrTicker=/^\d{6}$/.test(st.ticker);
        const defaultType=isKrTicker?'domestic':'foreign';
        return {sector:'',targetPrice:0,stockType:defaultType,...st};
      });
        S.consumptionCalendar=old.consumptionCalendar||{};
        S.savingsGoals=old.savingsGoals||{};
        S.foodCalendar=old.foodCalendar||{};
        S.foodDirectSet=old.foodDirectSet||{};
        S.cardSettings=old.cardSettings||DEFAULT_DATA().cardSettings;
        S.currentMonths=old.currentMonths||DEFAULT_DATA().currentMonths;
        S.calYear=old.calYear||2026;
        if(old.globalIncome||old.globalFixed||old.globalVariable){
          const cm=S.currentMonths.dashboard;const key=mkey(cm.y,cm.m);
          const def=DEFAULT_MONTH();
          S.monthlyData[key]={
            income:old.globalIncome||def.income,
            fixed:(old.globalFixed||def.fixed).map(f=>({isSavings:f.category==='저축',...f})),
            variable:(old.globalVariable||[]).filter(v=>v.name!=='커피+샐러드'&&!v.autoFromFood),
          };
        }
        S._migrated_v2=true;
      } else {S=DEFAULT_DATA();S._migrated_v2=true;}
    }
  } catch(e){S=DEFAULT_DATA();S._migrated_v2=true;}
}

function saveState(){
  try{localStorage.setItem('kakeibo_v4',JSON.stringify(S));}catch(e){alert('저장 공간이 부족합니다. 백업 후 일부 데이터를 정리해 주세요.');}
  if(window.FB_SAVE) window.FB_SAVE(S);
}

// Firebase에서 불러온 데이터를 S에 병합
window.FB_MERGE = function(fbData) {
  try {
    S = fbData;
    const D = DEFAULT_DATA();
    if(!S.monthlyData)S.monthlyData={};
    if(!S.cardSettings)S.cardSettings=D.cardSettings;
    if(!S.currentMonths)S.currentMonths=D.currentMonths;
    if(!S.calYear)S.calYear=new Date().getFullYear();
    if(!S.savingsGoals)S.savingsGoals={};
    if(!S.foodDirectSet)S.foodDirectSet={};
    if(!S.foodCalendar)S.foodCalendar={};
    if(!S.creditCards)S.creditCards=[];
    if(!S.assets)S.assets=[];
    if(!S.stocks)S.stocks=D.stocks;
    if(!S.consumptionCalendar)S.consumptionCalendar={};
    if(!S.ledger)S.ledger={};
    if(!S.subscriptions)S.subscriptions=[];
    if(!S.automations)S.automations=[];
    // Migrate automations: add type/memo/tags for old entries
    S.automations=S.automations.map(a=>({type:'expense',memo:a.name||'',tags:[],...a}));
    if(!S.autoSkippedIds)S.autoSkippedIds=[];
    if(!S.closedMonths)S.closedMonths={};
    if(!S.budgetCategories)S.budgetCategories=D.budgetCategories;
    if(!S.monthBudgets)S.monthBudgets={};
    if(!S.assetCategories)S.assetCategories=['계좌','적금','주식'];
    if(!S.remainingBudgetSettings)S.remainingBudgetSettings={label:'현재 남은 예산',amount:0};
    if(!S.ledgerCategories)S.ledgerCategories=D.ledgerCategories;
    if(S.stockAssetDirect===undefined)S.stockAssetDirect=false;
    if(S.stockAssetAutoId===undefined)S.stockAssetAutoId=null;
    if(!S.calFoodSync)S.calFoodSync={};
    // 가계부 카테고리 이모지 버전으로 재설정 (v2)
    if(!S._lcat_reset_v2){
      S.ledgerCategories=[
        {id:1,name:'🍚 식비',isSavings:false},
        {id:2,name:'🧴 생활용품',isSavings:false},
        {id:3,name:'🏠 주거·공과금',isSavings:false},
        {id:4,name:'🚗 교통·차량',isSavings:false},
        {id:5,name:'💪 건강',isSavings:false},
        {id:6,name:'🎨 문화·취미',isSavings:false},
        {id:7,name:'👕 패션·미용',isSavings:false},
        {id:8,name:'💰 금융',isSavings:false},
        {id:9,name:'✈ 여행',isSavings:false},
        {id:10,name:'🎁 경조사',isSavings:false},
        {id:11,name:'📦 기타',isSavings:false},
      ];
      S._lcat_reset_v2=true;
    }
    // 예산 카테고리 강제 리셋
    if(!S._budget_reset_v2){
      S.budgetCategories=[
        {id:201,name:'식비',budget:200000,synced:true,syncFrom:'',linkedCategories:[]},
        {id:202,name:'생필품',budget:200000,synced:true,syncFrom:'',linkedCategories:[]},
        {id:203,name:'문화/여가',budget:200000,synced:true,syncFrom:'',linkedCategories:[]},
        {id:204,name:'기타',budget:200000,synced:true,syncFrom:'',linkedCategories:[]},
      ];
      S.monthBudgets={};
      S._budget_reset_v2=true;
    }
    if(S.ledgerFilter===undefined)S.ledgerFilter=null;
    if(!S.currentMonths.ledger)S.currentMonths.ledger={...S.currentMonths.dashboard};
    S.budgetCategories=S.budgetCategories.map(c=>({synced:true,syncFrom:'',linkedCategories:[],...c}));
    // Migrate fundCalc: add assetLinked field
    if(!S.fundCalc)S.fundCalc={amount:0,items:[],assetLinked:false,assetLinkedAt:null,linkedAssetIds:[]};
    if(S.fundCalc.assetLinked===undefined)S.fundCalc.assetLinked=false;
    if(S.fundCalc.assetLinkedAt===undefined)S.fundCalc.assetLinkedAt=null;
    if(!S.fundCalc.linkedAssetIds)S.fundCalc.linkedAssetIds=[];
  } catch(e) { console.error('[FB_MERGE] 오류:', e); }
};


// ===== MONTHLY THEMES =====
const MONTH_THEMES = {
  1:  { t1:'#1A237E', t2:'#42A5F5', bg:'#EEF4FF', border:'#DDEAFF', name:'1월 딥네이비',
        cards:{ income:'#42A5F5', fixed:'#EF7B74', variable:'#FFB347', budget:'#7986CB' } },
  2:  { t1:'#AD1457', t2:'#F48FB1', bg:'#FFF0F5', border:'#FFD6E7', name:'2월 로즈핑크',
        cards:{ income:'#F48FB1', fixed:'#BA68C8', variable:'#FFB74D', budget:'#4DB6AC' } },
  3:  { t1:'#1B5E20', t2:'#66BB6A', bg:'#F0FFF4', border:'#C8EDD9', name:'3월 민트그린',
        cards:{ income:'#66BB6A', fixed:'#EF7B74', variable:'#FFA726', budget:'#42A5F5' } },
  4:  { t1:'#6A1B9A', t2:'#CE93D8', bg:'#F9F0FF', border:'#E8D5F5', name:'4월 라벤더',
        cards:{ income:'#CE93D8', fixed:'#F48FB1', variable:'#FFCC80', budget:'#80DEEA' } },
  5:  { t1:'#5E4BC4', t2:'#A29BFE', bg:'#F7F4FF', border:'#EEE9FF', name:'5월 퍼플',
        cards:{ income:'#A29BFE', fixed:'#F06292', variable:'#FDCB6E', budget:'#74B9FF' } },
  6:  { t1:'#0277BD', t2:'#4FC3F7', bg:'#EFF8FF', border:'#C9E8FF', name:'6월 오션블루',
        cards:{ income:'#4FC3F7', fixed:'#EF7B74', variable:'#FFA726', budget:'#80CBC4' } },
  7:  { t1:'#BF360C', t2:'#FF7043', bg:'#FFF4F0', border:'#FFD4C4', name:'7월 코랄핑크',
        cards:{ income:'#FF7043', fixed:'#CE93D8', variable:'#FFCA28', budget:'#7CB88A' } },
  8:  { t1:'#212121', t2:'#757575', bg:'#F4F4F4', border:'#E0E0E0', name:'8월 다크블랙',
        cards:{ income:'#90A4AE', fixed:'#EF9A9A', variable:'#FFF176', budget:'#80DEEA' } },
  9:  { t1:'#E65100', t2:'#FFA726', bg:'#FFF8EE', border:'#FFE0C0', name:'9월 앰버오렌지',
        cards:{ income:'#FFA726', fixed:'#EC407A', variable:'#FFEE58', budget:'#4DB6AC' } },
  10: { t1:'#B71C1C', t2:'#EF9A9A', bg:'#FFF5F5', border:'#FFD0D0', name:'10월 버건디레드',
        cards:{ income:'#EF9A9A', fixed:'#CE93D8', variable:'#FFCC80', budget:'#80CBC4' } },
  11: { t1:'#4E342E', t2:'#A1887F', bg:'#FDF5F0', border:'#EDD9C8', name:'11월 웜브라운',
        cards:{ income:'#A1887F', fixed:'#CE93D8', variable:'#FFCC80', budget:'#A5D6A7' } },
  12: { t1:'#1B5E20', t2:'#00BCD4', bg:'#F0FBF5', border:'#C5EDD6', name:'12월 에메랄드',
        cards:{ income:'#00BCD4', fixed:'#F06292', variable:'#FFCA28', budget:'#90CAF9' } },
};

function applyMonthTheme(m) {
  const t = MONTH_THEMES[m] || MONTH_THEMES[5];
  const root = document.documentElement.style;
  root.setProperty('--t1', t.t1);
  root.setProperty('--t2', t.t2);
  root.setProperty('--t-bg', t.bg);
  root.setProperty('--t-border', t.border);
  root.setProperty('--t-light', t.bg);
  // 카드 상단 띠 컬러 — 테마별 보조 컬러 세트 적용
  if(t.cards) {
    root.setProperty('--card-income-strip', t.cards.income);
    root.setProperty('--card-fixed-strip', t.cards.fixed);
    root.setProperty('--card-var-strip', t.cards.variable);
    root.setProperty('--card-budget-strip', t.cards.budget);
  }
  // bg도 함께 변경
  document.body.style.background = t.bg;
}

// ===== HELPERS =====
function fmt(n){if(n===undefined||n===null||isNaN(n))return'0원';return Math.round(n).toLocaleString('ko-KR')+'원';}
function fmtSigned(n){return n>0?'+'+fmt(n):fmt(n);}

// ===== NUMBER INPUT FORMATTING =====
function numInputFmt(el){
  const raw=el.value.replace(/[^0-9]/g,'');
  if(!raw){el.value='';return;}
  el.value=Number(raw).toLocaleString('ko-KR');
}
function numInputParse(val){
  return parseFloat(String(val||'').replace(/[^0-9.]/g,''))||0;
}
function genId(){return Date.now()+Math.floor(Math.random()*9999);}
function mkey(y,m){return y+'-'+m;}

function getMonthData(y,m){
  const key=mkey(y,m);
  if(!S.monthlyData[key]){
    const di=S.defaultItems||{income:[],fixed:[]};
    const hasDefaults=di.income.length>0||di.fixed.length>0;
    let py=y,pm=m-1;if(pm<1){pm=12;py--;}
    const prevKey=mkey(py,pm);
    if(hasDefaults){
      // Use saved defaults as the template
      S.monthlyData[key]={
        income:di.income.map(i=>({...i,id:genId()})),
        fixed:di.fixed.map(i=>({...i,id:genId()})),
        variable:[],
      };
    } else if(S.monthlyData[prevKey]){
      const prev=S.monthlyData[prevKey];
      S.monthlyData[key]={
        income:prev.income.map(i=>({...i,id:genId()})),
        fixed:prev.fixed.map(i=>({...i,id:genId()})),
        variable:prev.variable.filter(v=>!v.autoFromFood&&v.name!=='커피+샐러드').map(i=>({...i,id:genId()})),
      };
    } else {
      const def=DEFAULT_MONTH();
      S.monthlyData[key]={
        income:def.income.map(i=>({...i})),
        fixed:def.fixed.map(i=>({...i})),
        variable:def.variable.map(i=>({...i})),
      };
    }
    saveState();
  }
  return S.monthlyData[key];
}

function getFoodTotal(y,m){
  const key=mkey(y,m);
  const direct=S.foodDirectSet[key];
  if(direct&&direct.direct)return direct.amount||0;
  const days=S.foodCalendar[key]||{};
  return Object.values(days).reduce((s,d)=>s+(parseFloat(d.amount)||0),0);
}

function getCreditMonthTotal(y,m){
  let total=0;
  for(const card of S.creditCards){
    if(isCardDueInMonth(card,y,m)){
      const monthly=Math.ceil(card.amount/card.months);
      if(!(card.paidMonths||[]).includes(mkey(y,m)))total+=monthly;
    }
  }
  return total;
}

function isCardDueInMonth(card,y,m){
  for(let i=0;i<card.months;i++){
    let mm=card.startMonth+i,yy=card.startYear;
    while(mm>12){mm-=12;yy++;}
    if(yy===y&&mm===m)return true;
  }
  return false;
}

function getCardTotalRemaining(card){
  const monthly=Math.ceil(card.amount/card.months);
  return card.amount-(card.paidMonths||[]).length*monthly;
}

function getLedgerCategorySums(y,m){
  const key=mkey(y,m);
  const entries=S.ledger[key]||[];
  const sums={};
  entries.filter(e=>e.type==='expense'&&!e.creditAutoId).forEach(e=>{
    sums[e.category]=(sums[e.category]||0)+e.amount;
  });
  return sums;
}

function getEffectiveVariable(y,m){
  const data=getMonthData(y,m);
  const ledgerSums=getLedgerCategorySums(y,m);
  const ledgerCats=Object.keys(ledgerSums);

  // Credit auto items: look up actual category from ledger entry (user may have edited it)
  const key=mkey(y,m);
  const ledgerEntries=S.ledger[key]||[];
  const creditAutoItems=(data.variable||[]).filter(item=>item.autoFromCredit);
  // Merge credit items by their actual ledger category
  const creditCatMap={};
  creditAutoItems.forEach(item=>{
    const ledEntry=ledgerEntries.find(e=>e.creditAutoId===item.creditAutoId);
    const cat=ledEntry?ledEntry.category:(item.category||'신용카드');
    creditCatMap[cat]=(creditCatMap[cat]||0)+(parseFloat(item.amount)||0);
  });
  const creditItems=Object.entries(creditCatMap).map(([cat,amt])=>({
    id:'credit_cat_'+cat,
    name:cat,
    category:cat,
    amount:amt+(ledgerSums[cat]||0),
    autoFromCredit:true,
    autoFromLedger:(ledgerSums[cat]||0)>0
  }));

  // Manual items (no autoFromFood, no autoFromCredit, sync ledger amounts for all categories including 식비)
  const manual=(data.variable||[]).filter(item=>!item.autoFromFood&&!item.autoFromCredit&&item.name!=='커피+샐러드').map(item=>{
    if(ledgerSums[item.category]!==undefined&&ledgerSums[item.category]>0){
      return{...item,amount:ledgerSums[item.category],autoFromLedger:true};
    }
    return item;
  });

  // Ledger-only items (exclude credit auto entries)
  const manualCats=new Set(manual.map(i=>i.category));
  const creditCats=new Set(creditItems.map(i=>i.category));
  const ledgerItems=ledgerCats
    .filter(cat=>!manualCats.has(cat)&&!creditCats.has(cat)&&ledgerSums[cat]>0)
    .map(cat=>({id:'led_'+cat,name:cat,category:cat,amount:ledgerSums[cat],autoFromLedger:true}));

  return[...manual,...ledgerItems,...creditItems];
}

function getCardRate(cardId,months){
  const card=S.cardSettings.find(c=>c.id===cardId);if(!card)return 0;
  for(const r of card.rates){if(months>=r.minMonths&&months<=r.maxMonths)return r.rate;}
  return 0;
}

function getTotalIncome(y,m){return getMonthData(y,m).income.reduce((s,i)=>s+(parseFloat(i.amount)||0),0);}
function getTotalFixed(y,m){return getMonthData(y,m).fixed.reduce((s,i)=>s+(parseFloat(i.amount)||0),0);}
function getTotalSavings(y,m){return getLedgerSavings(y,m);}
function getLedgerSavings(y,m){
  const key=mkey(y,m);
  const entries=S.ledger[key]||[];
  // #저축 태그가 달린 지출 항목만 저축으로 집계
  return entries.filter(e=>e.type==='expense'&&(e.tags||[]).includes('저축')).reduce((s,e)=>s+e.amount,0);
}
function getTotalVariable(y,m){return getEffectiveVariable(y,m).reduce((s,i)=>s+(parseFloat(i.amount)||0),0);}
function getTotalAssets(){return S.assets.reduce((s,a)=>s+(parseFloat(a.amount)||0),0);}
function getTotalStockValue(){return S.stocks.reduce((s,st)=>{
  if(st.stockType==='foreign'||st.stockType==='gold')return s+(parseFloat(st.currentAmount)||0);
  return s+(parseFloat(st.currentPrice)||0)*(parseFloat(st.quantity)||0);
},0);}
function getTotalStockCost(){return S.stocks.reduce((s,st)=>{
  if(st.stockType==='foreign'||st.stockType==='gold')return s+(parseFloat(st.buyAmount)||0);
  return s+(parseFloat(st.buyPrice)||0)*(parseFloat(st.quantity)||0);
},0);}

// Budget cats: per-category sync
function monthNum(y,m){return y*12+m;}
function parseSyncFrom(s){if(!s)return 0;const p=s.split('-');return monthNum(parseInt(p[0]),parseInt(p[1]));}
function getActiveBudgetCats(y,m){
  const curNum=monthNum(y,m);
  const key=mkey(y,m);
  const monthOverrides=(S.monthBudgets&&S.monthBudgets[key])||{};
  return (S.budgetCategories||[]).map(cat=>{
    const sfNum=parseSyncFrom(cat.syncFrom);
    const useGlobal=cat.synced&&(sfNum===0||curNum>=sfNum);
    if(useGlobal)return cat;
    // use per-month override if exists
    const ov=monthOverrides[cat.id];
    if(ov!==undefined)return{...cat,budget:ov};
    return cat;
  });
}

function renderAll(){
  applyMonthTheme(S.currentMonths.dashboard.m);
  renderDashboard();renderIncome();renderCredit();renderAssets();
  renderCalendar();renderFood();renderInstallment();
  renderLedger();renderLcatPanel();
}

// ===== BUDGET CATEGORIES =====
function renderBudget(y,m){
  const el=document.getElementById('budget-cat-list');
  const footer=document.getElementById('budget-cat-footer');
  if(!el)return;

  const cats=getActiveBudgetCats(y,m);
  const effectiveVars=getEffectiveVariable(y,m);
  const foodTotal=getFoodTotal(y,m);
  const ledgerSums=getLedgerCategorySums(y,m);
  // Build catSpent: from effective variable (unless linkedCategories is set)
  const catSpent={};
  effectiveVars.forEach(v=>{catSpent[v.category]=(catSpent[v.category]||0)+(parseFloat(v.amount)||0);});

  if(cats.length===0){
    el.innerHTML=`<div class="budget-empty">+ 항목 추가로 카테고리별 예산을 설정하세요</div>`;
    if(footer)footer.innerHTML='';
    return;
  }

  // 카테고리별 실제 지출 계산 (linkedCategories가 있으면 가계부 합산)
  function getCatSpent(cat){
    const linked=(cat.linkedCategories||[]);
    if(linked.length>0){
      return linked.reduce((s,lname)=>s+(ledgerSums[lname]||0),0);
    }
    return catSpent[cat.name]||0;
  }

  el.innerHTML=cats.map(cat=>{
    const spent=getCatSpent(cat);
    // For 식비: use food calendar total as budget if not manually set
    let effectiveBudget=cat.budget;
    let foodBadge='';
    if(cat.name==='식비'){
      if(!cat.foodBudgetManual&&foodTotal>0){
        effectiveBudget=foodTotal;
        foodBadge='<span style="font-size:10px;color:var(--blue);margin-left:4px;">(캘린더예산)</span>';
      } else {
        foodBadge='<span style="font-size:10px;color:var(--green);margin-left:4px;">(식비)</span>';
      }
    }
    const pct=effectiveBudget>0?Math.min(100,(spent/effectiveBudget)*100):0;
    const color=pct>=90?'var(--red)':pct>=70?'var(--orange)':'var(--green)';
    const rem=effectiveBudget-spent;
    // 연동된 가계부 카테고리 태그 (인라인, 첫째+N 형식)
    const linkedArr=cat.linkedCategories||[];
    const hasLinked=linkedArr.length>0;
    const linkedTagsHtml=hasLinked
      ?(linkedArr.length===1
        ?`<span class="budget-linked-tag">📒${linkedArr[0]}</span>`
        :`<span class="budget-linked-tag">📒${linkedArr[0]}+${linkedArr.length-1}</span>`)
      :'';
    // 기본값 설정 모드
    const da=_defaultMode?` data-drag-id="${cat.id}" draggable="true" ondragstart="App._dmDragStart(event,'budget',${cat.id})" ondragover="App._dmDragOver(event,'budget')" ondragleave="App._dmDragLeave(event)" ondrop="App._dmDrop(event,'budget',${cat.id})" ondragend="App._dmDragEnd(event)"`:'';
    const defaultChk=_defaultMode
      ?`<span class="dm-handle" ontouchstart="App._dmTouchStart(event,'budget-cat-list')">⠿</span><input type="checkbox" class="budget-default-chk" data-id="${cat.id}" ${cat.synced!==false?'checked':''} style="accent-color:var(--green);width:15px;height:15px;flex-shrink:0;cursor:pointer;"/>`
      :'';
    return `
      <div class="budget-cat-row${_defaultMode?' default-mode-item':''}"${da}>
        <div class="budget-cat-top">
          <div style="display:flex;align-items:center;gap:5px;flex:1;min-width:0;overflow:hidden;">
            ${defaultChk}
            <span class="budget-cat-name" style="flex-shrink:0;">${cat.name}${foodBadge}</span>
            ${linkedTagsHtml}
          </div>
          <div style="display:flex;align-items:center;gap:4px;flex-shrink:0;">
            <span class="budget-cat-amounts">${fmt(spent)}<span class="budget-cat-of"> / ${fmt(effectiveBudget)}</span></span>
            ${_defaultMode?'':
              `<button class="budget-link-text-btn${hasLinked?' linked':''}" onclick="App.openBudgetCatSyncModal(${cat.id})">🔗</button>
               <button class="icon-btn" onclick="App.openBudgetModal(${cat.id})">✏️</button>
               <button class="icon-btn" onclick="App.deleteBudgetCategory(${cat.id})">🗑️</button>`}
          </div>
        </div>
        <div class="budget-cat-bar-wrap">
          <div class="budget-cat-bar-fill" style="width:${pct}%;background:${color}"></div>
        </div>
        <div class="budget-cat-bottom">
          <span class="budget-cat-pct">${pct.toFixed(0)}% 사용</span>
          <span style="font-size:11px;color:${rem>=0?'var(--green)':'var(--red)'};">${rem>=0?'잔여 '+fmt(rem):'초과 '+fmt(-rem)}</span>
        </div>
      </div>`;
  }).join('');

  if(footer){
    const totalBudget=cats.reduce((s,c)=>{
      if(c.name==='식비'&&!c.foodBudgetManual&&foodTotal>0)return s+foodTotal;
      return s+c.budget;
    },0);
    const totalSpent=cats.reduce((s,c)=>s+getCatSpent(c),0);
    const rem=totalBudget-totalSpent;
    const pct=totalBudget>0?(totalSpent/totalBudget*100).toFixed(1):0;
    const color=parseFloat(pct)>=90?'var(--red)':parseFloat(pct)>=70?'var(--orange)':'var(--green)';
    footer.innerHTML=`
      <div class="budget-cat-total-row">
        <span style="font-weight:700;font-size:13px;">전체 합계</span>
        <span style="font-size:13px;color:${rem>=0?'var(--green)':'var(--red)'};">${fmt(totalSpent)} / ${fmt(totalBudget)}</span>
      </div>
      <div class="budget-cat-bar-wrap" style="margin:6px 0 4px;">
        <div class="budget-cat-bar-fill" style="width:${pct}%;background:${color}"></div>
      </div>
      <div class="budget-cat-bottom"><span>${pct}% 사용</span><span style="color:${rem>=0?'var(--green)':'var(--red)'};">${rem>=0?'잔여 '+fmt(rem):'초과 '+fmt(-rem)}</span></div>`;
  }
}

// ===== BUDGET CATEGORY SYNC MODAL =====
function openBudgetCatSyncModal(catId){
  const cat=(S.budgetCategories||[]).find(c=>c.id==catId);
  if(!cat)return;
  const linked=cat.linkedCategories||[];
  const lcats=S.ledgerCategories||[];
  const el=document.getElementById('modal-bcsync');
  const bodyEl=document.getElementById('bcsync-body');
  if(!el||!bodyEl)return;
  document.getElementById('bcsync-cat-name').textContent=cat.name;
  document.getElementById('bcsync-cat-id').value=catId;
  if(lcats.length===0){
    bodyEl.innerHTML='<div style="color:var(--text-sub);font-size:13px;padding:12px 0;">등록된 가계부 카테고리가 없습니다.<br>가계부 탭에서 카테고리를 먼저 추가해 주세요.</div>';
  } else {
    bodyEl.innerHTML=lcats.map(lc=>`
      <label class="bcsync-check-row">
        <input type="checkbox" class="bcsync-chk" value="${lc.name.replace(/"/g,'&quot;')}" ${linked.includes(lc.name)?'checked':''}/>
        <span class="bcsync-check-label-text">${lc.name}</span>
      </label>`).join('');
  }
  openModal('bcsync');
}

function saveBudgetCatSync(){
  const catId=document.getElementById('bcsync-cat-id').value;
  const cat=(S.budgetCategories||[]).find(c=>c.id==catId);
  if(!cat)return;
  const checks=document.querySelectorAll('.bcsync-chk:checked');
  cat.linkedCategories=Array.from(checks).map(c=>c.value);
  const cm=S.currentMonths.income;
  saveState();closeModal();renderBudget(cm.y,cm.m);
}

function openBudgetModal(id){
  document.getElementById('modal-budget-id').value=id||'';
  const syncEl=document.getElementById('mb-synced');
  const foodManualRow=document.getElementById('mb-food-manual-row');
  const foodManualChk=document.getElementById('mb-food-budget-manual');
  if(id){
    const cat=(S.budgetCategories||[]).find(c=>c.id==id);if(!cat)return;
    document.getElementById('mb-name').value=cat.name;
    document.getElementById('mb-budget').value=cat.budget;
    if(syncEl)syncEl.checked=cat.synced!==false;
    document.getElementById('modal-budget-edit-label').textContent='수정';
    // Show food manual option only for 식비
    if(foodManualRow)foodManualRow.style.display=cat.name==='식비'?'flex':'none';
    if(foodManualChk)foodManualChk.checked=!!cat.foodBudgetManual;
  } else {
    document.getElementById('mb-name').value='';
    document.getElementById('mb-budget').value='';
    if(syncEl)syncEl.checked=true;
    document.getElementById('modal-budget-edit-label').textContent='추가';
    if(foodManualRow)foodManualRow.style.display='none';
    if(foodManualChk)foodManualChk.checked=false;
  }
  openModal('budget');
}

function saveBudgetCategory(){
  const id=document.getElementById('modal-budget-id').value;
  const name=document.getElementById('mb-name').value.trim();
  const budget=numInputParse(document.getElementById('mb-budget').value);
  const syncedEl=document.getElementById('mb-synced');
  const synced=syncedEl?syncedEl.checked:true;
  if(!name)return alert('카테고리 이름을 입력해주세요');
  const cm=S.currentMonths.income;
  const curKey=mkey(cm.y,cm.m);
  if(!S.budgetCategories)S.budgetCategories=[];
  if(!S.monthBudgets)S.monthBudgets={};
  const foodManualChk=document.getElementById('mb-food-budget-manual');
  if(id){
    const c=S.budgetCategories.find(c=>c.id==id);
    if(c){
      if(c.name==='식비'&&foodManualChk)c.foodBudgetManual=foodManualChk.checked;
      c.name=name;c.budget=budget;
      const wasSynced=c.synced!==false;
      c.synced=synced;
      if(synced&&!wasSynced){
        // turning sync ON: set syncFrom to current month, keep past months in monthBudgets untouched
        c.syncFrom=cm.y+'-'+cm.m;
      } else if(!synced&&wasSynced){
        // turning sync OFF: save current global budget to this month's override
        c.syncFrom='';
        if(!S.monthBudgets[curKey])S.monthBudgets[curKey]={};
        S.monthBudgets[curKey][c.id]=budget;
      } else if(!synced){
        // stays unsynced: update only this month
        if(!S.monthBudgets[curKey])S.monthBudgets[curKey]={};
        S.monthBudgets[curKey][c.id]=budget;
      }
    }
  } else {
    const newCat={id:genId(),name,budget,synced,syncFrom:synced?(cm.y+'-'+cm.m):''};
    S.budgetCategories.push(newCat);
    if(!synced){
      if(!S.monthBudgets[curKey])S.monthBudgets[curKey]={};
      S.monthBudgets[curKey][newCat.id]=budget;
    }
  }
  saveState();closeModal();renderBudget(cm.y,cm.m);
}

function deleteBudgetCategory(id){
  if(!confirm('예산 카테고리를 삭제하시겠어요?'))return;
  const cm=S.currentMonths.income;
  S.budgetCategories=(S.budgetCategories||[]).filter(c=>c.id!=id);
  saveState();renderBudget(cm.y,cm.m);
}


// ===== REMAINING BUDGET =====
function saveRemainingBudget(val){
  if(!S.remainingBudgetSettings)S.remainingBudgetSettings={label:'현재 남은 예산',amount:0};
  S.remainingBudgetSettings.amount=numInputParse(val);
  saveState();
}

function editRemainingLabel(){
  const current=S.remainingBudgetSettings?S.remainingBudgetSettings.label:'현재 남은 예산';
  const newLabel=prompt('박스 이름을 입력하세요:',current);
  if(newLabel===null)return;
  const trimmed=newLabel.trim()||'현재 남은 예산';
  if(!S.remainingBudgetSettings)S.remainingBudgetSettings={label:trimmed,amount:0};
  else S.remainingBudgetSettings.label=trimmed;
  saveState();
  const el=document.getElementById('remaining-label-display');
  if(el)el.textContent=trimmed;
}


// ===== STOCK→ASSET AUTO SYNC =====
function getFoodBudgetAmount(y,m){
  const key=mkey(y,m);
  const foodCat=(S.budgetCategories||[]).find(c=>c.name==='식비');
  if(!foodCat)return 0;
  // per-month override first
  if(S.monthBudgets&&S.monthBudgets[key]&&S.monthBudgets[key][foodCat.id]!==undefined){
    return S.monthBudgets[key][foodCat.id];
  }
  // synced: use global if syncFrom is before or equal this month
  if(foodCat.synced!==false){
    if(!foodCat.syncFrom)return foodCat.budget;
    const [sy,sm]=foodCat.syncFrom.split('-').map(Number);
    if(y>sy||(y===sy&&m>=sm))return foodCat.budget;
  }
  return foodCat.budget;
}

function syncStockAsset(){
  const totalBuy=(S.stocks||[]).reduce((s,st)=>{
    if(st.stockType==='foreign'||st.stockType==='gold')return s+(parseFloat(st.buyAmount)||0);
    return s+(parseFloat(st.buyPrice)||0)*(parseFloat(st.quantity)||0);
  },0);
  if(!S.assets)S.assets=[];
  let autoAsset=S.assets.find(a=>a.id===S.stockAssetAutoId||(a._isStockAuto&&a.category==='주식'));
  if(!autoAsset){
    autoAsset={id:genId(),name:'주식 매입금액(자동)',amount:totalBuy,category:'주식',_isStockAuto:true};
    S.assets.push(autoAsset);
    S.stockAssetAutoId=autoAsset.id;
  } else {
    autoAsset.amount=totalBuy;
    S.stockAssetAutoId=autoAsset.id;
  }
}

function toggleStockAssetDirect(checked){
  S.stockAssetDirect=!!checked;
  if(!checked){
    syncStockAsset();
  }
  saveState();renderAssets();
}

function toggleCalFoodSync(y,m){
  const key=y+'-'+m;
  if(!S.calFoodSync)S.calFoodSync={};
  S.calFoodSync[key]=!S.calFoodSync[key];
  saveState();renderCalendar();
}

// ===== ASSET → FUND CALC SYNC (선택 항목만) =====
function syncFundCalcToAssets(){
  if(!S.fundCalc||!S.fundCalc.assetLinked)return;
  const ids=S.fundCalc.linkedAssetIds||[];
  if(ids.length===0)return;
  const total=(S.assets||[]).filter(a=>ids.includes(a.id)).reduce((s,a)=>s+(parseFloat(a.amount)||0),0);
  S.fundCalc.amount=total;
  S.fundCalc.assetLinkedAt=Date.now();
  saveState();
  renderFundCalc();
}

function toggleAssetTotalLink(linked){
  if(!S.fundCalc)S.fundCalc={amount:0,items:[],assetLinked:false,assetLinkedAt:null,linkedAssetIds:[]};
  S.fundCalc.assetLinked=!!linked;
  if(!linked){
    S.fundCalc.assetLinkedAt=null;
    S.fundCalc.linkedAssetIds=[];
  }
  saveState();renderFundCalc();
}

// ===== DASHBOARD =====
// ===== FUND CALCULATOR =====
function renderFundCalc(){
  const fc=S.fundCalc||{amount:0,items:[],assetLinked:false};
  const isLinked=!!fc.assetLinked;

  // 연동 배지: 몇 개 항목 연동 중인지 표시
  const linkedIds=fc.linkedAssetIds||[];
  const badgeEl=document.getElementById('fc-asset-linked-badge');
  if(badgeEl){
    badgeEl.style.display=isLinked?'inline-flex':'none';
    badgeEl.textContent=isLinked?`🔗 ${linkedIds.length}개 항목 연동중`:'';
  }

  // 연동 해제 버튼 (연동 중일 때만 표시)
  const unlinkBtn=document.getElementById('fc-asset-link-btn');
  if(unlinkBtn)unlinkBtn.style.display=isLinked?'inline-flex':'none';

  // 보유금액 입력창: 연동 시 비활성화
  const amtEl=document.getElementById('fc-amount-input');
  if(amtEl){
    if(document.activeElement!==amtEl)amtEl.value=fc.amount?(fc.amount).toLocaleString('ko-KR'):'';
    amtEl.readOnly=isLinked;
    amtEl.style.background=isLinked?'var(--green-light)':'';
    amtEl.style.cursor=isLinked?'default':'';
    amtEl.title=isLinked?'자산 항목 연동 중 — 직접 편집 불가':'';
  }

  // 연동 시각 표시
  const linkedTimeEl=document.getElementById('fc-linked-time');
  if(linkedTimeEl){
    if(isLinked&&fc.assetLinkedAt){
      const d=new Date(fc.assetLinkedAt);
      linkedTimeEl.textContent='마지막 반영: '+d.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});
      linkedTimeEl.style.display='block';
    } else {
      linkedTimeEl.style.display='none';
    }
  }

  const dispEl=document.getElementById('fc-amount-display');
  const shownAmt=fc.amount||0;
  if(dispEl)dispEl.textContent=shownAmt>0?'보유: '+fmt(shownAmt):'';
  const listEl=document.getElementById('fc-items-list');
  if(listEl){
    if((fc.items||[]).length===0){
      listEl.innerHTML='<div class="fc-empty">아래 버튼으로 항목을 추가하세요</div>';
    } else {
      listEl.innerHTML=(fc.items||[]).map(item=>`
        <div class="fc-item">
          <input class="fc-item-name" type="text" value="${(item.name||'').replace(/"/g,'&quot;')}" placeholder="항목명"
            onchange="App.updateFundItem(${item.id},'name',this.value)"
            onkeydown="if(event.key==='Enter')this.blur()"/>
          <div class="fc-item-amount-wrap">
            <input class="fc-item-amount" type="text" inputmode="numeric" value="${item.amount?(item.amount).toLocaleString('ko-KR'):''}" placeholder="0"
              oninput="App.numInputFmt(this);App.previewFundItem()"
              onchange="App.updateFundItem(${item.id},'amount',this.value)"
              onkeydown="if(event.key==='Enter')App.updateFundItem(${item.id},'amount',this.value)"/>
            <span class="fc-item-unit">원</span>
          </div>
          <button class="icon-btn" onclick="App.deleteFundItem(${item.id})">🗑️</button>
        </div>`).join('');
    }
  }
  _fcSummary();
}

// 합계 표시만 갱신 (DOM 재렌더링 없음 — focus 유지)
function _fcSummary(){
  const fc=S.fundCalc||{amount:0,items:[],assetLinked:false};
  const totalUsed=(fc.items||[]).reduce((s,i)=>s+(parseFloat(i.amount)||0),0);
  const baseAmt=parseFloat(fc.amount)||0;
  const remaining=baseAmt-totalUsed;
  const over=remaining<0;
  const tuEl=document.getElementById('fc-total-used');
  if(tuEl)tuEl.textContent=fmt(totalUsed);
  const rvEl=document.getElementById('fc-remaining-val');
  if(rvEl){rvEl.textContent=fmt(Math.abs(remaining));rvEl.style.color=over?'var(--red)':'var(--green)';}
  const obEl=document.getElementById('fc-over-badge');
  if(obEl)obEl.style.display=over?'inline-block':'none';
}

// oninput: 현재 DOM 값 기준으로 합계 미리보기 (state 저장 없음 → focus 유지)
function previewFundItem(){
  const fc=S.fundCalc||{amount:0,items:[]};
  let total=0;
  document.querySelectorAll('.fc-item-amount').forEach(el=>{total+=numInputParse(el.value);});
  const remaining=(parseFloat(fc.amount)||0)-total;
  const over=remaining<0;
  const tuEl=document.getElementById('fc-total-used');
  if(tuEl)tuEl.textContent=fmt(total);
  const rvEl=document.getElementById('fc-remaining-val');
  if(rvEl){rvEl.textContent=fmt(Math.abs(remaining));rvEl.style.color=over?'var(--red)':'var(--green)';}
  const obEl=document.getElementById('fc-over-badge');
  if(obEl)obEl.style.display=over?'inline-block':'none';
}

// oninput on main amount: 보유금액 표시 + 합계 미리보기 (state 저장 없음)
function previewFundAmount(val){
  const amount=numInputParse(val);
  const dispEl=document.getElementById('fc-amount-display');
  if(dispEl)dispEl.textContent=amount>0?'보유: '+fmt(amount):'';
  let total=0;
  document.querySelectorAll('.fc-item-amount').forEach(el=>{total+=numInputParse(el.value);});
  const remaining=amount-total;
  const over=remaining<0;
  const tuEl=document.getElementById('fc-total-used');
  if(tuEl)tuEl.textContent=fmt(total);
  const rvEl=document.getElementById('fc-remaining-val');
  if(rvEl){rvEl.textContent=fmt(Math.abs(remaining));rvEl.style.color=over?'var(--red)':'var(--green)';}
  const obEl=document.getElementById('fc-over-badge');
  if(obEl)obEl.style.display=over?'inline-block':'none';
}

function setFundAmount(val){
  if(!S.fundCalc)S.fundCalc={amount:0,items:[],assetLinked:false};
  if(S.fundCalc.assetLinked)return; // 연동 중 직접 편집 차단
  S.fundCalc.amount=numInputParse(val);
  saveState();renderFundCalc();
}

function addFundItem(){
  if(!S.fundCalc)S.fundCalc={amount:0,items:[]};
  S.fundCalc.items.push({id:genId(),name:'',amount:0});
  saveState();renderFundCalc();
}

function deleteFundItem(id){
  if(!S.fundCalc)return;
  S.fundCalc.items=(S.fundCalc.items||[]).filter(i=>i.id!=id);
  saveState();renderFundCalc();
}

function updateFundItem(id,field,value){
  if(!S.fundCalc)return;
  const item=(S.fundCalc.items||[]).find(i=>i.id==id);
  if(!item)return;
  item[field]=field==='amount'?numInputParse(value):value;
  saveState();
  // amount 저장 시 합계만 갱신 (list 재렌더 금지 — focus 유지)
  _fcSummary();
}

function resetFundCalc(){
  if(!confirm('자금 분배 계산기를 초기화하시겠어요?'))return;
  S.fundCalc={amount:0,items:[],assetLinked:false,assetLinkedAt:null,linkedAssetIds:[]};
  saveState();renderFundCalc();
}

function toggleAssetSelector(){
  const el=document.getElementById('fc-asset-selector');if(!el)return;
  const isHidden=el.style.display==='none';
  if(isHidden){
    const assets=S.assets||[];
    if(assets.length===0){el.innerHTML='<div class="fc-asset-selector-title">자산 없음</div>';el.style.display='block';return;}
    const linkedIds=(S.fundCalc&&S.fundCalc.linkedAssetIds)||[];
    el.innerHTML=`<div class="fc-asset-selector-title">🏦 자산 선택 (합산할 항목 체크)</div>`+
      assets.map(a=>`<label class="fc-asset-check-row">
        <input type="checkbox" class="fc-asset-chk" data-id="${a.id}" data-amount="${a.amount}" ${linkedIds.includes(a.id)?'checked':''}/>
        <span>${a.name} <span style="color:var(--green);font-weight:700;">${fmt(a.amount)}</span></span>
      </label>`).join('')+
      `<div class="fc-asset-btn-row">
        <button class="fc-asset-apply-btn" onclick="App.applyAssetSelection()">✓ 합산 적용 (1회)</button>
        <button class="fc-asset-apply-btn fc-asset-link-apply-btn" onclick="App.applyAssetLink()">🔗 연동으로 적용</button>
      </div>`;
    el.style.display='block';
  } else {
    el.style.display='none';
  }
}

function applyAssetSelection(){
  const checks=document.querySelectorAll('.fc-asset-chk:checked');
  let total=0;
  checks.forEach(c=>{total+=parseFloat(c.dataset.amount)||0;});
  if(!S.fundCalc)S.fundCalc={amount:0,items:[],assetLinked:false,assetLinkedAt:null,linkedAssetIds:[]};
  // 연동 해제하고 1회 적용
  S.fundCalc.amount=total;
  S.fundCalc.assetLinked=false;
  S.fundCalc.assetLinkedAt=null;
  S.fundCalc.linkedAssetIds=[];
  const el=document.getElementById('fc-asset-selector');
  if(el)el.style.display='none';
  saveState();renderFundCalc();
}

function applyAssetLink(){
  const checks=document.querySelectorAll('.fc-asset-chk:checked');
  if(checks.length===0){alert('연동할 항목을 선택해 주세요.');return;}
  if(!S.fundCalc)S.fundCalc={amount:0,items:[],assetLinked:false,assetLinkedAt:null,linkedAssetIds:[]};
  const ids=Array.from(checks).map(c=>c.dataset.id);
  S.fundCalc.linkedAssetIds=ids;
  S.fundCalc.assetLinked=true;
  // 선택 항목 합산
  let total=0;
  checks.forEach(c=>{total+=parseFloat(c.dataset.amount)||0;});
  S.fundCalc.amount=total;
  S.fundCalc.assetLinkedAt=Date.now();
  const el=document.getElementById('fc-asset-selector');
  if(el)el.style.display='none';
  saveState();renderFundCalc();
}


// ===== DASHBOARD =====
function renderDashboard(){
  const cm=S.currentMonths.dashboard;
  document.getElementById('dash-month-label').textContent=cm.y+'년 '+cm.m+'월';

  const totalIncome=getTotalIncome(cm.y,cm.m);
  const totalFixed=getTotalFixed(cm.y,cm.m);
  const totalVar=getTotalVariable(cm.y,cm.m);
  const foodTotal=getFoodTotal(cm.y,cm.m);
  const totalCredit=getCreditMonthTotal(cm.y,cm.m);
  // Credit excluded from expense
  const totalExpense=totalFixed+totalVar+foodTotal;
  const remaining=totalIncome-totalExpense;

  const key=mkey(cm.y,cm.m);
  const entries=S.ledger[key]||[];

  // Banner: ledger-based (includes all expense categories including 신용카드 auto entries)
  const ledBannerIn=entries.filter(e=>e.type==='income').reduce((s,e)=>s+e.amount,0);
  const ledBannerOut=entries.filter(e=>e.type==='expense').reduce((s,e)=>s+e.amount,0);
  const bannerRemaining=entries.length>0?ledBannerIn-ledBannerOut:remaining;
  const bannerIsLedger=entries.length>0;
  const banner=document.getElementById('dash-budget-banner');
  banner.style.background=bannerRemaining>=0
    ?'linear-gradient(135deg,#43C98A,#56D87A)'
    :'linear-gradient(135deg,#F06292,#EF5350)';
  document.getElementById('dash-remaining').textContent=fmt(bannerRemaining);
  document.getElementById('dash-banner-sub').textContent=bannerIsLedger
    ?'📒 수입 '+fmt(ledBannerIn)+' − 지출 '+fmt(ledBannerOut)
    :'수입 '+fmt(totalIncome)+' − 지출 '+fmt(totalExpense);

  const ledIn=entries.filter(e=>e.type==='income').reduce((s,e)=>s+e.amount,0);
  const ledOut=entries.filter(e=>e.type==='expense').reduce((s,e)=>s+e.amount,0);
  document.getElementById('dash-led-income').textContent=fmt(ledIn);
  document.getElementById('dash-led-expense').textContent=fmt(ledOut);
  const balEl=document.getElementById('dash-led-balance');
  balEl.textContent=fmt(ledIn-ledOut);
  balEl.style.color=ledIn-ledOut>=0?'var(--green)':'var(--red)';
  document.getElementById('dash-led-count').textContent=entries.length+'건';

  renderSavingsRate();

  document.getElementById('dash-income-total').textContent=fmt(totalIncome);
  document.getElementById('dash-fixed-total').textContent=fmt(totalFixed);
  document.getElementById('dash-variable-total').textContent=fmt(totalVar);
  document.getElementById('dash-asset-total').textContent=fmt(getTotalAssets());
  document.getElementById('dash-stock-total').textContent=fmt(getTotalStockValue());

  renderDashExpand('income',getMonthData(cm.y,cm.m).income.map(i=>({name:i.name,cat:i.category,amount:i.amount,color:'green'})));
  renderDashExpand('fixed',getMonthData(cm.y,cm.m).fixed.map(i=>({name:i.name,cat:i.category,amount:i.amount,color:'red'})));
  renderDashExpand('variable',getEffectiveVariable(cm.y,cm.m).map(i=>({name:i.name,cat:i.category,amount:i.amount,color:'orange'})));
  renderDashAssetExpand();

  renderDashExpand('stock',S.stocks.map(st=>{
    const t=st.stockType;
    const val=(t==='foreign'||t==='gold')?(parseFloat(st.currentAmount)||0):(parseFloat(st.currentPrice)||0)*(parseFloat(st.quantity)||0);
    const cost=(t==='foreign'||t==='gold')?(parseFloat(st.buyAmount)||0):(parseFloat(st.buyPrice)||0)*(parseFloat(st.quantity)||0);
    const label=t==='gold'?'금현물':t==='foreign'?'해외주식':st.ticker;
    return {name:st.name,cat:label,amount:val,color:val>=cost?'red':'blue'};
  }));
}

function renderDashExpand(section,items){
  const el=document.getElementById('dash-'+section+'-expand');if(!el)return;
  el.innerHTML=items.length===0
    ?'<div style="color:var(--text-sub);font-size:12px;padding:8px 0;">항목 없음</div>'
    :items.map(item=>`
      <div class="dash-expand-item">
        <div class="dash-expand-name">${item.name}<span class="dash-expand-cat">${item.cat}</span></div>
        <div class="dash-expand-amount ${item.color}">${fmt(item.amount)}</div>
      </div>`).join('');
}

function renderDashAssetExpand(){
  const el=document.getElementById('dash-asset-expand');if(!el)return;
  el.innerHTML=S.assets.length===0
    ?'<div style="color:var(--text-sub);font-size:12px;padding:8px 0;">자산 없음</div>'
    :S.assets.map(a=>`
      <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;font-size:13px;border-bottom:1px dashed var(--border);">
        <span>${a.name}</span>
        <input style="border:1.5px solid var(--border);border-radius:8px;padding:4px 8px;font-size:13px;width:120px;"
          type="number" value="${a.amount}" onchange="App.updateAssetAmount(${a.id},this.value)"/>
      </div>`).join('');
}

function toggleDashSection(section){
  const expand=document.getElementById('dash-'+section+'-expand');
  const arrow=document.getElementById('dash-'+section+'-arrow');
  if(!expand)return;
  const isOpen=expand.classList.contains('open');
  expand.classList.toggle('open',!isOpen);
  if(arrow)arrow.classList.toggle('open',!isOpen);
}

// ===== INCOME / EXPENSE =====
// ===== 기본값 설정 모드 =====
let _defaultMode=false;

function openDefaultMode(){
  _defaultMode=true;
  renderIncome();
  const cm=S.currentMonths.income;
  renderBudget(cm.y,cm.m);
}
function cancelDefaultMode(){
  _defaultMode=false;
  renderIncome();
  const cm=S.currentMonths.income;
  renderBudget(cm.y,cm.m);
}

// ===== 기본값 모드 드래그 정렬 =====
let _dmDragging=null;
let _dmTouchEl=null,_dmTouchListId=null;

function _dmDragStart(e,type,id){
  _dmDragging={type,id};
  e.dataTransfer.effectAllowed='move';
  const item=e.currentTarget.closest('[data-drag-id]');
  if(item)item.classList.add('dm-dragging');
}
function _dmDragOver(e,type){
  if(!_dmDragging||_dmDragging.type!==type)return;
  e.preventDefault();
  e.dataTransfer.dropEffect='move';
  e.currentTarget.classList.add('dm-drag-over');
}
function _dmDragLeave(e){
  e.currentTarget.classList.remove('dm-drag-over');
}
function _dmDrop(e,type,targetId){
  e.preventDefault();
  e.currentTarget.classList.remove('dm-drag-over');
  if(!_dmDragging||_dmDragging.type!==type)return;
  const fromId=_dmDragging.id;
  _dmDragging=null;
  if(fromId===targetId)return;
  const listId=type==='income'?'income-list':type==='budget'?'budget-cat-list':'fixed-list';
  const list=document.getElementById(listId);
  const fromEl=list.querySelector(`[data-drag-id="${fromId}"]`);
  const toEl=list.querySelector(`[data-drag-id="${targetId}"]`);
  if(!fromEl||!toEl)return;
  const items=[...list.querySelectorAll('[data-drag-id]')];
  if(items.indexOf(fromEl)<items.indexOf(toEl))toEl.after(fromEl);
  else toEl.before(fromEl);
}
function _dmDragEnd(e){
  document.querySelectorAll('.dm-dragging,.dm-drag-over').forEach(el=>{
    el.classList.remove('dm-dragging','dm-drag-over');
  });
  _dmDragging=null;
}
function _dmTouchStart(e,listId){
  const item=e.currentTarget.closest('[data-drag-id]');
  if(!item)return;
  _dmTouchEl=item;
  _dmTouchListId=listId;
  item.classList.add('dm-dragging');
  document.addEventListener('touchmove',_dmTouchMove,{passive:false});
  document.addEventListener('touchend',_dmTouchEnd,{once:true});
}
function _dmTouchMove(e){
  if(!_dmTouchEl||!_dmTouchListId)return;
  e.preventDefault();
  const touch=e.touches[0];
  const el=document.elementFromPoint(touch.clientX,touch.clientY);
  const target=el&&el.closest('[data-drag-id]');
  if(!target||target===_dmTouchEl)return;
  const list=document.getElementById(_dmTouchListId);
  if(!list.contains(target))return;
  const items=[...list.querySelectorAll('[data-drag-id]')];
  if(items.indexOf(_dmTouchEl)<items.indexOf(target))target.after(_dmTouchEl);
  else target.before(_dmTouchEl);
}
function _dmTouchEnd(){
  if(_dmTouchEl)_dmTouchEl.classList.remove('dm-dragging');
  _dmTouchEl=null;_dmTouchListId=null;
  document.removeEventListener('touchmove',_dmTouchMove);
}

// 현재 달 포함 이후 모든 달에 기본값 항목을 추가/업데이트 (직접 추가한 항목은 유지, 순서 동기화)
function _propagateDefaultsToFutureMonths(fromY,fromM){
  const di=S.defaultItems||{income:[],fixed:[]};
  const defIncNames=di.income.map(d=>d.name);
  const defFixNames=di.fixed.map(d=>d.name);
  Object.keys(S.monthlyData).forEach(key=>{
    const parts=key.split('-');
    const ky=parseInt(parts[0]),km=parseInt(parts[1]);
    if(ky<fromY||(ky===fromY&&km<fromM))return;
    const mdata=S.monthlyData[key];
    di.income.forEach(def=>{
      const ex=mdata.income.find(i=>i.name===def.name);
      if(ex){ex.category=def.category;ex.amount=def.amount;}
      else{mdata.income.push({...def,id:genId()});}
    });
    di.fixed.forEach(def=>{
      const ex=mdata.fixed.find(i=>i.name===def.name);
      if(ex){ex.category=def.category;ex.amount=def.amount;ex.isSavings=def.isSavings;}
      else{mdata.fixed.push({...def,id:genId()});}
    });
    // 기본값 순서 적용 (기본값 항목을 지정된 순서로 앞에, 나머지는 뒤에 유지)
    mdata.income.sort((a,b)=>{
      const ai=defIncNames.indexOf(a.name),bi=defIncNames.indexOf(b.name);
      if(ai<0&&bi<0)return 0;if(ai<0)return 1;if(bi<0)return -1;return ai-bi;
    });
    mdata.fixed.sort((a,b)=>{
      const ai=defFixNames.indexOf(a.name),bi=defFixNames.indexOf(b.name);
      if(ai<0&&bi<0)return 0;if(ai<0)return 1;if(bi<0)return -1;return ai-bi;
    });
  });
}

function saveDefaultItems(){
  const cm=S.currentMonths.income;
  const data=getMonthData(cm.y,cm.m);
  // 드래그로 변경된 DOM 순서 읽기
  const incomeOrder=[...document.getElementById('income-list').querySelectorAll('[data-drag-id]')].map(el=>Number(el.dataset.dragId));
  const fixedOrder=[...document.getElementById('fixed-list').querySelectorAll('[data-drag-id]')].map(el=>Number(el.dataset.dragId));
  // 현재 달 데이터를 DOM 순서에 맞게 정렬
  if(incomeOrder.length)data.income.sort((a,b)=>{const ai=incomeOrder.indexOf(a.id),bi=incomeOrder.indexOf(b.id);return(ai<0?9999:ai)-(bi<0?9999:bi);});
  if(fixedOrder.length)data.fixed.sort((a,b)=>{const ai=fixedOrder.indexOf(a.id),bi=fixedOrder.indexOf(b.id);return(ai<0?9999:ai)-(bi<0?9999:bi);});
  const checkedIncome=Array.from(document.querySelectorAll('.default-chk-income:checked')).map(el=>el.value);
  const checkedFixed=Array.from(document.querySelectorAll('.default-chk-fixed:checked')).map(el=>el.value);
  if(!S.defaultItems)S.defaultItems={income:[],fixed:[]};
  S.defaultItems.income=data.income.filter(i=>checkedIncome.includes(String(i.id))).map(i=>({name:i.name,category:i.category,amount:i.amount}));
  S.defaultItems.fixed=data.fixed.filter(i=>checkedFixed.includes(String(i.id))).map(i=>({name:i.name,category:i.category,amount:i.amount,isSavings:i.isSavings}));
  // 이후 달에도 즉시 반영 (순서 포함)
  _propagateDefaultsToFutureMonths(cm.y,cm.m);
  // 예산 카테고리 기본값(synced) + 순서 저장
  const budgetOrder=[...document.getElementById('budget-cat-list').querySelectorAll('[data-drag-id]')].map(el=>Number(el.dataset.dragId));
  if(budgetOrder.length&&S.budgetCategories){
    S.budgetCategories.sort((a,b)=>{const ai=budgetOrder.indexOf(a.id),bi=budgetOrder.indexOf(b.id);return(ai<0?9999:ai)-(bi<0?9999:bi);});
  }
  document.querySelectorAll('.budget-default-chk').forEach(chk=>{
    const id=parseInt(chk.dataset.id);
    const cat=(S.budgetCategories||[]).find(c=>c.id===id);
    if(cat)cat.synced=chk.checked;
  });
  saveState();
  _defaultMode=false;
  renderIncome();
  renderBudget(cm.y,cm.m);
}

// 체크한 항목을 기본값에서 제거하고 이후 달에서도 삭제
function deleteDefaultItems(){
  const cm=S.currentMonths.income;
  const data=getMonthData(cm.y,cm.m);
  const checkedIncome=Array.from(document.querySelectorAll('.default-chk-income:checked')).map(el=>el.value);
  const checkedFixed=Array.from(document.querySelectorAll('.default-chk-fixed:checked')).map(el=>el.value);
  if(checkedIncome.length===0&&checkedFixed.length===0){
    alert('삭제할 항목을 체크해주세요.');return;
  }
  const incNames=data.income.filter(i=>checkedIncome.includes(String(i.id))).map(i=>i.name);
  const fixNames=data.fixed.filter(i=>checkedFixed.includes(String(i.id))).map(i=>i.name);
  // 기본값에서 제거
  if(S.defaultItems){
    S.defaultItems.income=(S.defaultItems.income||[]).filter(i=>!incNames.includes(i.name));
    S.defaultItems.fixed=(S.defaultItems.fixed||[]).filter(i=>!fixNames.includes(i.name));
  }
  // 현재 달 포함 이후 달에서 해당 항목 삭제
  Object.keys(S.monthlyData).forEach(key=>{
    const parts=key.split('-');
    const ky=parseInt(parts[0]),km=parseInt(parts[1]);
    if(ky<cm.y||(ky===cm.y&&km<cm.m))return;
    const mdata=S.monthlyData[key];
    mdata.income=mdata.income.filter(i=>!incNames.includes(i.name));
    mdata.fixed=mdata.fixed.filter(i=>!fixNames.includes(i.name));
  });
  saveState();
  _defaultMode=false;
  renderIncome();
}

function renderIncome(){
  const cm=S.currentMonths.income;
  document.getElementById('income-month-label').textContent=cm.y+'년 '+cm.m+'월';

  const data=getMonthData(cm.y,cm.m);
  const totalIncome=getTotalIncome(cm.y,cm.m);
  const totalFixed=getTotalFixed(cm.y,cm.m);
  const totalVar=getTotalVariable(cm.y,cm.m);

  document.getElementById('income-total').textContent=fmt(totalIncome);
  document.getElementById('fixed-total').textContent=fmt(totalFixed);
  document.getElementById('variable-total').textContent=fmt(totalVar);

  // Remaining budget display
  const rb=S.remainingBudgetSettings||{label:'현재 남은 예산',amount:0};
  const lblEl=document.getElementById('remaining-label-display');
  const inpEl=document.getElementById('remaining-budget-input');
  if(lblEl)lblEl.textContent=rb.label;
  if(inpEl&&!inpEl.matches(':focus'))inpEl.value=rb.amount||'';

  renderBudget(cm.y,cm.m);

  // Show default mode banner if active
  const defaultBanner=document.getElementById('default-mode-banner');
  if(defaultBanner)defaultBanner.style.display=_defaultMode?'flex':'none';

  const curDefIncome=(S.defaultItems&&S.defaultItems.income)||[];
  const curDefFixed=(S.defaultItems&&S.defaultItems.fixed)||[];
  const isDefaultIncome=item=>curDefIncome.some(d=>d.name===item.name&&d.amount===item.amount);
  const isDefaultFixed=item=>curDefFixed.some(d=>d.name===item.name&&d.amount===item.amount);

  // Income list
  document.getElementById('income-list').innerHTML=data.income.map(item=>{
    const da=_defaultMode?` data-drag-id="${item.id}" draggable="true" ondragstart="App._dmDragStart(event,'income',${item.id})" ondragover="App._dmDragOver(event,'income')" ondragleave="App._dmDragLeave(event)" ondrop="App._dmDrop(event,'income',${item.id})" ondragend="App._dmDragEnd(event)"`:'';
    return `<div class="expense-item${_defaultMode?' default-mode-item':''}"${da}>
      ${_defaultMode?`<span class="dm-handle" ontouchstart="App._dmTouchStart(event,'income-list')">⠿</span><label class="dm-chk-label"><input type="checkbox" class="default-chk default-chk-income" value="${item.id}" ${isDefaultIncome(item)?'checked':''}><span class="dm-chk-indicator"></span></label>`:''}
      <div class="item-left"><span class="item-name">${item.name}</span><span class="item-cat">${item.category}</span></div>
      <div class="item-right">
        <span class="item-amount green">${fmt(item.amount)}</span>
        ${_defaultMode?'':`<div class="item-actions"><button class="icon-btn" onclick="App.editItem('income',${item.id})">✏️</button><button class="icon-btn" onclick="App.deleteItem('income',${item.id})">🗑️</button></div>`}
      </div>
    </div>`;
  }).join('')||(data.income.length===0&&_defaultMode?'<div style="font-size:12px;color:var(--text-sub);padding:8px 0;">수입 항목이 없습니다</div>':'');

  // Fixed list (with isSavings badge)
  document.getElementById('fixed-list').innerHTML=data.fixed.map(item=>{
    const da=_defaultMode?` data-drag-id="${item.id}" draggable="true" ondragstart="App._dmDragStart(event,'fixed',${item.id})" ondragover="App._dmDragOver(event,'fixed')" ondragleave="App._dmDragLeave(event)" ondrop="App._dmDrop(event,'fixed',${item.id})" ondragend="App._dmDragEnd(event)"`:'';
    return `<div class="expense-item${_defaultMode?' default-mode-item':''}"${da}>
      ${_defaultMode?`<span class="dm-handle" ontouchstart="App._dmTouchStart(event,'fixed-list')">⠿</span><label class="dm-chk-label"><input type="checkbox" class="default-chk default-chk-fixed" value="${item.id}" ${isDefaultFixed(item)?'checked':''}><span class="dm-chk-indicator"></span></label>`:''}
      <div class="item-left">
        <span class="item-name">${item.name}${item.isSavings?'<span class="savings-tag">💜저축</span>':''}</span>
        <span class="item-cat">${item.category}</span>
      </div>
      <div class="item-right">
        <span class="item-amount ${item.isSavings?'purple':'red'}">${fmt(item.amount)}</span>
        ${_defaultMode?'':`<div class="item-actions"><button class="icon-btn" onclick="App.editItem('fixed',${item.id})">✏️</button><button class="icon-btn" onclick="App.deleteItem('fixed',${item.id})">🗑️</button></div>`}
      </div>
    </div>`;
  }).join('')||(data.fixed.length===0&&_defaultMode?'<div style="font-size:12px;color:var(--text-sub);padding:8px 0;">고정 지출 항목이 없습니다</div>':'');

  // Variable list
  const effectiveVars=getEffectiveVariable(cm.y,cm.m);

  let varHTML=effectiveVars.map(item=>{
    if(item.autoFromLedger){
      return `
        <div class="expense-item auto-item">
          <div class="item-left">
            <span class="item-name">${item.name}<span class="auto-tag ledger">가계부</span></span>
            <span class="item-cat">${item.category}</span>
          </div>
          <div class="item-right"><span class="item-amount orange">${fmt(item.amount)}</span></div>
        </div>`;
    }
    return `
      <div class="expense-item">
        <div class="item-left">
          <span class="item-name">${item.name}</span>
          <span class="item-cat">${item.category}</span>
        </div>
        <div class="item-right">
          <span class="item-amount orange">${fmt(item.amount)}</span>
          <div class="item-actions">
            <button class="icon-btn" onclick="App.editItem('variable',${item.id})">✏️</button>
            <button class="icon-btn" onclick="App.deleteItem('variable',${item.id})">🗑️</button>
          </div>
        </div>
      </div>`;
  }).join('');

  document.getElementById('variable-list').innerHTML=varHTML||'<div style="color:var(--text-sub);font-size:13px;padding:12px 0;">항목 없음</div>';
  renderFundCalc();
}

// ===== CREDIT CARD =====
function renderCredit(){
  const cm=S.currentMonths.credit;
  document.getElementById('credit-month-label').textContent=cm.y+'년 '+cm.m+'월';
  document.getElementById('credit-month-text').textContent=cm.y+'년 '+cm.m+'월 납부액';
  let monthTotal=0;
  for(const card of S.creditCards){
    if(isCardDueInMonth(card,cm.y,cm.m)){
      const monthly=Math.ceil(card.amount/card.months);
      if(!(card.paidMonths||[]).includes(mkey(cm.y,cm.m)))monthTotal+=monthly;
    }
  }
  document.getElementById('credit-month-total').textContent=fmt(monthTotal);
  const list=document.getElementById('credit-list');
  if(S.creditCards.length===0){
    list.innerHTML=`<div class="card" style="text-align:center;padding:50px;color:var(--text-sub);"><div style="font-size:40px;margin-bottom:12px;">💳</div><div style="font-weight:600;">등록된 대금이 없어요</div></div>`;
    return;
  }
  // 이번 달 일괄 결제 완료 버튼 표시
  const dueCards=S.creditCards.filter(c=>isCardDueInMonth(c,cm.y,cm.m));
  const allPaidThisMonth=dueCards.length>0&&dueCards.every(c=>(c.paidMonths||[]).includes(mkey(cm.y,cm.m)));
  const bulkBtnEl=document.getElementById('credit-bulk-pay-btn');
  if(bulkBtnEl){
    if(dueCards.length>0){
      bulkBtnEl.style.display='';
      bulkBtnEl.textContent=allPaidThisMonth?'✅ 결제 완료 해제':'✅ 이번 달 모두 결제 완료';
      bulkBtnEl.className='add-btn '+(allPaidThisMonth?'green-btn':'primary');
    } else {
      bulkBtnEl.style.display='none';
    }
  }
  // Group by card name
  const cardGroups={};
  for(const card of S.creditCards){
    if(!cardGroups[card.card])cardGroups[card.card]=[];
    cardGroups[card.card].push(card);
  }
  list.innerHTML=Object.entries(cardGroups).map(([cardName,items])=>{
    const oneTimeItems=items.filter(c=>c.months===1&&isCardDueInMonth(c,cm.y,cm.m));
    const installItems=items.filter(c=>c.months>1&&isCardDueInMonth(c,cm.y,cm.m));
    const groupRemaining=items.reduce((s,c)=>s+getCardTotalRemaining(c),0);

    // 이번 달 이용내역 section (일시불 / months=1)
    let oneTimeSection='';
    if(oneTimeItems.length>0){
      const rows=oneTimeItems.map(card=>{
        const monthly=Math.ceil(card.amount/card.months);
        const pk=mkey(card.startYear,card.startMonth);
        const isPaid=(card.paidMonths||[]).includes(pk);
        const isCurrent=(card.startYear===cm.y&&card.startMonth===cm.m);
        const statusClass=isPaid?'paid':isCurrent?'current':'future';
        const statusLabel=isPaid?'결제완료':isCurrent?'이번 달':'예정';
        return `
          <div class="credit-simple-row">
            <label class="credit-check-label" style="gap:10px;flex:1;min-width:0;">
              <input type="checkbox" ${isPaid?'checked':''} onchange="App.toggleCreditPaid(${card.id},'${pk}',this.checked)"/>
              <div style="min-width:0;">
                <div class="credit-item-name">${card.item}</div>
                <div class="credit-item-sub">일시불</div>
              </div>
            </label>
            <div class="credit-simple-right">
              <span class="credit-simple-amount">${fmt(monthly)}</span>
              <span class="credit-status-badge ${statusClass}">${statusLabel}</span>
              <div class="credit-row-actions">
                <button class="credit-edit-btn" onclick="App.editCredit(${card.id})">✏️ 수정</button>
                <button class="credit-delete-btn" style="font-size:12px;padding:2px 6px;border:1px solid var(--border);border-radius:6px;" onclick="App.deleteCredit(${card.id})">🗑️</button>
              </div>
            </div>
          </div>`;
      }).join('');
      oneTimeSection=`
        <div class="credit-section">
          <div class="credit-section-title">이번 달 이용내역 <span class="credit-section-count">(총 ${oneTimeItems.length}건)</span></div>
          ${rows}
        </div>`;
    }

    // 할부 이용내역 section (months>1)
    let installSection='';
    if(installItems.length>0){
      const installCards=installItems.map(card=>{
        const monthly=Math.ceil(card.amount/card.months);
        const paidCount=(card.paidMonths||[]).length;
        let tableRows='';
        for(let i=0;i<card.months;i++){
          let mm=card.startMonth+i,yy=card.startYear;
          while(mm>12){mm-=12;yy++;}
          const pk=mkey(yy,mm);
          const isPaid=(card.paidMonths||[]).includes(pk);
          const isCurrent=(yy===cm.y&&mm===cm.m);
          const day=Math.min(card.startDay||1,28);
          const dateStr=yy+'.'+String(mm).padStart(2,'0')+'.'+String(day).padStart(2,'0');
          const statusClass=isPaid?'paid':isCurrent?'current':'future';
          const statusLabel=isPaid?'결제완료':isCurrent?'이번 달':'예정';
          tableRows+=`
            <tr class="${isCurrent?'install-row-current':''}">
              <td>${i+1}회차${isCurrent?'<span class="install-current-badge"> (이번 달)</span>':''}</td>
              <td>${dateStr}</td>
              <td>${fmt(monthly)}</td>
              <td>
                <label class="credit-check-label" style="gap:4px;justify-content:flex-start;">
                  <input type="checkbox" ${isPaid?'checked':''} onchange="App.toggleCreditPaid(${card.id},'${pk}',this.checked)"/>
                  <span class="credit-status-badge ${statusClass}">${statusLabel}</span>
                </label>
              </td>
            </tr>`;
        }
        return `
          <div class="credit-install-item">
            <div class="credit-install-header">
              <div style="min-width:0;flex:1;">
                <div class="credit-item-name">${card.item}</div>
                <div class="credit-item-sub">${card.months}개월 할부</div>
              </div>
              <div class="credit-install-stats">
                <div class="credit-install-stat">
                  <div class="credit-install-stat-label">월 납부</div>
                  <div class="credit-install-stat-val">${fmt(monthly)}</div>
                </div>
                <div class="credit-install-stat">
                  <div class="credit-install-stat-label">진행</div>
                  <div class="credit-install-stat-val">${paidCount} / ${card.months}회</div>
                </div>
              </div>
              <div class="credit-row-actions">
                <button class="credit-edit-btn" onclick="App.editCredit(${card.id})">✏️ 수정</button>
                <button class="credit-delete-btn" style="font-size:12px;padding:2px 6px;border:1px solid var(--border);border-radius:6px;" onclick="App.deleteCredit(${card.id})">🗑️</button>
              </div>
            </div>
            <table class="credit-install-table">
              <thead><tr><th>회차</th><th>결제 예정일</th><th>금액</th><th>상태</th></tr></thead>
              <tbody>${tableRows}</tbody>
            </table>
          </div>`;
      }).join('');
      installSection=`
        <div class="credit-section">
          <div class="credit-section-title">할부 이용내역 <span class="credit-section-count">(총 ${installItems.length}건)</span></div>
          ${installCards}
        </div>`;
    }

    return `
      <div class="credit-card-group">
        <div class="credit-card-group-header">
          <span class="credit-card-group-name">💳 ${cardName}</span>
          <span class="credit-card-group-count">총 ${items.length}건 · 남은 대금 ${fmt(groupRemaining)}</span>
        </div>
        ${oneTimeSection}${installSection}
      </div>`;
  }).join('');
}

// ===== ASSETS =====
// ===== ASSET STOCKS SECTION (in assets tab) =====
function renderAssetStocks(){
  const stocks=S.stocks||[];
  // Summary using unified getTotalStockValue/Cost
  const totalBuy=getTotalStockCost();
  const totalCurrent=getTotalStockValue();
  const totalProfit=totalCurrent-totalBuy;
  const totalRate=totalBuy>0?((totalProfit/totalBuy)*100):0;
  const totalEl=document.getElementById('asset-stock-total-display');
  if(totalEl)totalEl.textContent=fmt(totalCurrent);
  const sumEl=document.getElementById('asset-stock-summary');
  if(sumEl){
    sumEl.innerHTML=stocks.length===0?'':
      `<div class="asset-stock-sum-item">
        <div class="asset-stock-sum-label">총 매입금액</div>
        <div class="asset-stock-sum-val">${fmt(totalBuy)}</div>
      </div>
      <div class="asset-stock-sum-item">
        <div class="asset-stock-sum-label">총 평가금액</div>
        <div class="asset-stock-sum-val" style="color:#00CEC9;">${fmt(totalCurrent)}</div>
      </div>
      <div class="asset-stock-sum-item">
        <div class="asset-stock-sum-label">총 손익</div>
        <div class="asset-stock-sum-val" style="color:${totalProfit>=0?'var(--green)':'var(--red)'};">${totalProfit>=0?'+':''}${fmt(totalProfit)}<span style="font-size:12px;margin-left:4px;">(${totalRate>=0?'+':''}${totalRate.toFixed(1)}%)</span></div>
      </div>`;
  }
  const listEl=document.getElementById('asset-stock-list');
  if(!listEl)return;
  if(stocks.length===0){
    listEl.innerHTML='<div style="padding:16px 0;text-align:center;color:var(--text-sub);font-size:13px;">종목을 추가하세요</div>';
    return;
  }

  // Categorize by stockType
  const domestic=stocks.filter(st=>st.stockType==='domestic'||(!st.stockType&&/^\d{6}$/.test(st.ticker)));
  const foreignStocks=stocks.filter(st=>st.stockType==='foreign');
  const goldStocks=stocks.filter(st=>st.stockType==='gold');

  function domesticCard(st){
    const val=(parseFloat(st.currentPrice)||0)*(parseFloat(st.quantity)||0);
    const cost=(parseFloat(st.buyPrice)||0)*(parseFloat(st.quantity)||0);
    const profit=val-cost;
    const rate=cost>0?((val-cost)/cost*100):0;
    const pos=rate>=0;
    return `<div class="stk-card">
      <div class="stk-card-top">
        <div class="stk-card-name">${st.name}</div>
        <div class="stk-card-actions">
          <button class="icon-btn" onclick="App.editItem('stock',${st.id})">✏️</button>
          <button class="icon-btn" onclick="App.deleteItem('stock',${st.id})">🗑️</button>
        </div>
      </div>
      ${st.ticker?`<div class="stk-card-ticker">${st.ticker}${st.sector?' · '+st.sector:''}</div>`:''}
      <div class="stk-card-row">
        <span class="stk-card-label">매입단가</span>
        <span class="stk-card-val">${fmt(st.buyPrice)}</span>
      </div>
      <div class="stk-card-row">
        <span class="stk-card-label">현재가</span>
        <input class="stk-price-input" type="text" inputmode="numeric" value="${st.currentPrice?(st.currentPrice).toLocaleString('ko-KR'):''}"
          oninput="App.numInputFmt(this)"
          onchange="App.updateStockPrice(${st.id},this.value)"/>
      </div>
      <div class="stk-card-row">
        <span class="stk-card-label">${st.quantity}주 평가액</span>
        <span class="stk-card-val" style="font-weight:700;">${fmt(val)}</span>
      </div>
      <div class="stk-card-profit" style="color:${pos?'var(--green)':'var(--red)'};">
        ${pos?'+':''}${rate.toFixed(1)}% &nbsp; ${pos?'+':''}${fmt(Math.abs(profit))}
      </div>
    </div>`;
  }

  function manualCard(st){
    const val=parseFloat(st.currentAmount)||0;
    const cost=parseFloat(st.buyAmount)||0;
    const profit=val-cost;
    const rate=cost>0?((val-cost)/cost*100):0;
    const pos=rate>=0;
    return `<div class="stk-card">
      <div class="stk-card-top">
        <div class="stk-card-name">${st.name}</div>
        <div class="stk-card-actions">
          <button class="icon-btn" onclick="App.editItem('stock',${st.id})">✏️</button>
          <button class="icon-btn" onclick="App.deleteItem('stock',${st.id})">🗑️</button>
        </div>
      </div>
      ${st.ticker&&st.ticker!=='금현물'?`<div class="stk-card-ticker">${st.ticker}${st.sector?' · '+st.sector:''}</div>`:st.sector?`<div class="stk-card-ticker">${st.sector}</div>`:''}
      <div class="stk-card-row">
        <span class="stk-card-label">매입금액</span>
        <input class="stk-price-input" type="text" inputmode="numeric" value="${cost?(cost).toLocaleString('ko-KR'):''}" placeholder="0"
          oninput="App.numInputFmt(this)"
          onchange="App.updateStockBuyAmount(${st.id},this.value)"/>
      </div>
      <div class="stk-card-row">
        <span class="stk-card-label">평가금액</span>
        <input class="stk-price-input" type="text" inputmode="numeric" value="${val?(val).toLocaleString('ko-KR'):''}" placeholder="0"
          oninput="App.numInputFmt(this)"
          onchange="App.updateStockCurrentAmount(${st.id},this.value)" style="background:#e8f5e9;"/>
      </div>
      <div class="stk-card-row">
        <span class="stk-card-label">손익</span>
        <span class="stk-card-val" style="font-weight:700;color:${pos?'var(--green)':'var(--red)'};">${profit>=0?'+':''}${fmt(profit)}</span>
      </div>
      <div class="stk-card-profit" style="color:${pos?'var(--green)':'var(--red)'};">
        ${pos?'+':''}${rate.toFixed(1)}%
      </div>
    </div>`;
  }

  function colHTML(list,label,flag,cardFn){
    return `<div class="stk-col">
      <div class="stk-col-header ${flag}">${label} <span class="stk-col-count">${list.length}종목</span></div>
      ${list.length===0
        ? '<div class="stk-col-empty">없음</div>'
        : list.map(cardFn).join('')}
    </div>`;
  }

  listEl.innerHTML=`<div class="stk-split-grid">
    ${colHTML(domestic,'🇰🇷 국내주식','kr',domesticCard)}
    <div class="stk-right-col">
      ${colHTML(foreignStocks,'🌍 해외주식','us',manualCard)}
      ${colHTML(goldStocks,'🥇 금현물','gold',manualCard)}
    </div>
  </div>`;
}

function renderAssets(){
  const total=getTotalAssets();
  document.getElementById('asset-total-display').textContent=fmt(total);
  document.getElementById('asset-count-display').textContent=S.assets.length+'개 항목';
  const list=document.getElementById('asset-list');
  if(S.assets.length===0){
    list.innerHTML=`<div style="text-align:center;padding:32px;color:var(--text-sub);"><div style="font-size:32px;margin-bottom:8px;">🏦</div><div>아직 자산이 없어요</div></div>`;return;
  }
  // Group by category
  const cats=S.assetCategories||['계좌','적금','주식'];
  const grouped={};
  cats.forEach(c=>{grouped[c]=[];});
  grouped['기타']=grouped['기타']||[];
  S.assets.forEach(a=>{
    const cat=a.category&&cats.includes(a.category)?a.category:'기타';
    if(!grouped[cat])grouped[cat]=[];
    grouped[cat].push(a);
  });
  const catIcons={'계좌':'🏦','적금':'💰','주식':'📈','기타':'📌'};
  let html='';
  [...cats,'기타'].filter((c,i,arr)=>arr.indexOf(c)===i).forEach(cat=>{
    const items=grouped[cat]||[];
    if(items.length===0)return;
    const catTotal=items.reduce((s,a)=>s+(parseFloat(a.amount)||0),0);
    html+=`<div class="asset-category-section">
      <div class="asset-category-title">
        <span>${catIcons[cat]||'📌'} ${cat}</span>
        <span class="asset-category-badge">${fmt(catTotal)}</span>
      </div>`;
    html+=items.map(a=>`
      <div class="asset-item">
        <div class="asset-name">${a.name}</div>
        <div style="display:flex;align-items:center;gap:12px;">
          <span class="asset-amount">${fmt(a.amount)}</span>
          <button class="icon-btn" onclick="App.editItem('asset',${a.id})">✏️</button>
          <button class="icon-btn" onclick="App.deleteItem('asset',${a.id})">🗑️</button>
        </div>
      </div>`).join('');
    html+='</div>';
  });
  list.innerHTML=html;
  renderAssetStocks();
}

// ===== STOCKS =====
function renderStocks(){
  const totalVal=getTotalStockValue();
  const totalCost=getTotalStockCost();
  const totalProfit=totalVal-totalCost;
  const totalRate=totalCost>0?(totalProfit/totalCost)*100:0;
  document.getElementById('stock-total-val').textContent=fmt(totalVal);
  const profitEl=document.getElementById('stock-total-profit');
  profitEl.textContent=fmtSigned(totalProfit);
  profitEl.className='stock-sum-val '+(totalProfit>0?'red':totalProfit<0?'blue':'');
  const rateEl=document.getElementById('stock-total-rate');
  rateEl.textContent=(totalRate>=0?'+':'')+totalRate.toFixed(2)+'%';
  rateEl.className='stock-sum-val '+(totalRate>0?'red':totalRate<0?'blue':'');

  const tbody=document.getElementById('stock-tbody');
  if(S.stocks.length===0){
    tbody.innerHTML=`<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-sub);">종목을 추가해 주세요</td></tr>`;return;
  }
  tbody.innerHTML=S.stocks.map(st=>{
    const t=st.stockType;
    const isManual=t==='foreign'||t==='gold';
    const val=isManual?(parseFloat(st.currentAmount)||0):(parseFloat(st.currentPrice)||0)*(parseFloat(st.quantity)||0);
    const cost=isManual?(parseFloat(st.buyAmount)||0):(parseFloat(st.buyPrice)||0)*(parseFloat(st.quantity)||0);
    const profit=val-cost;
    const rate=cost>0?(profit/cost)*100:0;
    const cls=rate>0?'profit-pos':rate<0?'profit-neg':'profit-zero';
    const typeLabel=t==='gold'?'🥇금현물':t==='foreign'?'🌍해외':'🇰🇷국내';
    return `
      <tr>
        <td>
          <div class="stock-name">${st.name}</div>
          <div class="stock-ticker">${typeLabel} ${st.ticker}</div>
          ${st.sector?`<div class="stock-sector">${st.sector}</div>`:''}
        </td>
        <td>${isManual?`<input type="number" class="stock-price-input" value="${st.buyAmount||0}" onchange="App.updateStockBuyAmount(${st.id},this.value)" style="width:100px;"/>`:fmt(st.buyPrice)}</td>
        <td>${isManual?`<input type="number" class="stock-price-input" value="${st.currentAmount||0}" onchange="App.updateStockCurrentAmount(${st.id},this.value)" style="background:#e8f5e9;width:100px;"/>`:`<input type="number" class="stock-price-input" value="${st.currentPrice}" onchange="App.updateStockPrice(${st.id},this.value)"/>`}</td>
        <td>${isManual?'-':st.quantity}</td>
        <td style="font-weight:700;">${fmt(val)}</td>
        <td class="${cls}">${(rate>=0?'+':'')+rate.toFixed(2)}%<br><span style="font-size:11px;">${fmtSigned(profit)}</span></td>
        <td>
          <button class="icon-btn" onclick="App.editItem('stock',${st.id})">✏️</button>
          <button class="icon-btn" onclick="App.deleteItem('stock',${st.id})">🗑️</button>
        </td>
      </tr>`;
  }).join('');
}

async function tryFetchPrice(yahooUrl,isKorean){
  const proxies=[
    `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`,
    `https://thingproxy.freeboard.io/fetch/${yahooUrl}`,
  ];
  for(const pUrl of proxies){
    try{
      const res=await fetch(pUrl,{signal:AbortSignal.timeout(7000)});
      if(!res.ok)continue;
      const text=await res.text();
      let data;
      try{data=JSON.parse(text);}catch{continue;}
      const price=data?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if(price&&price>0)return isKorean?Math.round(price):Math.round(price*1370);
    }catch(e){}
  }
  return null;
}

async function fetchStockPrices(){
  const btn=document.getElementById('stock-refresh-btn');
  const status=document.getElementById('stock-refresh-status');
  if(!btn)return;
  btn.classList.add('loading');btn.textContent='🔄 새로고침 중...';
  if(status)status.textContent='현재가를 가져오는 중...';
  let updated=0,failed=[];
  for(const st of S.stocks){
    // Only auto-refresh domestic stocks; foreign/gold are manual
    if(st.stockType==='foreign'||st.stockType==='gold'){continue;}
    try{
      const isKorean=/^\d{6}$/.test(st.ticker);
      const baseUrl='https://query1.finance.yahoo.com/v8/finance/chart/';
      const q='?interval=1d&range=1d';
      const symbol=isKorean?st.ticker+'.KS':st.ticker;
      let price=await tryFetchPrice(baseUrl+encodeURIComponent(symbol)+q,isKorean);
      if(!price&&isKorean)price=await tryFetchPrice(baseUrl+encodeURIComponent(st.ticker+'.KQ')+q,true);
      if(!price&&isKorean)price=await tryFetchPrice('https://query2.finance.yahoo.com/v8/finance/chart/'+encodeURIComponent(symbol)+q,isKorean);
      if(price&&price>0){st.currentPrice=price;updated++;}
      else failed.push(st.name);
    }catch(e){failed.push(st.name);}
    await new Promise(r=>setTimeout(r,400));
  }
  saveState();renderStocks();renderAssetStocks();renderDashboard();
  btn.classList.remove('loading');btn.textContent='🔄 현재가 새로고침';
  const now=new Date().toLocaleTimeString('ko-KR');
  if(status){
    if(updated>0)status.textContent=`${now} — ${updated}개 업데이트${failed.length>0?' | 실패: '+failed.join(', '):''}`;
    else status.textContent=`${now} — 새로고침 실패 (장 마감 또는 네트워크 오류)`;
    status.style.color=failed.length>0?'var(--red)':'var(--green)';
  }
  document.querySelectorAll('.stock-price-input').forEach(el=>{
    el.classList.add('refreshed');setTimeout(()=>el.classList.remove('refreshed'),2000);
  });
}

// ===== CONSUMPTION CALENDAR =====
function renderCalendar(){
  const y=S.calYear;
  document.getElementById('cal-year-label').textContent=y+'년';
  const now=new Date();
  const months=['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  const grid=document.getElementById('cal-year-grid');
  grid.innerHTML=months.map((mLabel,idx)=>{
    const m=idx+1;
    const key=y+'-'+m;
    const isNow=(now.getFullYear()===y&&now.getMonth()+1===m);
    const events=((S.consumptionCalendar[y]||{})[m])||[];
    const isSynced=!!(S.calFoodSync&&S.calFoodSync[key]);
    const foodBudget=isSynced?getFoodBudgetAmount(y,m):0;
    const eventsTotal=events.reduce((s,e)=>s+(parseFloat(e.amount)||0),0);
    const monthTotal=eventsTotal+foodBudget;
    return `
      <div class="cal-month-card ${isNow?'cal-month-now':''}">
        <div class="cal-month-header">
          <span>${mLabel}${isNow?'<span class="cal-now-tag">NOW</span>':''}</span>
          <div style="display:flex;align-items:center;gap:4px;">
            ${monthTotal>0?`<span class="cal-month-total">${fmt(monthTotal)}</span>`:''}
            <button class="cal-food-sync-btn ${isSynced?'active':''}" onclick="App.toggleCalFoodSync(${y},${m})" title="${isSynced?'식비 동기화 해제':'식비 예산 동기화'}">🔗</button>
            <button class="cal-month-add" onclick="App.openCalModal(${y},${m})">+</button>
          </div>
        </div>
        ${isSynced?`<div class="cal-food-sync-row">🍽️ 식비예산 ${fmt(foodBudget)}</div>`:''}
        <div class="cal-event-list">
          ${events.length===0&&!isSynced?'<div class="cal-empty">일정 없음</div>':events.map(e=>`
            <div class="cal-event-item">
              <span class="cal-event-name">${e.name}${e.amount>0?'<br><span class="cal-event-amount">'+fmt(e.amount)+'</span>':''}</span>
              <button class="cal-event-delete" onclick="App.deleteCalEvent(${y},${m},${e.id})">✕</button>
            </div>`).join('')}
        </div>
      </div>`;
  }).join('');
  renderSavingsGoals();
}

function renderSavingsGoals(){
  const y=S.calYear;
  const goals=S.savingsGoals[y]||[];
  const totalTarget=goals.reduce((s,g)=>s+(parseFloat(g.target)||0),0);
  const totalSaved=goals.reduce((s,g)=>s+(parseFloat(g.saved)||0),0);
  const overallPct=totalTarget>0?Math.min(100,(totalSaved/totalTarget)*100):0;
  const subEl=document.getElementById('savings-overall-sub');if(subEl)subEl.textContent='달성률 '+overallPct.toFixed(1)+'%';
  const savedEl=document.getElementById('savings-overall-saved');if(savedEl)savedEl.textContent='저축 '+fmt(totalSaved);
  const targetEl=document.getElementById('savings-overall-target');if(targetEl)targetEl.textContent='목표 '+fmt(totalTarget);
  const fillEl=document.getElementById('savings-overall-fill');
  if(fillEl){fillEl.style.width=overallPct+'%';fillEl.style.background=overallPct>=100?'linear-gradient(90deg,#43C98A,#00B894)':'linear-gradient(90deg,#A29BFE,#6C5CE7)';}
  const container=document.getElementById('savings-goals-container');if(!container)return;
  if(goals.length===0){
    container.innerHTML=`<div class="savings-empty-state"><div style="font-size:36px;margin-bottom:10px;">🎯</div><div style="font-size:15px;font-weight:700;color:#5E4BC4;margin-bottom:4px;">아직 저축 목표가 없어요</div><div style="font-size:13px;color:#9490A8;">위 "+ 목표 추가" 버튼을 눌러서 시작하세요!</div></div>`;return;
  }
  container.innerHTML=goals.map(g=>{
    const target=parseFloat(g.target)||0;
    const saved=parseFloat(g.saved)||0;
    const pct=target>0?Math.min(100,(saved/target)*100):0;
    const remaining=Math.max(0,target-saved);
    const done=pct>=100;
    const color=g.color||'#A29BFE';
    return `
      <div class="savings-goal-card ${done?'goal-done':''}">
        <div class="savings-goal-card-top">
          <div class="savings-goal-card-title">
            <span class="savings-goal-dot" style="background:${color}"></span>
            <span class="savings-goal-card-name">${g.name}</span>
            ${done?'<span class="goal-done-badge">🎉 달성!</span>':''}
          </div>
          <div class="savings-goal-card-actions">
            <button class="icon-btn" onclick="App.editSavingsGoal(${g.id})">✏️</button>
            <button class="icon-btn" onclick="App.deleteSavingsGoal(${g.id})">🗑️</button>
          </div>
        </div>
        <div class="savings-progress-track">
          <div class="savings-progress-fill" style="width:${pct}%;background:${color};"></div>
        </div>
        <div class="savings-goal-meta">
          <div class="savings-goal-meta-left">
            <span class="savings-saved-label">저축</span>
            <input class="savings-saved-input" type="text" inputmode="numeric" value="${saved?(saved).toLocaleString('ko-KR'):''}"
              oninput="App.numInputFmt(this)"
              onchange="App.updateSavedAmount(${g.id},this.value)"
              onkeydown="if(event.key==='Enter'){App.updateSavedAmount(${g.id},this.value);this.blur();}"
              style="border-color:${color}"/>
          </div>
          <div class="savings-goal-meta-right">
            <span class="savings-pct-badge" style="background:${color}22;color:${color}">${pct.toFixed(1)}%</span>
            <span class="savings-target-label">목표 ${fmt(target)}</span>
            ${!done?`<span class="savings-remaining-label">남은 ${fmt(remaining)}</span>`:''}
          </div>
        </div>
      </div>`;
  }).join('');
}

// ===== FOOD CALENDAR — INLINE PANEL =====
let currentFoodPanel=null;

function renderFood(){
  const cm=S.currentMonths.food;
  document.getElementById('food-month-label').textContent=cm.y+'년 '+cm.m+'월';
  const key=mkey(cm.y,cm.m);
  const directSetting=S.foodDirectSet[key]||{direct:false,amount:0};
  const foodTotal=getFoodTotal(cm.y,cm.m);
  const dc=document.getElementById('food-direct-check');if(dc)dc.checked=directSetting.direct;
  const dw=document.getElementById('food-direct-input-wrap');if(dw)dw.style.display=directSetting.direct?'block':'none';
  if(directSetting.direct){const inp=document.getElementById('food-direct-input');if(inp)inp.value=directSetting.amount;}
  document.getElementById('food-total-display').textContent=fmt(foodTotal);
  document.getElementById('food-reflect-amount').textContent=fmt(foodTotal);
  const days=S.foodCalendar[key]||{};
  const firstDay=new Date(cm.y,cm.m-1,1).getDay();
  const daysInMonth=new Date(cm.y,cm.m,0).getDate();
  const dowLabels=['일','월','화','수','목','금','토'];
  let cells='';
  for(let i=0;i<firstDay;i++)cells+='<div class="food-day empty"></div>';
  for(let d=1;d<=daysInMonth;d++){
    const dow=(firstDay+d-1)%7;
    const dd=days[d]||{};
    const isOpen=currentFoodPanel===d;
    cells+=`
      <div class="food-day${isOpen?' panel-open':''}" onclick="App.toggleFoodPanel(${d})" title="클릭하여 편집">
        <div class="food-day-num ${dow===0?'sun':dow===6?'sat':''}">${d}</div>
        ${dd.special?`<div class="food-special-tag">${dd.special}</div>`:''}
        ${dd.memo?`<div class="food-memo">${dd.memo}</div>`:''}
        ${dd.amount?`<div class="food-amount">${Number(dd.amount).toLocaleString('ko-KR')}</div>`:''}
      </div>`;
  }
  const rem=(firstDay+daysInMonth)%7;
  if(rem>0)for(let i=0;i<7-rem;i++)cells+='<div class="food-day empty"></div>';
  document.getElementById('food-calendar').innerHTML=`
    <div class="food-cal-header">
      ${dowLabels.map((d,i)=>`<div class="food-cal-dow ${i===0?'sun':i===6?'sat':''}">${d}</div>`).join('')}
    </div>
    <div class="food-cal-grid">${cells}</div>
    <div style="padding:14px 18px;background:var(--green-light);border-top:1px solid var(--border);font-size:13px;font-weight:700;text-align:right;color:var(--green);">총 ${fmt(foodTotal)}</div>`;

  // Re-render panel if one was open
  if(currentFoodPanel!==null){
    renderFoodPanel(currentFoodPanel);
  } else {
    const existing=document.getElementById('food-inline-panel');
    if(existing)existing.remove();
  }
}

function toggleFoodPanel(d){
  const cm=S.currentMonths.food;
  if(currentFoodPanel===d){
    // Same day → close
    currentFoodPanel=null;
    const panel=document.getElementById('food-inline-panel');
    if(panel)panel.remove();
    // Update cell highlight
    renderFood();
    return;
  }
  currentFoodPanel=d;
  renderFood(); // re-render to highlight correct cell, then panel renders inside
}

function renderFoodPanel(d){
  const cm=S.currentMonths.food;
  const key=mkey(cm.y,cm.m);
  const dd=(S.foodCalendar[key]||{})[d]||{};
  // Remove existing panel
  const existing=document.getElementById('food-inline-panel');
  if(existing)existing.remove();

  const panel=document.createElement('div');
  panel.id='food-inline-panel';
  panel.className='food-inline-panel';
  panel.innerHTML=`
    <div class="food-panel-header">
      <span>🍱 ${cm.y}년 ${cm.m}월 ${d}일 기록</span>
      <button class="food-panel-close" onclick="App.closeFoodPanel()">✕ 닫기</button>
    </div>
    <div class="food-panel-fields">
      <div class="food-panel-field">
        <label>📌 특별 일정</label>
        <div class="food-panel-input-row">
          <input type="text" id="fp-special" class="form-input" value="${(dd.special||'').replace(/"/g,'&quot;')}" placeholder="연차, 생일파티..."
            onkeydown="if(event.key==='Enter')App.saveFoodField(${d},'special')"/>
          <button class="food-save-field-btn" onclick="App.saveFoodField(${d},'special')">저장</button>
        </div>
        <div class="food-field-feedback" id="fp-special-feedback"></div>
      </div>
      <div class="food-panel-field">
        <label>🍽️ 식사 메모</label>
        <div class="food-panel-input-row">
          <input type="text" id="fp-memo" class="form-input" value="${(dd.memo||'').replace(/"/g,'&quot;')}" placeholder="배달, 된장찌개..."
            onkeydown="if(event.key==='Enter')App.saveFoodField(${d},'memo')"/>
          <button class="food-save-field-btn" onclick="App.saveFoodField(${d},'memo')">저장</button>
        </div>
        <div class="food-field-feedback" id="fp-memo-feedback"></div>
      </div>
      <div class="food-panel-field">
        <label>💰 식비 금액 (원)</label>
        <div class="food-panel-input-row">
          <input type="text" inputmode="numeric" id="fp-amount" class="form-input" value="${dd.amount?(dd.amount).toLocaleString('ko-KR'):''}" placeholder="15,000"
            oninput="App.numInputFmt(this)"
            onkeydown="if(event.key==='Enter')App.saveFoodField(${d},'amount')"/>
          <button class="food-save-field-btn" onclick="App.saveFoodField(${d},'amount')">저장</button>
        </div>
        <div class="food-field-feedback" id="fp-amount-feedback"></div>
      </div>
    </div>`;

  const foodCal=document.getElementById('food-calendar');
  if(foodCal)foodCal.insertAdjacentElement('afterend',panel);
  setTimeout(()=>panel.scrollIntoView({behavior:'smooth',block:'nearest'}),50);
}

function closeFoodPanel(){
  currentFoodPanel=null;
  const panel=document.getElementById('food-inline-panel');
  if(panel)panel.remove();
  renderFood();
}

function saveFoodField(d,field){
  const cm=S.currentMonths.food;
  const key=mkey(cm.y,cm.m);
  if(!S.foodCalendar[key])S.foodCalendar[key]={};
  if(!S.foodCalendar[key][d])S.foodCalendar[key][d]={};
  let value;
  if(field==='amount'){
    value=numInputParse(document.getElementById('fp-amount').value);
  } else {
    value=(document.getElementById('fp-'+field).value||'').trim();
  }
  S.foodCalendar[key][d][field]=value;
  saveState();

  // Green border feedback (update in-place without closing)
  const input=document.getElementById('fp-'+field);
  const feedback=document.getElementById('fp-'+field+'-feedback');
  if(input){
    const orig=input.style.borderColor;
    input.style.borderColor='var(--green)';
    setTimeout(()=>input.style.borderColor=orig,1800);
  }
  if(feedback){
    feedback.textContent='✓ 저장됨';
    feedback.style.color='var(--green)';
    setTimeout(()=>{feedback.textContent='';},1800);
  }

  // Update food total display only (not full re-render, to preserve panel)
  const foodTotal=getFoodTotal(cm.y,cm.m);
  const ftEl=document.getElementById('food-total-display');
  if(ftEl)ftEl.textContent=fmt(foodTotal);
  const frEl=document.getElementById('food-reflect-amount');
  if(frEl)frEl.textContent=fmt(foodTotal);

  // Update the day cell display
  const dayCells=document.querySelectorAll('.food-day:not(.empty)');
  const dayIdx=d-1; // cells start at 0 but there may be leading empty cells
  // Find by data-day or by scanning
  document.querySelectorAll('.food-cal-grid .food-day:not(.empty)').forEach((cell,i)=>{
    const num=cell.querySelector('.food-day-num');
    if(num&&parseInt(num.textContent)===d){
      const days=S.foodCalendar[key]||{};
      const dd2=days[d]||{};
      // Rebuild inner content
      const dow=cell.querySelector('.food-day-num').classList.contains('sat')?6:cell.querySelector('.food-day-num').classList.contains('sun')?0:-1;
      const dowClass=dow===0?'sun':dow===6?'sat':'';
      cell.innerHTML=`
        <div class="food-day-num ${dowClass}">${d}</div>
        ${dd2.special?`<div class="food-special-tag">${dd2.special}</div>`:''}
        ${dd2.memo?`<div class="food-memo">${dd2.memo}</div>`:''}
        ${dd2.amount?`<div class="food-amount">${Number(dd2.amount).toLocaleString('ko-KR')}</div>`:''}`;
    }
  });
  // Update calendar total footer
  const footer=document.querySelector('.food-calendar > div:last-child');
  if(footer&&footer.style.background)footer.textContent='총 '+fmt(foodTotal);

  // Update dashboard/income if open
  renderDashboard();renderIncome();
}

// ===== INSTALLMENT =====
function renderInstallment(){
  const opts=S.cardSettings.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
  document.getElementById('inst-card').innerHTML=opts;
  document.getElementById('mc-card').innerHTML=opts;
  renderCardSettings();calcInstallment();
}

function calcInstallment(){
  const principal=parseFloat(document.getElementById('inst-principal').value)||0;
  const months=parseInt(document.getElementById('inst-months').value)||0;
  const days=parseFloat(document.getElementById('inst-days').value)||30;
  const cardId=parseInt(document.getElementById('inst-card').value);
  const manualRateInput=document.getElementById('inst-rate').value;
  const manualRate=manualRateInput?parseFloat(manualRateInput):NaN;
  let rate=isNaN(manualRate)?getCardRate(cardId,months):manualRate;
  if(!manualRateInput)document.getElementById('inst-rate').placeholder=rate>0?`자동: ${rate}% (연)`:'수수료율이 자동 적용됩니다';
  const totalInterest=principal*(rate/100)*days/365;
  const monthlyPrincipal=months>0?Math.ceil(principal/months):0;
  const monthlyTotal=months>0?Math.ceil((principal+totalInterest)/months):0;
  document.getElementById('res-principal').textContent=fmt(principal);
  document.getElementById('res-interest').textContent=fmt(totalInterest);
  document.getElementById('res-monthly-principal').textContent=fmt(monthlyPrincipal);
  document.getElementById('res-monthly-total').textContent=fmt(monthlyTotal);
  document.getElementById('res-total').textContent=fmt(principal+totalInterest);
}

function renderCardSettings(){
  document.getElementById('card-settings-list').innerHTML=S.cardSettings.map(card=>`
    <div class="card-setting-item">
      <div class="card-setting-header">
        <input class="card-setting-name-input" type="text" value="${card.name}" onchange="App.updateCardName(${card.id},this.value)"/>
        <button class="card-setting-delete" onclick="App.deleteCardSetting(${card.id})">🗑️</button>
      </div>
      <table class="rate-table">
        <thead><tr><th>최소</th><th>최대</th><th>연이율 (%)</th><th></th></tr></thead>
        <tbody>
          ${card.rates.map(r=>`
            <tr>
              <td><input class="rate-input" type="number" value="${r.minMonths}" onchange="App.updateRate(${card.id},${r.id},'minMonths',this.value)"/></td>
              <td><input class="rate-input" type="number" value="${r.maxMonths}" onchange="App.updateRate(${card.id},${r.id},'maxMonths',this.value)"/></td>
              <td><input class="rate-input" type="number" step="0.1" value="${r.rate}" onchange="App.updateRate(${card.id},${r.id},'rate',this.value)"/></td>
              <td><button class="icon-btn" onclick="App.deleteRate(${card.id},${r.id})">✕</button></td>
            </tr>`).join('')}
        </tbody>
      </table>
      <button class="add-rate-btn" onclick="App.addRate(${card.id})">+ 구간 추가</button>
    </div>`).join('');
}

// ===== MODAL SYSTEM =====
function openModal(type){
  document.getElementById('modal-overlay').classList.add('active');
  document.querySelectorAll('.modal').forEach(m=>m.classList.remove('active'));
  const modal=document.getElementById('modal-'+type);
  if(modal)modal.classList.add('active');
  if(type==='credit'){
    const cm=S.currentMonths.credit;
    document.getElementById('mc-start-year').value=cm.y;
    document.getElementById('mc-start-month').value=cm.m;
  }
}

function openIncomeModal(){
  document.getElementById('modal-income-id').value='';
  document.getElementById('mi-name').value='';
  document.getElementById('mi-cat').value='';
  document.getElementById('mi-amount').value='';
  document.getElementById('modal-income-edit-label').textContent='추가';
  openModal('income');
}

function openFixedModal(){
  document.getElementById('modal-fixed-id').value='';
  document.getElementById('mf-name').value='';
  document.getElementById('mf-cat').value='';
  document.getElementById('mf-amount').value='';
  const cb=document.getElementById('mf-is-savings');if(cb)cb.checked=false;
  document.getElementById('modal-fixed-edit-label').textContent='추가';
  openModal('fixed');
}

function openStockModal(){
  document.getElementById('modal-stock-id').value='';
  document.getElementById('ms-name').value='';
  document.getElementById('ms-ticker').value='';
  document.getElementById('ms-sector').value='';
  document.getElementById('ms-buy').value='';
  document.getElementById('ms-current').value='';
  document.getElementById('ms-qty').value='1';
  document.getElementById('ms-buy-amount').value='';
  document.getElementById('ms-current-amount').value='';
  const tmEl=document.getElementById('ms-ticker-manual');if(tmEl)tmEl.value='';
  const smEl=document.getElementById('ms-sector-manual');if(smEl)smEl.value='';
  // Default to domestic
  const radios=document.querySelectorAll('input[name="ms-type"]');
  radios.forEach(r=>{r.checked=(r.value==='domestic');});
  onStockTypeChange('domestic');
  document.getElementById('modal-stock-edit-label').textContent='추가';
  openModal('stock');
}

function closeModal(){
  document.getElementById('modal-overlay').classList.remove('active');
  document.querySelectorAll('.modal').forEach(m=>m.classList.remove('active'));
}

// ===== CRUD =====
function saveIncome(){
  const cm=S.currentMonths.income;
  const data=getMonthData(cm.y,cm.m);
  const id=document.getElementById('modal-income-id').value;
  const name=document.getElementById('mi-name').value.trim();
  const category=document.getElementById('mi-cat').value.trim()||'기타';
  const amount=numInputParse(document.getElementById('mi-amount').value);
  if(!name)return alert('항목명을 입력해주세요');
  if(id){const i=data.income.find(i=>i.id==id);if(i){i.name=name;i.category=category;i.amount=amount;}}
  else data.income.push({id:genId(),name,category,amount});
  saveState();closeModal();renderIncome();renderDashboard();
}

function saveFixed(){
  const cm=S.currentMonths.income;
  const data=getMonthData(cm.y,cm.m);
  const id=document.getElementById('modal-fixed-id').value;
  const name=document.getElementById('mf-name').value.trim();
  const category=document.getElementById('mf-cat').value.trim()||'기타';
  const amount=numInputParse(document.getElementById('mf-amount').value);
  if(!name)return alert('항목명을 입력해주세요');
  if(id){const i=data.fixed.find(i=>i.id==id);if(i){i.name=name;i.category=category;i.amount=amount;}}
  else data.fixed.push({id:genId(),name,category,amount});
  saveState();closeModal();renderIncome();renderDashboard();
}

function openVariableModal(){
  document.getElementById('modal-variable-id').value='';
  document.getElementById('mv-name').value='';
  document.getElementById('mv-cat').value='';
  document.getElementById('mv-amount').value='';
  document.getElementById('modal-variable-edit-label').textContent='추가';
  openModal('variable');
}

function saveVariable(){
  const cm=S.currentMonths.income;const data=getMonthData(cm.y,cm.m);
  const id=document.getElementById('modal-variable-id').value;
  const name=document.getElementById('mv-name').value.trim();
  const category=document.getElementById('mv-cat').value.trim()||'기타';
  const amount=numInputParse(document.getElementById('mv-amount').value);
  if(!name)return alert('항목명을 입력해주세요');
  if(id){const i=data.variable.find(i=>i.id==id);if(i){i.name=name;i.category=category;i.amount=amount;}}
  else data.variable.push({id:genId(),name,category,amount});
  saveState();closeModal();renderIncome();renderDashboard();
}

function _addCreditAutoEntries(card){
  const monthly=Math.ceil(card.amount/card.months);
  for(let i=0;i<card.months;i++){
    let mm=card.startMonth+i,yy=card.startYear;
    while(mm>12){mm-=12;yy++;}
    const pk=mkey(yy,mm);
    const day=Math.min(card.startDay||1,28);
    const dateStr=yy+'-'+String(mm).padStart(2,'0')+'-'+String(day).padStart(2,'0');
    const autoId='credit_'+card.id+'_'+pk;
    if(!S.ledger[pk])S.ledger[pk]=[];
    S.ledger[pk].push({
      id:genId(),creditAutoId:autoId,
      date:dateStr,type:'expense',category:'신용카드',
      memo:card.card+' — '+card.item+(card.months>1?' ('+(i+1)+'/'+card.months+'회)':''),
      amount:monthly
    });
    const mdata=getMonthData(yy,mm);
    if(!mdata.variable)mdata.variable=[];
    mdata.variable=mdata.variable.filter(v=>v.creditAutoId!==autoId);
    mdata.variable.push({
      id:genId(),
      name:card.item+(card.months>1?' ('+(i+1)+'/'+card.months+'회)':''),
      category:'신용카드',amount:monthly,
      autoFromCredit:true,creditId:card.id,creditAutoId:autoId
    });
  }
}

function saveCredit(){
  const editId=parseInt(document.getElementById('mc-edit-id').value)||0;
  const cardSelId=document.getElementById('mc-card').value;
  const item=document.getElementById('mc-item').value.trim();
  const amount=numInputParse(document.getElementById('mc-amount').value);
  const months=parseInt(document.getElementById('mc-months').value)||1;
  const startYear=parseInt(document.getElementById('mc-start-year').value)||2026;
  const startMonth=parseInt(document.getElementById('mc-start-month').value)||1;
  const startDay=parseInt(document.getElementById('mc-start-day').value)||new Date().getDate();
  if(!item||amount<=0)return alert('항목명과 금액을 입력해주세요');
  const cardName=S.cardSettings.find(c=>c.id==cardSelId)?.name||'카드';
  if(editId){
    const existing=S.creditCards.find(c=>c.id==editId);
    if(!existing)return;
    for(const key of Object.keys(S.ledger)){
      S.ledger[key]=(S.ledger[key]||[]).filter(e=>!e.creditAutoId||!e.creditAutoId.startsWith('credit_'+editId+'_'));
    }
    for(const key of Object.keys(S.monthlyData)){
      if(S.monthlyData[key]&&S.monthlyData[key].variable){
        S.monthlyData[key].variable=S.monthlyData[key].variable.filter(v=>v.creditId!==editId);
      }
    }
    existing.card=cardName;existing.item=item;existing.amount=amount;
    existing.months=months;existing.startYear=startYear;existing.startMonth=startMonth;existing.startDay=startDay;
    existing.paidMonths=[];
    _addCreditAutoEntries(existing);
  } else {
    const creditId=genId();
    const newCard={id:creditId,card:cardName,item,amount,months,startYear,startMonth,startDay,paidMonths:[]};
    S.creditCards.push(newCard);
    _addCreditAutoEntries(newCard);
  }
  saveState();closeModal();renderCredit();renderIncome();renderDashboard();renderLedger();
}

function openCreditModal(){
  document.getElementById('mc-edit-id').value='';
  document.getElementById('mc-edit-label').textContent='추가';
  document.getElementById('mc-item').value='';
  document.getElementById('mc-amount').value='';
  document.getElementById('mc-months').value='';
  document.getElementById('mc-start-day').value='';
  const now=new Date();
  document.getElementById('mc-start-year').value=now.getFullYear();
  document.getElementById('mc-start-month').value=now.getMonth()+1;
  openModal('credit');
}

function editCredit(id){
  const card=S.creditCards.find(c=>c.id==id);if(!card)return;
  document.getElementById('mc-edit-id').value=id;
  document.getElementById('mc-edit-label').textContent='수정';
  const cardSetting=S.cardSettings.find(c=>c.name===card.card);
  document.getElementById('mc-item').value=card.item;
  document.getElementById('mc-amount').value=(card.amount||0).toLocaleString('ko-KR');
  document.getElementById('mc-months').value=card.months;
  document.getElementById('mc-start-year').value=card.startYear;
  document.getElementById('mc-start-month').value=card.startMonth;
  document.getElementById('mc-start-day').value=card.startDay||1;
  openModal('credit');
  if(cardSetting){const sel=document.getElementById('mc-card');if(sel)sel.value=cardSetting.id;}
}

function populateAssetCategorySelect(selectedCat){
  const sel=document.getElementById('ma-category');if(!sel)return;
  const cats=S.assetCategories||['계좌','적금','주식'];
  sel.innerHTML=cats.map(c=>`<option value="${c}" ${c===selectedCat?'selected':''}>${c}</option>`).join('');
}

function openAssetModal(){
  document.getElementById('modal-asset-id').value='';
  document.getElementById('ma-name').value='';
  document.getElementById('ma-amount').value='';
  document.getElementById('modal-asset-edit-label').textContent='추가';
  populateAssetCategorySelect('계좌');
  openModal('asset');
}

function promptAddAssetCategory(){
  const name=prompt('새 분류 이름을 입력하세요:');
  if(!name||!name.trim())return;
  const trimmed=name.trim();
  if(!S.assetCategories)S.assetCategories=['계좌','적금','주식'];
  if(!S.assetCategories.includes(trimmed))S.assetCategories.push(trimmed);
  saveState();populateAssetCategorySelect(trimmed);
}

function saveAsset(){
  const id=document.getElementById('modal-asset-id').value;
  const name=document.getElementById('ma-name').value.trim();
  const amount=numInputParse(document.getElementById('ma-amount').value);
  const catEl=document.getElementById('ma-category');
  const category=catEl?catEl.value:'계좌';
  if(!name)return alert('자산명을 입력해주세요');
  if(id){const a=S.assets.find(a=>a.id==id);if(a){a.name=name;a.amount=amount;a.category=category;}}
  else S.assets.push({id:genId(),name,amount,category});
  saveState();closeModal();renderAssets();renderDashboard();
  syncFundCalcToAssets();
}

function getStockTypeFromModal(){
  const radios=document.querySelectorAll('input[name="ms-type"]');
  for(const r of radios){if(r.checked)return r.value;}
  return 'domestic';
}
function onStockTypeChange(val){
  const isDomestic=val==='domestic';
  const isManual=val==='foreign'||val==='gold';
  document.getElementById('ms-domestic-fields').style.display=isDomestic?'':'none';
  document.getElementById('ms-manual-fields').style.display=isManual?'':'none';
}
function saveStock(){
  const id=document.getElementById('modal-stock-id').value;
  const name=document.getElementById('ms-name').value.trim();
  const ticker=document.getElementById('ms-ticker').value.trim();
  const sector=document.getElementById('ms-sector').value.trim();
  const stockType=getStockTypeFromModal();
  if(!name)return alert('종목명을 입력해주세요');
  let stObj;
  if(stockType==='domestic'){
    const buyPrice=numInputParse(document.getElementById('ms-buy').value);
    const currentPrice=numInputParse(document.getElementById('ms-current').value)||buyPrice;
    const quantity=parseFloat(document.getElementById('ms-qty').value)||1;
    stObj={name,ticker,sector,stockType,buyPrice,currentPrice,quantity};
  } else {
    const buyAmount=numInputParse(document.getElementById('ms-buy-amount').value);
    const currentAmount=numInputParse(document.getElementById('ms-current-amount').value)||buyAmount;
    stObj={name,ticker:stockType==='gold'?'금현물':ticker,sector,stockType,buyAmount,currentAmount,buyPrice:0,currentPrice:0,quantity:1};
  }
  if(id){const st=S.stocks.find(s=>s.id==id);if(st)Object.assign(st,stObj);}
  else S.stocks.push({id:genId(),...stObj});
  syncStockAsset();
  saveState();closeModal();renderStocks();renderAssetStocks();renderAssets();renderDashboard();
}

function editItem(type,id){
  if(type==='income'){
    const cm=S.currentMonths.income;const i=getMonthData(cm.y,cm.m).income.find(i=>i.id==id);if(!i)return;
    document.getElementById('modal-income-id').value=id;
    document.getElementById('mi-name').value=i.name;
    document.getElementById('mi-cat').value=i.category;
    document.getElementById('mi-amount').value=(i.amount||0).toLocaleString('ko-KR');
    document.getElementById('modal-income-edit-label').textContent='수정';
    openModal('income');
  } else if(type==='fixed'){
    const cm=S.currentMonths.income;const i=getMonthData(cm.y,cm.m).fixed.find(i=>i.id==id);if(!i)return;
    document.getElementById('modal-fixed-id').value=id;
    document.getElementById('mf-name').value=i.name;
    document.getElementById('mf-cat').value=i.category;
    document.getElementById('mf-amount').value=(i.amount||0).toLocaleString('ko-KR');
    document.getElementById('modal-fixed-edit-label').textContent='수정';
    openModal('fixed');
  } else if(type==='variable'){
    const cm=S.currentMonths.income;
    const item=getMonthData(cm.y,cm.m).variable.find(i=>i.id==id);
    if(!item)return;
    document.getElementById('modal-variable-id').value=id;
    document.getElementById('mv-name').value=item.name;
    document.getElementById('mv-cat').value=item.category;
    document.getElementById('mv-amount').value=(item.amount||0).toLocaleString('ko-KR');
    document.getElementById('modal-variable-edit-label').textContent='수정';
    openModal('variable');
  } else if(type==='asset'){
    const a=S.assets.find(a=>a.id==id);if(!a)return;
    document.getElementById('modal-asset-id').value=id;
    document.getElementById('ma-name').value=a.name;
    document.getElementById('ma-amount').value=(a.amount||0).toLocaleString('ko-KR');
    document.getElementById('modal-asset-edit-label').textContent='수정';
    populateAssetCategorySelect(a.category||'계좌');
    openModal('asset');
  } else if(type==='stock'){
    const st=S.stocks.find(s=>s.id==id);if(!st)return;
    document.getElementById('modal-stock-id').value=id;
    document.getElementById('ms-name').value=st.name;
    document.getElementById('ms-ticker').value=st.ticker==='금현물'?'':st.ticker;
    document.getElementById('ms-sector').value=st.sector||'';
    // Set stockType radio
    const t=st.stockType||'domestic';
    const radios=document.querySelectorAll('input[name="ms-type"]');
    radios.forEach(r=>{r.checked=(r.value===t);});
    onStockTypeChange(t);
    if(t==='domestic'){
      document.getElementById('ms-buy').value=st.buyPrice?(st.buyPrice).toLocaleString('ko-KR'):'';
      document.getElementById('ms-current').value=st.currentPrice?(st.currentPrice).toLocaleString('ko-KR'):'';
      document.getElementById('ms-qty').value=st.quantity||1;
    } else {
      document.getElementById('ms-buy-amount').value=st.buyAmount?(st.buyAmount).toLocaleString('ko-KR'):'';
      document.getElementById('ms-current-amount').value=st.currentAmount?(st.currentAmount).toLocaleString('ko-KR'):'';
      const tmEl=document.getElementById('ms-ticker-manual');
      const smEl=document.getElementById('ms-sector-manual');
      const tickerVal=st.ticker==='금현물'?'':st.ticker;
      if(tmEl)tmEl.value=tickerVal;
      if(smEl)smEl.value=st.sector||'';
    }
    document.getElementById('modal-stock-edit-label').textContent='수정';
    openModal('stock');
  }
}

function deleteItem(type,id){
  if(!confirm('삭제하시겠어요?'))return;
  if(type==='income'){const cm=S.currentMonths.income;getMonthData(cm.y,cm.m).income=getMonthData(cm.y,cm.m).income.filter(i=>i.id!=id);}
  else if(type==='fixed'){const cm=S.currentMonths.income;getMonthData(cm.y,cm.m).fixed=getMonthData(cm.y,cm.m).fixed.filter(i=>i.id!=id);}
  else if(type==='variable'){const cm=S.currentMonths.income;getMonthData(cm.y,cm.m).variable=getMonthData(cm.y,cm.m).variable.filter(i=>i.id!=id);}
  else if(type==='asset'){S.assets=S.assets.filter(a=>a.id!=id);if(S.fundCalc&&S.fundCalc.assetLinked){S.fundCalc.amount=getTotalAssets();S.fundCalc.assetLinkedAt=Date.now();}}
  else if(type==='stock'){S.stocks=S.stocks.filter(s=>s.id!=id);syncStockAsset();}
  saveState();renderAll();
}

function updateAssetAmount(id,val){const a=S.assets.find(a=>a.id==id);if(a)a.amount=numInputParse(val);saveState();renderAssets();renderDashboard();syncFundCalcToAssets();}
function updateStockPrice(id,val){const st=S.stocks.find(s=>s.id==id);if(st)st.currentPrice=numInputParse(val);syncStockAsset();saveState();renderStocks();renderAssetStocks();renderDashboard();}
function updateStockBuyAmount(id,val){const st=S.stocks.find(s=>s.id==id);if(st)st.buyAmount=numInputParse(val);syncStockAsset();saveState();renderAssetStocks();renderDashboard();}
function updateStockCurrentAmount(id,val){const st=S.stocks.find(s=>s.id==id);if(st)st.currentAmount=numInputParse(val);syncStockAsset();saveState();renderStocks();renderAssetStocks();renderDashboard();}

function deleteCredit(id){
  if(!confirm('삭제하시겠어요?'))return;
  const card=S.creditCards.find(c=>c.id==id);
  if(card){
    for(const key of Object.keys(S.ledger)){
      S.ledger[key]=(S.ledger[key]||[]).filter(e=>!e.creditAutoId||!e.creditAutoId.startsWith('credit_'+id+'_'));
    }
    for(const key of Object.keys(S.monthlyData)){
      if(S.monthlyData[key]&&S.monthlyData[key].variable){
        S.monthlyData[key].variable=S.monthlyData[key].variable.filter(v=>v.creditId!==id);
      }
    }
  }
  S.creditCards=S.creditCards.filter(c=>c.id!=id);
  saveState();renderCredit();renderIncome();renderDashboard();renderLedger();
}

function markAllCreditPaidThisMonth(){
  const cm=S.currentMonths.credit;
  const key=mkey(cm.y,cm.m);
  const dueCards=S.creditCards.filter(c=>isCardDueInMonth(c,cm.y,cm.m));
  if(dueCards.length===0)return;
  const allPaid=dueCards.every(c=>(c.paidMonths||[]).includes(key));
  dueCards.forEach(card=>{
    if(!card.paidMonths)card.paidMonths=[];
    if(!allPaid){
      if(!card.paidMonths.includes(key))card.paidMonths.push(key);
    } else {
      card.paidMonths=card.paidMonths.filter(m=>m!==key);
    }
  });
  saveState();renderCredit();renderIncome();renderDashboard();renderLedger();
}

function toggleCreditPaid(cardId,pk,checked){
  const card=S.creditCards.find(c=>c.id==cardId);if(!card)return;
  if(!card.paidMonths)card.paidMonths=[];
  if(checked&&!card.paidMonths.includes(pk)){
    card.paidMonths.push(pk);
  } else if(!checked){
    card.paidMonths=card.paidMonths.filter(m=>m!==pk);
  }
  saveState();renderCredit();renderIncome();renderDashboard();renderLedger();
}

// ===== CALENDAR =====
function openCalModal(y,m){
  document.getElementById('modal-cal-month').value=y+'-'+m;
  document.getElementById('modal-cal-id').value='';
  document.getElementById('modal-cal-month-label').textContent=y+'년 '+m+'월';
  document.getElementById('mc-event-name').value='';
  document.getElementById('mc-event-amount').value='';
  // 식비 예산 힌트 표시
  const hint=document.getElementById('cal-food-hint');
  if(hint){
    const fb=getFoodBudgetAmount(y,m);
    if(fb>0){
      hint.style.display='block';
      hint.innerHTML='🍽️ '+y+'년 '+m+'월 식비 예산: <strong>'+fmt(fb)+'</strong>';
    } else {hint.style.display='none';}
  }
  openModal('cal');
}

function saveCalEvent(){
  const monthVal=document.getElementById('modal-cal-month').value;
  const[y,m]=monthVal.split('-').map(Number);
  const name=document.getElementById('mc-event-name').value.trim();
  const amount=numInputParse(document.getElementById('mc-event-amount').value);
  if(!name)return alert('내용을 입력해주세요');
  if(!S.consumptionCalendar[y])S.consumptionCalendar[y]={};
  if(!S.consumptionCalendar[y][m])S.consumptionCalendar[y][m]=[];
  S.consumptionCalendar[y][m].push({id:genId(),name,amount});
  saveState();closeModal();renderCalendar();
}

function deleteCalEvent(y,m,id){
  if(S.consumptionCalendar[y]&&S.consumptionCalendar[y][m])
    S.consumptionCalendar[y][m]=S.consumptionCalendar[y][m].filter(e=>e.id!=id);
  saveState();renderCalendar();
}

// Savings Goals
function openSavingsModal(){
  document.getElementById('modal-savings-id').value='';
  document.getElementById('msg-name').value='';
  document.getElementById('msg-target').value='';
  document.getElementById('msg-saved').value='';
  document.getElementById('msg-color').value='#A29BFE';
  document.querySelectorAll('.color-swatch').forEach(b=>b.classList.remove('active'));
  const first=document.querySelector('.color-swatch[data-color="#A29BFE"]');if(first)first.classList.add('active');
  openModal('savings');
}

function editSavingsGoal(id){
  const y=S.calYear;const g=(S.savingsGoals[y]||[]).find(g=>g.id==id);if(!g)return;
  document.getElementById('modal-savings-id').value=id;
  document.getElementById('msg-name').value=g.name;
  document.getElementById('msg-target').value=(g.target||0).toLocaleString('ko-KR');
  document.getElementById('msg-saved').value=(g.saved||0).toLocaleString('ko-KR');
  document.getElementById('msg-color').value=g.color||'#A29BFE';
  document.querySelectorAll('.color-swatch').forEach(b=>b.classList.toggle('active',b.dataset.color===(g.color||'#A29BFE')));
  openModal('savings');
}

function saveSavingsGoal(){
  const y=S.calYear;const id=document.getElementById('modal-savings-id').value;
  const name=document.getElementById('msg-name').value.trim();
  const target=numInputParse(document.getElementById('msg-target').value);
  const saved=numInputParse(document.getElementById('msg-saved').value);
  const color=document.getElementById('msg-color').value||'#A29BFE';
  if(!name)return alert('목표명을 입력해주세요');
  if(!S.savingsGoals[y])S.savingsGoals[y]=[];
  if(id){const g=S.savingsGoals[y].find(g=>g.id==id);if(g){g.name=name;g.target=target;g.saved=saved;g.color=color;}}
  else S.savingsGoals[y].push({id:genId(),name,target,saved,color});
  saveState();closeModal();renderSavingsGoals();
}

function deleteSavingsGoal(id){
  const y=S.calYear;if(S.savingsGoals[y])S.savingsGoals[y]=S.savingsGoals[y].filter(g=>g.id!=id);
  saveState();renderSavingsGoals();
}

function updateSavedAmount(id,val){
  const y=S.calYear;const g=(S.savingsGoals[y]||[]).find(g=>g.id==id);
  if(g)g.saved=numInputParse(val);
  saveState();renderSavingsGoals();
}

function pickSavingsColor(color,btn){
  document.getElementById('msg-color').value=color;
  document.querySelectorAll('.color-swatch').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
}

// Food direct
function toggleFoodDirect(checked){
  const cm=S.currentMonths.food;const key=mkey(cm.y,cm.m);
  if(!S.foodDirectSet[key])S.foodDirectSet[key]={direct:false,amount:0};
  S.foodDirectSet[key].direct=!!checked;
  const wrap=document.getElementById('food-direct-input-wrap');if(wrap)wrap.style.display=checked?'block':'none';
  saveState();renderFood();renderIncome();renderDashboard();
}

function saveFoodDirect(val){
  const cm=S.currentMonths.food;const key=mkey(cm.y,cm.m);
  if(!S.foodDirectSet[key])S.foodDirectSet[key]={direct:true,amount:0};
  S.foodDirectSet[key].amount=numInputParse(val);
  saveState();renderFood();renderIncome();renderDashboard();
}

// Card settings
function toggleCardSettings(){
  const panel=document.getElementById('card-settings-panel');
  const arrow=document.getElementById('card-settings-arrow');
  const isHidden=panel.style.display==='none';
  panel.style.display=isHidden?'block':'none';
  if(arrow)arrow.textContent=isHidden?'∧':'∨';
}

function addCardSetting(){
  S.cardSettings.push({id:genId(),name:'새 카드',rates:[{id:genId(),minMonths:2,maxMonths:2,rate:5.9}]});
  saveState();renderCardSettings();
}

function deleteCardSetting(id){
  if(S.cardSettings.length<=1)return alert('최소 1개의 카드는 있어야 해요');
  S.cardSettings=S.cardSettings.filter(c=>c.id!==id);
  saveState();renderCardSettings();
}

function updateCardName(id,name){const c=S.cardSettings.find(c=>c.id==id);if(c)c.name=name;saveState();renderInstallment();}
function addRate(cardId){const c=S.cardSettings.find(c=>c.id==cardId);if(!c)return;c.rates.push({id:genId(),minMonths:2,maxMonths:2,rate:5.9});saveState();renderCardSettings();}
function deleteRate(cardId,rateId){const c=S.cardSettings.find(c=>c.id==cardId);if(!c)return;c.rates=c.rates.filter(r=>r.id!=rateId);saveState();renderCardSettings();}
function updateRate(cardId,rateId,field,val){const c=S.cardSettings.find(c=>c.id==cardId);if(!c)return;const r=c.rates.find(r=>r.id==rateId);if(!r)return;r[field]=parseFloat(val)||0;saveState();calcInstallment();}

// ===== SAVINGS RATE =====
function renderSavingsRate(){
  const cm=S.currentMonths.dashboard;
  const income=getTotalIncome(cm.y,cm.m);
  const savings=getTotalSavings(cm.y,cm.m); // only isSavings-tagged fixed items
  const rate=income>0?(savings/income*100):0;
  const pct=Math.max(0,Math.min(100,rate));
  const color=rate>=30?'#43C98A':rate>=15?'#FFB347':'#F06292';
  const pctEl=document.getElementById('dash-sr-pct');
  const detailEl=document.getElementById('dash-sr-detail');
  const fillEl=document.getElementById('dash-sr-fill');
  if(pctEl){pctEl.textContent=rate.toFixed(1)+'%';pctEl.style.color=color;}
  if(detailEl)detailEl.textContent='저축 '+fmt(savings)+' / 수입 '+fmt(income);
  if(fillEl){fillEl.style.width=pct+'%';fillEl.style.background=color;}
}

// ===== LEDGER AUTOMATION (monthly auto-register) =====
function applyLedgerAutomations(y,m){
  const automations=(S.automations||[]).filter(a=>a.active!==false);
  if(automations.length===0)return;
  const key=mkey(y,m);
  if(!S.ledger[key])S.ledger[key]=[];
  const skipped=S.autoSkippedIds||[];

  const today=new Date();
  const todayY=today.getFullYear(),todayM=today.getMonth()+1,todayD=today.getDate();

  // 미래 달이면 아무것도 생성하지 않음
  if(y>todayY||(y===todayY&&m>todayM))return;

  // 중복 자동화 항목 제거 (같은 날짜+메모+금액인 auto 항목)
  const dupSeen=new Set();
  S.ledger[key]=S.ledger[key].filter(e=>{
    if(!e.autoLedgerId)return true;
    const sig=e.date+'|'+e.memo+'|'+e.amount;
    if(dupSeen.has(sig))return false;
    dupSeen.add(sig);
    return true;
  });

  let changed=false;
  automations.forEach(a=>{
    const startY=a.startYear||(a.startMonth?todayY:null)||todayY;
    const startM=a.startMonth||1;

    // 시작 달 이전이면 스킵
    if(y<startY||(y===startY&&m<startM))return;

    const day=Math.min(a.billingDay||1,28);

    // 현재 달인 경우, 결제일이 아직 안 지났으면 스킵
    if(y===todayY&&m===todayM&&todayD<day)return;

    const autoLedgerId='auto_'+a.id+'_'+key;
    const dateStr=y+'-'+String(m).padStart(2,'0')+'-'+String(day).padStart(2,'0');
    const memo=a.memo||a.name||'자동화';

    // 기존 항목 확인 (ID 또는 동일 날짜+메모+금액)
    const exists=S.ledger[key].some(e=>
      e.autoLedgerId===autoLedgerId||
      (e.autoLedgerId&&e.date===dateStr&&e.memo===memo&&e.amount===a.amount)
    );
    if(!exists&&!skipped.includes(autoLedgerId)){
      S.ledger[key].push({
        id:genId(),autoLedgerId,
        date:dateStr,type:a.type||'expense',
        category:a.category||'📦 기타',
        memo,tags:a.tags||[],amount:a.amount
      });
      changed=true;
    }
  });
  if(changed)saveState();
}

function _syncAutoModalCatSelect(selected){
  const cats=S.ledgerCategories||[];
  const makeOpts=(sel)=>cats.map(c=>`<option value="${c.name}" ${c.name===sel?'selected':''}>${c.name}</option>`).join('');
  const modal=document.getElementById('ma2-cat-sel');
  if(modal){
    modal.innerHTML=makeOpts(selected);
    if(selected&&!cats.some(c=>c.name===selected))modal.innerHTML=`<option value="${selected}" selected>${selected}</option>`+modal.innerHTML;
  }
  const inline=document.getElementById('la-cat-sel');
  if(inline){inline.innerHTML=makeOpts('');}
}

function addAutoInline(){
  const type=document.getElementById('la-type').value;
  const billingDay=parseInt(document.getElementById('la-day').value)||1;
  const today=new Date();
  const startYear=parseInt(document.getElementById('la-start-year').value)||today.getFullYear();
  const startMonth=parseInt(document.getElementById('la-start-month').value)||today.getMonth()+1;
  const category=(document.getElementById('la-cat-sel').value)||((S.ledgerCategories&&S.ledgerCategories[0])?S.ledgerCategories[0].name:'📦 기타');
  const rawMemo=(document.getElementById('la-memo').value||'').trim();
  const tags=extractTagsFromMemo(rawMemo);
  const memo=cleanMemoText(rawMemo);
  const amount=numInputParse(document.getElementById('la-amount').value);
  if(!memo||amount<=0)return alert('메모와 금액을 입력해주세요');
  if(!S.automations)S.automations=[];
  S.automations.push({id:genId(),type,billingDay,startYear,startMonth,category,memo,tags,amount,name:memo,active:true});
  saveState();
  document.getElementById('la-day').value='';
  document.getElementById('la-start-year').value='';
  document.getElementById('la-start-month').value='';
  document.getElementById('la-memo').value='';
  document.getElementById('la-amount').value='';
  const cm=S.currentMonths.ledger;
  applyLedgerAutomations(cm.y,cm.m);
  renderAutoList();renderLedger();renderDashboard();renderIncome();
}

// ===== LEDGER =====
function renderLedger(){
  const cm=S.currentMonths.ledger;
  applyLedgerAutomations(cm.y,cm.m);
  const lbl=document.getElementById('ledger-month-label');
  if(lbl)lbl.textContent=cm.y+'년 '+cm.m+'월';
  const key=mkey(cm.y,cm.m);
  const closed=S.closedMonths[key];
  const banner=document.getElementById('ledger-closed-banner');
  if(banner){
    if(closed){
      banner.style.display='flex';
      banner.innerHTML=`<span>📋 마감 완료 (${new Date(closed.closedAt).toLocaleDateString('ko-KR')} 마감)${closed.note?' — '+closed.note:''}</span>
        <button onclick="App.reopenMonth()">다시 열기</button>`;
    } else {banner.style.display='none';}
  }
  const entries=S.ledger[key]||[];
  const filter=S.ledgerFilter;
  const tagFilter=S.ledgerTagFilter;
  let filtered=filter==='__credit__'?entries.filter(e=>e.creditAutoId):filter?entries.filter(e=>e.category===filter):entries;
  if(tagFilter)filtered=filtered.filter(e=>(e.tags||[]).includes(tagFilter));
  const cats=[...new Set(entries.map(e=>e.category))];
  const filterBar=document.getElementById('ledger-filter-bar');
  if(filterBar){
    const creditEntries=entries.filter(e=>e.creditAutoId);
    filterBar.innerHTML=[
      `<button class="ledger-filter-chip ${!filter?'active':''}" onclick="App.setLedgerFilter(null)">전체 (${entries.length})</button>`,
      ...cats.map(c=>{
        const cnt=entries.filter(e=>e.category===c).length;
        const cc=getCategoryColor(c);
        const isActive=filter===c;
        return `<button class="ledger-filter-chip ${isActive?'active':''}" style="--chip-strip:${cc.strip};--chip-bg:${cc.bg};--chip-color:${cc.color};" onclick="App.setLedgerFilter('${c}')">${c} (${cnt})</button>`;
      }),
      creditEntries.length>0?`<button class="ledger-filter-chip ledger-filter-credit ${filter==='__credit__'?'active':''}" onclick="App.setLedgerFilter(S.ledgerFilter==='__credit__'?null:'__credit__')">💳 신용카드만 (${creditEntries.length})</button>`:''
    ].join('');
  }
  // Tag filter bar
  const allTags=[...new Set(entries.flatMap(e=>e.tags||[]))];
  const tagBarEl=document.getElementById('ledger-tag-filter-bar');
  if(tagBarEl){
    if(allTags.length>0){
      tagBarEl.style.display='flex';
      tagBarEl.innerHTML=allTags.map(t=>{
        const col=getTagColor(t);
        const active=tagFilter===t;
        return `<button class="ledger-tag-chip ${active?'active':''}" style="--tag-bg:${col.bg};--tag-color:${col.color};" onclick="App.setTagFilter('${t}')">#${t}</button>`;
      }).join('');
    } else {
      tagBarEl.style.display='none';
      tagBarEl.innerHTML='';
    }
  }
  const today=new Date();
  const todayStr=today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');
  const dateInp=document.getElementById('lq-date');if(dateInp&&!dateInp.value)dateInp.value=todayStr;
  const listEl=document.getElementById('ledger-list');if(!listEl)return;
  if(filtered.length===0){
    listEl.innerHTML=`<div class="ledger-empty"><div>📒</div><div>내역이 없어요</div><div>위 빠른 입력으로 시작하세요!</div></div>`;return;
  }
  const byDate={};
  filtered.slice().sort((a,b)=>b.date.localeCompare(a.date)).forEach(e=>{
    if(!byDate[e.date])byDate[e.date]=[];byDate[e.date].push(e);
  });
  const dow=['일','월','화','수','목','금','토'];
  listEl.innerHTML=Object.entries(byDate).sort(([a],[b])=>b.localeCompare(a)).map(([date,items])=>{
    const d=new Date(date+'T12:00:00');
    const dayNet=items.reduce((s,e)=>s+(e.type==='income'?e.amount:-e.amount),0);
    return `
      <div class="ledger-date-group">
        <div class="ledger-date-header">
          <span>${date} (${dow[d.getDay()]})</span>
          <span style="font-weight:800;${dayNet>=0?'color:var(--green)':'color:var(--red)'}">${dayNet>=0?'+':''}${fmt(dayNet)}</span>
        </div>
        ${items.map(e=>{
          const cc=getCategoryColor(e.category);
          const tagPills=(e.tags&&e.tags.length>0)?e.tags.map(t=>{const col=getTagColorForCategory(e.category);return `<span class="ledger-tag-pill" style="--tag-bg:${col.bg};--tag-color:${col.color};" onclick="App.setTagFilter('${t}')">#${t}</span>`;}).join(''):'';
          const creditBadge=e.creditAutoId?`<span class="ledger-credit-auto-badge" style="--cat-strip:${cc.strip};">💳 신용카드 자동</span>`:'';
          const savingsBadge=(e.tags||[]).includes('저축')?`<span class="ledger-savings-badge">♥저축</span>`:'';
          const autoLedgerBadge=e.autoLedgerId?`<span class="ledger-auto-ledger-badge">⚡ 자동화</span>`:'';
          return `
          <div class="ledger-entry ${e.type}" style="--cat-strip:${cc.strip};--cat-bg:${cc.bg};--cat-color:${cc.color};">
            <div class="ledger-cat-strip"></div>
            <div class="ledger-entry-left">
              <span class="ledger-cat-badge" style="background:${cc.bg};color:${cc.color};">${e.category}</span>
              <div class="ledger-memo-wrap">
                <span class="ledger-memo">${e.memo||'—'}</span>
                ${tagPills}
              </div>
            </div>
            <div class="ledger-entry-mid">
              ${creditBadge}${savingsBadge}${autoLedgerBadge}
            </div>
            <div class="ledger-entry-right">
              <span class="ledger-amount ${e.type==='income'?'green':'red'}">${e.type==='income'?'+':'−'}${fmt(e.amount)}</span>
              <button class="icon-btn" onclick="App.openEditLedgerModal('${key}',${e.id})" title="수정" style="font-size:13px;">✏️</button>
              <button class="icon-btn" onclick="App.deleteLedgerEntry('${key}',${e.id})">🗑️</button>
            </div>
          </div>`;}).join('')}
      </div>`;
  }).join('');
}

function addLedgerEntry(){
  const cm=S.currentMonths.ledger;const key=mkey(cm.y,cm.m);
  const type=document.getElementById('lq-type').value;
  const date=document.getElementById('lq-date').value;
  const category=document.getElementById('lq-category').value;
  const rawMemo=document.getElementById('lq-memo').value.trim();
  const amount=numInputParse(document.getElementById('lq-amount').value);
  if(!date||amount<=0)return;
  const tags=extractTagsFromMemo(rawMemo);
  const memo=cleanMemoText(rawMemo);
  if(!S.ledger[key])S.ledger[key]=[];
  S.ledger[key].push({id:genId(),date,type,category,memo,tags,amount});
  document.getElementById('lq-memo').value='';
  document.getElementById('lq-amount').value='';
  hideMemoDropdown();
  document.getElementById('lq-amount').focus();
  saveState();renderLedger();renderDashboard();
  if(type==='expense')renderIncome();
}

function deleteLedgerEntry(key,id){
  const entry=(S.ledger[key]||[]).find(e=>e.id==id);
  if(entry&&entry.autoLedgerId){
    if(!S.autoSkippedIds)S.autoSkippedIds=[];
    if(!S.autoSkippedIds.includes(entry.autoLedgerId))S.autoSkippedIds.push(entry.autoLedgerId);
  }
  if(S.ledger[key])S.ledger[key]=S.ledger[key].filter(e=>e.id!=id);
  saveState();renderLedger();renderDashboard();renderIncome();
}

// 가계부 카테고리 셀렉트 공통 동기화 — lq-category(빠른입력)와 mle-category(수정모달) 모두 S.ledgerCategories로 통일
function _syncLedgerCatSelects(selectedForEdit){
  const cats=S.ledgerCategories||[];
  // 빠른입력 셀렉트
  const lqSel=document.getElementById('lq-category');
  if(lqSel){
    const cur=lqSel.value;
    lqSel.innerHTML=cats.map(c=>`<option value="${c.name}">${c.name}</option>`).join('');
    if([...lqSel.options].some(o=>o.value===cur))lqSel.value=cur;
  }
  // 수정 모달 셀렉트 (selectedForEdit가 주어진 경우에만)
  if(selectedForEdit!==undefined){
    const mleSel=document.getElementById('mle-category');
    if(mleSel){
      let opts=cats.map(c=>`<option value="${c.name}" ${c.name===selectedForEdit?'selected':''}>${c.name}</option>`).join('');
      if(selectedForEdit&&!cats.some(c=>c.name===selectedForEdit)){
        opts=`<option value="${selectedForEdit}" selected>${selectedForEdit}</option>`+opts;
      }
      mleSel.innerHTML=opts;
    }
  }
}

function _populateLedgerEditCat(type,selected){
  _syncLedgerCatSelects(selected);
}

function onLedgerEditTypeChange(){
  const type=document.getElementById('mle-type').value;
  const cur=document.getElementById('mle-category').value;
  _populateLedgerEditCat(type,cur);
}

function openEditLedgerModal(key,id){
  const entries=S.ledger[key]||[];
  const entry=entries.find(e=>e.id==id);if(!entry)return;
  document.getElementById('mle-key').value=key;
  document.getElementById('mle-id').value=id;
  document.getElementById('mle-type').value=entry.type;
  document.getElementById('mle-date').value=entry.date;
  const rawMemo=(entry.memo||'')+(entry.tags&&entry.tags.length?entry.tags.map(t=>' #'+t).join(''):'');
  document.getElementById('mle-memo').value=rawMemo;
  document.getElementById('mle-amount').value=entry.amount;
  _populateLedgerEditCat(entry.type,entry.category);
  openModal('ledger-edit');
}

function saveLedgerEdit(){
  const key=document.getElementById('mle-key').value;
  const id=parseInt(document.getElementById('mle-id').value);
  const date=document.getElementById('mle-date').value;
  const type=document.getElementById('mle-type').value;
  const category=document.getElementById('mle-category').value;
  const rawMemo=document.getElementById('mle-memo').value.trim();
  const amount=numInputParse(document.getElementById('mle-amount').value);
  if(!date||amount<=0)return alert('날짜와 금액을 입력해주세요');
  const tags=extractTagsFromMemo(rawMemo);
  const memo=cleanMemoText(rawMemo);
  const entries=S.ledger[key];if(!entries)return;
  const idx=entries.findIndex(e=>e.id==id);if(idx<0)return;
  entries[idx]={...entries[idx],date,type,category,memo,tags,amount};
  saveState();closeModal();renderLedger();renderDashboard();renderIncome();
}

function setLedgerFilter(cat){S.ledgerFilter=cat;renderLedger();}

function setTagFilter(tag){
  S.ledgerTagFilter=(S.ledgerTagFilter===tag)?null:tag;
  renderLedger();
}

// ===== TAG UTILITIES =====
const CHOSUNG_LIST=['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
function getChosung(str){
  return[...str].map(c=>{
    const code=c.charCodeAt(0);
    return(code>=0xAC00&&code<=0xD7A3)?CHOSUNG_LIST[Math.floor((code-0xAC00)/588)]:c;
  }).join('');
}
function isJamo(str){return/^[ㄱ-ㅎ]+$/.test(str);}
function matchesTag(query,tagName){
  if(!query)return true;
  const q=query.toLowerCase(),t=tagName.toLowerCase();
  if(t.includes(q))return true;
  if(isJamo(q)&&getChosung(t).startsWith(q))return true;
  return false;
}
function extractTagsFromMemo(text){
  const matches=text.match(/#([^\s#]+)/g);
  if(!matches)return[];
  return[...new Set(matches.map(m=>m.slice(1)))];
}
function cleanMemoText(text){
  return text.replace(/#[^\s#]+/g,'').replace(/\s+/g,' ').trim();
}
function getAllLedgerTags(){
  const tags=new Set(['식비','카페','교통','쇼핑','의료','문화','여행','생활','편의점','배달']);
  for(const key of Object.keys(S.ledger||{})){
    for(const e of(S.ledger[key]||[])){if(e.tags)e.tags.forEach(t=>tags.add(t));}
  }
  return[...tags];
}
const TAG_PALETTE=[
  {bg:'#E8F5EE',color:'#2E8B57'},
  {bg:'#EBF5FF',color:'#1565C0'},
  {bg:'#F0EEFF',color:'#6C5CE7'},
  {bg:'#FFF8EE',color:'#D4820A'},
  {bg:'#FFF0F5',color:'#C0396C'},
  {bg:'#E0F7F5',color:'#007B74'},
  {bg:'#FFF5F5',color:'#C0392B'},
  {bg:'#F5FFF5',color:'#2E7D32'},
  {bg:'#FFF9E6',color:'#B07C00'},
  {bg:'#EEF4FF',color:'#2A5BD7'},
];

// ===== 가계부 카테고리 색상 팔레트 =====
const LEDGER_CAT_COLORS={
  '식비':        {strip:'#FF6B6B',bg:'#FFF0F0',color:'#C0392B'},
  '생활':        {strip:'#FFA94D',bg:'#FFF5E6',color:'#D4620A'},
  '주거/공과':   {strip:'#74B9FF',bg:'#EBF5FF',color:'#1565C0'},
  '교통':        {strip:'#55EFC4',bg:'#E0FFF6',color:'#007B60'},
  '문화/여가':   {strip:'#A29BFE',bg:'#F0EEFF',color:'#6C5CE7'},
  '저축/투자':   {strip:'#FDCB6E',bg:'#FFFBE6',color:'#B07C00'},
  '기타':        {strip:'#B2BEC3',bg:'#F4F6F8',color:'#636E72'},
  '신용카드':    {strip:'#6C5CE7',bg:'#F0EEFF',color:'#4834d4'},
  '🍚 식비':    {strip:'#FF6B6B',bg:'#FFF0F0',color:'#C0392B'},
  '🧴 생활용품': {strip:'#FFA94D',bg:'#FFF5E6',color:'#D4620A'},
  '🏠 주거·공과금':{strip:'#74B9FF',bg:'#EBF5FF',color:'#1565C0'},
  '🚗 교통·차량': {strip:'#55EFC4',bg:'#E0FFF6',color:'#007B60'},
  '💪 건강':    {strip:'#43C98A',bg:'#E8F5EE',color:'#2E8B57'},
  '🎨 문화·취미': {strip:'#A29BFE',bg:'#F0EEFF',color:'#6C5CE7'},
  '👕 패션·미용': {strip:'#F48FB1',bg:'#FFF0F5',color:'#AD1457'},
  '💰 금융':    {strip:'#FDCB6E',bg:'#FFFBE6',color:'#B07C00'},
  '✈ 여행':     {strip:'#4DB6AC',bg:'#E0F7F5',color:'#007B74'},
  '🎁 경조사':  {strip:'#CE93D8',bg:'#F5EEFF',color:'#6A1B9A'},
  '📦 기타':    {strip:'#B2BEC3',bg:'#F4F6F8',color:'#636E72'},
};
const _CAT_FALLBACK_STRIPS=['#FF6B6B','#FFA94D','#74B9FF','#55EFC4','#A29BFE','#FDCB6E','#FD79A8','#00CEC9'];
function getCategoryColor(catName){
  if(LEDGER_CAT_COLORS[catName])return LEDGER_CAT_COLORS[catName];
  let h=0;for(let i=0;i<catName.length;i++)h=(h*31+catName.charCodeAt(i))&0xFFFF;
  const strip=_CAT_FALLBACK_STRIPS[Math.abs(h)%_CAT_FALLBACK_STRIPS.length];
  return{strip,bg:strip+'18',color:strip};
}

function getTagColor(tagName){
  let h=0;for(let i=0;i<tagName.length;i++)h=(h*31+tagName.charCodeAt(i))&0xFFFF;
  return TAG_PALETTE[Math.abs(h)%TAG_PALETTE.length];
}
// 태그 색을 카테고리 색과 일치시키는 함수 (가계부 항목 내 태그용)
function getTagColorForCategory(catName){
  const cc=getCategoryColor(catName);
  return{bg:cc.bg,color:cc.color};
}

// ===== TAG DROPDOWN =====
let _tagDropFocusIdx=-1;
let _tagHideTimer=null;

function onMemoInput(el){
  const val=el.value;
  const pos=el.selectionStart;
  const before=val.slice(0,pos);
  const hashMatch=before.match(/#([^\s#]*)$/);
  if(!hashMatch){hideMemoDropdown();return;}
  showMemoDropdown(el,hashMatch[1]);
}

function showMemoDropdown(el,query){
  const dd=document.getElementById('lq-tag-dropdown');
  if(!dd)return;
  const allTags=getAllLedgerTags();
  const filtered=allTags.filter(t=>matchesTag(query,t)).slice(0,8);
  if(filtered.length===0){hideMemoDropdown();return;}
  _tagDropFocusIdx=-1;
  dd.innerHTML=filtered.map((t,i)=>{
    const col=getTagColor(t);
    return `<div class="lq-tag-option" data-tag="${t}" data-idx="${i}" style="--tag-bg:${col.bg};--tag-color:${col.color};" onmousedown="App.selectMemoTag('${t}')">#${t}</div>`;
  }).join('');
  dd.style.display='block';
}

function hideMemoDropdown(delay){
  if(delay){
    _tagHideTimer=setTimeout(()=>{
      const d=document.getElementById('lq-tag-dropdown');
      if(d)d.style.display='none';
      _tagDropFocusIdx=-1;
    },delay);
  } else {
    if(_tagHideTimer)clearTimeout(_tagHideTimer);
    const d=document.getElementById('lq-tag-dropdown');
    if(d)d.style.display='none';
    _tagDropFocusIdx=-1;
  }
}

function selectMemoTag(tag){
  if(_tagHideTimer)clearTimeout(_tagHideTimer);
  const el=document.getElementById('lq-memo');
  if(!el)return;
  const val=el.value,pos=el.selectionStart;
  const before=val.slice(0,pos),after=val.slice(pos);
  const newBefore=before.replace(/#([^\s#]*)$/,'#'+tag);
  const spacer=(after.startsWith(' ')||after==='')?'':' ';
  el.value=newBefore+spacer+after;
  el.focus();
  const np=newBefore.length+spacer.length;
  el.setSelectionRange(np,np);
  hideMemoDropdown();
}

function onMemoKeydown(event){
  const dd=document.getElementById('lq-tag-dropdown');
  const ddVisible=dd&&dd.style.display!=='none';
  if(!ddVisible){
    if(event.key==='Enter')addLedgerEntry();
    return;
  }
  const opts=dd.querySelectorAll('.lq-tag-option');
  if(event.key==='ArrowDown'){
    event.preventDefault();
    _tagDropFocusIdx=Math.min(_tagDropFocusIdx+1,opts.length-1);
    opts.forEach((o,i)=>o.classList.toggle('focused',i===_tagDropFocusIdx));
  } else if(event.key==='ArrowUp'){
    event.preventDefault();
    _tagDropFocusIdx=Math.max(_tagDropFocusIdx-1,0);
    opts.forEach((o,i)=>o.classList.toggle('focused',i===_tagDropFocusIdx));
  } else if(event.key==='Enter'){
    event.preventDefault();
    if(_tagDropFocusIdx>=0&&opts[_tagDropFocusIdx]){
      selectMemoTag(opts[_tagDropFocusIdx].dataset.tag);
    } else {
      hideMemoDropdown();
      addLedgerEntry();
    }
  } else if(event.key==='Escape'){
    hideMemoDropdown();
  }
}

// ===== LEDGER IMPORT =====
function toggleImportPanel(){
  const panel=document.getElementById('ledger-import-panel');
  if(!panel)return;
  const isHidden=panel.style.display==='none';
  panel.style.display=isHidden?'block':'none';
  if(isHidden)renderImportPanel();
}

function renderImportPanel(){
  const cm=S.currentMonths.ledger;
  const data=getMonthData(cm.y,cm.m);
  const today=new Date();
  const todayStr=today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');

  const incomeItems=data.income;
  const fixedItems=data.fixed;
  const varItems=getEffectiveVariable(cm.y,cm.m);

  const el=document.getElementById('ledger-import-panel');
  el.innerHTML=`
    <div class="import-panel-header">📥 가계부로 가져오기 — ${cm.y}년 ${cm.m}월</div>
    <div class="import-date-row">
      <label>날짜 선택:</label>
      <input type="date" id="import-date" class="lq-input lq-date" value="${todayStr}"/>
    </div>
    <div class="import-section-title">💰 수입 항목</div>
    ${incomeItems.length===0?'<div style="font-size:12px;color:var(--text-sub);padding:4px 0;">항목 없음</div>':incomeItems.map(i=>`
      <label class="import-check-row">
        <input type="checkbox" class="import-check" data-type="income" data-category="${i.category}" data-memo="${i.name}" data-amount="${i.amount}"/>
        <span>${i.name} <span style="color:var(--green);font-weight:700;">${fmt(i.amount)}</span></span>
      </label>`).join('')}
    <div class="import-section-title">🏠 고정 지출</div>
    ${fixedItems.length===0?'<div style="font-size:12px;color:var(--text-sub);padding:4px 0;">항목 없음</div>':fixedItems.map(i=>`
      <label class="import-check-row">
        <input type="checkbox" class="import-check" data-type="expense" data-category="${i.category}" data-memo="${i.name}" data-amount="${i.amount}"/>
        <span>${i.name} ${i.isSavings?'<span class="savings-tag">💜저축</span>':''} <span style="color:var(--red);font-weight:700;">${fmt(i.amount)}</span></span>
      </label>`).join('')}
    <div class="import-section-title">🛒 변동 지출</div>
    ${varItems.length===0?'<div style="font-size:12px;color:var(--text-sub);padding:4px 0;">항목 없음</div>':varItems.map(i=>`
      <label class="import-check-row">
        <input type="checkbox" class="import-check" data-type="expense" data-category="${i.category}" data-memo="${i.name}" data-amount="${i.amount}"/>
        <span>${i.name} <span style="color:var(--orange);font-weight:700;">${fmt(i.amount)}</span></span>
      </label>`).join('')}
    <div class="import-actions">
      <button class="btn-save" onclick="App.doImportToLedger()">✅ 선택 항목 가져오기</button>
      <button class="btn-cancel" onclick="App.toggleImportPanel()">닫기</button>
    </div>`;
}

function doImportToLedger(){
  const cm=S.currentMonths.ledger;const key=mkey(cm.y,cm.m);
  const date=document.getElementById('import-date')?.value;
  if(!date)return alert('날짜를 선택해주세요');
  const checks=document.querySelectorAll('#ledger-import-panel .import-check:checked');
  if(checks.length===0)return alert('가져올 항목을 선택해주세요');
  if(!S.ledger[key])S.ledger[key]=[];
  checks.forEach(cb=>{
    S.ledger[key].push({
      id:genId(),date,
      type:cb.dataset.type,
      category:cb.dataset.category,
      memo:cb.dataset.memo,
      amount:parseFloat(cb.dataset.amount)||0
    });
  });
  saveState();renderLedger();renderDashboard();renderIncome();
  const panel=document.getElementById('ledger-import-panel');
  if(panel)panel.style.display='none';
  alert(checks.length+'개 항목을 가져왔어요! ✅');
}

// ===== CLOSE MONTH =====
function openCloseMonthModal(){
  const cm=S.currentMonths.ledger;const key=mkey(cm.y,cm.m);
  document.getElementById('cm-month-label').textContent=cm.y+'년 '+cm.m+'월';
  document.getElementById('cm-note').value=S.closedMonths[key]?.note||'';

  const entries=S.ledger[key]||[];
  const ledIn=entries.filter(e=>e.type==='income').reduce((s,e)=>s+e.amount,0);
  const ledOut=entries.filter(e=>e.type==='expense').reduce((s,e)=>s+e.amount,0);
  const budIn=getTotalIncome(cm.y,cm.m);
  const budOut=getTotalFixed(cm.y,cm.m)+getTotalVariable(cm.y,cm.m)+getFoodTotal(cm.y,cm.m);
  const savingsAmt=getTotalSavings(cm.y,cm.m);
  const sr=budIn>0?(savingsAmt/budIn*100).toFixed(1):0;
  const srColor=parseFloat(sr)>=30?'#43C98A':parseFloat(sr)>=15?'#FFB347':'#F06292';

  const effectiveVars=getEffectiveVariable(cm.y,cm.m);
  const catMap={};
  effectiveVars.forEach(v=>{catMap[v.category]=(catMap[v.category]||0)+(parseFloat(v.amount)||0);});
  // Add food
  const foodAmt=getFoodTotal(cm.y,cm.m);
  if(foodAmt>0)catMap['식비']=(catMap['식비']||0)+foodAmt;
  const catEntries=Object.entries(catMap).sort((a,b)=>b[1]-a[1]);
  const maxAmt=catEntries.length>0?catEntries[0][1]:1;

  const catRows=catEntries.map(([cat,amt])=>{
    const bCat=(S.budgetCategories||[]).find(b=>b.name===cat);
    const bAmt=bCat?.budget||0;
    const barPct=Math.min(100,(amt/(maxAmt||1))*100);
    const barColor=bAmt>0&&amt>bAmt?'var(--red)':bAmt>0&&(amt/bAmt)>=0.7?'var(--orange)':'var(--purple)';
    const note=bAmt>0?`<span class="cm-cat-note" style="color:${amt>bAmt?'var(--red)':'var(--green)'};">${amt>bAmt?'▲초과 '+fmt(amt-bAmt):'▽여유 '+fmt(bAmt-amt)}</span>`:'';
    return `
      <div class="cm-cat-row">
        <div class="cm-cat-label-row">
          <span class="cm-cat-name">${cat}</span>
          <div style="display:flex;align-items:center;gap:8px;">${note}<span class="cm-cat-amount">${fmt(amt)}</span></div>
        </div>
        <div class="cm-cat-bar-wrap">
          <div class="cm-cat-bar" style="width:${barPct}%;background:${barColor}"></div>
        </div>
      </div>`;
  }).join('');

  document.getElementById('cm-summary').innerHTML=`
    <div class="cm-stats-grid">
      <div class="cm-stat-box">
        <div class="cm-stat-label">💰 예산 수입</div>
        <div class="cm-stat-val green">${fmt(budIn)}</div>
      </div>
      <div class="cm-stat-box">
        <div class="cm-stat-label">💸 예산 지출</div>
        <div class="cm-stat-val red">${fmt(budOut)}</div>
      </div>
      <div class="cm-stat-box">
        <div class="cm-stat-label">📒 가계부 지출</div>
        <div class="cm-stat-val orange">${fmt(ledOut)}</div>
      </div>
      <div class="cm-stat-box" style="background:${srColor}18;border:1.5px solid ${srColor}44;">
        <div class="cm-stat-label">🎯 저축률</div>
        <div class="cm-stat-val" style="color:${srColor};font-size:22px;font-weight:900;">${sr}%</div>
      </div>
    </div>
    <div style="margin-top:16px;">
      <div class="cm-section-title">📊 카테고리별 지출</div>
      ${catRows||'<div style="color:var(--text-sub);font-size:13px;padding:10px 0;">기록된 지출이 없어요</div>'}
    </div>`;
  openModal('closeMonth');
}

function closeMonth(){
  const cm=S.currentMonths.ledger;const key=mkey(cm.y,cm.m);
  const entries=S.ledger[key]||[];
  const budIn=getTotalIncome(cm.y,cm.m);
  const budOut=getTotalFixed(cm.y,cm.m)+getTotalVariable(cm.y,cm.m)+getFoodTotal(cm.y,cm.m);
  const savings=getTotalSavings(cm.y,cm.m);
  const sr=budIn>0?(savings/budIn*100).toFixed(1):0;
  S.closedMonths[key]={
    closedAt:Date.now(),note:document.getElementById('cm-note').value,
    ledgerIncome:entries.filter(e=>e.type==='income').reduce((s,e)=>s+e.amount,0),
    ledgerExpense:entries.filter(e=>e.type==='expense').reduce((s,e)=>s+e.amount,0),
    budgetIncome:budIn,budgetExpense:budOut,savings,savingsRate:sr,
  };
  saveState();closeModal();renderLedger();
}

function reopenMonth(){
  const cm=S.currentMonths.ledger;const key=mkey(cm.y,cm.m);
  if(!confirm('마감을 취소하고 다시 편집 가능하게 할까요?'))return;
  delete S.closedMonths[key];
  saveState();renderLedger();
}

// ===== SUBSCRIPTIONS =====
let currentSubTab='month';
function renderSubscriptions(){
  const now=new Date();
  const active=S.subscriptions.filter(s=>s.active!==false);
  const monthTotal=active.reduce((sum,s)=>sum+s.amount,0);
  const sorted=active.slice().sort((a,b)=>a.billingDay-b.billingDay);
  const monthEl=document.getElementById('sub-this-month');
  if(monthEl){
    if(sorted.length===0){
      monthEl.innerHTML='<div class="sub-empty">구독 서비스를 추가하면 여기에 납부일이 표시돼요</div>';
    } else {
      monthEl.innerHTML=`<div class="sub-total-bar">이번 달 총 구독료: <strong>${fmt(monthTotal)}</strong> · ${sorted.length}개 서비스</div>
        <div class="sub-timeline-list">
          ${sorted.map(s=>{
            const daysLeft=s.billingDay-now.getDate();
            const isPast=daysLeft<0,isToday=daysLeft===0;
            return `<div class="sub-timeline-item ${isPast?'past':isToday?'today':'upcoming'}">
              <div class="sub-day-bubble">${s.billingDay}일</div>
              <div class="sub-item-info">
                <div class="sub-item-name">${s.name}</div>
                <div class="sub-item-cat">${s.category}</div>
              </div>
              <div class="sub-item-amount">${fmt(s.amount)}</div>
              <div class="sub-status-badge ${isPast?'past':isToday?'today':'upcoming'}">${isPast?'납부완료':isToday?'🔔 오늘!':'D-'+daysLeft}</div>
            </div>`;
          }).join('')}
        </div>`;
    }
  }
  const fullEl=document.getElementById('sub-full-list');
  if(fullEl){
    if(S.subscriptions.length===0){
      fullEl.innerHTML=`<div class="card" style="text-align:center;padding:40px;color:var(--text-sub);"><div style="font-size:36px;margin-bottom:8px;">🔄</div><div>구독 서비스를 추가해 보세요</div></div>`;
    } else {
      const allTotal=S.subscriptions.filter(s=>s.active!==false).reduce((sum,s)=>sum+s.amount,0);
      fullEl.innerHTML=`<div class="card" style="padding:14px 20px;margin-bottom:12px;background:var(--green-light);border:1.5px solid var(--green);"><span style="font-weight:700;color:var(--green);">✅ 활성 구독 월 합계: ${fmt(allTotal)}</span></div>`+
        S.subscriptions.map(sub=>`
          <div class="sub-card ${sub.active===false?'sub-inactive':''}">
            <div><div class="sub-card-name">${sub.name}</div><div class="sub-card-meta">${sub.category} · 매월 ${sub.billingDay}일 결제</div></div>
            <div class="sub-card-right">
              <div class="sub-card-amount">${fmt(sub.amount)}</div>
              <label class="sub-toggle-label"><input type="checkbox" ${sub.active!==false?'checked':''} onchange="App.toggleSub(${sub.id},this.checked)"/> ${sub.active!==false?'활성':'중지'}</label>
              <button class="icon-btn" onclick="App.editSub(${sub.id})">✏️</button>
              <button class="icon-btn" onclick="App.deleteSub(${sub.id})">🗑️</button>
            </div>
          </div>`).join('');
    }
  }
}

function renderAutoList(){
  const el=document.getElementById('ledger-auto-list');if(!el)return;
  const automations=S.automations||[];
  if(automations.length===0){
    el.innerHTML=`<div class="sub-empty" style="padding:16px 0;color:var(--text-sub);font-size:13px;">자동화를 추가하면 매달 지정일에 가계부에 자동 등록돼요.</div>`;return;
  }
  const active=automations.filter(a=>a.active!==false);
  const totalOut=active.filter(a=>(a.type||'expense')!=='income').reduce((s,a)=>s+a.amount,0);
  const totalIn=active.filter(a=>a.type==='income').reduce((s,a)=>s+a.amount,0);
  let summaryParts=[];
  if(totalOut>0)summaryParts.push(`<span style="color:var(--red);">지출 <strong>${fmt(totalOut)}</strong></span>`);
  if(totalIn>0)summaryParts.push(`<span style="color:var(--green);">수입 <strong>${fmt(totalIn)}</strong></span>`);
  const summary=summaryParts.length>0?`<div class="auto-summary-bar">⚡ 활성 자동화 월 합계: ${summaryParts.join(' · ')}</div>`:'';
  el.innerHTML=summary+automations.map(a=>`
    <div class="auto-card ${a.active===false?'auto-inactive':''}">
      <div class="auto-card-left">
        <div class="auto-card-name">${a.memo||a.name||'—'}<span class="auto-type-badge ${(a.type||'expense')==='income'?'income':'expense'}">${(a.type||'expense')==='income'?'수입':'지출'}</span></div>
        <div class="auto-card-meta">${a.category} · 매월 <span class="auto-day-badge">${a.billingDay}일</span>${a.startYear?` · <span style="font-size:10px;color:var(--text-sub);">시작 ${a.startYear}.${String(a.startMonth||1).padStart(2,'0')}</span>`:''}</div>
      </div>
      <div class="auto-card-right">
        <div class="auto-card-amount ${(a.type||'expense')==='income'?'green':'red'}">${fmt(a.amount)}</div>
        <label class="sub-toggle-label"><input type="checkbox" ${a.active!==false?'checked':''} onchange="App.toggleAuto(${a.id},this.checked)"/> ${a.active!==false?'활성':'중지'}</label>
        <button class="icon-btn" onclick="App.editAuto(${a.id})">✏️</button>
        <button class="icon-btn" onclick="App.deleteAuto(${a.id})">🗑️</button>
      </div>
    </div>`).join('');
}

function switchSubTab(tab){
  currentSubTab=tab;
  document.querySelectorAll('.sub-inner-tab').forEach((el,i)=>{
    const tabs=['month','all'];el.classList.toggle('active',tabs[i]===tab);
  });
  document.querySelectorAll('.sub-tab-pane').forEach(el=>el.classList.remove('active'));
  const pane=document.getElementById('sub-pane-'+tab);if(pane)pane.classList.add('active');
}

function openSubModal(){
  document.getElementById('modal-sub-id').value='';
  document.getElementById('ms2-name').value='';
  document.getElementById('ms2-amount').value='';
  document.getElementById('ms2-day').value='';
  document.getElementById('ms2-category').value='구독/OTT';
  openModal('sub');
}

function editSub(id){
  const sub=S.subscriptions.find(s=>s.id==id);if(!sub)return;
  document.getElementById('modal-sub-id').value=id;
  document.getElementById('ms2-name').value=sub.name;
  document.getElementById('ms2-amount').value=sub.amount;
  document.getElementById('ms2-day').value=sub.billingDay;
  document.getElementById('ms2-category').value=sub.category;
  openModal('sub');
}

function saveSub(){
  const id=document.getElementById('modal-sub-id').value;
  const name=document.getElementById('ms2-name').value.trim();
  const amount=numInputParse(document.getElementById('ms2-amount').value);
  const billingDay=parseInt(document.getElementById('ms2-day').value)||1;
  const category=document.getElementById('ms2-category').value;
  if(!name||amount<=0)return alert('서비스명과 금액을 입력해주세요');
  if(id){const sub=S.subscriptions.find(s=>s.id==id);if(sub){sub.name=name;sub.amount=amount;sub.billingDay=billingDay;sub.category=category;}}
  else S.subscriptions.push({id:genId(),name,amount,billingDay,category,active:true});
  saveState();closeModal();renderSubscriptions();
}

function deleteSub(id){if(!confirm('삭제하시겠어요?'))return;S.subscriptions=S.subscriptions.filter(s=>s.id!=id);saveState();renderSubscriptions();}
function toggleSub(id,active){const sub=S.subscriptions.find(s=>s.id==id);if(sub)sub.active=active;saveState();renderSubscriptions();}

function openAutoModal(){
  const today=new Date();
  document.getElementById('modal-auto-id').value='';
  document.getElementById('ma2-type').value='expense';
  document.getElementById('ma2-day').value='';
  document.getElementById('ma2-start-year').value=today.getFullYear();
  document.getElementById('ma2-start-month').value=today.getMonth()+1;
  document.getElementById('ma2-memo').value='';
  document.getElementById('ma2-amount').value='';
  document.getElementById('modal-auto-edit-label').textContent='추가';
  _syncAutoModalCatSelect('');
  openModal('auto');
}

function editAuto(id){
  const a=(S.automations||[]).find(a=>a.id==id);if(!a)return;
  const today=new Date();
  document.getElementById('modal-auto-id').value=id;
  document.getElementById('ma2-type').value=a.type||'expense';
  document.getElementById('ma2-day').value=a.billingDay;
  document.getElementById('ma2-start-year').value=a.startYear||today.getFullYear();
  document.getElementById('ma2-start-month').value=a.startMonth||(today.getMonth()+1);
  const memoWithTags=(a.tags&&a.tags.length>0)?((a.memo||a.name||'')+(a.tags.map(t=>' #'+t).join(''))).trim():(a.memo||a.name||'');
  document.getElementById('ma2-memo').value=memoWithTags;
  document.getElementById('ma2-amount').value=(a.amount||0).toLocaleString('ko-KR');
  document.getElementById('modal-auto-edit-label').textContent='수정';
  _syncAutoModalCatSelect(a.category);
  openModal('auto');
}

function saveAuto(){
  const id=document.getElementById('modal-auto-id').value;
  const type=document.getElementById('ma2-type').value;
  const billingDay=parseInt(document.getElementById('ma2-day').value)||1;
  const today=new Date();
  const startYear=parseInt(document.getElementById('ma2-start-year').value)||today.getFullYear();
  const startMonth=parseInt(document.getElementById('ma2-start-month').value)||(today.getMonth()+1);
  const category=document.getElementById('ma2-cat-sel').value||(S.ledgerCategories&&S.ledgerCategories[0]?S.ledgerCategories[0].name:'📦 기타');
  const rawMemo=document.getElementById('ma2-memo').value.trim();
  const tags=extractTagsFromMemo(rawMemo);
  const memo=cleanMemoText(rawMemo);
  const amount=numInputParse(document.getElementById('ma2-amount').value);
  if(!memo||amount<=0)return alert('메모와 금액을 입력해주세요');
  if(!S.automations)S.automations=[];
  if(id){
    const a=S.automations.find(a=>a.id==id);
    if(a){a.type=type;a.billingDay=billingDay;a.startYear=startYear;a.startMonth=startMonth;a.category=category;a.memo=memo;a.tags=tags;a.amount=amount;a.name=memo;}
  } else {
    S.automations.push({id:genId(),type,billingDay,startYear,startMonth,category,memo,tags,amount,name:memo,active:true});
  }
  saveState();closeModal();
  const cm=S.currentMonths.ledger;
  applyLedgerAutomations(cm.y,cm.m);
  renderAutoList();renderLedger();renderDashboard();renderIncome();
}

function deleteAuto(id){
  if(!confirm('삭제하시겠어요?\n(지난 달 가계부 기록은 유지됩니다)'))return;
  const now=new Date();
  const curKey=mkey(now.getFullYear(),now.getMonth()+1);
  Object.keys(S.ledger).forEach(key=>{
    if(key>=curKey)S.ledger[key]=(S.ledger[key]||[]).filter(e=>e.autoLedgerId!==('auto_'+id+'_'+key));
  });
  S.automations=(S.automations||[]).filter(a=>a.id!=id);
  saveState();renderAutoList();renderLedger();renderDashboard();renderIncome();
}

function toggleAuto(id,active){
  const a=(S.automations||[]).find(a=>a.id==id);if(a)a.active=active;
  saveState();
  if(active){const cm=S.currentMonths.ledger;applyLedgerAutomations(cm.y,cm.m);}
  renderAutoList();renderLedger();renderDashboard();renderIncome();
}

function toggleLedgerAutoPanel(){
  const panel=document.getElementById('ledger-auto-panel');
  const arrow=document.getElementById('ledger-auto-arrow');
  if(!panel)return;
  const hidden=panel.style.display==='none'||!panel.style.display;
  panel.style.display=hidden?'block':'none';
  if(arrow)arrow.textContent=hidden?'∧':'∨';
  if(hidden){_syncAutoModalCatSelect('');renderAutoList();}
}

// ===== LEDGER CATEGORY MANAGEMENT (lcat) =====
function renderLcatPanel(){
  const panel=document.getElementById('lcat-panel');if(!panel)return;
  const cats=S.ledgerCategories||[];
  if(cats.length===0){
    panel.innerHTML=`<div class="lcat-empty">카테고리를 추가하세요. 가계부 항목 분류에 사용됩니다.</div>
      <div style="margin-top:10px;display:flex;gap:8px;">
        <input id="lcat-new-name" class="lq-input" placeholder="카테고리명" style="flex:1;"
          onkeydown="if(event.key==='Enter')App.addLcatEntry()"/>
        <button class="lq-add-btn" onclick="App.addLcatEntry()">추가</button>
      </div>`;
    return;
  }
  panel.innerHTML=`<div class="lcat-list">${cats.map(c=>`
    <div class="lcat-row">
      <input class="lcat-name-input" type="text" value="${c.name}"
        onchange="App.saveLcatName(${c.id},this.value)"
        onkeydown="if(event.key==='Enter')this.blur()"/>
      <button class="icon-btn" onclick="App.deleteLcatEntry(${c.id})">🗑️</button>
    </div>`).join('')}
  </div>
  <div style="display:flex;gap:8px;margin-top:10px;">
    <input id="lcat-new-name" class="lq-input" placeholder="새 카테고리명" style="flex:1;"
      onkeydown="if(event.key==='Enter')App.addLcatEntry()"/>
    <button class="lq-add-btn" onclick="App.addLcatEntry()">추가</button>
  </div>`;

  // 빠른입력 & 수정모달 카테고리 셀렉트를 S.ledgerCategories로 통일
  _syncLedgerCatSelects();
  _syncAutoModalCatSelect('');
}

function addLcatEntry(){
  const inp=document.getElementById('lcat-new-name');if(!inp)return;
  const name=inp.value.trim();if(!name)return alert('카테고리명을 입력해주세요');
  if(!S.ledgerCategories)S.ledgerCategories=[];
  if(S.ledgerCategories.some(c=>c.name===name))return alert('이미 있는 카테고리입니다');
  S.ledgerCategories.push({id:genId(),name,isSavings:false});
  saveState();renderLcatPanel();
}

function deleteLcatEntry(id){
  if(!confirm('카테고리를 삭제하시겠어요?'))return;
  S.ledgerCategories=(S.ledgerCategories||[]).filter(c=>c.id!=id);
  saveState();renderLcatPanel();
}

function toggleLcatSavings(id,checked){
  const c=(S.ledgerCategories||[]).find(c=>c.id==id);if(!c)return;
  c.isSavings=checked;
  saveState();renderLcatPanel();renderSavingsRate();renderDashboard();
}

function saveLcatName(id,name){
  const c=(S.ledgerCategories||[]).find(c=>c.id==id);if(!c)return;
  c.name=name.trim()||c.name;
  saveState();renderLcatPanel();
}

function toggleLcatPanel(){
  const panel=document.getElementById('lcat-panel');
  const arrow=document.getElementById('lcat-panel-arrow');
  if(!panel)return;
  const hidden=panel.style.display==='none'||!panel.style.display;
  panel.style.display=hidden?'block':'none';
  if(arrow)arrow.textContent=hidden?'∧':'∨';
  if(hidden)renderLcatPanel();
}

// ===== MONTH NAVIGATION =====
function changeMonth(dir,section){
  const ref=S.currentMonths[section];
  ref.m+=dir;
  if(ref.m>12){ref.m=1;ref.y++;}
  if(ref.m<1){ref.m=12;ref.y--;}
  ['dashboard','income','credit','food','ledger'].forEach(s=>{S.currentMonths[s]={y:ref.y,m:ref.m};});
  S.ledgerFilter=null;
  S.ledgerTagFilter=null;
  currentFoodPanel=null;
  saveState();renderAll();
}

function changeCalYear(dir){S.calYear+=dir;saveState();renderCalendar();}

// ===== MOBILE SIDEBAR =====
function toggleSidebar(){
  const sidebar=document.getElementById('sidebar');
  const overlay=document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
}

function closeSidebar(){
  const sidebar=document.getElementById('sidebar');
  const overlay=document.getElementById('sidebar-overlay');
  if(sidebar)sidebar.classList.remove('open');
  if(overlay)overlay.classList.remove('active');
}

// ===== MONTHLY REPORT IMAGE =====
async function downloadMonthlyReport(){
  const btn=document.querySelector('.report-btn');
  if(btn){btn.textContent='⏳ 생성 중...';btn.disabled=true;}
  try{
    if(!window.html2canvas){
      await new Promise((res,rej)=>{
        const s=document.createElement('script');
        s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        s.onload=res;s.onerror=rej;document.head.appendChild(s);
      });
    }
    const cm=S.currentMonths.dashboard;
    const y=cm.y,m=cm.m;
    let py=y,pm=m-1;if(pm<1){pm=12;py--;}
    const prevKey=mkey(py,pm);
    const totalIncome=getTotalIncome(y,m);
    const totalFixed=getTotalFixed(y,m);
    const totalVar=getTotalVariable(y,m);
    const foodTotal=getFoodTotal(y,m);
    const totalSavings=getTotalSavings(y,m);
    const totalExpense=totalFixed+totalVar+foodTotal;
    const remaining=totalIncome-totalExpense;
    const savingsRate=totalIncome>0?(totalSavings/totalIncome*100):0;
    const stockVal=getTotalStockValue();
    const assetTotal=getTotalAssets();
    const prevIncome=S.monthlyData[prevKey]?getTotalIncome(py,pm):0;
    const prevExpense=S.monthlyData[prevKey]?(getTotalFixed(py,pm)+getTotalVariable(py,pm)+getFoodTotal(py,pm)):0;
    const prevSavings=S.monthlyData[prevKey]?getTotalSavings(py,pm):0;
    const netChange=remaining-(prevIncome>0?prevIncome-prevExpense:0);
    const ledgerKey=mkey(y,m);
    const entries=S.ledger[ledgerKey]||[];
    const expEntries=entries.filter(e=>e.type==='expense'&&!e.creditAutoId);
    const daysInMonth=new Date(y,m,0).getDate();
    const zeroDays=daysInMonth-new Set(expEntries.map(e=>e.date)).size;
    const avgPerDay=expEntries.length>0?Math.round(totalExpense/daysInMonth):0;
    // Top spending by category
    const catMap={};
    getEffectiveVariable(y,m).forEach(v=>{catMap[v.category]=(catMap[v.category]||0)+(parseFloat(v.amount)||0);});
    if(foodTotal>0)catMap['식비']=(catMap['식비']||0)+foodTotal;
    getMonthData(y,m).fixed.filter(f=>!f.isSavings).forEach(f=>{catMap[f.category]=(catMap[f.category]||0)+(parseFloat(f.amount)||0);});
    const catEntries=Object.entries(catMap).sort((a,b)=>b[1]-a[1]);
    const top3=catEntries.slice(0,3);
    // 6-month trend
    const trend=[];
    for(let i=5;i>=0;i--){
      let ty=y,tm=m-i;
      while(tm<1){tm+=12;ty--;}
      const tKey=mkey(ty,tm);
      const tData=S.monthlyData[tKey];
      const tTotal=tData?(getTotalFixed(ty,tm)+getTotalVariable(ty,tm)+getFoodTotal(ty,tm)):null;
      trend.push({y:ty,m:tm,total:tTotal});
    }
    const trendMax=Math.max(...trend.map(t=>t.total||0),1);
    const COLORS=['#A29BFE','#74B9FF','#43C98A','#FFB347','#F06292','#4DB6AC','#CE93D8','#FDCB6E'];
    // Donut SVG
    const donutCats=catEntries.slice(0,6).map((c,i)=>({name:c[0],value:c[1],color:COLORS[i%COLORS.length]}));
    const donutTotal=donutCats.reduce((s,c)=>s+c.value,0)||1;
    const R=58,CX=70,CY=70,CIRC=2*Math.PI*R;
    let donutPaths='',donutOffset=-CIRC/4;
    donutCats.forEach(c=>{
      const pct=c.value/donutTotal;
      const dash=pct*CIRC;
      const gap=CIRC-dash;
      donutPaths+=`<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${c.color}" stroke-width="22" stroke-dasharray="${dash.toFixed(1)} ${gap.toFixed(1)}" stroke-dashoffset="${donutOffset.toFixed(1)}"/>`;
      donutOffset-=dash;
    });
    const donutSVG=`<svg width="140" height="140" viewBox="0 0 140 140">${donutPaths}<text x="${CX}" y="${CY-6}" text-anchor="middle" font-size="10" font-weight="800" fill="#2D2D3A" font-family="Apple SD Gothic Neo,Noto Sans KR,sans-serif">총 지출</text><text x="${CX}" y="${CY+8}" text-anchor="middle" font-size="9" fill="#9490A8" font-family="Apple SD Gothic Neo,Noto Sans KR,sans-serif">${Math.round(totalExpense).toLocaleString('ko-KR')}원</text></svg>`;
    // Tips
    // Goals
    const goals=S.savingsGoals[y]||[];
    const pendingGoals=goals.filter(g=>g.saved<g.target).slice(0,3);
    const defaultGoals=['변동지출 계획 세우기','식비 예산 설정해보기','투자 비중 늘리기'];
    const goalsList=pendingGoals.length>0?pendingGoals.map(g=>g.name):defaultGoals;
    // Fixed expense list
    const fixedItems=getMonthData(y,m).fixed;
    const now=new Date();
    const nowStr=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0')+' '+String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');

    const W=900;
    const html=`
<div style="width:${W}px;font-family:'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif;background:#fff;color:#2D2D3A;line-height:1.4;">
  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,${(MONTH_THEMES[m]||MONTH_THEMES[5]).t1} 0%,${(MONTH_THEMES[m]||MONTH_THEMES[5]).t2} 100%);padding:28px 36px;color:white;display:flex;justify-content:space-between;align-items:flex-start;">
    <div>
      <div style="font-size:12px;font-weight:600;opacity:.8;margin-bottom:6px;">💜 월간 재무 리포트</div>
      <div style="font-size:32px;font-weight:900;letter-spacing:-1px;margin-bottom:4px;">${y}년 ${m}월</div>
      <div style="font-size:13px;background:rgba(255,255,255,.18);display:inline-block;padding:4px 14px;border-radius:20px;">한눈에 보는 나의 재무 현황</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:11px;opacity:.75;margin-bottom:4px;">생성일 ${nowStr}</div>
      <div style="font-size:15px;font-weight:800;background:rgba(255,255,255,.2);padding:6px 14px;border-radius:12px;">💰 MoneyLog</div>
    </div>
  </div>
  <!-- STAT ROW -->
  <div style="display:flex;gap:10px;padding:20px 24px 8px;background:#F7F4FF;">
    ${[
      {label:'총 수입',value:fmt(totalIncome),color:'#43C98A',change:prevIncome?fmtSigned(totalIncome-prevIncome):'—',up:totalIncome>=prevIncome},
      {label:'총 지출',value:fmt(totalExpense),color:'#F06292',change:prevExpense?fmtSigned(totalExpense-prevExpense):'—',up:totalExpense<=prevExpense},
      {label:'총 저축(적금 포함)',value:fmt(totalSavings),color:'#A29BFE',change:prevSavings?fmtSigned(totalSavings-prevSavings):'—',up:totalSavings>=prevSavings},
      {label:'순자산 변화',value:(remaining>=0?'+':'')+fmt(remaining),color:remaining>=0?'#43C98A':'#F06292',change:'지난달 대비',up:true},
      {label:'이번 달 잔액',value:fmt(Math.abs(remaining)),color:'#FFB347',change:'저축률',up:true,sub:savingsRate.toFixed(1)+'%'},
    ].map(s=>`
      <div style="flex:1;background:white;border-radius:14px;padding:14px 16px;box-shadow:0 2px 12px rgba(162,155,254,.12);border:1.5px solid #EEE9FF;">
        <div style="font-size:11px;color:#9490A8;font-weight:600;margin-bottom:6px;">${s.label}</div>
        <div style="font-size:17px;font-weight:900;color:${s.color};margin-bottom:4px;">${s.value}</div>
        <div style="font-size:10px;color:#9490A8;">${s.sub||s.change}</div>
      </div>`).join('')}
  </div>
  <!-- 지출구조 + 저축투자 -->
  <div style="display:flex;gap:16px;padding:16px 24px;background:#F7F4FF;">
    <!-- Donut -->
    <div style="flex:1.1;background:white;border-radius:16px;padding:18px 20px;border:1.5px solid #EEE9FF;box-shadow:0 2px 12px rgba(162,155,254,.10);">
      <div style="font-size:13px;font-weight:800;margin-bottom:14px;">지출 구조</div>
      <div style="display:flex;align-items:center;gap:16px;">
        ${donutSVG}
        <div style="flex:1;">
          ${donutCats.map((c,i)=>{
            const pct=totalExpense>0?(c.value/totalExpense*100).toFixed(1):0;
            return `<div style="display:flex;align-items:center;gap:7px;margin-bottom:8px;font-size:12px;">
              <div style="width:10px;height:10px;border-radius:50%;background:${c.color};flex-shrink:0;"></div>
              <span style="font-weight:600;">${c.name}</span>
              <span style="margin-left:auto;font-weight:800;color:#2D2D3A;">${Math.round(c.value).toLocaleString('ko-KR')}원</span>
              <span style="color:#9490A8;min-width:38px;text-align:right;">(${pct}%)</span>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>
    <!-- 저축&투자 -->
    <div style="flex:1;background:white;border-radius:16px;padding:18px 20px;border:1.5px solid #EEE9FF;box-shadow:0 2px 12px rgba(162,155,254,.10);">
      <div style="font-size:13px;font-weight:800;margin-bottom:14px;">저축 &amp; 투자 현황</div>
      <div style="margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
          <span style="font-size:12px;font-weight:600;">적금(저축)</span>
          <span style="font-size:12px;font-weight:800;color:#A29BFE;">${fmt(totalSavings)} / ${fmt(totalIncome)}</span>
          <span style="font-size:12px;font-weight:800;color:#A29BFE;">${savingsRate.toFixed(1)}%</span>
        </div>
        <div style="height:9px;background:#EEE9FF;border-radius:5px;overflow:hidden;">
          <div style="height:100%;width:${Math.min(100,savingsRate)}%;background:linear-gradient(90deg,#A29BFE,#6C5CE7);border-radius:5px;"></div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
        <span style="font-size:12px;font-weight:600;">주식 투자 평가액</span>
        <span style="font-size:13px;font-weight:800;color:#4DB6AC;">${fmt(stockVal)}</span>
      </div>
      <div style="height:9px;background:#E0F7F5;border-radius:5px;overflow:hidden;margin-bottom:14px;">
        <div style="height:100%;width:${totalIncome>0?Math.min(100,stockVal/totalIncome*100):0}%;background:linear-gradient(90deg,#4DB6AC,#26A69A);border-radius:5px;"></div>
      </div>
      <div style="font-size:13px;font-weight:800;margin-bottom:8px;color:#9490A8;">자산 현황</div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #EEE9FF;font-size:12px;">
        <span>🏦 총 자산</span><span style="font-weight:700;color:#64B5F6;">${fmt(assetTotal)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:12px;">
        <span>📈 주식 평가액</span><span style="font-weight:700;color:#4DB6AC;">${fmt(stockVal)}</span>
      </div>
    </div>
  </div>
  <!-- 고정지출 + TOP소비 + 6개월추이 -->
  <div style="display:flex;gap:16px;padding:0 24px 16px;background:#F7F4FF;">
    <!-- 고정지출 -->
    <div style="flex:1;background:white;border-radius:16px;padding:18px 20px;border:1.5px solid #EEE9FF;box-shadow:0 2px 12px rgba(162,155,254,.10);">
      <div style="font-size:13px;font-weight:800;margin-bottom:12px;">고정 지출 상세</div>
      ${fixedItems.map(f=>`
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #F0EBF8;font-size:12px;align-items:center;">
          <div style="display:flex;align-items:center;gap:5px;">
            <span>${f.name}</span>
            ${f.isSavings?'<span style="background:#A29BFE;color:white;font-size:9px;border-radius:4px;padding:1px 4px;font-weight:700;">저축</span>':''}
          </div>
          <span style="font-weight:700;color:${f.isSavings?'#A29BFE':'#F06292'};">${Math.round(f.amount).toLocaleString('ko-KR')}원</span>
        </div>`).join('')}
      <div style="display:flex;justify-content:space-between;padding:8px 0 0;font-size:13px;font-weight:800;border-top:1.5px solid #EEE9FF;margin-top:4px;">
        <span>합계</span><span style="color:#F06292;">${fmt(totalFixed)}</span>
      </div>
    </div>
    <!-- TOP소비 -->
    <div style="flex:1;background:white;border-radius:16px;padding:18px 20px;border:1.5px solid #EEE9FF;box-shadow:0 2px 12px rgba(162,155,254,.10);">
      <div style="font-size:13px;font-weight:800;margin-bottom:12px;">이번 달 TOP 소비</div>
      ${top3.map((c,i)=>{
        const pct=totalExpense>0?(c[1]/totalExpense*100).toFixed(1):0;
        const rankColors=['#A29BFE','#74B9FF','#43C98A'];
        return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px dashed #F0EBF8;">
          <div style="width:26px;height:26px;border-radius:50%;background:${rankColors[i]};color:white;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${i+1}</div>
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:700;">${c[0]}</div>
            <div style="font-size:10px;color:#9490A8;">${fmt(c[1])} (${pct}%)</div>
          </div>
          <div style="height:6px;width:60px;background:#F0EBF8;border-radius:4px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:${rankColors[i]};border-radius:4px;"></div>
          </div>
        </div>`;
      }).join('')}
    </div>
    <!-- 6개월추이 -->
    <div style="flex:1;background:white;border-radius:16px;padding:18px 20px;border:1.5px solid #EEE9FF;box-shadow:0 2px 12px rgba(162,155,254,.10);">
      <div style="font-size:13px;font-weight:800;margin-bottom:12px;">지출 추이 (최근 6개월)</div>
      <div style="display:flex;align-items:flex-end;gap:8px;height:100px;">
        ${trend.map(t=>{
          const barH=t.total!=null?Math.max(8,Math.round((t.total/trendMax)*80)):0;
          const isCurrent=(t.y===y&&t.m===m);
          return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;">
            <div style="font-size:9px;color:#9490A8;">${t.total!=null?Math.round(t.total/10000)+'만':'-'}</div>
            <div style="width:100%;background:${isCurrent?'#A29BFE':'#DDD9F5'};border-radius:4px 4px 0 0;height:${barH}px;"></div>
            <div style="font-size:9px;color:${isCurrent?'#5E4BC4':'#9490A8'};font-weight:${isCurrent?700:400};">${t.m}월</div>
          </div>`;
        }).join('')}
      </div>
    </div>
  </div>

  <!-- TOP5 태그 -->
  ${(()=>{
    const tagCount={};
    (S.ledger[ledgerKey]||[]).forEach(e=>(e.tags||[]).forEach(t=>{tagCount[t]=(tagCount[t]||0)+1;}));
    const top5=Object.entries(tagCount).sort((a,b)=>b[1]-a[1]).slice(0,5);
    if(top5.length===0)return '';
    return `<div style="padding:10px 24px 16px;background:#F7F4FF;">
      <div style="background:white;border-radius:16px;padding:18px 20px;border:1.5px solid #EEE9FF;box-shadow:0 2px 12px rgba(162,155,254,.10);">
        <div style="font-size:13px;font-weight:800;margin-bottom:12px;">🏷️ 이달의 주요 태그 TOP5</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${top5.map(([t,cnt],i)=>{
            const palBg=['#F0EEFF','#EBF5FF','#E8F5EE','#FFF8EE','#FFF0F5'];
            const palColor=['#6C5CE7','#1565C0','#2E8B57','#D4820A','#C0396C'];
            return `<div style="display:flex;align-items:center;gap:6px;background:${palBg[i]};color:${palColor[i]};border-radius:20px;padding:6px 14px;font-size:13px;font-weight:700;">
              <span style="font-size:12px;background:${palColor[i]};color:white;border-radius:50%;width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;font-weight:800;">${i+1}</span>
              #${t}
              <span style="font-size:11px;opacity:.7;">${cnt}회</span>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
  })()}
  <!-- FOOTER -->
  <div style="background:${(MONTH_THEMES[m]||MONTH_THEMES[5]).t1};padding:14px 36px;display:flex;justify-content:space-between;align-items:center;color:white;">
    <div style="font-size:12px;opacity:.85;">💜 MoneyLog · 나의 돈, 나의 미래를 기록합니다.</div>
    <div style="font-size:11px;opacity:.7;">${y}년 ${m}월 리포트 · 항상 현명한 소비 습관을 응원합니다! 💜</div>
  </div>
</div>`;
    const wrapper=document.createElement('div');
    wrapper.style.cssText='position:fixed;left:-9999px;top:0;z-index:-1;';
    wrapper.innerHTML=html;
    document.body.appendChild(wrapper);
    await new Promise(r=>setTimeout(r,300));
    const canvas=await window.html2canvas(wrapper.firstElementChild,{
      scale:2,backgroundColor:'#F7F4FF',useCORS:true,
      width:W,scrollX:0,scrollY:0,
    });
    document.body.removeChild(wrapper);
    const link=document.createElement('a');
    link.download=`월간리포트_${y}년${m}월.png`;
    link.href=canvas.toDataURL('image/png');
    link.click();
  } catch(e){
    alert('리포트 생성 실패: '+e.message);
  } finally {
    if(btn){btn.textContent='📊 한달 요약';btn.disabled=false;}
  }
}

// ===== BACKUP / EXPORT =====
function exportToCSV(){
  const rows=[];
  const BOM='\uFEFF';
  rows.push(['=== 나만의 가계부 내보내기 ===']);
  rows.push(['내보낸 날짜',new Date().toLocaleDateString('ko-KR')]);
  rows.push([]);
  rows.push(['[수입/지출 데이터]']);
  rows.push(['년','월','유형','항목명','카테고리','금액','저축여부']);
  for(const key of Object.keys(S.monthlyData).sort()){
    const[y,m]=key.split('-');const d=S.monthlyData[key];
    (d.income||[]).forEach(i=>rows.push([y,m,'수입',i.name,i.category,i.amount,'']));
    (d.fixed||[]).forEach(i=>rows.push([y,m,'고정지출',i.name,i.category,i.amount,i.isSavings?'저축':'']));
    (d.variable||[]).forEach(i=>rows.push([y,m,'변동지출',i.name,i.category,i.amount,'']));
  }
  rows.push([]);
  rows.push(['[가계부]']);
  rows.push(['년-월','날짜','유형','카테고리','메모','금액']);
  for(const key of Object.keys(S.ledger).sort()){
    (S.ledger[key]||[]).forEach(e=>rows.push([key,e.date,e.type==='income'?'수입':'지출',e.category,e.memo||'',e.amount]));
  }
  rows.push([]);
  rows.push(['[식비 캘린더]']);
  rows.push(['년-월','일','특별일정','메모','금액']);
  for(const key of Object.keys(S.foodCalendar).sort()){
    const days=S.foodCalendar[key]||{};
    Object.entries(days).forEach(([d,dd])=>rows.push([key,d,dd.special||'',dd.memo||'',dd.amount||0]));
  }
  rows.push([]);
  rows.push(['[주식 포트폴리오]']);
  rows.push(['종목명','티커','섹터','매수단가','현재가','목표가','수량','평가금액','수익률(%)']);
  S.stocks.forEach(st=>{
    const val=st.currentPrice*st.quantity;const cost=st.buyPrice*st.quantity;
    const rate=cost>0?((val-cost)/cost*100).toFixed(2):0;
    rows.push([st.name,st.ticker,st.sector||'',st.buyPrice,st.currentPrice,st.targetPrice||0,st.quantity,val,rate]);
  });
  rows.push([]);
  rows.push(['[자산]']);
  rows.push(['자산명','금액']);
  S.assets.forEach(a=>rows.push([a.name,a.amount]));

  const csv=BOM+rows.map(r=>r.map(c=>{
    const s=String(c===null||c===undefined?'':c);
    return s.includes(',')||s.includes('"')||s.includes('\n')?'"'+s.replace(/"/g,'""')+'"':s;
  }).join(',')).join('\n');

  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download='가계부_백업_'+new Date().toISOString().slice(0,10)+'.csv';
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
}


// ===== MONTHLY DATA DELETE =====
function openDeleteModal(){
  const allKeys=new Set();
  // 데이터가 있는 달 수집
  Object.keys(S.monthlyData||{}).forEach(k=>allKeys.add(k));
  Object.keys(S.foodCalendar||{}).forEach(k=>allKeys.add(k));
  Object.keys(S.foodDirectSet||{}).forEach(k=>{
    if(S.foodDirectSet[k]&&(S.foodDirectSet[k].direct||S.foodDirectSet[k].amount))allKeys.add(k);
  });
  Object.keys(S.ledger||{}).forEach(k=>{if((S.ledger[k]||[]).length>0)allKeys.add(k);});
  Object.keys(S.closedMonths||{}).forEach(k=>allKeys.add(k));
  // consumptionCalendar: {y:{m:[...]}}
  Object.keys(S.consumptionCalendar||{}).forEach(y=>{
    Object.keys(S.consumptionCalendar[y]||{}).forEach(m=>{
      if((S.consumptionCalendar[y][m]||[]).length>0)allKeys.add(y+'-'+m);
    });
  });
  Object.keys(S.monthBudgets||{}).forEach(k=>allKeys.add(k));

  const listEl=document.getElementById('delete-month-list');
  if(!listEl)return;

  if(allKeys.size===0){
    listEl.innerHTML='<div style="text-align:center;padding:24px;color:var(--text-sub);">삭제할 데이터가 없습니다</div>';
    openModal('delete');return;
  }

  // 정렬 (최신순)
  const sorted=[...allKeys].sort((a,b)=>{
    const [ay,am]=a.split('-').map(Number);
    const [by,bm]=b.split('-').map(Number);
    return by!==ay?by-ay:bm-am;
  });

  listEl.innerHTML=sorted.map(key=>{
    const [y,m]=key.split('-').map(Number);
    // 각 달에 있는 데이터 종류 파악
    const tags=[];
    if((S.monthlyData||{})[key]){
      const d=S.monthlyData[key];
      const hasIncome=(d.income||[]).length>0;
      const hasFixed=(d.fixed||[]).length>0;
      const hasVariable=(d.variable||[]).length>0;
      if(hasIncome||hasFixed||hasVariable)tags.push('수입/지출');
    }
    if((S.foodCalendar||{})[key]&&Object.keys(S.foodCalendar[key]).length>0)tags.push('식비');
    if((S.ledger||{})[key]&&(S.ledger[key]||[]).length>0)tags.push('가계부');
    if((S.consumptionCalendar||{})[y]&&(S.consumptionCalendar[y]||{})[m]&&
       (S.consumptionCalendar[y][m]||[]).length>0)tags.push('소비캘린더');
    if((S.closedMonths||{})[key])tags.push('마감됨');

    const tagHtml=tags.map(t=>`<span class="delete-tag">${t}</span>`).join('');
    return `<div class="delete-month-row">
      <div class="delete-month-info">
        <div class="delete-month-label">${y}년 ${m}월</div>
        <div class="delete-month-tags">${tagHtml||'<span class="delete-tag">기타</span>'}</div>
      </div>
      <button class="delete-month-btn" onclick="App.confirmDeleteMonth('${key}')">삭제</button>
    </div>`;
  }).join('');

  openModal('delete');
}

function confirmDeleteMonth(key){
  const [y,m]=key.split('-').map(Number);
  if(!confirm(`⚠️ ${y}년 ${m}월의 모든 데이터를 삭제할까요?

이 작업은 되돌릴 수 없습니다.
(자산·주식·신용카드는 영향 없음)`))return;
  deleteMonthData(key);
}

function deleteMonthData(key){
  const [y,m]=key.split('-').map(Number);
  // 해당 달 데이터만 삭제
  if(S.monthlyData)delete S.monthlyData[key];
  if(S.foodCalendar)delete S.foodCalendar[key];
  if(S.foodDirectSet)delete S.foodDirectSet[key];
  if(S.ledger)delete S.ledger[key];
  if(S.closedMonths)delete S.closedMonths[key];
  if(S.monthBudgets)delete S.monthBudgets[key];
  if(S.consumptionCalendar&&S.consumptionCalendar[y]){
    delete S.consumptionCalendar[y][m];
    if(Object.keys(S.consumptionCalendar[y]).length===0)
      delete S.consumptionCalendar[y];
  }
  saveState();
  // 모달 내 목록 갱신
  const listEl=document.getElementById('delete-month-list');
  if(listEl){
    const row=listEl.querySelector(`[data-key="${key}"]`);
    if(row)row.remove();
  }
  // 성공 피드백 후 목록 갱신
  openDeleteModal();
  renderAll();
}


// ===== TAB SWITCHING =====
function switchTab(tab){
  document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const tabEl=document.getElementById('tab-'+tab);
  if(tabEl)tabEl.classList.add('active');
  const navEl=document.querySelector('[data-tab="'+tab+'"]');
  if(navEl)navEl.classList.add('active');
  // Close sidebar on mobile
  if(window.innerWidth<=680)closeSidebar();
}

// ===== APP EXPORT =====
window.App={
  changeMonth,changeCalYear,toggleDashSection,applyMonthTheme,
  openModal,closeModal,openVariableModal,
  openBudgetModal,saveBudgetCategory,deleteBudgetCategory,
  openBudgetCatSyncModal,saveBudgetCatSync,
  openIncomeModal,openFixedModal,openDefaultMode,cancelDefaultMode,saveDefaultItems,deleteDefaultItems,saveIncome,saveFixed,saveVariable,saveCredit,openCreditModal,editCredit,saveAsset,saveStock,
  editItem,deleteItem,
  updateAssetAmount,updateStockPrice,updateStockBuyAmount,updateStockCurrentAmount,onStockTypeChange,renderAssetStocks,
  deleteCredit,toggleCreditPaid,markAllCreditPaidThisMonth,
  applyLedgerAutomations,toggleLedgerAutoPanel,addAutoInline,
  openEditLedgerModal,saveLedgerEdit,onLedgerEditTypeChange,
  openCalModal,saveCalEvent,deleteCalEvent,
  openSavingsModal,editSavingsGoal,saveSavingsGoal,deleteSavingsGoal,updateSavedAmount,pickSavingsColor,
  toggleFoodPanel,closeFoodPanel,saveFoodField,toggleFoodDirect,saveFoodDirect,
  toggleCardSettings,addCardSetting,deleteCardSetting,updateCardName,addRate,deleteRate,updateRate,
  calcInstallment,
  addLedgerEntry,deleteLedgerEntry,setLedgerFilter,setTagFilter,
  onMemoInput,onMemoKeydown,selectMemoTag,hideMemoDropdown,
  toggleImportPanel,doImportToLedger,
  openCloseMonthModal,closeMonth,reopenMonth,
  fetchStockPrices,
  downloadMonthlyReport,exportToCSV,
  toggleSidebar,closeSidebar,
  switchSubTab,openSubModal,editSub,saveSub,deleteSub,toggleSub,
  openAutoModal,editAuto,saveAuto,deleteAuto,toggleAuto,
  openAssetModal,promptAddAssetCategory,openStockModal,
  toggleStockAssetDirect,toggleCalFoodSync,
  saveRemainingBudget,editRemainingLabel,
  renderFundCalc,setFundAmount,addFundItem,deleteFundItem,updateFundItem,
  previewFundItem,previewFundAmount,
  resetFundCalc,toggleAssetSelector,applyAssetSelection,applyAssetLink,
  toggleAssetTotalLink,syncFundCalcToAssets,
  addLcatEntry,deleteLcatEntry,toggleLcatSavings,saveLcatName,toggleLcatPanel,
  openDeleteModal,confirmDeleteMonth,deleteMonthData,
  numInputFmt,numInputParse,
  _dmDragStart,_dmDragOver,_dmDragLeave,_dmDrop,_dmDragEnd,_dmTouchStart,_dmTouchMove,_dmTouchEnd,
  renderAll,
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.nav-item').forEach(item=>{
    item.addEventListener('click',()=>switchTab(item.dataset.tab));
  });
  document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',e=>e.stopPropagation()));

  // 모달 내 Enter 키 → 저장 버튼 자동 클릭
  document.addEventListener('keydown',e=>{
    if(e.key!=='Enter')return;
    const active=document.activeElement;
    if(!active||active.tagName==='TEXTAREA'||active.tagName==='SELECT')return;
    const modal=document.querySelector('.modal.active');
    if(!modal||!modal.contains(active))return;
    const saveBtn=modal.querySelector('.btn-save');
    if(saveBtn&&!saveBtn.disabled){e.preventDefault();saveBtn.click();}
  });

  loadState();
  // 항상 초기 렌더링 실행 (로컬 데이터 or 기본값 표시)
  // Firebase 모드에서는 FB_MERGE 후 renderAll()이 다시 호출되어 Firebase 데이터로 갱신됨
  try{renderAll();}catch(e){console.error('renderAll error:',e);}
});
