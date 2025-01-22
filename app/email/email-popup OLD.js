'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChangedListener } from '../../auth';

export default function EmailPopup({ isOpen, onClose, user: initialUser }) {
  const [user, setUser] = useState(initialUser || null);
  const [formData, setFormData] = useState({
    fromName: '',
    fromEmail: '',
    to: '',
    subject: '',
    message: '',
    photoUrl: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!initialUser) {
      const unsubscribe = onAuthStateChangedListener(setUser);
      return () => unsubscribe();
    }
  }, [initialUser]);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fromName: user.displayName || '',
        fromEmail: user.email || '',
      }));
    }
  }, [user]);

  if (!isOpen || !user) return null;


  // Handle form field changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(
        'https://us-central1-detail-on-the-go-universal.cloudfunctions.net/email-alias-2',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        alert('Error: ' + errorData.error);
      } else {
        const responseData = await response.json();
        alert(responseData.message); // Show success message
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error sending email: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      {/* Modal Content */}
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
        >
          &times;
        </button>
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">Send an Email</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fromName" className="block text-sm font-medium text-gray-700">
              From Name
            </label>
            <input
              id="fromName"
              type="text"
              name="fromName"
              placeholder="Your Name"
              value={formData.fromName}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="fromEmail" className="block text-sm font-medium text-gray-700">
              From Email
            </label>
            <input
              id="fromEmail"
              type="email"
              name="fromEmail"
              placeholder="your.email@example.com"
              value={formData.fromEmail}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="to" className="block text-sm font-medium text-gray-700">
              To Email
            </label>
            <input
              id="to"
              type="email"
              name="to"
              placeholder="recipient@example.com"
              value={formData.to}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
              Subject
            </label>
            <input
              id="subject"
              type="text"
              name="subject"
              placeholder="Email Subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              placeholder="Write your message here..."
              value={formData.message}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 h-32"
            ></textarea>
          </div>
          <div>
            <label htmlFor="photoUrl" className="block text-sm font-medium text-gray-700">
              Photo URL (Optional)
            </label>
            <input
              id="photoUrl"
              type="url"
              name="photoUrl"
              placeholder="https://example.com/photo.jpg"
              value={formData.photoUrl}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
          >
            {isLoading ? 'Sending...' : 'Send Email'}
          </button>
        </form>
      </div>
    </div>
  );
}
