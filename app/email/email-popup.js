'use client';

import { useState, useEffect } from 'react';

export default function EmailPopup({ isOpen, onClose, clientEmail, clientName, invoiceDetails }) {
  const [locationDetails, setLocationDetails] = useState(null);
  const [formData, setFormData] = useState({
    fromName: '',
    fromEmail: '',
    to: '',
    subject: '',
    message: '', // Plain text for editing
    photoUrl: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to convert plain text to HTML
  const plainTextToHtml = (text) => {
    const reviewLink = locationDetails?.reviewLink || '#'; // Get the review link from locationDetails
    const employeeName = locationDetails?.employeeName || 'our team'; // Get the employee name
    const businessNumber = locationDetails?.businessNumber || ''; // Get the business phone number

    return `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .invoice-container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              border: 1px solid #ddd;
              border-radius: 8px;
              background-color: #f9f9f9;
            }
            .invoice-header {
              font-size: 24px;
              font-weight: bold;
              color: #2c3e50;
              margin-bottom: 20px;
            }
            .invoice-details {
              margin-bottom: 20px;
            }
            .invoice-details p {
              margin: 5px 0;
            }
            .invoice-details strong {
              color: #2c3e50;
            }
            .invoice-footer {
              margin-top: 20px;
              font-size: 14px;
              color: #777;
              text-align: center;
            }
            .review-link {
              color: #1a73e8;
              text-decoration: none;
            }
            .review-link:hover {
              text-decoration: underline;
            }
            .contact-info {
              margin-top: 10px;
              font-size: 14px;
              color: #555;
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="invoice-header">Invoice Details</div>
            <div class="invoice-details">
              ${text
                .split('\n')
                .map(line => `<p>${line}</p>`)
                .join('')}
            </div>
            <div class="invoice-footer">
              Thank you for your business!<br>
              If you have any questions, feel free to reply to this email.<br><br>
              <a href="${reviewLink}" class="review-link">Your review means the world to us. Please consider leaving one here.</a>
              <div class="contact-info">
                ${employeeName}<br>
                ${businessNumber}
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  useEffect(() => {
    const storedLocationDetails = sessionStorage.getItem('locationDetails');
    if (storedLocationDetails) {
      const parsedDetails = JSON.parse(storedLocationDetails);
      setLocationDetails(parsedDetails);

      // Generate the plain text invoice message if invoiceDetails is provided
      const plainTextMessage = invoiceDetails
        ? `
          ${invoiceDetails.description.replace(/  +/g, '\n')}

          Amount Charged: $${parseFloat(invoiceDetails.amount).toFixed(2)}
          ${invoiceDetails.cardDetails
            ? `Payment Method: ${invoiceDetails.cardDetails.brand} ending in ****${invoiceDetails.cardDetails.last4}`
            : ''}
        `
        : '';

      setFormData(prev => ({
        ...prev,
        fromName: parsedDetails.employeeName || '',
        fromEmail: parsedDetails.employeeEmail || '',
        to: clientEmail || '',
        subject: invoiceDetails ? `Your Detail Invoice for $${parseFloat(invoiceDetails.amount).toFixed(2)}` : '',
        message: plainTextMessage.trim(), // Plain text for editing
      }));
    }
  }, [clientEmail, invoiceDetails, clientName]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Convert the plain text message to HTML
      const htmlMessage = plainTextToHtml(formData.message);

      const response = await fetch(
        'https://us-central1-detail-on-the-go-universal.cloudfunctions.net/email-alias-2',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            subject: clientName ? `${formData.subject} ` : formData.subject,
            message: htmlMessage, // Send the HTML message
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
          {invoiceDetails ? 'Send Invoice' : 'Email Client'}
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
              readOnly // Disable editing
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-100 cursor-not-allowed"
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
              readOnly // Disable editing
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-100 cursor-not-allowed"
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