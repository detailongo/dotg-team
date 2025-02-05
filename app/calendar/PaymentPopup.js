'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AddCard from './AddCard'; // Make sure the file name matches

const PaymentPopup = ({ onClose, businessNumber, clientName, clientNumber, stripeCustomerId, selectedEvent, onPaymentSuccess }) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  const [description, setDescription] = useState('');
  const [autoSendInvoice, setAutoSendInvoice] = useState(true);
  const [showAddCardPopup, setShowAddCardPopup] = useState(false);

  const chargeCustomer = async (customerId, paymentMethodId, amount, description, zipCode) => {
    try {
      const response = await fetch(
        'https://us-central1-detail-on-the-go-universal.cloudfunctions.net/stripe-create-add-charge',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'charge', // Required by backend
            customer_id: customerId, // Match backend naming
            payment_method: paymentMethodId, // Match backend naming
            amount: Math.round(amount * 100),
            description,
            zip_code: zipCode, // Add ZIP code if required
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || data.error);
      return data;
    } catch (error) {
      throw new Error(`Charge failed: ${error.message}`);
    }
  };

  const handleCardSelect = (e) => {
    const value = e.target.value;
    if (value === 'new') {
      setShowAddCardPopup(true);
      setSelectedCard('');
    } else {
      setSelectedCard(value);
    }
  };

  const extractEmail = (desc) => desc.match(/Email:\s*([^\s]+@[^\s]+)/i)?.[1] || null;

  const generateDescription = (event) => {
    const vehicle = event.description.match(/Vehicle:\s*\(([^)]+)\)/)?.[1] || 'Unknown';
    const pkg = event.description.match(/Package:\s*(.+?)(<br>|$)/)?.[1]?.trim() || 'Unknown';
    const plan = event.description.match(/Plan:\s*(.+?)(<br>|$)/)?.[1]?.trim() || 'Unknown';
    const services = parseFloat(event.description.match(/Services:\s*\$(\d+\.?\d*)/)?.[1] || 0);
    const tax = parseFloat(event.description.match(/Sales Tax:\s*\$(\d+\.?\d*)/)?.[1] || 0);
    const total = services + tax;

    return `Vehicle: ${vehicle}
Package: ${pkg}
Plan: ${plan}
Services: $${services.toFixed(2)}
Tax: $${tax.toFixed(2)}
Total: $${total.toFixed(2)}
Location: ${event.location || 'Unknown'}`;
  };

  const fetchMethods = useCallback(async () => {
    if (!stripeCustomerId) return;
    setIsFetching(true);
    try {
      const response = await fetch(
        `https://us-central1-detail-on-the-go-universal.cloudfunctions.net/charge-customer-1?customerId=${stripeCustomerId}`
      );
      const data = await response.json();
      setPaymentMethods(data.paymentMethods || []);
    } catch (error) {
      console.error('Failed to fetch methods:', error);
      setPaymentMethods([]);
    } finally {
      setIsFetching(false);
    }
  }, [stripeCustomerId]);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  useEffect(() => {
    if (selectedEvent) setDescription(generateDescription(selectedEvent));
  }, [selectedEvent]);

  const handlePayment = async () => {
    if (!amount || amount <= 0) return alert('Invalid amount');
    if (!paymentMethod) return alert('Select payment method');
    if (paymentMethod === 'card' && !selectedCard) return alert('Select card');

    try {
      const result = await chargeCustomer(
        stripeCustomerId,
        selectedCard,
        parseFloat(amount),
        description
      );

      alert('Payment successful!');

      const clientData = {
        timestamp: new Date().toLocaleString(), // Use the same timestamp as the message
        businessNumber: businessNumber,
        name: clientName,
        phone: clientNumber,
        message: "Payment Collected",

      };

      const sheetsResponse = await fetch(
        'https://us-central1-detail-on-the-go-universal.cloudfunctions.net/detail-sms-timing',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(clientData), // Send client data as JSON
        }
      );

      if (!sheetsResponse.ok) {
        console.error('Failed to send client data to backend');
      } else {
        console.log('Client data successfully sent to backend');
      }


      if (autoSendInvoice && onPaymentSuccess) {
        onPaymentSuccess({
          amount: parseFloat(amount),
          description,
          customerEmail: extractEmail(selectedEvent.description),
        });
      }

      onClose();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
        {/* 
          Add 'relative' so we can position the top-right close (X) button with absolute 
        */}
        <div className="relative bg-white p-6 rounded-lg w-[90%] shadow-lg max-h-[80vh] overflow-y-auto">
          {/* Top-right close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            &times;
          </button>

          <h3 className="text-xl font-semibold mb-4">Process Payment</h3>
          <p className="text-gray-800 mb-2">Customer ID: {stripeCustomerId}</p>

          {isFetching ? (
            <p className="text-gray-600">Loading payment methods...</p>
          ) : paymentMethods.length > 0 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-800 mb-1">Amount ($)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="block text-gray-800 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select method</option>
                  <option value="card">Credit Card</option>
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                </select>
              </div>

              {paymentMethod === 'card' && (
                <div>
                  <label className="block text-gray-800 mb-1">Select Card</label>
                  <select
                    value={selectedCard}
                    onChange={handleCardSelect}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Choose card</option>
                    {paymentMethods.map((pm) => (
                      <option key={pm.id} value={pm.id}>
                        {pm.card.brand.toUpperCase()} ****{pm.card.last4} (Exp:{' '}
                        {pm.card.exp_month}/{pm.card.exp_year})
                      </option>
                    ))}
                    <option value="new">➕ Add new card</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-gray-800 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border rounded h-32"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoSendInvoice}
                  onChange={(e) => setAutoSendInvoice(e.target.checked)}
                  className="h-4 w-4"
                />
                <label className="text-sm text-gray-700">Auto-send invoice email</label>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handlePayment}
                  className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                >
                  Confirm Payment
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No payment methods available</p>
          )}
        </div>
      </div>

      <AddCard
        visible={showAddCardPopup}
        onClose={() => setShowAddCardPopup(false)}
        onCardAdded={fetchMethods}
        customerId={stripeCustomerId}
      />
    </>
  );
};

export default PaymentPopup;
