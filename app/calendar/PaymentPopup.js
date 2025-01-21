import React, { useState, useEffect } from 'react';

const PaymentPopup = ({
  onClose,
  stripeCustomerId,
  selectedEvent,
  fetchPaymentMethods,
  chargeCustomer,
}) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isFetchingPaymentMethods, setIsFetchingPaymentMethods] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  const [chargeDescription, setChargeDescription] = useState('');

  // Function to prefill the charge description
  const generatePrefilledDescription = (event) => {
    const vehicleMatch = event.description.match(/Vehicle:\s*\(([^)]+)\)/);
    const vehicle = vehicleMatch ? vehicleMatch[1] : 'Unknown Vehicle';

    const packageName =
      event.description.match(/Package:\s*(.+?)(<br>|$)/)?.[1]?.trim() ||
      'Unknown Package';
    const plan =
      event.description.match(/Plan:\s*(.+?)(<br>|$)/)?.[1]?.trim() ||
      'Unknown Plan';

    const beforeTaxMatch = event.description.match(/Services:\s*\$(\d+(\.\d{2})?)/);
    const taxMatch = event.description.match(/Sales Tax:\s*\$(\d+(\.\d{2})?)/);
    const totalMatch = event.description.match(/Total\s*\$(\d+(\.\d{2})?)/);

    const beforeTax = beforeTaxMatch ? parseFloat(beforeTaxMatch[1]) : 0;
    const tax = taxMatch ? parseFloat(taxMatch[1]) : 0;
    const total = totalMatch ? parseFloat(totalMatch[1]) : beforeTax + tax;

    const location = event.location || 'Unknown Location';

    return `
      Vehicle: ${vehicle}
      Package: ${packageName}
      Plan: ${plan}
      Before Tax: $${beforeTax.toFixed(2)}
      Tax: $${tax.toFixed(2)}
      Total: $${total.toFixed(2)}
      Billing Location: ${location}`;
  };

  // Fetch payment methods when the component mounts
  useEffect(() => {
    const loadPaymentMethods = async () => {
      if (!stripeCustomerId) return;

      console.log('Fetching payment methods for customerId:', stripeCustomerId);
      setIsFetchingPaymentMethods(true);
      try {
        const response = await fetch(
          `https://us-central1-detail-on-the-go-universal.cloudfunctions.net/charge-customer?customerId=${stripeCustomerId}`
        );
        const data = await response.json();
        console.log('Payment methods fetch response:', data);
        setPaymentMethods(data.paymentMethods || []);
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        setPaymentMethods([]); // Handle error by resetting to an empty array
      } finally {
        setIsFetchingPaymentMethods(false);
      }
    };

    loadPaymentMethods();
  }, [stripeCustomerId]);

  // Set prefilled description when selectedEvent changes
  useEffect(() => {
    if (selectedEvent) {
      const prefilledDescription = generatePrefilledDescription(selectedEvent);
      setChargeDescription(prefilledDescription);
    }
  }, [selectedEvent]);

  const handleConfirmPayment = async () => {
    if (!amount || isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (!selectedPaymentMethod) {
      alert('Please select a payment method.');
      return;
    }
    if (selectedPaymentMethod === 'card' && !selectedCard) {
      alert('Please select a card.');
      return;
    }
    if (selectedPaymentMethod === 'card' && !chargeDescription.trim()) {
      alert('Please enter a description for the charge.');
      return;
    }

    try {
      console.log('Charging customer...');
      await chargeCustomer(
        stripeCustomerId,
        selectedCard,
        amount,
        chargeDescription
      );
      alert('Payment successful!');
      onClose(); // Close the popup after successful payment
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-[90%] shadow-lg max-h-[80vh] overflow-y-auto">
        <h3 className="text-xl font-semibold">Make a Payment</h3>
        <p className="text-gray-800">
          <strong>Stripe Customer ID:</strong> {stripeCustomerId}
        </p>
        {isFetchingPaymentMethods ? (
          <p className="text-gray-600">Loading payment methods...</p>
        ) : paymentMethods.length > 0 ? (
          <>
            <div className="mt-4">
              <label htmlFor="amount" className="block text-gray-800">
                Amount to Collect/Charge:
              </label>
              <input
                type="number"
                id="amount"
                className="mt-2 p-2 border rounded w-full"
                placeholder="Enter amount in dollars"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="mt-4">
              <label htmlFor="payment-method" className="block text-gray-800">
                Select Payment Method:
              </label>
              <select
                id="payment-method"
                className="mt-2 p-2 border rounded w-full"
                value={selectedPaymentMethod}
                onChange={(e) => {
                  const method = e.target.value;
                  setSelectedPaymentMethod(method);
                }}
              >
                <option value="">Select Method</option>
                <option value="card">Card</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
              </select>
            </div>
            {selectedPaymentMethod === 'card' && paymentMethods.length > 0 && (
              <div className="mt-4">
                <label htmlFor="card-selection" className="block text-gray-800">
                  Select Card:
                </label>
                <select
                  id="card-selection"
                  className="mt-2 p-2 border rounded w-full"
                  value={selectedCard}
                  onChange={(e) => setSelectedCard(e.target.value)}
                >
                  <option value="">Select a Card</option>
                  {paymentMethods.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {`${pm.card.brand.toUpperCase()} **** ${pm.card.last4} (exp: ${pm.card.exp_month}/${pm.card.exp_year})`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="mt-4">
              <label htmlFor="charge-description" className="block text-gray-800">
                Charge Description:
              </label>
              <textarea
                id="charge-description"
                className="mt-2 p-2 border rounded w-full"
                placeholder="Enter a description for this charge"
                value={chargeDescription}
                onChange={(e) => setChargeDescription(e.target.value)}
              ></textarea>
            </div>
            <div className="mt-4">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                onClick={handleConfirmPayment}
              >
                Confirm Payment
              </button>
            </div>
          </>
        ) : (
          <p className="text-gray-600">No payment methods found.</p>
        )}
        <button
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default PaymentPopup;
