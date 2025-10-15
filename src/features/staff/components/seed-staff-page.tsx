"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Database,
    Shield,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Users,
    Key,
    FileCheck,
    AlertTriangle,
    RefreshCw,
} from "lucide-react";
import { SeedProgress, seedStaffAndRolesAction } from "@/lib/seeds/seed-staff-actions";
import { Progress } from "@/components/progressive-component";

interface SeedStaffPageProps {
    storeId: string;
    storeType: "physical" | "virtual";
    storeName: string;
}

export function SeedStaffPage({
    storeId,
    storeType,
    storeName,
}: SeedStaffPageProps) {
    const router = useRouter();
    const [progress, setProgress] = useState<SeedProgress[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const { execute, isExecuting, result } = useAction(seedStaffAndRolesAction, {
        onSuccess: (data) => {
            if (data.data?.success) {
                toast.success("Seeding completed successfully!");
                setProgress(data.data.progress || []);
                router.refresh();
            } else if (data.data?.error) {
                toast.error(data.data.error);
            }
        },
        onError: () => {
            toast.error("Failed to seed staff data");
        },
    });

    const handleSeed = async () => {
        setProgress([]);
        setIsDialogOpen(false);
        await execute({ storeId, storeType });
    };

    const getStepIcon = (status: SeedProgress["status"]) => {
        switch (status) {
            case "completed":
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case "processing":
                return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
            case "error":
                return <AlertCircle className="h-5 w-5 text-red-500" />;
            default:
                return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
        }
    };

    const calculateProgress = () => {
        if (progress.length === 0) return 0;
        const completed = progress.filter((p) => p.status === "completed").length;
        return (completed / progress.length) * 100;
    };

    const hasErrors = progress.some((p) => p.status === "error");
    const isComplete = progress.length > 0 && progress.every((p) => p.status === "completed");

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Seed Staff & Roles</h1>
                <p className="text-muted-foreground mt-2">
                    Initialize default roles and permissions for {storeName}
                </p>
            </div>

            {/* Information Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        What will be seeded?
                    </CardTitle>
                    <CardDescription>
                        This process will create default data for your store's staff management system
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Permissions Card */}
                        <div className="rounded-lg border p-4 space-y-2">
                            <div className="flex items-center gap-2">
                                <Key className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold">Global Permissions</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                System-wide permissions that define what actions staff members can perform
                            </p>
                            <ul className="text-sm space-y-1 text-muted-foreground">
                                <li>• Orders management permissions</li>
                                <li>• Products management permissions</li>
                                <li>• Customer management permissions</li>
                                <li>• Dashboard access permissions</li>
                                <li>• Staff & roles management</li>
                                <li>• And more...</li>
                            </ul>
                        </div>

                        {/* Roles Card */}
                        <div className="rounded-lg border p-4 space-y-2">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold">Store Roles</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Pre-configured roles for {storeType === "physical" ? "physical" : "virtual"} store management
                            </p>
                            <ul className="text-sm space-y-1 text-muted-foreground">
                                {storeType === "physical" ? (
                                    <>
                                        <li>• Warehouse Manager</li>
                                        <li>• Sales Manager</li>
                                        <li>• Product Manager</li>
                                        <li>• Marketing Manager</li>
                                        <li>• Support Agent</li>
                                        <li>• Order Processor</li>
                                        <li>• Content Manager</li>
                                        <li>• Store Viewer</li>
                                    </>
                                ) : (
                                    <>
                                        <li>• Marketing Manager</li>
                                        <li>• Product Curator</li>
                                        <li>• Product Manager</li>
                                        <li>• Sales Agent</li>
                                        <li>• Support Agent</li>
                                        <li>• Content Manager</li>
                                        <li>• Store Viewer</li>
                                    </>
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* Important Notes */}
                    <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertTitle>Important Information</AlertTitle>
                        <AlertDescription className="space-y-2 text-sm">
                            <p>
                                • This process is <strong>idempotent</strong> - it will not duplicate existing data
                            </p>
                            <p>
                                • Global permissions are shared across the platform (seeded once)
                            </p>
                            <p>
                                • Roles are specific to your store
                            </p>
                            <p>
                                • You can customize roles and create new ones after seeding
                            </p>
                            <p>
                                • Only store owners can perform this operation
                            </p>
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

            {/* Seeding Progress Card */}
            {progress.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileCheck className="h-5 w-5" />
                            Seeding Progress
                        </CardTitle>
                        <CardDescription>
                            {isExecuting
                                ? "Seeding in progress..."
                                : isComplete
                                    ? "Seeding completed successfully"
                                    : hasErrors
                                        ? "Seeding completed with errors"
                                        : "Ready to seed"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Overall Progress</span>
                                <span className="font-medium">{Math.round(calculateProgress())}%</span>
                            </div>
                            <Progress value={calculateProgress()} className="h-2" />
                        </div>

                        {/* Steps */}
                        <div className="space-y-4">
                            {progress.map((step, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-3 rounded-lg border p-4"
                                >
                                    <div className="mt-0.5">{getStepIcon(step.status)}</div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium capitalize">{step.step}</h4>
                                            {step.count !== undefined && (
                                                <span className="text-sm text-muted-foreground">
                                                    {step.count} items
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{step.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Success Message */}
                        {isComplete && (
                            <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <AlertTitle className="text-green-800 dark:text-green-200">
                                    Seeding Completed!
                                </AlertTitle>
                                <AlertDescription className="text-green-700 dark:text-green-300">
                                    All staff roles and permissions have been successfully seeded. You can now
                                    invite team members and assign them roles.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Error Message */}
                        {hasErrors && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Seeding Issues Detected</AlertTitle>
                                <AlertDescription>
                                    Some steps encountered errors. Please review the details above and try again
                                    if needed.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
                <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <AlertDialogTrigger asChild>
                        <Button size="lg" disabled={isExecuting} className="gap-2">
                            {isExecuting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Seeding...
                                </>
                            ) : (
                                <>
                                    <Database className="h-4 w-4" />
                                    {progress.length > 0 ? "Re-run Seed" : "Start Seeding"}
                                </>
                            )}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Seeding Operation</AlertDialogTitle>
                            <AlertDialogDescription className="space-y-2">
                                <span>
                                    This will seed default staff roles and permissions for your store.
                                </span>
                                <span className="font-medium text-foreground">
                                    Don't worry - this operation is safe and won't duplicate existing data.
                                </span>
                                <span>Do you want to continue?</span>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleSeed}>
                                Yes, Start Seeding
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {progress.length > 0 && (
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => router.push(`/admin/stores/${storeId}/staff`)}
                        className="gap-2"
                    >
                        <Users className="h-4 w-4" />
                        Go to Staff Management
                    </Button>
                )}
            </div>
        </div>
    );
}