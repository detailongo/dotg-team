'use client';

import { useState } from 'react';

export default function EmailForm() {
  const [formData, setFormData] = useState({
    fromName: '',
    fromEmail: '',
    to: '',
    subject: '',
    message: '',
    photoUrl: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('https://us-central1-detail-on-the-go-universal.cloudfunctions.net/email-alias-2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        alert('Error: ' + errorData.error);
      } else {
        const responseData = await response.json(); // Parse JSON response
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
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg">
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
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Sending...' : 'Send Email'}
          </button>
        </form>
      </div>
    </div>
  );
}
