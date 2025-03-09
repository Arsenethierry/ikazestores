import Link from 'next/link';
import React from 'react';

export const AccessDeniedCard = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] bg-gradient-to-r from-red-50 to-red-100 p-4">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-red-600 mb-4 animate-bounce">🚫</h1>
                <h2 className="text-4xl font-bold text-red-800 mb-2">Access Denied</h2>
                <p className="text-xl text-red-600 mb-8">
                    You do not have permission to view this page.
                </p>
                <Link
                    href="/"
                    className="inline-block px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-lg hover:bg-red-700 transition duration-300"
                >
                    Go Back Home
                </Link>
            </div>
        </div>
    );
}