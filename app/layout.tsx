import "./globals.css";
import { GlobalProviders } from "@/lib/Providers";
import AIAssistant from "@/components/AIAssistant";

export const metadata = {
  title: "AmanZone Trading PLC",
  description: "Enterprise Construction Materials & Logistics Pipeline",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <GlobalProviders>
          {children}
          {/* This ensures the AI is available on every single page of the client storefront */}
          <AIAssistant isAdmin={false} /> 
        </GlobalProviders>
      </body>
    </html>
  );
}