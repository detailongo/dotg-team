'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChangedListener } from '../../auth';
import React, { lazy, Suspense } from 'react';

const PaymentPopup = lazy(() => import('./PaymentPopup'));
const MessengerPopup = lazy(() => import('../sms/sms-pop'));
const EmailPopup = lazy(() => import('../email/email-popup'));
const EditEventPopup = lazy(() => import('./EditEventPopup'));

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [stripeCustomerId, setStripeCustomerId] = useState('');
  const [isPaymentPopupVisible, setIsPaymentPopupVisible] = useState(false);
  const [isSmsPopupVisible, setIsSmsPopupVisible] = useState(false);
  const [isEmailPopupVisible, setIsEmailPopupVisible] = useState(false);
  const [clientPhone, setClientPhone] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [branch, setBranch] = useState('');
  const [invoiceDetails, setInvoiceDetails] = useState(null);
  const [isEditPopupVisible, setIsEditPopupVisible] = useState(false);
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const getCurrentUser = () => {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChangedListener((user) => {
        unsubscribe();
        resolve(user);
      });
    });
  };

  useEffect(() => {
    const storedLocationDetails = sessionStorage.getItem('locationDetails');
    if (storedLocationDetails) {
      const parsedDetails = JSON.parse(storedLocationDetails);
      setBusinessNumber(parsedDetails.businessNumber || '');
      setBranch(parsedDetails.branch || '');
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchEvents = async (user) => {
      if (!user) {
        setUserName('');
        setEvents([]);
        return;
      }
      setUserName(user.displayName || '');
      try {
        const response = await fetch(
          `https://us-central1-dotg-d6313.cloudfunctions.net/universal-display-details?email=${encodeURIComponent(user.email)}&singleEvents=true`
        );
        const text = await response.text(); // Get raw text
        console.log('Raw response:', text); // Log it
        if (!response.ok) {
          throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`);
        }
        const data = JSON.parse(text); // Parse only if OK
        const fetchedEvents = data.map((event) => ({
          id: event.id,
          title: event.summary,
          start: new Date(event.start.dateTime || event.start.date),
          end: event.end ? new Date(event.end.dateTime || event.end.date) : null,
          description: event.description,
          location: event.location,
        }));
        setEvents(fetchedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      }
    };

    const unsubscribe = onAuthStateChangedListener((user) => {
      fetchEvents(user);
    });

    return () => unsubscribe();
  }, []);

  const handleNext = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
    } else if (view === 'week') {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)));
    } else {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)));
    }
  };

  const handlePrev = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
    } else if (view === 'week') {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)));
    } else {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)));
    }
  };

  const formatMonthYear = () =>
    currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

  const formatWeekRange = () => {
    const start = getStartOfWeek(currentDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  const getStartOfWeek = (date) => {
    const newDate = new Date(date);
    const dayOfWeek = newDate.getDay();
    newDate.setDate(newDate.getDate() - dayOfWeek);
    return newDate;
  };

  const getWeekDays = (date) => {
    const start = getStartOfWeek(date);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

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

  const eventsByDay = (events) =>
    events.reduce((acc, event) => {
      const eventDay = new Date(event.start).toLocaleDateString();
      if (!acc[eventDay]) acc[eventDay] = [];
      acc[eventDay].push(event);
      return acc;
    }, {});

  const groupedEvents = eventsByDay(events);

  const handleEventClick = (event) => {
    console.log(event.title);
    setClientName(event.title);
    setSelectedEvent(event);
    setIsPopupVisible(true);
  };

  const closePopup = () => {
    setIsPopupVisible(false);
    setSelectedEvent(null);
  };

  const normalizePhoneNumber = (rawNumber) => {
    const clean = rawNumber.replace(/[^\d+]/g, '');
    if (clean.startsWith('+')) return clean;
    if (clean.length === 10) return `+1${clean}`;
    if (clean.length === 11 && clean.startsWith('1')) return `+${clean}`;
    return null;
  };

  const extractFromDescription = (pattern) => {
    if (!selectedEvent?.description) return null;
    const stripped = selectedEvent.description.replace(/<[^>]+>/g, ' ');
    const match = stripped.match(pattern);
    return match?.[1]?.trim() || null;
  };

  const handleSmsClick = () => {
    const storedDetails = sessionStorage.getItem('locationDetails');
    if (!storedDetails) return alert('Business configuration missing');

    const parsedDetails = JSON.parse(storedDetails);
    const businessPhone = parsedDetails.businessNumber;
    if (!businessPhone) return alert('Business number not configured');

    const phone = extractFromDescription(/Phone(?: Number)?:\s*([+\d\s\-()]+)/i);
    if (!phone) return alert('No client phone found');

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) return alert('Invalid phone format');
    console.log("normalizedPhone: " + normalizedPhone);
    console.log("Name; " + clientName);
    setBusinessNumber(businessPhone);
    setClientPhone(normalizedPhone);
    setIsSmsPopupVisible(true);
  };

  const handleEmailClick = () => {
    const email = extractFromDescription(/Email:\s*([^\s]+@[^\s]+)/i);
    const phoneNumber = extractFromDescription(/Phone Number:\s*(\d+)/i);
    if (email) {
      setClientEmail(email);
      setIsEmailPopupVisible(true);
    } else {
      alert('No client email found');
    }
  };

  const renderDayCell = (day, isDaily = false) => {
    if (!day) {
      return (
        <div
          className="p-2 bg-gray-100 dark:bg-gray-900 rounded"
          style={{ minHeight: '60px' }}
        />
      );
    }

    const isToday = day.toDateString() === new Date().toDateString();
    const dayEvents = groupedEvents[day.toLocaleDateString()] || [];

    if (isDaily) {
      return (
        <div
          className={`p-2 bg-white dark:bg-gray-800 rounded ${isToday ? 'ring-2 ring-green-500' : ''}`}
          style={{ minHeight: '60px' }}
        >
          <div className="text-sm sm:text-base text-gray-700 dark:text-gray-200 mb-2 font-semibold">
            {day.toDateString()}
          </div>
          <div className="flex flex-col space-y-2">
            {dayEvents.map((event, idx) => (
              <div
                key={idx}
                onClick={() => handleEventClick(event)}
                className="w-full block bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-sm px-1 py-0.5 text-xs text-left overflow-hidden"
                style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}
              >
                <div className="font-medium">{event.title}</div>
                {event.start && (
                  <div className="text-xs text-gray-600">
                    Start: {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
                {event.location && (
                  <div className="text-sm text-gray-600 mt-1">{event.location}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div
        className={`p-.5 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 ${isToday ? 'ring-2 ring-green-500' : ''}`}
        style={{ minHeight: '60px' }}
      >
        <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 mb-1">
          {day.getDate()}
        </div>
        <div className="flex flex-col space-y-2">
          {dayEvents.map((event, idx) => (
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
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 w-full min-h-[100vh]">
      {isLoading ? (
        <div className="flex justify-center items-center h-screen">
          <p>Loading...</p>
        </div>
      ) : !sessionStorage.getItem('locationDetails') ? (
        <div className="flex justify-center items-center h-screen">
          <p>Please sign in with an authorized email to access this page.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 p-1">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 text-center">
            {userName ? `${userName}'s Calendar` : 'Calendar'} -{' '}
            {view === 'month'
              ? formatMonthYear()
              : view === 'week'
                ? formatWeekRange()
                : currentDate.toLocaleDateString()}
          </h2>

          <div className="flex items-center justify-between w-full mb-4 px-2 sm:px-4">
            <button
              onClick={handlePrev}
              className="px-3 py-2 bg-blue-500 text-white rounded text-2xl"
            >
              👈
            </button>
            <div className="flex space-x-2">
              <button
                onClick={() => setView('month')}
                className={`px-3 py-2 rounded ${view === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Month
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-3 py-2 rounded ${view === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Week
              </button>
              <button
                onClick={() => setView('day')}
                className={`px-3 py-2 rounded ${view === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Day
              </button>
            </div>
            <button
              onClick={handleNext}
              className="px-3 py-2 bg-blue-500 text-white rounded text-2xl"
            >
              👉
            </button>
          </div>

          {view === 'month' && (
            <div className="grid grid-cols-7 gap-x-0 gap-y-0 w-full text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                <div
                  key={i}
                  className="font-medium text-sm sm:text-base text-gray-900 dark:text-white py-1 bg-gray-200 dark:bg-gray-800 rounded"
                >
                  {day}
                </div>
              ))}
              {getMonthDaysWithOffset(currentDate).map((day, i) => (
                <React.Fragment key={i}>{renderDayCell(day)}</React.Fragment>
              ))}
            </div>
          )}

          {view === 'week' && (
            <div className="grid grid-cols-7 gap-x-0 gap-y-0 w-full text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                <div
                  key={i}
                  className="font-medium text-sm sm:text-base text-gray-900 dark:text-white py-1 bg-gray-200 dark:bg-gray-800 rounded"
                >
                  {day}
                </div>
              ))}
              {getWeekDays(currentDate).map((day, i) => (
                <React.Fragment key={i}>{renderDayCell(day)}</React.Fragment>
              ))}
            </div>
          )}

          {view === 'day' && (
            <div className="w-full text-center">
              {renderDayCell(currentDate, true)}
            </div>
          )}

          {isPopupVisible && selectedEvent && (
            <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
              <div className="relative bg-white p-6 rounded-lg w-full h-full sm:w-[90%] sm:h-auto sm:max-h-[80vh] shadow-lg overflow-y-auto">
                <button
                  onClick={closePopup}
                  className="absolute top-3 right-3 text-gray-700 hover:text-gray-900 text-2xl sm:text-3xl"
                >
                  ×
                </button>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {selectedEvent.title}
                </h3>
                <p className="text-gray-800">
                  <strong>Start:</strong>{' '}
                  {new Date(selectedEvent.start).toLocaleString()}
                </p>
                <p className="text-gray-800">
                  <strong>End:</strong>{' '}
                  {selectedEvent.end
                    ? new Date(selectedEvent.end).toLocaleString()
                    : 'N/A'}
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
                      className="whitespace-pre-wrap mt-2"
                      dangerouslySetInnerHTML={{
                        __html: selectedEvent.description
                          .replace(/<br>/g, '\n')
                          .replace(/<a href="(.+?)" target="_blank">(.+?)<\/a>/g, '$2 ($1)')
                          .replace(/&/g, '&')
                          .replace(/<u>(.+?)<\/u>/g, '<strong>$1</strong>'),
                      }}
                    />
                  </div>
                )}
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => setIsEditPopupVisible(true)}
                    className="w-full bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
                  >
                    Edit Event
                  </button>
                  <button
                    onClick={() => {
                      const stripped = selectedEvent.description.replace(/<[^>]+>/g, ' ');
                      const match = stripped.match(/Stripe:\s*(cus_[a-zA-Z0-9]+)/);
                      if (match?.[1]) {
                        setStripeCustomerId(match[1].trim());
                      }
                      setIsPaymentPopupVisible(true);
                    }}
                    className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    View Payment & Charge
                  </button>
                  <button
                    onClick={handleSmsClick}
                    className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                  >
                    Send SMS
                  </button>
                  <button
                    onClick={handleEmailClick}
                    className="w-full bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
                  >
                    Send Email
                  </button>
                </div>
              </div>
            </div>
          )}

          {isEditPopupVisible && (
            <Suspense fallback={<div>Loading editor...</div>}>
              <EditEventPopup
                event={selectedEvent}
                onClose={() => setIsEditPopupVisible(false)}
                onSave={async (updatedEvent) => {
                  try {
                    const user = await getCurrentUser();
                    const toRFC3339 = (datetime) => {
                      const date = new Date(datetime);
                      const offset = -date.getTimezoneOffset();
                      const pad = (n) => String(n).padStart(2, "0");
                      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
                        `T${pad(date.getHours())}:${pad(date.getMinutes())}:00` +
                        `${offset >= 0 ? "+" : "-"}${pad(Math.abs(offset) / 60)}:${pad(Math.abs(offset) % 60)}`;
                    };
                    const requestBody = {
                      eventId: updatedEvent.id,
                      summary: updatedEvent.title,
                      start: toRFC3339(updatedEvent.start),
                      end: toRFC3339(updatedEvent.end),
                      description: updatedEvent.description,
                      location: updatedEvent.location,
                      recurrence: updatedEvent.recurrence,
                      timeZone: updatedEvent.timeZone,
                    };
                    console.log("Data being sent to backend:", requestBody);
                    const response = await fetch(
                      `https://us-central1-dotg-d6313.cloudfunctions.net/universal-modify-event?email=${user.email}`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(requestBody),
                      }
                    );
                    if (!response.ok) throw new Error("Failed to update event");
                    setEvents(events.map(e => e.id === updatedEvent.id ? {
                      ...e,
                      ...updatedEvent,
                      start: new Date(updatedEvent.start),
                      end: updatedEvent.end ? new Date(updatedEvent.end) : null
                    } : e));
                    setSelectedEvent(prev => {
                      if (prev?.id === updatedEvent.id) {
                        return {
                          ...prev,
                          ...updatedEvent,
                          start: new Date(updatedEvent.start),
                          end: updatedEvent.end ? new Date(updatedEvent.end) : null
                        };
                      }
                      return prev;
                    });
                    setIsEditPopupVisible(false);
                  } catch (error) {
                    console.error("Error updating event:", error);
                    alert(`Failed to update event: ${error.message}`);
                  }
                }}
              />
            </Suspense>
          )}
          {isPaymentPopupVisible && (
            <Suspense fallback={<div>Loading payment...</div>}>
              <PaymentPopup
                branch={branch}
                onClose={() => setIsPaymentPopupVisible(false)}
                businessNumber={businessNumber}
                clientName={clientName}
                clientNumber={clientPhone}
                stripeCustomerId={stripeCustomerId}
                selectedEvent={selectedEvent}
                onPaymentSuccess={(details) => {
                  setClientEmail(details.customerEmail);
                  setInvoiceDetails(details);
                  setIsEmailPopupVisible(true);
                }}
              />
            </Suspense>
          )}
          {isSmsPopupVisible && (
            <Suspense fallback={<div>Loading SMS...</div>}>
              <MessengerPopup
                isOpen={isSmsPopupVisible}
                onClose={() => setIsSmsPopupVisible(false)}
                businessNumber={businessNumber}
                clientNumber={clientPhone}
              />
            </Suspense>
          )}
          {isEmailPopupVisible && (
            <Suspense fallback={<div>Loading Email...</div>}>
              <EmailPopup
                isOpen={isEmailPopupVisible}
                onClose={() => setIsEmailPopupVisible(false)}
                clientEmail={clientEmail}
                clientName={clientName}
                invoiceDetails={invoiceDetails}
              />
            </Suspense>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarPage;