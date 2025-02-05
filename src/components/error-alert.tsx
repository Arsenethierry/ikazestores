import { useEffect, useState } from "react";
import { CircleAlert } from "lucide-react";

type ErrorAlertProps = {
    errorMessage: string;
};

export default function ErrorAlert({ errorMessage }: ErrorAlertProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
        }, 4000);

        return () => clearTimeout(timer);
    }, []);

    if (!visible) return null;

    return (
        <div className="rounded-lg border border-red-500/50 px-4 py-3 text-red-600">
            <p className="text-sm">
                <CircleAlert
                    className="-mt-0.5 me-3 inline-flex opacity-60"
                    size={16}
                    strokeWidth={2}
                    aria-hidden="true"
                />
                {errorMessage}
            </p>
        </div>
    );
}
