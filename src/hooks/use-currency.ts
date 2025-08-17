import { getCurrencyList, getUserLocale } from "@/lib/actions/auth.action"
import { EXCHANGE_RATES_API_KEY } from "@/lib/env-config";
import { useQuery } from "@tanstack/react-query"

const SUPPORTED_CURRENCIES = [
    'USD', 'RWF', 'KES', 'UGX', 'TZS', 'BIF',
    'ETB', 'SOS', 'DJF', 'ERN', 'SSP', 'SDG',
    'ZMW', 'MWK', 'CDF'
];

export const useUserLocationInfo = () => {
    return useQuery({
        queryKey: ['userLocaleInfo'],
        queryFn: getUserLocale,
        staleTime: 24 * 60 * 60 * 1000,
        gcTime: 7 * 24 * 60 * 60 * 1000,
    });
};

export const useCurrencyList = () => {
    return useQuery({
        queryKey: ['currencyList'],
        queryFn: async () => {
            const result = await getCurrencyList();
            if (result?.currencies) {
                result.currencies = result.currencies.filter(currency =>
                    SUPPORTED_CURRENCIES.includes(currency.code)
                );
            }
            return result;
        },
        staleTime: Infinity
    });
}

export const useExchangeRates = (baseCurrency = 'USD') => {
    return useQuery({
        queryKey: ['exchangeRates', baseCurrency],
        queryFn: async () => {
            try {
                const response = await fetch(`https://v6.exchangerate-api.com/v6/${EXCHANGE_RATES_API_KEY}/latest/${baseCurrency}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch exchange rates: ${response.status}`);
                }

                const data = await response.json();

                if (data.result !== 'success' || !data.conversion_rates) {
                    console.error('Exchange rate API returned error:', data);
                    return { USD: 1 };
                }

                const filteredRates: Record<string, number> = {};
                SUPPORTED_CURRENCIES.forEach(currency => {
                    if (data.conversion_rates[currency]) {
                        filteredRates[currency] = data.conversion_rates[currency];
                    }
                });

                if (!filteredRates.USD) {
                    filteredRates.USD = 1;
                }

                return filteredRates;
            } catch (error) {
                console.error('Failed to fetch exchange rates:', error);
            }
        },
        staleTime: 6 * 60 * 60 * 1000,
        gcTime: 24 * 60 * 60 * 1000,
        retry: 3
    });
};

export const convertCurrency = (
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    rates: Record<string, number>
) => {
    if (fromCurrency === toCurrency) return amount;
    if (!rates || !rates[fromCurrency] || !rates[toCurrency]) return amount;

    if (rates[fromCurrency] === 1) {
        return amount * rates[toCurrency];
    }

    const amountInBaseCurrency = amount / rates[fromCurrency];
    return amountInBaseCurrency * rates[toCurrency]
}

export const formatCurrency = (
    amount: number,
    currency: string,
    countryCode: string = "US"
) => {
    const eastAfricanLocales: Record<string, string> = {
        'RWF': 'rw-RW',
        'KES': 'sw-KE',
        'UGX': 'en-UG',
        'TZS': 'sw-TZ',
        'BIF': 'rn-BI',
        'ETB': 'am-ET',
        'SOS': 'so-SO',
        'DJF': 'fr-DJ',
        'ERN': 'ti-ER',
        'SSP': 'en-SS',
        'SDG': 'ar-SD',
        'ZMW': 'en-ZM',
        'MWK': 'ny-MW',
        'CDF': 'fr-CD',
    };
    const localeString = eastAfricanLocales[currency] || `en-${countryCode}`;

    const formatOptions: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    };

    if (['UGX', 'TZS', 'RWF', 'BIF', 'SOS', 'CDF'].includes(currency)) {
        formatOptions.minimumFractionDigits = 0;
        formatOptions.maximumFractionDigits = 0;
    }

    try {
        return new Intl.NumberFormat(localeString, formatOptions).format(amount);
    } catch (error) {
        const symbols: Record<string, string> = {
            'USD': '$',
            'RWF': 'FRw ',
            'KES': 'KSh ',
            'UGX': 'USh ',
            'TZS': 'TSh ',
            'BIF': 'FBu ',
            'ETB': 'Br ',
            'SOS': 'Sh ',
            'DJF': 'Fdj ',
            'ERN': 'Nkf ',
            'SSP': '£',
            'SDG': 'ج.س. ',
            'ZMW': 'ZK ',
            'MWK': 'MK ',
            'CDF': 'FC ',
        };

        const symbol = symbols[currency] || currency + ' ';
        const decimals = ['UGX', 'TZS', 'RWF', 'BIF', 'SOS', 'CDF'].includes(currency) ? 0 : 2;
        return symbol + amount.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }
}

export const useCurrencyDisplay = (amount: number, originalCurrency = 'USD') => {
    const { data: localeInfo, isLoading: isLocaleLoading } = useUserLocationInfo();
    const { data: rates, isLoading: isRatesLoading } = useExchangeRates();
    const { data: currencies, isLoading: isCurrenciesLoading } = useCurrencyList();

    const isLoading = isLocaleLoading || isRatesLoading || isCurrenciesLoading

    if (isLoading || !localeInfo || !currencies) {
        return {
            isLoading: true,
            originalCurrency: amount,
            convertedAmount: amount,
            formattedAmount: '',
            useCurrency: originalCurrency,
            currencySymbol: '',
            currencyInfo: null
        };
    }

    const userCurrency = SUPPORTED_CURRENCIES.includes(localeInfo.currency) 
        ? localeInfo.currency 
        : 'USD';
    const countryCode = localeInfo.countryCode || 'US'

    const currencyInfo = currencies.currencies.find(c => c.code === userCurrency) || null;
    const currencySymbol = currencyInfo?.symbol || '$';

    const convertedAmount = convertCurrency(
        amount,
        originalCurrency,
        userCurrency,
        rates!
    );

    const formattedAmount = formatCurrency(convertedAmount, userCurrency, countryCode);

    return {
        isLoading: false,
        originalAmount: amount,
        convertedAmount,
        formattedAmount,
        userCurrency,
        currencySymbol,
        currencyInfo
    }
}