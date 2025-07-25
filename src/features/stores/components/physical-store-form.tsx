"use client";

import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ErrorAlert from "@/components/error-alert";
import { Check, ChevronsUpDown, Loader, MapPin, Search } from "lucide-react";
import CustomFormField, { FormFieldType } from "@/components/custom-field";
import { CurrentUserType, PhysicalStoreTypes } from "@/lib/types";
import { SingleImageUploader } from "@/components/file-uploader";
import { toast } from "sonner";
import { getUserLocation } from "@/lib/geolocation";
import { useEffect, useState } from "react";
import countriesData from '@/data/countries.json';
import { Option } from "@/components/ui/multiselect";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/hooks/use-confirm";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { createPhysicalStoreFormSchema, updatePhysicalStoreFormSchema } from "@/lib/schemas/stores-schema";
import dynamic from "next/dynamic";
import { useCreatePhysicalStore, useUpdatePhysicalStore } from "@/hooks/queries-and-mutations/use-physical-store";

const MapLocationPicker = dynamic(() => import("./MapLocationPicker"), {
    ssr: false,
    loading: () => <div className="h-96 bg-gray-100 rounded-md flex items-center justify-center">Loading map...</div>
})

export function PhysicalStoreForm({
    currentUser, initialValues = null
}: {
    currentUser: CurrentUserType,
    initialValues?: PhysicalStoreTypes | null
}) {
    const isEditMode = !!initialValues;
    const router = useRouter();
    const countries: Option[] = countriesData.map(country => ({
        value: country.code,
        label: country.name
    }));

    const currencies: Option[] = countriesData.map(country => ({
        value: country.currency,
        label: `${country.currency} - ${country.name}`
    }));

    const uniqueCurrencies = currencies.filter((currency, index, self) =>
        index === self.findIndex(c => c.value === currency.value)
    );

    const sortedCurrencies = uniqueCurrencies.sort((a, b) => a.value.localeCompare(b.value));

    const [selectedCountry, setSelectedCountry] = useState(initialValues?.country ?? "");
    const [selectedCurrency, setSelectedCurrency] = useState(initialValues?.currency ?? "");
    const [open, setOpen] = useState(false);
    const [currencyOpen, setCurrencyOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    const updateStoreMutation = useUpdatePhysicalStore();
    const createStoreMutation = useCreatePhysicalStore();

    const [CancelDialog, confirmCancelEdit] = useConfirm(
        "Are you sure you want to cancel?",
        "The changes made will not be saved!",
        "destructive"
    );

    const form = useForm<z.infer<typeof createPhysicalStoreFormSchema | typeof updatePhysicalStoreFormSchema>>({
        resolver: zodResolver(isEditMode ? updatePhysicalStoreFormSchema : createPhysicalStoreFormSchema),
        defaultValues: {
            storeName: initialValues?.storeName ?? "",
            description: initialValues?.desccription ?? "",
            storeBio: initialValues?.storeBio ?? "",
            address: initialValues?.address ?? "",
            storeLogo: initialValues?.storeLogoUrl ?? undefined,
            latitude: initialValues?.latitude ?? undefined,
            longitude: initialValues?.longitude ?? undefined,
            country: initialValues?.country ?? "",
            currency: initialValues?.currency ?? "",
            storeId: initialValues?.$id ?? undefined
        },
        mode: "onChange",
    })

    const { formState: { dirtyFields } } = form;

    const searchAddress = async (query: string) => {
        if (!query.trim()) return;

        setIsSearching(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`
            );
            const data = await response.json();

            if (data && data.length > 0) {
                const result = data[0];
                const lat = parseFloat(result.lat);
                const lon = parseFloat(result.lon);

                form.setValue('latitude', lat);
                form.setValue('longitude', lon);
                form.setValue('address', result.display_name);

                toast.success("Location found and marked on map!");
            } else {
                toast.error("No location found for this address");
            }
        } catch (error) {
            console.error("Error searching address:", error);
            toast.error("Failed to search address");
        } finally {
            setIsSearching(false)
        }
    }

    function onSubmit(values: z.infer<typeof createPhysicalStoreFormSchema | typeof updatePhysicalStoreFormSchema>) {
        if (!currentUser) {
            toast.error("Something went wrong, try again");
            return;
        }

        if (!values.latitude || !values.longitude) {
            toast.error("Please select a location on the map or search for an address");
            return;
        }

        if (isEditMode && initialValues) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updatedValues: Record<string, any> = {};

            if (dirtyFields.storeName) updatedValues.storeName = values.storeName;
            if (dirtyFields.description) updatedValues.desccription = values.description;
            if (dirtyFields.storeBio) updatedValues.storeBio = values.storeBio;
            if (dirtyFields.address) updatedValues.address = values.address;
            if (dirtyFields.country) updatedValues.country = values.country;
            if (dirtyFields.currency) updatedValues.currency = values.currency;
            if (dirtyFields.latitude) updatedValues.latitude = values.latitude;
            if (dirtyFields.longitude) updatedValues.longitude = values.longitude;
            if (dirtyFields.storeLogo) {
                updatedValues.storeLogo = values.storeLogo;
                updatedValues.oldFileId = initialValues?.storeLogoId ?? null;
            }
            if (Object.keys(updatedValues).length > 0) {
                const formData = {
                    ...updatedValues,
                    storeId: initialValues.$id,
                }
                updateStoreMutation.mutate(formData, {
                    onSuccess: (data) => {
                        if (data?.success) {
                            toast.success(data.success);
                            router.push(`/admin/stores/${initialValues.$id}`);
                        } else if (data?.error) {
                            toast.error(data.error);
                        }
                    },
                    onError: (error) => {
                        toast.error(error.message || "Failed to update store");
                    }
                });
            } else {
                toast.info("No changes detected");
            }
        } else {
            createStoreMutation.mutate(values as z.infer<typeof createPhysicalStoreFormSchema>, {
                onSuccess: (data) => {
                    if (data?.success) {
                        toast.success(data.success);
                        router.push(`/admin/stores/${data.storeId}`);
                    } else if (data?.error) {
                        toast.error(data.error);
                    }
                },
                onError: (error) => {
                    toast.error(error.message || "Failed to create store");
                }
            });
        }
    }

    useEffect(() => {
        const detectLocation = async () => {
            if (isEditMode && initialValues?.latitude && initialValues?.longitude) {
                return;
            } else {
                try {
                    const location = await getUserLocation();
                    if (location) {
                        form.setValue('latitude', location.latitude)
                        form.setValue('longitude', location.longitude)
                        toast.success("We use your current location to accurate user search results")
                    }
                } catch (error) {
                    console.error("Error getting location:", error);
                    toast.error("Failed to detect location. Please check your browser permissions.");
                }
            }
        };
        detectLocation()
    }, [form, isEditMode, initialValues]);

    const handleCountrySelect = (value: string) => {
        setSelectedCountry(value);
        form.setValue("country", value, { shouldDirty: true });
        setOpen(false);
    };

    const handleCurrencySelect = (value: string) => {
        setSelectedCurrency(value);
        form.setValue("currency", value, { shouldDirty: true });
        setCurrencyOpen(false);
    };

    const handleCancel = async () => {
        const ok = await confirmCancelEdit()
        if (!ok) return;
        router.back()
    }

    const handleMapLocationChange = (lat: number, lng: number, address?: string) => {
        form.setValue('latitude', lat);
        form.setValue('longitude', lng);
        if (address) {
            form.setValue('address', address);
        }
    };

    const isLoading = createStoreMutation.isPending || updateStoreMutation.isPending;
    const error = isEditMode ? updateStoreMutation.error?.message : createStoreMutation.error?.message;

    return (
        <Card className="border-t-0 rounded-t-none">
            <CancelDialog />
            <CardHeader>
                <CardTitle>{isEditMode ? 'Edit physical store' : 'Create a physical store'}</CardTitle>
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
                                        <Input placeholder="Store Name" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Enter the name of your physical store
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Store Description" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Brief description of your store
                                    </FormDescription>
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
                                        <Input placeholder="Store Bio" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Additional information about your store
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormItem>
                                <FormLabel>Country</FormLabel>
                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className="w-full justify-between">
                                            {selectedCountry
                                                ? countries.find((c) => c.label === selectedCountry)?.label
                                                : "Select a country"}
                                            <ChevronsUpDown className="opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0">
                                        <Command>
                                            <CommandInput placeholder="Search country..." />
                                            <CommandList>
                                                <CommandEmpty>No country found.</CommandEmpty>
                                                <CommandGroup>
                                                    {countries.map((country) => (
                                                        <CommandItem
                                                            key={country.value}
                                                            value={country.label}
                                                            onSelect={() => handleCountrySelect(country.label)}
                                                        >
                                                            {country.label}
                                                            <Check
                                                                className={cn(
                                                                    "ml-auto",
                                                                    selectedCountry === country.value ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <FormDescription>
                                    Select the country where your store is located
                                </FormDescription>
                                <FormMessage />
                            </FormItem>

                            <FormItem>
                                <FormLabel>Currency</FormLabel>
                                <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className="w-full justify-between">
                                            {selectedCurrency
                                                ? sortedCurrencies.find((c) => c.value === selectedCurrency)?.label
                                                : "Select a currency"}
                                            <ChevronsUpDown className="opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0">
                                        <Command>
                                            <CommandInput placeholder="Search currency..." />
                                            <CommandList>
                                                <CommandEmpty>No currency found.</CommandEmpty>
                                                <CommandGroup>
                                                    {sortedCurrencies.map((currency) => (
                                                        <CommandItem
                                                            key={currency.value}
                                                            value={currency.label}
                                                            onSelect={() => handleCurrencySelect(currency.value)}
                                                        >
                                                            {currency.label}
                                                            <Check
                                                                className={cn(
                                                                    "ml-auto",
                                                                    selectedCurrency === currency.value ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <FormDescription>
                                    Select the currency used in your store
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        </div>

                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Input disabled placeholder="Full address of your physical store" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        This will be updated when you select a location on the map
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-4">
                            <FormLabel>Search Address or Mark Location on Map</FormLabel>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Search for an address (e.g., 123 Main St, City, Country)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            searchAddress(searchQuery);
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => searchAddress(searchQuery)}
                                    disabled={isSearching || !searchQuery.trim()}
                                >
                                    {isSearching ? (
                                        <Loader className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Search className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            <FormDescription>
                                Search for an address or click on the map to mark your store location
                            </FormDescription>
                        </div>

                        <div className="space-y-4">
                            <FormLabel>Store Location</FormLabel>
                            <div className="border rounded-lg overflow-hidden">
                                <MapLocationPicker
                                    initialLat={form.watch('latitude')}
                                    initialLng={form.watch("longitude")}
                                    onLocationChange={handleMapLocationChange}
                                />
                            </div>
                            <FormDescription>
                                Click on the map to set your store location. The marker shows your current selection.
                            </FormDescription>

                            {form.watch("latitude") && form.watch("longitude") && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    <span>
                                        Location: {form.watch("latitude")?.toFixed(6)}, {form.watch("longitude")?.toFixed(6)}
                                    </span>
                                </div>
                            )}
                        </div>

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