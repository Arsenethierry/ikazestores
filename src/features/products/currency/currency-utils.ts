import countriesData from "@/data/countries.json";

export type Currency = string;
export type CountryCode = string;

export const COUNTRY_CURRENCY_MAP: Record<CountryCode, Currency> = {
  RW: "RWF", // Rwanda
  KE: "KES", // Kenya
  UG: "UGX", // Uganda
  TZ: "TZS", // Tanzania
  BI: "BIF", // Burundi
  ET: "ETB", // Ethiopia
  SO: "SOS", // Somalia
  DJ: "DJF", // Djibouti
  ER: "ERN", // Eritrea
  SS: "SSP", // South Sudan
  SD: "SDG", // Sudan
  ZM: "ZMW", // Zambia
  MW: "MWK", // Malawi
  CD: "CDF", // Congo DRC
};

export const getCurrencyByCountryCode = (countryCode: string): Currency => {
  const upperCode = countryCode.toUpperCase();
  return COUNTRY_CURRENCY_MAP[upperCode] || "RWF";
};

export const getCurrencyByCountryName = (countryName: string): Currency => {
  const country = countriesData.find(
    (c: any) => c.name.toLowerCase() === countryName.toLowerCase()
  );

  if (country?.code) {
    return getCurrencyByCountryCode(country.code);
  }

  return "RWF"; // Default fallback
};

/**
 * Validate if a country-currency pair is valid
 */
export const isValidCountryCurrencyPair = (
  countryCode: string,
  currency: string
): boolean => {
  const expectedCurrency = getCurrencyByCountryCode(countryCode);
  return expectedCurrency === currency;
};

/**
 * Get country info with currency
 */
export interface CountryInfo {
  code: string;
  name: string;
  currency: string;
  currencySymbol?: string;
}

export const getCountryInfo = (countryCode: string): CountryInfo | null => {
  const country = countriesData.find(
    (c: any) => c.code === countryCode.toUpperCase()
  );

  if (!country) return null;

  const currency = getCurrencyByCountryCode(countryCode);
  const currencySymbol = getCurrencySymbol(currency);

  return {
    code: country.code,
    name: country.name,
    currency,
    currencySymbol,
  };
};

/**
 * Get currency symbol
 */
export const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    RWF: "FRw",
    KES: "KSh",
    UGX: "USh",
    TZS: "TSh",
    BIF: "FBu",
    ETB: "Br",
    SOS: "Sh",
    DJF: "Fdj",
    ERN: "Nkf",
    SSP: "£",
    SDG: "ج.س",
    ZMW: "ZK",
    MWK: "MK",
    CDF: "FC",
    NGN: "₦",
    ZAR: "R",
    GHS: "₵",
    EGP: "£",
    CNY: "¥",
    JPY: "¥",
    INR: "₹",
    BRL: "R$",
    CAD: "C$",
    AUD: "A$",
  };

  return symbols[currency] || currency;
};

/**
 * Get list of countries with their currencies for dropdowns
 */
export const getCountriesWithCurrencies = (): Array<{
  label: string;
  value: string;
  currency: string;
  currencySymbol: string;
}> => {
  return countriesData.map((country: any) => {
    const currency = getCurrencyByCountryCode(country.code);
    const currencySymbol = getCurrencySymbol(currency);

    return {
      label: `${country.name} (${currencySymbol} ${currency})`,
      value: country.code,
      currency,
      currencySymbol,
    };
  });
};

export const convertCurrency = (
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  exchangeRates: Record<string, number>
): number => {
  if (fromCurrency === toCurrency) return amount;

  const fromRate = exchangeRates[fromCurrency] || 1;
  const toRate = exchangeRates[toCurrency] || 1;

  let convertedAmount: number;

  if (fromCurrency === "USD") {
    convertedAmount = amount * toRate;
  } else if (toCurrency === "USD") {
    convertedAmount = amount / fromRate;
  } else {
    const usdAmount = amount / fromRate;
    convertedAmount = usdAmount * toRate;
  }

  const wholeNumberCurrencies = ["UGX", "TZS", "RWF", "BIF", "SOS", "CDF"];
  const decimals = wholeNumberCurrencies.includes(toCurrency) ? 0 : 2;

  return parseFloat(convertedAmount.toFixed(decimals));
};
