
export default function StoreRootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    return (
        <div className="min-h-screen">
            {children}
        </div>
    );
}
