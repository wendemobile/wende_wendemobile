import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { CartProviderWrapper } from '@/components/providers/cart-provider-wrapper';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <CartProviderWrapper>
      <div className="flex h-[100dvh] overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <Header user={session.user} />
          <main className="flex-1 overflow-y-auto overscroll-contain touch-scroll p-3 sm:p-4 md:p-6 pb-28 md:pb-6">
            {children}
          </main>
          <MobileNav />
        </div>
      </div>
    </CartProviderWrapper>
  );
}
