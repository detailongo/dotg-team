'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AddCard from './AddCard'; // Make sure the file name matches

const PaymentPopup = ({ branch, onClose, businessNumber, clientName, clientNumber, stripeCustomerId, selectedEvent, onPaymentSuccess }) => {
  console.log(branch, "##", clientName, "##", clientNumber, "##",)
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  const [description, setDescription] = useState('');
  const [autoSendInvoice, setAutoSendInvoice] = useState(true);
  const [showAddCardPopup, setShowAddCardPopup] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // New state for processing payment

  const chargeCustomer = async (branch, customerId, paymentMethodId, amount, description, zipCode, businessNumber, clientName, clientNumber) => { // 👈 Add branch, businessNumber, clientInfo as parameters
    try {
      // 1. Process payment first
      const response = await fetch(
        'https://us-central1-detail-on-the-go-universal.cloudfunctions.net/stripe-create-add-charge',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'charge',
            customer_id: customerId,
            payment_method: paymentMethodId,
            amount: Math.round(amount * 100),
            description,
            zip_code: zipCode,
            location: branch
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || data.error);

      return data; // Return Stripe response

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
      // Find the selected payment method
      const selectedPaymentMethod = paymentMethods.find(pm => pm.id === value);
      if (selectedPaymentMethod) {
        // Update the description with the card's last 4 digits
        const last4Digits = selectedPaymentMethod.card.last4;
        const updatedDescription = generateDescription(selectedEvent, last4Digits);
        setDescription(updatedDescription);
      }
    }
  };

  const extractEmail = (desc) => desc.match(/Email:\s*([^\s]+@[^\s]+)/i)?.[1] || null;

  const generateDescription = (event, last4Digits = '') => {
    const vehicle = event.description.match(/Vehicle:\s*\(([^)]+)\)/)?.[1] || 'Unknown';
    const pkg = event.description.match(/Package:\s*(.+?)(\n|$)/)?.[1]?.trim() || 'Unknown';
    const plan = event.description.match(/Plan:\s*(.+?)(\n|$)/)?.[1]?.trim() || 'Unknown';

    const services = parseFloat(event.description.match(/Services:\s*\$(\d+\.?\d*)/)?.[1] || 0);
    const tax = parseFloat(event.description.match(/Sales Tax:\s*\$(\d+\.?\d*)/)?.[1] || 0);
    const total = services + tax;

    let desc = `Vehicle: ${vehicle}
Package: ${pkg}
Plan: ${plan}
Services: $${services.toFixed(2)}
Tax: $${tax.toFixed(2)}
Total: $${total.toFixed(2)}
Location: ${event.location || 'Unknown'}`;

    // Add the payment method line if last4Digits is provided
    if (last4Digits) {
      desc += `\nPayment Method: Card ending in ****${last4Digits}`;
    }

    return desc;
  };

  const fetchMethods = useCallback(async () => {
    if (!stripeCustomerId) return;
    setIsFetching(true);
    try {
      const response = await fetch(
        `https://us-central1-detail-on-the-go-universal.cloudfunctions.net/payment-methods?customerId=${stripeCustomerId}`
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
    if (selectedEvent) {
      const selectedPaymentMethod = paymentMethods.find(pm => pm.id === selectedCard);
      const last4Digits = selectedPaymentMethod ? selectedPaymentMethod.card.last4 : '';
      const updatedDescription = generateDescription(selectedEvent, last4Digits);
      setDescription(updatedDescription);
    }
  }, [selectedEvent, selectedCard, paymentMethods]);

  const handlePayment = async () => {
    if (!amount || amount <= 0) return alert('Invalid amount');
    if (!paymentMethod) return alert('Select payment method');
    if (paymentMethod === 'card' && !selectedCard) return alert('Select card');

    setIsProcessing(true); // Disable the button and show loading

    try {
      let updatedDescription = description;
      let paymentType = '';

      // Handle card payments
      if (paymentMethod === 'card') {
        const selectedPaymentMethod = paymentMethods.find(pm => pm.id === selectedCard);
        const last4Digits = selectedPaymentMethod ? selectedPaymentMethod.card.last4 : '';
        updatedDescription = generateDescription(selectedEvent, last4Digits);
        paymentType = `Card ending in ****${last4Digits}`;

        // Process card payment via Stripe
        const result = await chargeCustomer(
          branch,
          stripeCustomerId,
          selectedCard,
          parseFloat(amount),
          updatedDescription,
          businessNumber,
          clientName,
          clientNumber
        );
      } else {
        // Handle cash or check payments
        paymentType = paymentMethod === 'cash' ? 'Cash' : 'Check';
        updatedDescription = `${description}\nPayment Method: ${paymentType}`;
      }

      // Extract email and event start time
      const email = extractEmail(selectedEvent.description);
      const eventStartTime = selectedEvent.start || 'Unknown'; // Assuming selectedEvent has a 'start' property

      // Prepare data for Google Sheets
      const paymentData = {
        timestamp: new Date().toLocaleString(),
        eventStartTime: eventStartTime, // Add event start time
        location: branch,
        businessNumber: businessNumber,
        clientName: clientName,
        email: email, // Add email
        clientNumber: clientNumber,
        amount: parseFloat(amount),
        paymentMethod: paymentType,
        description: updatedDescription,
        email: email, // Add email

      };

      // Submit payment data to Google Sheets
      const sheetsResponse = await fetch(
        'https://us-central1-detail-on-the-go-universal.cloudfunctions.net/payment-collected',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentData),
        }
      );

      if (!sheetsResponse.ok) {
        console.error('Failed to send payment data to Google Sheets');
        throw new Error('Failed to log payment in Google Sheets');
      } else {
        console.log('Payment data successfully sent to Google Sheets');
      }

      // Prepare data for Google Sheets
      const timeData = {
        timestamp: new Date().toLocaleString(),
        location: branch,
        businessNumber: businessNumber,
        clientName: clientName,
        clientNumber: clientNumber,
        paymentMethod: "Payment collected: " + paymentType,
      };

      // Submit payment data to Google Sheets
      const sheetsResponse2 = await fetch(
        'https://us-central1-detail-on-the-go-universal.cloudfunctions.net/detail-sms-timing',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(timeData),
        }
      );

      if (!sheetsResponse2.ok) {
        console.error('Failed to send time data to Google Sheets');
        throw new Error('Failed to log time in Google Sheets');
      } else {
        console.log('time data successfully sent to Google Sheets');
      }

      alert('Payment successful!');

      if (autoSendInvoice && onPaymentSuccess) {
        onPaymentSuccess({
          amount: parseFloat(amount),
          description: updatedDescription,
          customerEmail: email,
        });
      }

      onClose();
    } catch (error) {
      alert(error.message);
    } finally {
      setIsProcessing(false); // Re-enable the button
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
        <div className="relative bg-white p-6 rounded-lg w-[90%] shadow-lg max-h-[80vh] overflow-y-auto">
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
                  disabled={isProcessing}
                  className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                >
                  {isProcessing ? 'Processing...' : 'Confirm Payment'}
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