'use client';
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(
  "pk_test_51NyDg2B0J8erMOcfH548HQOHIyYBtw5zyLakwE9Wgb7flWV8Eq3wJdK7q5gPX7leqU3iXQI1ymHNoLah4uNN7tGK00QtLJ2PaO"
);

const PaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!stripe || !elements) return;

    // Gather form data
    const name = e.target.name.value;
    const phone = e.target.phone.value;
    const email = e.target.email.value;
    const street = e.target.street.value;
    const city = e.target.city.value;
    const state = e.target.state.value;
    const postalCode = e.target.postalCode.value;
    const country = e.target.country.value;

    // Create a PaymentMethod
    const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement(CardElement),
      billing_details: {
        name,
        phone,
        email,
        address: {
          line1: street,
          city,
          state,
          postal_code: postalCode,
          country,
        },
      },
    });

    if (stripeError) {
      setError(stripeError.message);
      setLoading(false);
      return;
    }

    // Send paymentMethod to your backend
    try {
      const response = await fetch('https://us-central1-detail-on-the-go-universal.cloudfunctions.net/stripe-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method: paymentMethod,
          save_and_charge: false,         
          name,
          phone,
          email,
          address: {
            line1: street,
            city,
            state,
            postal_code: postalCode,
            country,
          },
        }),
      });

      const data = await response.json();
      // ========== ADDED SECTION ========== //
      if (data.client_secret) {
        const { error, paymentIntent } = await stripe.confirmCardPayment(
          data.client_secret,
          { payment_method: paymentMethod.id }
        );

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        if (paymentIntent.status === "succeeded") {
          alert("Payment successful!");
          e.target.reset();
          elements.getElement(CardElement).clear();
        }
      }
      // ========== END ADDED SECTION ========== //

      if (data.success) {
        alert('Payment information saved successfully!');
      } else {
        setError(data.error || 'An error occurred. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-blue-600 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold mb-6">Confirm Payment Info</h1>
        <p className="mb-6 opacity-80">Your card will not be charged at this time.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                required
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <input
                type="tel"
                name="phone"
                required
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                required
                placeholder="john@example.com"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Street Address</label>
              <input
                type="text"
                name="street"
                required
                placeholder="123 Main St"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <input
                  type="text"
                  name="city"
                  required
                  placeholder="New York"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">State</label>
                <input
                  type="text"
                  name="state"
                  required
                  placeholder="NY"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  required
                  placeholder="10001"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Country</label>
                <select
                  name="country"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 appearance-none"
                >
                  <option value="">Select Country</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card Details */}
          <div className="space-y-4">
            <label className="block text-sm font-medium mb-2">Card Details</label>
            <div className="p-4 bg-white/5 border border-white/20 rounded-lg">
              <CardElement
                options={{
                  style: {
                    base: {
                      color: '#ffffff',
                      fontSize: '16px',
                      '::placeholder': {
                        color: 'rgba(255,255,255,0.5)',
                      },
                      iconColor: '#ffffff',
                    },
                    invalid: {
                      color: '#ff0000',
                    },
                  },
                }}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm p-3 bg-red-900/20 rounded-lg">
              {typeof error === 'object' ? error.message : error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-emerald-400/90 hover:bg-emerald-400 text-black font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Confirm Billing'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default function PaymentPage() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm />
    </Elements>
  );
}