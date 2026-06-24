import "./globals.css";
import { LanguageProvider } from "@/lib/LanguageContext";

export const metadata = {
  title: "AmanZone Trading PLC",
  description: "Premium Construction Materials & Logistics in Addis Ababa",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#12121A] text-white min-h-screen">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}