/**
 * Currency map — code → { code, name, symbol }
 * The code is what gets stored in the DB.
 * Name and symbol are derived here and sent to the frontend on request.
 */
export const CURRENCIES = {
  NGN: { code: "NGN", name: "Nigerian Naira",          symbol: "₦"    },
  USD: { code: "USD", name: "US Dollar",                symbol: "$"    },
  EUR: { code: "EUR", name: "Euro",                     symbol: "€"    },
  GBP: { code: "GBP", name: "British Pound",            symbol: "£"    },
  GHS: { code: "GHS", name: "Ghanaian Cedi",            symbol: "₵"    },
  KES: { code: "KES", name: "Kenyan Shilling",          symbol: "KSh"  },
  ZAR: { code: "ZAR", name: "South African Rand",       symbol: "R"    },
  TZS: { code: "TZS", name: "Tanzanian Shilling",       symbol: "TSh"  },
  UGX: { code: "UGX", name: "Ugandan Shilling",         symbol: "USh"  },
  XOF: { code: "XOF", name: "West African CFA Franc",   symbol: "CFA"  },
  XAF: { code: "XAF", name: "Central African CFA Franc",symbol: "FCFA" },
  EGP: { code: "EGP", name: "Egyptian Pound",           symbol: "E£"   },
  MAD: { code: "MAD", name: "Moroccan Dirham",          symbol: "د.م." },
  ETB: { code: "ETB", name: "Ethiopian Birr",           symbol: "Br"   },
  RWF: { code: "RWF", name: "Rwandan Franc",            symbol: "Fr"   },
  TND: { code: "TND", name: "Tunisian Dinar",           symbol: "DT"   },
  DZD: { code: "DZD", name: "Algerian Dinar",           symbol: "DA"   },
  ZMW: { code: "ZMW", name: "Zambian Kwacha",           symbol: "ZK"   },
  MWK: { code: "MWK", name: "Malawian Kwacha",          symbol: "MK"   },
  BWP: { code: "BWP", name: "Botswana Pula",            symbol: "P"    },
};
