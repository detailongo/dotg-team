'use client';

import { useState, useEffect } from 'react';
import { getUser, onAuthStateChangedListener } from '../../auth';

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isFetchingPaymentMethods, setIsFetchingPaymentMethods] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  // Fetch events once the user is authenticated
  useEffect(() => {
    const fetchEvents = async (user) => {
      if (!user) return;
      console.log('Fetching events for user:', user.email);
      try {
        const response = await fetch(
          `https://us-central1-dotg-d6313.cloudfunctions.net/universal-display-details?email=${user.email}&singleEvents=true`
        );
        const data = await response.json();
        const fetchedEvents = data.map(event => ({
          id: event.id,
          title: event.summary,
          start: new Date(event.start.dateTime || event.start.date),
          end: event.end ? new Date(event.end.dateTime || event.end.date) : null,
          description: event.description,
          location: event.location,
        }));
        setEvents(fetchedEvents);
        console.log('Fetched events:', fetchedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    const unsubscribe = onAuthStateChangedListener((user) => {
      console.log('Auth changed, user:', user);
      fetchEvents(user);
    });

    return () => unsubscribe();
  }, []);

  // When an event is selected, extract the Stripe customer ID (if available)
  // and fetch payment methods for that customer.
  useEffect(() => {
    if (selectedEvent && selectedEvent.description) {
      console.log('Selected event description:', selectedEvent.description);

      // Remove HTML tags to get raw text
      const strippedDescription = selectedEvent.description.replace(/<[^>]+>/g, ' ');
      console.log('Stripped event description:', strippedDescription);
      
      // Use a capturing group to extract just the customer ID
      const stripeMatch = strippedDescription.match(/Stripe:\s*(cus_[a-zA-Z0-9]+)/);
      if (stripeMatch && stripeMatch[1]) {
        const stripeCustomerId = stripeMatch[1].trim();
        console.log('Extracted Stripe Customer ID:', stripeCustomerId);
        fetchPaymentMethods(stripeCustomerId);
      } else {
        console.log('No Stripe Customer ID found in the event description.');
        setPaymentMethods([]);
      }
    }
  }, [selectedEvent]);

  // Function to fetch payment methods from the Cloud Function for the given customer ID
  const fetchPaymentMethods = async (customerId) => {
    console.log('Fetching payment methods for customerId:', customerId);
    setIsFetchingPaymentMethods(true);
    try {
      const response = await fetch(
        `https://us-central1-detail-on-the-go-universal.cloudfunctions.net/charge-customer?customerId=${customerId}`
      );
      const data = await response.json();
      console.log('Payment methods fetch response:', data);
      if (data.paymentMethods && data.paymentMethods.length > 0) {
        setPaymentMethods(data.paymentMethods);
        console.log('Payment methods fetched:', data.paymentMethods);
      } else {
        setPaymentMethods([]);
        console.log('No payment methods found for customer:', customerId);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setPaymentMethods([]);
    } finally {
      setIsFetchingPaymentMethods(false);
    }
  };

  const nextMonth = () =>
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  const prevMonth = () =>
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  const formatMonthYear = () =>
    currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

  const getMonthDaysWithOffset = (date) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const days = [];
    const startDayOffset = startOfMonth.getDay();
    for (let i = 0; i < startDayOffset; i++) {
      days.push(null);
    }
    for (let i = 1; i <= endOfMonth.getDate(); i++) {
      days.push(new Date(date.getFullYear(), date.getMonth(), i));
    }
    return days;
  };

  const eventsByDay = (events) => {
    return events.reduce((acc, event) => {
      const eventDay = new Date(event.start).toLocaleDateString();
      if (!acc[eventDay]) {
        acc[eventDay] = [];
      }
      acc[eventDay].push(event);
      return acc;
    }, {});
  };

  const groupedEvents = eventsByDay(events);

  const handleEventClick = (event) => {
    console.log('Event clicked:', event);
    setSelectedEvent(event);
    setIsPopupVisible(true);
    setSelectedPaymentMethod('');
  };

  const closePopup = () => {
    console.log('Closing popup');
    setIsPopupVisible(false);
    setSelectedEvent(null);
    setPaymentMethods([]);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-white dark:bg-gray-900 p-2">
      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-4">
        My Calendar
      </h1>
      <div className="flex items-center w-full mb-2">
        <button
          onClick={prevMonth}
          className="px-4 py-2 bg-blue-500 text-white rounded flex-grow-0"
        >
          Prev
        </button>
        <h2 className="mx-4 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex-grow text-center">
          {formatMonthYear()}
        </h2>
        <button
          onClick={nextMonth}
          className="px-4 py-2 bg-blue-500 text-white rounded flex-grow-0"
        >
          Next
        </button>
      </div>
      <div className="grid grid-cols-7 gap-[1px] w-full text-center border-collapse">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
          <div
            key={index}
            className="font-medium text-sm sm:text-base text-gray-900 dark:text-white py-1 bg-gray-200 dark:bg-gray-800"
          >
            {day}
          </div>
        ))}
        {getMonthDaysWithOffset(currentDate).map((day, index) => (
          <div
            key={index}
            className={`p-1 sm:p-2 border dark:border-gray-700 ${
              day ? 'bg-white dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-900'
            }`}
            style={{ minHeight: '60px' }}
          >
            {day ? (
              <>
                <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 mb-1">
                  {day.getDate()}
                </div>
                {groupedEvents[day.toLocaleDateString()] && (
                  <div className="space-y-1">
                    {groupedEvents[day.toLocaleDateString()].map((event, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleEventClick(event)}
                        className="w-full block bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-sm px-1 py-0.5 text-xs text-left overflow-hidden"
                        style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}
                      >
                        {event.title}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </div>
        ))}
      </div>
      {isPopupVisible && selectedEvent && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-[90%] shadow-lg max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {selectedEvent.title}
            </h3>
            <p className="text-gray-800">
              <strong>Start:</strong> {new Date(selectedEvent.start).toLocaleString()}
            </p>
            <p className="text-gray-800">
              <strong>End:</strong>{' '}
              {selectedEvent.end ? new Date(selectedEvent.end).toLocaleString() : 'N/A'}
            </p>
            {selectedEvent.location && (
              <p className="text-gray-800 mt-2">
                <strong>Location:</strong> {selectedEvent.location}
              </p>
            )}
            {selectedEvent.description && (
              <div className="text-gray-800 mt-2">
                <strong>Description:</strong>
                <div
                  className="whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: selectedEvent.description }}
                ></div>
                {(() => {
                  // Remove HTML tags and then match for Stripe customer ID using a capturing group
                  const strippedDescription = selectedEvent.description.replace(/<[^>]+>/g, ' ');
                  console.log('Stripped event description for matching:', strippedDescription);
                  const stripeMatch = strippedDescription.match(/Stripe:\s*(cus_[a-zA-Z0-9]+)/);
                  if (stripeMatch && stripeMatch[1]) {
                    const stripeCustomerId = stripeMatch[1].trim();
                    return (
                      <div className="mt-2">
                        <p className="text-gray-800">
                          <strong>Stripe Customer ID:</strong> {stripeCustomerId}
                        </p>
                        {isFetchingPaymentMethods ? (
                          <p className="text-gray-600">Loading payment methods...</p>
                        ) : paymentMethods.length > 0 ? (
                          <select
                            className="mt-2 p-2 border rounded"
                            value={selectedPaymentMethod}
                            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                          >
                            <option value="">Select Payment Method</option>
                            {paymentMethods.map((pm) => (
                              <option key={pm.id} value={pm.id}>
                                {`${pm.card.brand.toUpperCase()} **** ${pm.card.last4} (exp: ${pm.card.exp_month}/${pm.card.exp_year})`}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-gray-600">No payment methods found.</p>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
            <button
              onClick={closePopup}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
