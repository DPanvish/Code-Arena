import "./globals.css";
import Navbar from "../components/Navbar";
import AuthProvider from "../components/AuthProvider";

export const metadata = {
  title: "CodeArena",
  description: "Master Code. Conquer the Arena.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}