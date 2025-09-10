"use client";

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ErrorAlert from "@/components/error-alert";
import { DollarSign, Globe, Loader } from "lucide-react";
import CustomFormField, { FormFieldType } from "@/components/custom-field";
import { SingleImageUploader } from "@/components/file-uploader";
import { CreateVirtualStoreTypes, CurrentUserType, UpdateVirtualStoreTypes, VirtualStoreTypes } from "@/lib/types";
import { MultiImageUploader } from "@/components/multiple-images-uploader";
import { MAIN_DOMAIN } from "@/lib/env-config";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/hooks/use-confirm";
import { Textarea } from "@/components/ui/textarea";
import MultipleSelector, { type Option } from "@/components/ui/multiselect";
import countriesData from '@/data/countries.json';
import { createVirtualStoreFormSchema, updateVirtualStoreFormSchema } from "@/lib/schemas/stores-schema";
import { useCreateVirtualStore, useUpdateVirtualStore } from "@/hooks/queries-and-mutations/use-virtual-store";
import { COUNTRY_CURRENCY_MAP, getCurrencySymbol } from "@/features/products/currency/currency-utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SUPPORTED_COUNTRIES = [
    { name: "Rwanda", code: "RW", currency: "RWF" },
    { name: "Kenya", code: "KE", currency: "KES" },
    { name: "Uganda", code: "UG", currency: "UGX" },
    { name: "Tanzania", code: "TZ", currency: "TZS" },
    { name: "Burundi", code: "BI", currency: "BIF" },
    { name: "Ethiopia", code: "ET", currency: "ETB" },
    { name: "South Sudan", code: "SS", currency: "SSP" },
    { name: "Zambia", code: "ZM", currency: "ZMW" },
    { name: "Malawi", code: "MW", currency: "MWK" },
    { name: "Congo DRC", code: "CD", currency: "CDF" }
];

const COUNTRY_NAME_TO_CURRENCY_MAP: Record<string, string> = SUPPORTED_COUNTRIES.reduce((acc, country) => {
    acc[country.name] = country.currency;
    return acc;
}, {} as Record<string, string>);

export function VirtualStoreForm({
    currentUser, initialValues = null
}: {
    currentUser: CurrentUserType,
    initialValues?: VirtualStoreTypes | null
}) {
    const isEditMode = !!initialValues;
    const router = useRouter();
    const [selectedCountryCurrency, setSelectedCountryCurrency] = useState<{ currency: string; symbol: string } | null>(null);

    const { mutate: createVirtualStore, isPending: isCreatingStore, error: createStoreError } = useCreateVirtualStore();
    const { mutate: updateVirtualStore, isPending: isUpdating, error: updateStoreError } = useUpdateVirtualStore();

    const [CancelDialog, confirmCancelEdit] = useConfirm(
        "Are you sure you want to cancel?",
        "The changes made will not be saved!",
        "destructive"
    );

    const form = useForm<CreateVirtualStoreTypes | UpdateVirtualStoreTypes>({
        resolver: zodResolver(isEditMode ? updateVirtualStoreFormSchema : createVirtualStoreFormSchema),
        defaultValues: isEditMode ? {
            storeId: initialValues?.$id ?? "",
            storeName: initialValues?.storeName ?? "",
            desccription: initialValues?.desccription ?? "",
            storeBio: initialValues?.storeBio ?? "",
            storeDomain: initialValues?.subDomain ?? "",
            bannerUrls: initialValues?.bannerUrls ?? [],
            bannerIds: initialValues?.bannerIds ?? [],
            storeLogoUrl: initialValues?.storeLogoUrl ?? "",
            storeLogoId: initialValues?.storeLogoId ?? "",
            operatingCountry: initialValues?.operatingCountry ?? '',
            countryCurrency: initialValues?.countryCurrency ?? '',
        } : {
            storeName: "",
            desccription: "",
            storeBio: "",
            storeDomain: "",
            storeBanner: [] as File[],
            storeLogo: undefined as unknown as File,
            operatingCountry: '',
            countryCurrency: '',
        },
    });

    const { watch, setValue, formState: { dirtyFields } } = form;
    const storeName = watch('storeName');
    const selectedCountry = watch('operatingCountry');

    useEffect(() => {
        if (selectedCountry) {
            const currency = COUNTRY_NAME_TO_CURRENCY_MAP[selectedCountry];
            if (currency) {
                const symbol = getCurrencySymbol(currency) || currency;
                setSelectedCountryCurrency({ currency, symbol });
                
                setValue('countryCurrency', currency, { shouldDirty: true });
            } else {
                setSelectedCountryCurrency(null);
                setValue('countryCurrency', '', { shouldDirty: true });
            }
        } else {
            setSelectedCountryCurrency(null);
            setValue('countryCurrency', '', { shouldDirty: true });
        }
    }, [selectedCountry, setValue]);


    useEffect(() => {
        if (isEditMode && initialValues?.storeLogoUrl) {
            form.setValue("storeLogo", initialValues?.storeLogoUrl)
        }
    }, [isEditMode, initialValues?.storeLogoUrl, form])

    useEffect(() => {
        if (storeName) {
            const sanitizedName = storeName.toLowerCase().replace(/[^a-z0-9]/g, '');
            setValue('storeDomain', `${sanitizedName}.${MAIN_DOMAIN}`);
        }
    }, [storeName, setValue]);

    function onSubmit(values: CreateVirtualStoreTypes | UpdateVirtualStoreTypes) {
        const sanitizedDomain = (values.storeDomain)!.split('.')[0];
        try {
            if (!currentUser) {
                toast.error("Something went wrong, try again");
                return;
            }
            if (isEditMode && initialValues) {
                const updatedValues: Record<string, any> = {};

                if (dirtyFields.storeName) updatedValues.storeName = values.storeName;
                if (dirtyFields.desccription) updatedValues.desccription = values.desccription;
                if (dirtyFields.storeBio) updatedValues.storeBio = values.storeBio;
                if (dirtyFields.storeDomain) updatedValues.storeDomain = sanitizedDomain;
                if (dirtyFields.storeBanner) updatedValues.storeBanner = values.storeBanner;
                if (dirtyFields.storeLogo) {
                    updatedValues.storeLogo = values.storeLogo;
                    updatedValues.oldFileId = initialValues?.storeLogoId ?? null;
                }
                if (dirtyFields.operatingCountry) {
                    updatedValues.operatingCountry = values.operatingCountry
                }
                if (dirtyFields.countryCurrency) {
                    updatedValues.countryCurrency = values.countryCurrency;
                }
                if (Object.keys(updatedValues).length > 0) {
                    const formData = {
                        ...updatedValues,
                        storeId: initialValues.$id,
                    }
                    updateVirtualStore({ data: formData, storeId: initialValues.$id });
                } else {
                    toast.info("No changes detected");
                }
            } else {
                const updatedValues = {
                    ...values,
                    storeDomain: sanitizedDomain
                };

                createVirtualStore(updatedValues as CreateVirtualStoreTypes);
            }
        } catch (error) {
            console.log(error)
        }
    }

    const handleCancel = async () => {
        const ok = await confirmCancelEdit()
        if (!ok) return;
        router.back()
    }

    const isLoading = isCreatingStore || isUpdating;

    console.log("&&&&&&: ", form.watch("operatingCountry"))

    const error = isEditMode ? updateStoreError : createStoreError
    return (
        <Card className="border-t-0 rounded-t-none max-w-5xl">
            <CancelDialog />
            <CardHeader>
                <CardTitle>{initialValues ? 'Edit' : 'Create'} a virtual store</CardTitle>
            </CardHeader>
            <CardContent>
                {error && <ErrorAlert errorMessage={error} />}
                <Form {...form}>
                    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                        <FormField
                            control={form.control}
                            name="storeName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Store Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Your store name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="storeDomain"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>website url</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="example.ikazestores.com"
                                            type="text"
                                            {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="desccription"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Desccription</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="short description" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="operatingCountry"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Store Country <span className="text-red-500">*</span></FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select your store's country">
                                                    {field.value && (
                                                        <div className="flex items-center justify-between w-full">
                                                            <div className="flex items-center gap-2">
                                                                <Globe className="h-4 w-4 text-gray-500" />
                                                                <span>{field.value}</span>
                                                            </div>
                                                            {selectedCountryCurrency && (
                                                                <span className="text-sm text-gray-500">
                                                                    {selectedCountryCurrency.symbol} {selectedCountryCurrency.currency}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </SelectValue>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="max-h-96 overflow-y-auto">
                                            {SUPPORTED_COUNTRIES.map((country) => {
                                                const symbol = getCurrencySymbol(country.currency) || country.currency;
                                                return (
                                                    <SelectItem key={country.code} value={country.name}>
                                                        <div className="flex items-center justify-between w-full gap-4">
                                                            <span>{country.name}</span>
                                                            <span className="text-sm text-gray-500">
                                                                {symbol} {country.currency}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />

                                    {selectedCountryCurrency && (
                                        <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <DollarSign className="h-5 w-5 text-gray-600" />
                                                    <span className="text-sm font-medium text-gray-700">
                                                        Store Currency (Auto-assigned)
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl font-bold text-gray-900">
                                                        {selectedCountryCurrency.symbol}
                                                    </span>
                                                    <span className="text-lg font-semibold text-gray-700">
                                                        {selectedCountryCurrency.currency}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                All products in your store will be priced in {selectedCountryCurrency.currency}.
                                                Customers visiting your store will see prices in this currency by default.
                                            </p>
                                        </div>
                                    )}
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="countryCurrency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Store Currency</FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="Currency will be auto-populated"
                                            readOnly
                                            className="bg-gray-50 cursor-not-allowed"
                                            {...field} 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="storeBio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Store Bio</FormLabel>
                                    <FormControl>
                                        <Input placeholder="store bio" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <CustomFormField
                            fieldType={FormFieldType.SKELETON}
                            control={form.control}
                            name="storeBanner"
                            label="Store banner Ratio 4:1 (2000 x 500 px)"
                            renderSkeleton={(field) => (
                                <FormControl>
                                    <MultiImageUploader
                                        isEditMode={isEditMode}
                                        files={field.value}
                                        onChange={field.onChange}
                                        caption="SVG, PNG, JPG or GIF (max. 2000 x 500 px)"
                                        maxFiles={5}
                                    />
                                </FormControl>
                            )}
                        />

                        <CustomFormField
                            fieldType={FormFieldType.SKELETON}
                            control={form.control}
                            name="storeLogo"
                            label="Shop logo(Ratio 1:1)"
                            renderSkeleton={(field) => (
                                <FormControl>
                                    <SingleImageUploader
                                        file={field.value}
                                        onChange={field.onChange}
                                        caption="SVG, PNG, JPG or GIF (Ratio 1:1)"
                                        imageHeight={100}
                                        imageWidth={100}
                                        isEditMode={isEditMode}
                                    />
                                </FormControl>
                            )}
                        />
                        <div className="flex justify-between items-center">
                            <Button
                                type="button"
                                variant={'destructive'}
                                onClick={handleCancel}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                            >
                                <Loader className={isLoading ? "animate-spin" : "hidden"} /> {" "}
                                {isEditMode ? 'Save changes' : 'Create store'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}