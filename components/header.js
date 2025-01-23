'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { signInWithGoogle, logoutUser, getUser, onAuthStateChangedListener } from '../auth';
import { useRouter } from 'next/navigation';

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
                ${variant === 'success' ? 'bg-green-500 shadow-[0_3px_0_0_#16a34a]' : 'bg-red-500 shadow-[0_3px_0_0_#dc2626]'}
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
    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
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
            `https://us-central1-detail-on-the-go-universal.cloudfunctions.net/user?email=${currentUser.email}`
          );
          if (response.ok) {
            const data = await response.json();
            console.log(data);
            setLocationDetails(data.locationDetails);
            sessionStorage.setItem('locationDetails', JSON.stringify(data.locationDetails));
          } else {
            console.error('Failed to fetch location details');
          }
        } catch (error) {
          console.error('Error fetching location details:', error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <header 
      className="fixed top-0 left-0 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-50"
    >
      <div className="px-4 py-4 flex justify-between items-center">
        <div className="ml-0">
          {user ? (
            <AuthButton onClick={handleLogout} variant="danger">Logout</AuthButton>
          ) : (
            <AuthButton onClick={signInWithGoogle}>Login with Google</AuthButton>
          )}
        </div>

        {user && (
          <>
            <MenuButton onClick={toggleMenu} isOpen={isMenuOpen} />
            <nav
              className={`absolute top-full right-0 w-64 bg-white dark:bg-gray-900 border border-gray-200 
              dark:border-gray-800 rounded-lg shadow-lg z-60 transition-transform duration-300
              ${isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-[-10px] opacity-0 pointer-events-none'}`}
            >
              <ul className="flex flex-col gap-4 p-4">
                <li><NavButton href="/" className="w-full justify-center" onClick={closeMenu}>Home</NavButton></li>
                <li><NavButton href="/calendar" className="w-full justify-center" onClick={closeMenu}>Calendar</NavButton></li>
                <li><NavButton href="/sms" className="w-full justify-center" onClick={closeMenu}>Messenger</NavButton></li>
                <li><NavButton href="/payments" className="w-full justify-center" onClick={closeMenu}>Payments</NavButton></li>
                <li><NavButton href="/email" className="w-full justify-center" onClick={closeMenu}>Email</NavButton></li>
                <li><NavButton href="/booking" className="w-full justify-center" onClick={closeMenu}>Book</NavButton></li>
                <li><NavButton href="/add-card" className="w-full justify-center" onClick={closeMenu}>Add Card</NavButton></li>
              </ul>
            </nav>
            {locationDetails && (
              <div className="absolute top-4 right-4 text-sm text-gray-500">
              </div>
            )}
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
