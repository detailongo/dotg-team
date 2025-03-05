'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { signInWithGoogle, logoutUser, getUser, onAuthStateChangedListener } from '../auth';
import { useRouter } from 'next/navigation';
import useScroll from '../lib/hooks/use-scroll';
import NextImage from 'next/image';
const NavButton = ({ href, children, className = '', onClick }) => (
  <Link
    href={href}
    onClick={onClick}
    className={`inline-flex items-center justify-center h-10 px-4 rounded-[30px] border-2 border-transparent
               bg-blue-500 text-white font-medium shadow-[0_3px_0_0_#2563eb] transition-all duration-200
               hover:opacity-85 active:shadow-none active:translate-y-[3px] ${className}`}
  >
    {children}
  </Link>
);

const AuthButton = ({ onClick, children, variant = 'success', className = '' }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center justify-center h-10 px-6 rounded-[30px] border-2 border-transparent
                ${variant === 'success' 
                  ? 'bg-blue-500 shadow-[0_3px_0_0_#1e3a8a]'  // Changed to dark blue shadow
                  : 'bg-red-500 shadow-[0_3px_0_0_#dc2626]'}
                text-white font-medium transition-all duration-200 hover:opacity-85
                active:shadow-none active:translate-y-[3px] ${className}`}
  >
    {children}
  </button>
);

const MenuButton = ({ onClick, isOpen }) => (
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 relative z-10"
  >
    <div className="w-6 h-5 flex flex-col justify-between">
      <span className={`h-0.5 w-full bg-gray-600 dark:bg-gray-300 transform transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-2' : ''}`} />
      <span className={`h-0.5 w-full bg-gray-600 dark:bg-gray-300 transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`} />
      <span className={`h-0.5 w-full bg-gray-600 dark:bg-gray-300 transform transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-2' : ''}`} />
    </div>
  </button>
);

const Header = () => {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [locationDetails, setLocationDetails] = useState(null);
  const router = useRouter();
  const scrolled = useScroll(50);

  const handleLogout = async () => {
    await logoutUser();
    router.push('/');
  };

  const toggleMenu = (e) => {
    e.preventDefault();
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    const currentUser = getUser();
    setUser(currentUser);
    const unsubscribe = onAuthStateChangedListener(async (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email) {
        try {
          const response = await fetch(
            `https://us-central1-detail-on-the-go-universal.cloudfunctions.net/user?email=${encodeURIComponent(currentUser.email)}`
          );
          if (response.ok) {
            const data = await response.json();
            setLocationDetails(data.locationDetails);
            sessionStorage.setItem('locationDetails', JSON.stringify(data.locationDetails));
          } else {
            console.error('Failed to fetch location details:', response.status);
            setLocationDetails(null);
            sessionStorage.removeItem('locationDetails');
          }
        } catch (error) {
          console.error('Error fetching location details:', error);
          setLocationDetails(null);
          sessionStorage.removeItem('locationDetails');
        }
      } else {
        setLocationDetails(null);
        sessionStorage.removeItem('locationDetails');
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full z-50 border-b border-gray-200/50 bg-white/50 backdrop-blur-xl">
      <div className="px-4 py-2 sm:py-4 flex justify-between items-center">
        {/* Logo on the left */}
        <div className="flex items-center ml-0 sm:ml-2">
          <NextImage
            src="/embroyder.png"
            alt="Detail On The Go Logo"
            width={200}
            height={40}
            className="w-[150px] sm:w-[200px]"
            priority
          />
        </div>

        {/* Right side container */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <MenuButton onClick={toggleMenu} isOpen={isMenuOpen} />
              <nav
                className={`absolute top-full right-0 w-64 bg-white/80 border border-gray-200/50 
                rounded-lg shadow-lg z-60 backdrop-blur-lg transition-transform duration-300
                ${isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-[-10px] opacity-0 pointer-events-none'}`}
              >
                <ul className="flex flex-col gap-4 p-4">
                  <li>
                    <AuthButton onClick={handleLogout} variant="danger" className="w-full justify-center">
                      Logout
                    </AuthButton>
                  </li>
                  <li><NavButton href="/calendar" className="w-full justify-center" onClick={closeMenu}>Calendar</NavButton></li>
                  <li><NavButton href="/sms" className="w-full justify-center" onClick={closeMenu}>Messenger</NavButton></li>
                </ul>
              </nav>
            </>
          ) : (
            <AuthButton onClick={signInWithGoogle} className="px-4 py-2 text-sm sm:text-base">
              Login
            </AuthButton>
          )}
        </div>
      </div>
    </header>
  );
};


export default Header;