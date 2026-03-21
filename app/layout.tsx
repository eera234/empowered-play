import "./globals.css";
import { ConvexClientProvider } from "./providers";
import { Toaster } from "sonner";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "(Em)Powered Play",
  description: "Real-time multiplayer LEGO city-building game for corporate teams",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Nunito:wght@400;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ConvexClientProvider>
          {children}
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: "var(--bg2)",
                border: "1.5px solid var(--acc1)",
                borderRadius: "12px",
                color: "var(--text)",
                fontSize: "13px",
                fontWeight: 800,
              },
            }}
          />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
