
export default function Loading() {
    return (
        <div className="space-y-12 animate-pulse">
            <div className="h-[500px] bg-slate-200 dark:bg-slate-800 rounded-lg" />

            <div>
                <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded mb-6" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="space-y-4">
                            <div className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-lg" />
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}