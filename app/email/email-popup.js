'use client';

import { useState, useEffect } from 'react';

export default function EmailPopup({ isOpen, onClose, clientEmail, clientName, invoiceDetails }) {
  const [locationDetails, setLocationDetails] = useState(null);
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
    const storedLocationDetails = sessionStorage.getItem('locationDetails');
    if (storedLocationDetails) {
      const parsedDetails = JSON.parse(storedLocationDetails);
      setLocationDetails(parsedDetails);
      
      const invoiceMessage = invoiceDetails ? `
        Please find your invoice details below:\n\n
        ${invoiceDetails.description.replace(/  +/g, '\n')}\n\n
        Amount Charged: $${parseFloat(invoiceDetails.amount).toFixed(2)}\n\n
        Thank you for your business!
      ` : '';

      setFormData(prev => ({
        ...prev,
        fromName: parsedDetails.employeeName || '',
        fromEmail: parsedDetails.employeeEmail || '',
        to: clientEmail || '',
        subject: invoiceDetails ? `Invoice for $${parseFloat(invoiceDetails.amount).toFixed(2)}` : '',
        message: invoiceMessage
      }));
    }
  }, [clientEmail, invoiceDetails, clientName]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(
        'https://us-central1-detail-on-the-go-universal.cloudfunctions.net/email-alias-2',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            subject: clientName ? `${formData.subject} - ${clientName}` : formData.subject
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      alert(result.message);
      onClose();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !locationDetails) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl">
          &times;
        </button>
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">
          Email {clientName || 'Client'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fromName" className="block text-sm font-medium text-gray-700">
              From Name
            </label>
            <input
              id="fromName"
              type="text"
              name="fromName"
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
              value={formData.message}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 h-32"
            ></textarea>
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