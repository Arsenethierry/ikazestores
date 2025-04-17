
export default async function AuthLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    
    return (
        <div className="flex flex-col justify-center items-center pt-10">
          {children}
        </div>
      );
  }