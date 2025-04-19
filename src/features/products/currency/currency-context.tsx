"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Currency, getUserCurrencyPreference, LocaleInfo } from "./currency-utils";
import { useCurrentUser } from "@/features/auth/queries/use-get-current-user";
import { useExchangeRates } from "@/hooks/use-currency";
import { getUserLocale } from "@/lib/actions/auth.action";

type CurrencyContextType = {
    currentCurrency: Currency;
    localeInfo: LocaleInfo | null;
    setCurrency: (currency: Currency) => void;
    isLoading: boolean;
    supportedCurrencies: Currency[];
    exchangeRates: Record<string, number>;
    exchangeRatesLoading: boolean;
};

const supportedCurrencies: Currency[] = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CNY', 'INR'];

const CurrencyContext = createContext<CurrencyContextType>({
    currentCurrency: 'USD',
    localeInfo: null,
    setCurrency: () => { },
    isLoading: true,
    supportedCurrencies,
    exchangeRates: { USD: 1 },
    exchangeRatesLoading: true,
});

export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentCurrency, setCurrentCurrency] = useState<Currency>('USD');
    const [localeInfo, setLocaleInfo] = useState<LocaleInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const { data: user } = useCurrentUser();

    const { data: exchangeRates = { USD: 1 }, isLoading: exchangeRatesLoading } = useExchangeRates();

    useEffect(() => {
        const initCurrency = async () => {
            setIsLoading(true);
            try {
                const storedPreference = localStorage.getItem('preferredCurrency');
                if (user?.prefs?.currency) {
                    setCurrentCurrency(user.prefs.currency)
                } else if (storedPreference) {
                    setCurrentCurrency(storedPreference);
                } else {
                    const info = await getUserLocale();
                    setLocaleInfo(info);

                    const currency = getUserCurrencyPreference(undefined, info);
                    setCurrentCurrency(currency);
                }
            } catch (error) {
                console.error('Failed to initialize currency:', error);
                setCurrentCurrency('USD');
            } finally {
                setIsLoading(false);
            }
        };

        initCurrency();
    }, [user]);

    const setCurrency = (currency: Currency) => {
        if (currency === currentCurrency) return;

        setCurrentCurrency(currency);
        if (user) {
            console.log("updateUserPreferences({ currency })")
        } else {
            localStorage.setItem('preferredCurrency', currency);
        }
    };

    return (
        <CurrencyContext.Provider
            value={{
                currentCurrency,
                localeInfo,
                setCurrency,
                isLoading,
                supportedCurrencies,
                exchangeRates,
                exchangeRatesLoading
            }}
        >
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => useContext(CurrencyContext);