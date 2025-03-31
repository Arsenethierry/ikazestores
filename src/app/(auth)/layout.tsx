import Image from "next/image";
import Link from "next/link";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center p-2 md:p-8">
        <Link href={'/'} className='fixed top-5 left-auto md:left-10 font-bold text-2xl text-primary md:ml-0'>
          Ikaze<span className='text-yellow-400'>Stores</span>
        </Link>
        {children}
      </div>
      <div className="auth-asset">
        <Image
          src="/images/auth-image.png"
          alt="Auth image"
          width={500}
          height={500}
          className="rounded-l-xl object-contain"
        />
      </div>
    </div>
  );
}