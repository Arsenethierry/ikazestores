import { getCurrencyList, getUserLocale } from "@/lib/actions/auth.action"
import { EXCHANGE_RATES_API_KEY } from "@/lib/env-config";
import { useQuery } from "@tanstack/react-query"

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
        queryFn: getCurrencyList,
        staleTime: Infinity
    });
}

export const useExchangeRates = (baseCurrency = 'USD') => {
    return useQuery({
        queryKey: ['exchangeRates', baseCurrency],
        queryFn: async () => {
            const response = await fetch(`https://v6.exchangerate-api.com/v6/${EXCHANGE_RATES_API_KEY}/latest/${baseCurrency}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch exchange rates: ${response.status}`);
            }

            const data = await response.json();

            if (data.result !== 'success' || !data.conversion_rates) {
                console.error('Exchange rate API returned error:', data);
                return { USD: 1 };
            }

            return data.conversion_rates;
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
    const localeString = `en-${countryCode}`;
    return new Intl.NumberFormat(localeString, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
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

    const userCurrency = localeInfo.currency || 'USD';
    const countryCode = localeInfo.countryCode || 'US'

    const currencyInfo = currencies.currencies.find(c => c.code === userCurrency) || null;
    const currencySymbol = currencyInfo?.symbol || '$';

    const convertedAmount = convertCurrency(
        amount,
        originalCurrency,
        userCurrency,
        rates
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