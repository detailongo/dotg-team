'use client';

import { useState, useEffect, useRef } from 'react';
import { onAuthStateChangedListener } from '../../auth.js'; // Adjust path to match your project structure

export default function MessengerPopup({ isOpen, onClose, businessNumber, clientNumber }) {
  const [clientInfo, setClientInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [delay, setDelay] = useState(0);
  const [userFirstName, setUserFirstName] = useState(''); // State for user's first name
  const [userFullName, setUserFullName] = useState(''); // New state for user's full name
  const messagesEndRef = useRef(null);

  // Fetch the logged-in user's first name and full name from Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener((user) => {
      if (user && user.displayName) {
        const firstName = user.displayName.split(' ')[0];
        setUserFirstName(firstName);
        setUserFullName(user.displayName); // Store the full name
      } else {
        setUserFirstName('');
        setUserFullName(''); // Clear full name if no user
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch conversation history
  useEffect(() => {
    if (isOpen && businessNumber && clientNumber) {
      const fetchConversation = async () => {
        try {
          const response = await fetch(
            `https://us-central1-detail-on-the-go-universal.cloudfunctions.net/get-sms-convo?to=${encodeURIComponent(
              businessNumber
            )}&from=${encodeURIComponent(clientNumber)}`
          );

          if (response.ok) {
            const data = await response.json();
            const processedMessages = (data.messages || [])
              .map((msg) => {
                const seconds = msg.timestamp?._seconds || 0;
                const nanoseconds = msg.timestamp?._nanoseconds || 0;
                const date = new Date(seconds * 1000 + nanoseconds / 1e6);
                return {
                  ...msg,
                  timestamp: date.toLocaleString(),
                  rawTimestamp: date.getTime(),
                };
              })
              .sort((a, b) => a.rawTimestamp - b.rawTimestamp);

            setClientInfo({ name: data.name, phone: clientNumber });
            setMessages(processedMessages);
          } else {
            console.error('Failed to fetch conversation');
          }
        } catch (error) {
          console.error('Error fetching conversation:', error);
        }
      };

      fetchConversation();
    }
  }, [isOpen, businessNumber, clientNumber]);

  // Scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Function to fetch availability from the Cloud Function
  const fetchAvailability = async () => {
    try {
      const response = await fetch(
        `https://us-central1-detail-on-the-go-universal.cloudfunctions.net/phone-availability?to=${encodeURIComponent(
          businessNumber
        )}&from=${encodeURIComponent(clientNumber)}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }
      const availableSlots = await response.json();
      return availableSlots;
    } catch (error) {
      console.error('Error fetching availability:', error);
      return [];
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsLoading(true);

    const signature = userFirstName ? `-${userFirstName}, Detail On The Go` : '-Detail On The Go';
    const messageWithSignature = `${newMessage.trim()} ${signature}`;

    try {
      const smsResponse = await fetch(
        `https://us-central1-detail-on-the-go-universal.cloudfunctions.net/sms?to=${encodeURIComponent(
          clientNumber
        )}&from=${encodeURIComponent(businessNumber)}&message=${encodeURIComponent(
          messageWithSignature
        )}&delay=${delay}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!smsResponse.ok) {
        console.error('Failed to send message');
        return;
      }

      const now = new Date();
      setMessages((prev) =>
        [
          ...prev,
          {
            message: messageWithSignature,
            direction: 'outgoing',
            timestamp: now.toLocaleString(),
            rawTimestamp: now.getTime(),
          },
        ].sort((a, b) => a.rawTimestamp - b.rawTimestamp)
      );
      setNewMessage('');

      const clientData = {
        timestamp: now.toLocaleString(),
        branch: 'branch',
        businessNumber: businessNumber,
        name: clientInfo.name,
        phone: clientInfo.phone,
        message: messageWithSignature,
      };

      if (
        newMessage.includes("I've just arrived") ||
        newMessage.includes("I'm headed your") ||
        newMessage.includes("wrapping") ||
        newMessage.includes("finished")
      ) {
        const sheetsResponse = await fetch(
          'https://us-central1-detail-on-the-go-universal.cloudfunctions.net/detail-sms-timing',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(clientData),
          }
        );

        if (!sheetsResponse.ok) {
          console.error('Failed to send client data to backend');
        } else {
          console.log('Client data successfully sent to backend');
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initiateCall = () => {
    fetch(
      `https://us-central1-detail-on-the-go-universal.cloudfunctions.net/LWR-create-call?businessnumber=${encodeURIComponent(
        businessNumber
      )}&forwardnumber=${encodeURIComponent(
        clientInfo.phone
      )}&clientnumber=${encodeURIComponent(clientNumber)}`,
      { method: 'POST' }
    )
      .then((res) => res.json())
      .then(() => alert('Call initiated successfully!'))
      .catch((error) => {
        console.error('Error initiating call:', error);
        alert('Failed to initiate call.');
      });
  };

  const applyShortcut = async (shortcut) => {
    const messagesMap = {
      onMyWay: "I'm headed your way now.",
      arrived: "I've just arrived, and will start shortly.",
      delay:
        "My current detail is taking a bit longer than expected, so I may be running late to our appointment today. I apologize for the delay and will update you as soon as I'm on my way.",
      early:
        "I've just finished my current detail earlier than expected, and can head your way now if that works with your schedule. Let me know if not - thanks!",
      finished1: "I'm close to wrapping up your detail now! If it's convenient, would you like to come look?",
      finished2: "I’ve just finished your detail. Thank you very much for having me out today, I’ll see you next time!",
      LWRReview:
        "I really appreciate you using my services. It would mean a lot if you left a review here: https://g.page/r/CS98X9jMS0IREBM/review",
    };

    if (shortcut === 'getAvailability') {
      setIsLoading(true); // Show loading state while fetching
      const availableSlots = await fetchAvailability();
      setIsLoading(false);

      if (availableSlots.length > 0) {
        const availabilityText = `My next availability is:\n${availableSlots
          .slice(0, 5) // Limit to 5 slots
          .join('\n')}`;
        setNewMessage(availabilityText);
      } else {
        setNewMessage('I don’t have any availability in the next 60 days.');
      }
    } else {
      setNewMessage(messagesMap[shortcut] || '');
    }
  };

  if (!isOpen || !clientInfo) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-md md:max-h-[90%] h-full md:h-auto relative flex flex-col overflow-hidden"
        style={{ maxHeight: '90vh' }}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">{clientInfo.name || 'Client'}</h2>
            <p className="text-sm text-gray-600">{clientInfo.phone}</p>
          </div>
          <button
            onClick={initiateCall}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Call
          </button>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900 ml-4">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {messages.length > 0 ? (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-4 p-3 rounded-lg shadow-sm ${msg.direction === 'outgoing' ? 'bg-blue-600 text-white ml-auto' : 'bg-white text-gray-900 border'}`}
              >
                <p className="text-sm">{msg.message}</p>
                <span className="text-xs text-gray-400">{msg.timestamp}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center">No messages yet.</p>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="sticky bottom-0 bg-white border-t p-4 space-y-2">
          <select
            onChange={(e) => applyShortcut(e.target.value)}
            className="w-full p-2 border rounded-md text-gray-700"
          >
            <option value="">Shortcut Messages</option>
            <option value="getAvailability">Get Availability</option>
            <option value="onMyWay">On My Way</option>
            <option value="arrived">Arrived</option>
            <option value="delay">Delay</option>
            <option value="early">Early Finish</option>
            <option value="finished1">Close to Wrapping Up</option>
            <option value="finished2">Finished Detail</option>
            <option value="LWRReview">Leave a Review</option>
          </select>
          <div className="flex flex-wrap gap-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 p-2 border rounded-md resize-none min-h-[2.5rem] max-h-[6rem] overflow-y-auto"
              onInput={(e) => {
                e.target.style.height = '0px';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
            <select
              onChange={(e) => setDelay(Number(e.target.value))}
              value={delay}
              className="p-2 pr-8 border rounded-md min-w-[120px]"
            >
              <option value={0}>Send Now</option>
              <option value={1}>1 Minute</option>
              <option value={5}>5 Minutes</option>
              <option value={10}>10 Minutes</option>
            </select>
            <button
              onClick={handleSendMessage}
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}