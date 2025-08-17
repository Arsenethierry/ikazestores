import countriesData from "@/data/countries.json";

export type Currency = string;
export type LocaleInfo = {
    country: string;
    countryCode: string;
    currency: string;
    ip?: string;
}

export interface CurrencyConversionResult {
    originalAmount: number;
    originalCurrency: string;
    convertedAmount: number;
    convertedCurrency: string;
    exchangeRate: number;
    timestamp: string;
}

export interface OrderCurrencyCalculation {
    customerCurrency: string;
    baseCurrency: string;
    customerSubtotal: number;
    customerShippingFee: number;
    customerTaxAmount: number;
    customerTotalAmount: number;
    baseSubtotal: number;
    baseShippingFee: number;
    baseTaxAmount: number;
    baseTotalAmount: number;
    exchangeRateToBase: number;
    exchangeRatesSnapshot: Record<string, number>;
    exchangeRatesTimestamp: string;
}

const EAST_AFRICAN_CURRENCY_MAP: Record<string, Currency> = {
    'RW': 'RWF', // Rwanda
    'KE': 'KES', // Kenya
    'UG': 'UGX', // Uganda
    'TZ': 'TZS', // Tanzania
    'BI': 'BIF', // Burundi
    'ET': 'ETB', // Ethiopia
    'SO': 'SOS', // Somalia
    'DJ': 'DJF', // Djibouti
    'ER': 'ERN', // Eritrea
    'SS': 'SSP', // South Sudan
    'SD': 'SDG', // Sudan
    'ZM': 'ZMW', // Zambia
    'MW': 'MWK', // Malawi
    'CD': 'CDF', // Congo DRC
};

// Supported currencies for East Africa + Zambia
const SUPPORTED_CURRENCIES = [
    'RWF', 'KES', 'UGX', 'TZS', 'BIF',
    'ETB', 'SOS', 'DJF', 'ERN', 'SSP', 'SDG',
    'ZMW', 'MWK', 'CDF'
];

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

    // Convert from source currency to USD first, then to target currency
    if (fromCurrency === 'USD') {
        // From USD to target currency: multiply by target rate
        convertedAmount = amount * toRate;
    } else if (toCurrency === 'USD') {
        // From source currency to USD: divide by source rate
        convertedAmount = amount / fromRate;
    } else {
        // From non-USD to non-USD: convert to USD first, then to target
        const usdAmount = amount / fromRate;  // Convert to USD
        convertedAmount = usdAmount * toRate; // Convert from USD to target
    }

    // Round to 2 decimal places for most currencies, 0 for whole number currencies
    const wholeNumberCurrencies = ['UGX', 'TZS', 'RWF', 'BIF', 'SOS', 'CDF'];
    const decimals = wholeNumberCurrencies.includes(toCurrency) ? 0 : 2;

    return Math.round(convertedAmount * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export const formatCurrency = (amount: number, currency: Currency): string => {
    const formatOptions: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    };

    if (['UGX', 'TZS', 'RWF', 'BIF', 'SOS'].includes(currency)) {
        formatOptions.minimumFractionDigits = 0;
        formatOptions.maximumFractionDigits = 0; // These currencies typically don't use decimals
    }

    try {
        return new Intl.NumberFormat('en-US', formatOptions).format(amount);
    } catch (error) {
        return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }
}

export const getUserCurrencyPreference = (
    userPreference?: string,
    localeInfo?: LocaleInfo | null
): Currency => {
    if (userPreference && userPreference.trim() !== '' && SUPPORTED_CURRENCIES.includes(userPreference)) {
        return userPreference;
    }

    if (localeInfo?.currency && localeInfo.currency.trim() !== '' && SUPPORTED_CURRENCIES.includes(localeInfo.currency)) {
        return localeInfo.currency;
    }

    if (localeInfo?.countryCode) {
        const mappedCurrency = EAST_AFRICAN_CURRENCY_MAP[localeInfo.countryCode.toUpperCase()];
        if (mappedCurrency) {
            return mappedCurrency;
        }

        const countryData = countriesData.find(
            c => c.code.toLowerCase() === localeInfo.countryCode.toLowerCase()
        );
        if (countryData?.currency && SUPPORTED_CURRENCIES.includes(countryData.currency)) {
            return countryData.currency;
        }
    }

    return 'USD'
}

export const isEastAfricanCountry = (countryCode: string): boolean => {
    return Object.keys(EAST_AFRICAN_CURRENCY_MAP).includes(countryCode.toUpperCase());
}

export const getCurrencySymbol = (currency: Currency): string => {
    const symbolMap: Record<string, string> = {
        'USD': '$',
        'RWF': 'FRw',
        'KES': 'KSh',
        'UGX': 'USh',
        'TZS': 'TSh',
        'BIF': 'FBu',
        'ETB': 'Br',
        'SOS': 'Sh',
        'DJF': 'Fdj',
        'ERN': 'Nkf',
        'SSP': '£',
        'SDG': 'ج.س.',
        'ZMW': 'ZK',
        'MWK': 'MK',
        'CDF': 'FC',
    };

    return symbolMap[currency] || currency;
};

export const convertCurrencyAmount = (
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    exchangeRates: Record<string, number>
): CurrencyConversionResult => {
    if (fromCurrency === toCurrency) {
        return {
            originalAmount: amount,
            originalCurrency: fromCurrency,
            convertedAmount: amount,
            convertedCurrency: toCurrency,
            exchangeRate: 1,
            timestamp: new Date().toISOString(),
        };
    }

    let exchangeRate: number;
    let convertedAmount: number;

    // If converting to USD (base currency)
    if (toCurrency === 'USD') {
        exchangeRate = 1 / (exchangeRates[fromCurrency] || 1);
        convertedAmount = amount * exchangeRate;
    }
    // If converting from USD (base currency)
    else if (fromCurrency === 'USD') {
        exchangeRate = exchangeRates[toCurrency] || 1;
        convertedAmount = amount * exchangeRate;
    }
    // Converting between two non-USD currencies
    else {
        const fromToUsdRate = 1 / (exchangeRates[fromCurrency] || 1);
        const usdToToRate = exchangeRates[toCurrency] || 1;
        exchangeRate = fromToUsdRate * usdToToRate;
        convertedAmount = amount * exchangeRate;
    }

    return {
        originalAmount: amount,
        originalCurrency: fromCurrency,
        convertedAmount: Math.round(convertedAmount * 100) / 100, // Round to 2 decimal places
        convertedCurrency: toCurrency,
        exchangeRate,
        timestamp: new Date().toISOString(),
    };
}

export const processCartItemsForOrder = (
    cartItems: Array<{
        id: string;
        productId: string;
        name: string;
        price: number;
        quantity: number;
        image: string;
        currency: string;
    }>,
    customerCurrency: string,
    exchangeRates: Record<string, number>
) => {
    const timestamp = new Date().toISOString();

    return cartItems.map(item => {
        const originalCurrency = item.currency || 'USD';
        const customerConversion = convertCurrencyAmount(
            item.price,
            originalCurrency,
            customerCurrency,
            exchangeRates
        );

        return {
            id: item.id,
            productId: item.productId,
            name: item.name,
            originalPrice: item.price,
            originalCurrency,
            customerPrice: customerConversion.convertedAmount,
            customerCurrency,
            exchangeRate: customerConversion.exchangeRate,
            exchangeRateTimestamp: timestamp,
            quantity: item.quantity,
            image: item.image,
            originalSubtotal: item.price * item.quantity,
            customerSubtotal: customerConversion.convertedAmount * item.quantity,
        };
    });
}

export const calculateOrderCurrencyTotals = (
    items: Array<{
        originalPrice: number;
        originalCurrency: string;
        customerPrice: number;
        customerCurrency: string;
        quantity: number;
    }>,
    customerCurrency: string,
    shippingFeeInCustomerCurrency: number,
    taxRatePercent: number,
    exchangeRates: Record<string, number>,
    baseCurrency: string = 'USD'
): OrderCurrencyCalculation => {
    const customerSubtotal = items.reduce(
        (sum, item) => sum + (item.customerPrice * item.quantity),
        0
    );

    const customerTaxAmount = (customerSubtotal * taxRatePercent) / 100;
    const customerTotalAmount = customerSubtotal + shippingFeeInCustomerCurrency + customerTaxAmount;

    const baseSubtotalConversion = convertCurrencyAmount(
        customerSubtotal,
        customerCurrency,
        baseCurrency,
        exchangeRates
    );

    const baseShippingConversion = convertCurrencyAmount(
        shippingFeeInCustomerCurrency,
        customerCurrency,
        baseCurrency,
        exchangeRates
    );

    const baseTaxConversion = convertCurrencyAmount(
        customerTaxAmount,
        customerCurrency,
        baseCurrency,
        exchangeRates
    );

    const baseTotalConversion = convertCurrencyAmount(
        customerTotalAmount,
        customerCurrency,
        baseCurrency,
        exchangeRates
    );

    return {
        customerCurrency,
        baseCurrency,
        customerSubtotal: Math.round(customerSubtotal * 100) / 100,
        customerShippingFee: Math.round(shippingFeeInCustomerCurrency * 100) / 100,
        customerTaxAmount: Math.round(customerTaxAmount * 100) / 100,
        customerTotalAmount: Math.round(customerTotalAmount * 100) / 100,
        baseSubtotal: baseSubtotalConversion.convertedAmount,
        baseShippingFee: baseShippingConversion.convertedAmount,
        baseTaxAmount: baseTaxConversion.convertedAmount,
        baseTotalAmount: baseTotalConversion.convertedAmount,
        exchangeRateToBase: baseTotalConversion.exchangeRate,
        exchangeRatesSnapshot: { ...exchangeRates },
        exchangeRatesTimestamp: new Date().toISOString(),
    };
}