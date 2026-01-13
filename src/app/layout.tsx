import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Toaster } from "@/components/ui/toaster"
import { AppProviders } from "@/components/providers/app-providers";

export const metadata: Metadata = {
  title: 'EcoSort Vision',
  description: 'AI-powered waste detection and segregation.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased', 'min-h-screen bg-background font-sans')}>
        <AppProviders>
          <SidebarProvider>
            <div className="flex min-h-screen">
              <AppSidebar />
              <SidebarInset className="flex-1">
                <main className="p-4 md:p-6 lg:p-8">{children}</main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        </AppProviders>
        <Toaster />
      </body>
    </html>
  );
}
