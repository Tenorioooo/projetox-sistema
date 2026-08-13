'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { isAuthenticated, getStoredUser } from '@/lib/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Allow login page to render without sidebar
    if (pathname === '/admin/login') {
      setAuthorized(true);
      return;
    }

    if (!isAuthenticated()) {
      router.push('/admin/login');
      return;
    }

    setAuthorized(true);
  }, [pathname, router]);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-brandDark text-white flex items-center justify-center">
        Verificando permissões de acesso...
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-brandDark text-white overflow-x-hidden">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 md:p-10 pb-24 md:pb-10 max-w-7xl w-full mx-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
