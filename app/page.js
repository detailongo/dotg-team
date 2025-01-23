'use client';

import Image from 'next/image';
import { useState } from 'react';

const Button = ({ children, variant = 'primary', href, icon }) => {
  const [isHovered, setIsHovered] = useState(false);

  const baseStyles = "relative overflow-hidden rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]";

  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white px-6 py-3",
    secondary: "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-6 py-3",
    outline: "border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 px-6 py-3"
  };

  return (
    <a
      href={href}
      className={`${baseStyles} ${variants[variant]}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="flex items-center gap-2">
        {icon && <span className={`transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`}>{icon}</span>}
        {children}
      </div>
      <div className={`absolute inset-0 bg-white/20 transition-transform duration-500 ${isHovered ? 'translate-x-0' : '-translate-x-full'}`} />
    </a>
  );
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <main className="max-w-4xl mx-auto flex flex-col items-center gap-12 pt-20">
        <Image
          className="dark:invert"
          src="/logo.svg"
          alt="Detail On The Go Logo"
          width={180}
          height={38}
          priority
        />

        <h1 className="text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
          Welcome to Detail On The Go 3
        </h1>

        <p className="text-center text-lg font-medium">
          A platform for contractors, employees, and admins to manage jobs, communicate with clients, and handle payments.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            variant="primary" 
            href="/jobs"
            icon={<Image src="https://storage.googleapis.com/dotg-photo/Asset%201.jpg.png" alt="Jobs" width={20} height={20} />}
          >
            View Upcoming Jobs
          </Button>

          <Button 
            variant="secondary" 
            href="/communications"
            icon={<Image src="/chat-icon.svg" alt="Communications" width={20} height={20} />}
          >
            Communicate with Customers
          </Button>

          <Button 
            variant="outline" 
            href="/payments"
            icon={<Image src="/payment-icon.svg" alt="Payments" width={20} height={20} />}
          >
            Manage Payments
          </Button>

          <Button 
            variant="outline" 
            href="/admin"
            icon={<Image src="/admin-icon.svg" alt="Admin" width={20} height={20} />}
          >
            Admin Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
}
