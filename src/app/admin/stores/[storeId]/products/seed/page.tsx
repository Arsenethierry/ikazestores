/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useCurrentUser } from '@/features/auth/queries/use-get-current-user';
import { seedProducts } from '@/lib/seed';
import { Loader } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function SeedDatabase() {
    const { data: user, isPending } = useCurrentUser();
    const params = useParams<{ storeId: string; }>()
    const storeId = params.storeId
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    if (isPending) {
        return (
            <div className='size-10 rounded-full flex items-center justify-center bg-neutral-200 border border-neutral-300'>
                <Loader className='size-4 animate-spin text-muted-foreground' />
            </div>
        )
    }

    if (!user || !storeId) return;


    const handleSeed = async () => {
        try {
            setIsLoading(true);
            const seedResult = await seedProducts({ storeId, userId: user.$id });
            setResult(seedResult);
        } catch (error) {
            setResult({ success: false, error: error instanceof Error ? error.message : error });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 border rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4">Database Seeder</h2>

            <button
                onClick={handleSeed}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
                {isLoading ? 'Seeding Database...' : 'Seed Database with Products'}
            </button>

            {result && (
                <div className="mt-4">
                    <h3 className="font-semibold text-lg">
                        {result.success ? '✅ Seeding Completed' : '❌ Seeding Failed'}
                    </h3>

                    {result.success ? (
                        <div className="mt-2">
                            <p>Successfully added: {result.added} products</p>
                            {result.failed > 0 && <p>Failed: {result.failed} products</p>}

                            {result.errors && (
                                <div className="mt-2">
                                    <p className="font-medium">Errors:</p>
                                    <ul className="list-disc pl-5">
                                        {result.errors.map((err: any, i: number) => (
                                            <li key={i}>
                                                &quot;{err.product}&quot;: {err.error}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-red-500 mt-2">{result.error}</p>
                    )}
                </div>
            )}
        </div>
    );
}