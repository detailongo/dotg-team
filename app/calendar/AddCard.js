'use client';
import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(
  "pk_test_51NyDg2B0J8erMOcfH548HQOHIyYBtw5zyLakwE9Wgb7flWV8Eq3wJdK7q5gPX7leqU3iXQI1ymHNoLah4uNN7tGK00QtLJ2PaO"
);

const AddCardForm = ({ onClose, onCardAdded, customerId }) => { // Added customerId prop
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!stripe || !elements) {
      setError('Stripe is not initialized.');
      setLoading(false);
      return;
    }

    try {
      // Create PaymentMethod with ZIP code
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
      });

      if (stripeError) throw stripeError;
      if (!paymentMethod?.id) throw new Error('Failed to create payment method');

      // Send to backend with all required fields
      const response = await fetch('https://us-central1-detail-on-the-go-universal.cloudfunctions.net/stripe-create-add-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_card', // Required field
          customer_id: customerId, // From props
          payment_method: paymentMethod.id, // From Stripe
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save card');
      }

      alert('Card added successfully!');
      onClose();
      if (onCardAdded) onCardAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-white/5 border border-gray-300 rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
              hidePostalCode: false // Show ZIP code field

            },
          }}
        />
      </div>

      {/* Error and buttons */}
      {error && (
        <div className="text-red-500 text-sm p-2 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-4 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
        >
          Close
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Card'}
        </button>
      </div>
    </form>
  );
};

const AddCard = ({ visible, onClose, onCardAdded, customerId }) => { // Added customerId prop
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-[90%] max-w-md">
        <h3 className="text-xl font-semibold mb-4">Add New Payment Method</h3>
        <Elements stripe={stripePromise}>
          <AddCardForm
            onClose={onClose}
            onCardAdded={onCardAdded}
            customerId={customerId} // Pass customerId to form
          />
        </Elements>
      </div>
    </div>
  );
};

export default AddCard;
