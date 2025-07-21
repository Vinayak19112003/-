

export const DEFAULT_ASSETS = [
    "EURUSD",
    "GBPUSD",
    "USDJPY",
    "SPX500",
    "NAS100",
    "BTCUSD",
];

export const DEFAULT_MISTAKE_TAGS = [
  "No SMT",
  "No CISD",
  "Early Entry",
  "Late Entry",
  "Early Exit",
  "Late Exit",
  "Overtrading",
  "Revenge Trading",
  "FOMO",
];

export const DEFAULT_STRATEGIES = [
  "9 AM CRT", 
  "9.30 15M MODEL", 
  "ASIAN MODEL"
];

export const DEFAULT_TRADING_RULES = [
  "Waited for liquidity sweep",
  "Confirmed SMT / CISD",
  "Used entry model criteria",
  "Entered only in valid time window",
  "Used proper stop loss and risk-to-reward",
  "Took partials or followed exit plan",
];

export const DEFAULT_TRADING_MODEL = {
    week: ["Check Cot & Seasonals", "Check News", "Outline Possible Weekly Profile"],
    day: ["Is PA favorable?", "Determine DOL", "Determine most likely daily OLHC"],
    trigger: ["Establish Narrative", "Establish a POI on H1", "Combine with session profiles"],
    ltf: ["Wait for Killzone", "Use LTF confirmation / Retracement entry"],
};

export const DEFAULT_ACCOUNTS = [
    { id: "default", name: "Default Account", initialBalance: 100000 },
];
