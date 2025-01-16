'use client';

import { useState, useEffect } from 'react';
import { getUser, onAuthStateChangedListener } from '../../auth';

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  useEffect(() => {
    const fetchEvents = async (user) => {
      if (!user) return;
      
      try {
        const response = await fetch(`https://us-central1-dotg-d6313.cloudfunctions.net/universal-display-details?email=${user.email}&singleEvents=true`);
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
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    const unsubscribe = onAuthStateChangedListener((user) => {
      fetchEvents(user);
    });

    return () => unsubscribe();
  }, []);

  // Rest of the component remains the same...
  const nextMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  const prevMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  const formatMonthYear = () => currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

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
    setSelectedEvent(event);
    setIsPopupVisible(true);
  };

  const closePopup = () => {
    setIsPopupVisible(false);
    setSelectedEvent(null);
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
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
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
            className={`p-1 sm:p-2 border dark:border-gray-700 ${day ? 'bg-white dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-900'}
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
                        style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                        }}
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
            <h3 className="text-xl font-semibold text-gray-900 mb-4">{selectedEvent.title}</h3>
            <p className="text-gray-800">
              <strong>Start:</strong> {new Date(selectedEvent.start).toLocaleString()}
            </p>
            <p className="text-gray-800">
              <strong>End:</strong> {selectedEvent.end ? new Date(selectedEvent.end).toLocaleString() : 'N/A'}
            </p>
            {selectedEvent.description && (
              <div className="text-gray-800 mt-2">
                <strong>Description:</strong>
                <div
                  className="whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: selectedEvent.description }}
                ></div>
              </div>
            )}
            {selectedEvent.location && (
              <p className="text-gray-800 mt-2">
                <strong>Location:</strong> {selectedEvent.location}
              </p>
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

