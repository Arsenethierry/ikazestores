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
import { Check, ChevronsUpDown, Loader } from "lucide-react";
import CustomFormField, { FormFieldType } from "@/components/custom-field";
import { CurrentUserType, DocumentType } from "@/lib/types";
import { SingleImageUploader } from "@/components/file-uploader";
import { toast } from "sonner";
import { getUserLocation } from "@/lib/geolocation";
import { useEffect, useState } from "react";
import countriesData from '@/data/countries.json';
import { Option } from "@/components/ui/multiselect";
import { useAction } from "next-safe-action/hooks";
import { createPhysicalStoreAction, updatePhysicalStore } from "@/lib/actions/physical-store.action";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/hooks/use-confirm";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { createPhysicalStoreFormSchema } from "@/lib/schemas/stores-schema";

export function PhysicalStoreForm({
    currentUser, initialValues = null
}: {
    currentUser: CurrentUserType,
    initialValues?: DocumentType | null
}) {
    const isEditMode = !!initialValues;
    const router = useRouter();
    const countries: Option[] = countriesData.map(country => ({
        value: country.code,
        label: country.name
    }));

    const [selectedCountry, setSelectedCountry] = useState(initialValues?.country ?? "");
    const [open, setOpen] = useState(false);

    const {
        execute: updateStore,
        isPending: isUpdating,
        result: updateStoreResponse
    } = useAction(updatePhysicalStore, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data?.success)
                router.push(`/admin/stores/${initialValues?.$id}`)
            } else if (data?.error) {
                toast.error(data?.error)
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError)
        }
    });

    const {
        execute: createStore,
        isPending: isCreatingStore,
        result: createStoreResponse
    } = useAction(createPhysicalStoreAction, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data?.success)
                router.push(`/admin/stores/${data?.storeId}`)
            } else if (data?.error) {
                toast.error(data?.error)
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError)
        }
    });

    const [CancelDialog, confirmCancelEdit] = useConfirm(
        "Are you sure you want to cancel?",
        "The changes made will not be saved!",
        "destructive"
    );

    const form = useForm<z.infer<typeof createPhysicalStoreFormSchema>>({
        resolver: zodResolver(createPhysicalStoreFormSchema),
        defaultValues: {
            storeName: initialValues?.storeName ?? "",
            description: initialValues?.desccription ?? "",
            storeBio: initialValues?.storeBio ?? "",
            address: initialValues?.address ?? "",
            storeLogo: initialValues?.storeLogoUrl ?? undefined,
            latitude: undefined,
            longitude: undefined,
            country: initialValues?.country ?? ""
        },
        mode: "onChange",
    })

    const { formState: { dirtyFields } } = form;

    function onSubmit(values: z.infer<typeof createPhysicalStoreFormSchema>) {
        if (!currentUser) {
            toast.error("Something went wrong, try again");
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
            if (dirtyFields.storeLogo) {
                updatedValues.storeLogo = values.storeLogo;
                updatedValues.oldFileId = initialValues?.storeLogoId ?? null;
            }
            if (Object.keys(updatedValues).length > 0) {
                const formData = {
                    ...updatedValues,
                    storeId: initialValues.$id,
                }
                updateStore(formData);
            } else {
                toast.info("No changes detected");
            }
        } else {
            createStore(values)
        }
    }

    useEffect(() => {
        const detectLocation = async () => {
            if (isEditMode) {
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
    }, [form, isEditMode]);

    const handleCountrySelect = (value: string) => {
        setSelectedCountry(value);
        form.setValue("country", value);
        setOpen(false);
    };

    const handleCancel = async () => {
        const ok = await confirmCancelEdit()
        if (!ok) return;
        router.back()
    }

    const isLoading = isCreatingStore || isUpdating;

    const error = isEditMode ? updateStoreResponse.data?.error : createStoreResponse.data?.error;

    return (
        <Card className="border-t-0 rounded-t-none">
            <CancelDialog />
            <CardHeader>
                <CardTitle>Create a physical store</CardTitle>
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
                                        <Input placeholder="Placeholder" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Description
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
                                    <FormLabel>Desccription</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Placeholder" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Description
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
                                        <Input placeholder="Placeholder" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Description
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
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
                                <FormMessage />
                            </FormItem>

                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Full address of your physical store" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
