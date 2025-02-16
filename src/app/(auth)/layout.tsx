import Image from "next/image";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <div className="grid lg:grid-cols-2 min-h-screen">
      {children}
      <div className="auth-asset">
        <Image
          src="/images/auth-image.svg"
          alt="Auth image"
          width={500}
          height={500}
          className="rounded-l-xl object-contain"
        />
      </div>
    </div>
  );
}