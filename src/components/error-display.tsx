import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, AlertTriangle, RefreshCw, XCircle } from "lucide-react";

interface ErrorDisplayProps {
    title?: string;
    message: string;
    variant?: "default" | "destructive";
    onRetry?: () => void;
    showRetry?: boolean;
}

/**
 * Professional error display component for inline errors
 * Use this for API failures, permission errors, etc.
 */
export function ErrorDisplay({
    title = "Error",
    message,
    variant = "destructive",
    onRetry,
    showRetry = false
}: ErrorDisplayProps) {
    return (
        <Alert variant={variant}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription className="mt-2">
                <p>{message}</p>
                {(showRetry || onRetry) && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRetry}
                        className="mt-3"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                    </Button>
                )}
            </AlertDescription>
        </Alert>
    );
}

interface ErrorCardProps {
    title?: string;
    message: string;
    icon?: React.ElementType;
    onRetry?: () => void;
    showDetails?: boolean;
    details?: string;
}

/**
 * Error card for full-page or section errors
 * Use when the entire component/page fails to load
 */
export function ErrorCard({
    title = "Something went wrong",
    message,
    icon: Icon = AlertCircle,
    onRetry,
    showDetails = false,
    details
}: ErrorCardProps) {
    const isDevelopment = process.env.NODE_ENV === 'development';

    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                    <Icon className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
                    {message}
                </p>

                {isDevelopment && showDetails && details && (
                    <details className="mt-4 w-full max-w-md">
                        <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                            Error details (dev only)
                        </summary>
                        <pre className="mt-2 p-3 text-xs bg-muted rounded-md overflow-auto max-h-40">
                            {details}
                        </pre>
                    </details>
                )}

                {onRetry && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRetry}
                        className="mt-4"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

interface EmptyStateProps {
    icon: React.ElementType;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action
}: EmptyStateProps) {
    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
                    {description}
                </p>
                {action && (
                    <Button
                        variant="teritary"
                        size="sm"
                        onClick={action.onClick}
                        className="mt-4"
                    >
                        {action.label}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

interface InlineErrorProps {
    message: string;
    variant?: "warning" | "error" | "info";
}

export function InlineError({
    message,
    variant = "error"
}: InlineErrorProps) {
    const config = {
        error: {
            icon: XCircle,
            className: "text-destructive border-destructive/50"
        },
        warning: {
            icon: AlertTriangle,
            className: "text-orange-600 border-orange-500/50"
        },
        info: {
            icon: AlertCircle,
            className: "text-blue-600 border-blue-500/50"
        }
    };

    const { icon: Icon, className } = config[variant];

    return (
        <div className={`rounded-lg border px-4 py-3 ${className}`}>
            <p className="text-sm flex items-start gap-2">
                <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{message}</span>
            </p>
        </div>
    );
}

export function getErrorMessage(result: any): string {
    if (typeof result === 'string') return result;
    if (result?.error) return result.error;
    if (result?.message) return result.message;
    return "An unexpected error occurred. Please try again.";
}