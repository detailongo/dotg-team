'use client';

import { useState, useEffect } from 'react';
import { getUser, onAuthStateChangedListener } from '../../auth';

const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {

    const fetchPayments = async (user) => {
      if (!user) return;

      try {
        const response = await fetch(
          `https://us-central1-detail-on-the-go-universal.cloudfunctions.net/show-payments3?location=${"stl"}`
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch payments: ${response.statusText}`);
        }

        const data = await response.json();
        setPayments(data.payments);
        setSuccessMessage('Payments loaded successfully.');
        setErrorMessage('');
      } catch (error) {
        console.error('Error fetching payments:', error);
        setErrorMessage(error.message);
        setSuccessMessage('');
      }
    }

    const unsubscribe = onAuthStateChangedListener((user) => {
      console.log(user)
      fetchPayments(user);
    });
    return () => unsubscribe();
  }, []);

  const handleButtonClick = (payment) => {
    setSelectedPayment(payment);
  };

  const handleClosePopup = () => {
    setSelectedPayment(null);
  };

  return (
    <div className="min-h-screen p-4 bg-gray-100">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Customer Payments</h1>
      {successMessage && <div className="text-green-600 mb-4">{successMessage}</div>}
      {errorMessage && <div className="text-red-600 mb-4">{errorMessage}</div>}

      <div className="space-y-4">
        {payments.map((payment, index) => (
          <button
            key={index}
            className="w-full p-4 text-left bg-blue-500 text-white rounded-md hover:bg-blue-600"
            onClick={() => handleButtonClick(payment)}
          >
            {new Date(payment.created * 1000).toLocaleString()} - ${((payment.amount || 0) / 100).toFixed(2)}
          </button>
        ))}
      </div>

      {selectedPayment && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-1/3">
            <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
            <div><strong>Date:</strong> {new Date(selectedPayment.created * 1000).toLocaleString()}</div>
            <div><strong>Amount:</strong> ${((selectedPayment.amount || 0) / 100).toFixed(2)}</div>
            <div><strong>Payment Method:</strong> {selectedPayment.payment_method || 'N/A'}</div>
            <div><strong>Description:</strong></div>
            <div className="overflow-hidden text-ellipsis" style={{ maxHeight: '80px', lineHeight: '1.2em', overflowY: 'auto', whiteSpace: 'normal' }}>
              {selectedPayment.description ? selectedPayment.description.split('\n').map((line, index) => (
                <span key={index}>{line}<br /></span>
              )) : 'N/A'}
            </div>
            <div><strong>Location:</strong> {selectedPayment.metadata?.location || 'N/A'}</div>
            <div><strong>Receipt Email:</strong> {selectedPayment.receipt_email || 'N/A'}</div>
            <div><strong>Customer:</strong> {selectedPayment.customer || 'N/A'}</div>
            <button className="mt-4 p-2 bg-gray-500 text-white rounded-md" onClick={handleClosePopup}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
