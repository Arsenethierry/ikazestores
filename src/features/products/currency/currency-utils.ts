import countriesData from "@/data/countries.json";

export type Currency = string;
export type LocaleInfo = {
    country: string;
    countryCode: string;
    currency: string;
    ip?: string;
}

export const convertCurrency = (
    amount: number,
    fromCurrency: Currency,
    toCurrency: Currency,
    exchangeRates: Record<string, number>
): number => {
    if (fromCurrency === toCurrency) return amount;

    if (Object.keys(exchangeRates).includes(toCurrency)) {
        return amount * exchangeRates[toCurrency];
    }

    const usdRate = exchangeRates['USD'] || 1;
    const toRate = exchangeRates[toCurrency] || 1;

    return amount * (toRate / usdRate);
}

export const formatCurrency = (amount: number, currency: Currency): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount)
}

export const getUserCurrencyPreference = (
    userPreference?: string,
    localeInfo?: LocaleInfo | null
): Currency => {
    if (userPreference && userPreference.trim() !== '') {
        return userPreference;
    }

    if (localeInfo?.currency && localeInfo.currency.trim() !== '') {
        return localeInfo.currency;
    }

    if (localeInfo?.countryCode) {
        const countryData = countriesData.find(
            c => c.code.toLowerCase() === localeInfo.countryCode.toLowerCase()
        );
        if (countryData?.currency) {
            return countryData.currency;
        }
    }

    return 'USD'
}