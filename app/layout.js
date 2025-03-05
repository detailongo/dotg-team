import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "../components/header"; // Import the Header component

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Detail On The Go",
  description: "Manage your Detail On The Go. ",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Include the Google Maps API script */}
        <script
          src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCwkqP67w9Hse_VUD78dsGx_D3cSZ-0Gac&libraries=places"
          async
          defer
        ></script>
      </head>
      <body className="antialiased">
        <Header /> {/* Add Header component here */}
        <div className="pt-16"> {/* Add padding-top to push content down */}
          {children} {/* Render the content of the page here */}
        </div>
      </body>
    </html>
  );
}
