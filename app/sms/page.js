'use client';

import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, onSnapshot, setDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { Menu, X, Phone } from 'lucide-react';

const firebaseConfig = {
  apiKey: "AIzaSyBMVa4EhYrz2NyYBdaVMJTS-JjfUIQDagQ",
  authDomain: "detail-on-the-go-universal.firebaseapp.com",
  projectId: "detail-on-the-go-universal",
  storageBucket: "detail-on-the-go-universal.firebasestorage.app",
  messagingSenderId: "896343340170",
  appId: "1:896343340170:web:473d7fd278d40649de2973",
  measurementId: "G-W2D7QKW2YS"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const MessengerPage = () => {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const conversationViewRef = useRef(null);

  // Fetch contacts from Firestore
  useEffect(() => {
    const fetchContacts = async () => {
      const smsCollection = "sms-lwr";
      const contactsRef = collection(db, smsCollection);

      try {
        const contactsSnapshot = await getDocs(contactsRef);
        const contactsArray = [];

        contactsSnapshot.forEach((doc) => {
          const data = doc.data();
          const lastMessage = data.messages?.slice().sort((a, b) => {
            const aTimestamp = (a.timestamp?.seconds || 0) * 1e9 + (a.timestamp?.nanoseconds || 0);
            const bTimestamp = (b.timestamp?.seconds || 0) * 1e9 + (b.timestamp?.nanoseconds || 0);
            return bTimestamp - aTimestamp;
          })[0] || {};

          const lastMessageTimestamp = lastMessage.timestamp
            ? new Date(lastMessage.timestamp.seconds * 1000).toLocaleString()
            : null;

          contactsArray.push({
            id: doc.id,
            name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
            phone: doc.id,
            lastMessage: lastMessage.message || 'No messages yet',
            lastMessageTimestamp,
          });
        });

        contactsArray.sort((a, b) =>
          new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp)
        );

        setContacts(contactsArray);
      } catch (error) {
        console.error("Error fetching contacts: ", error);
      }
    };

    fetchContacts();
  }, []);

  const fetchMessages = (contactId) => {
    const contactDocRef = doc(db, "sms-lwr", contactId);
  
    const unsubscribe = onSnapshot(contactDocRef, (doc) => {
      if (doc.exists()) {
        const contactData = doc.data();
        const newMessages = contactData.messages || [];
        setMessages(newMessages);
  
        // Update the contact's last message details in the contact list
        const lastMessage = newMessages
          .slice()
          .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)[0];
  
        const updatedContacts = contacts.map(contact =>
          contact.id === contactId
            ? {
                ...contact,
                lastMessage: lastMessage?.message || 'No messages yet',
                lastMessageTimestamp: lastMessage?.timestamp
                  ? new Date(lastMessage.timestamp.seconds * 1000).toLocaleString()
                  : null,
              }
            : contact
        );
  
        // Sort contacts by latest message timestamp
        updatedContacts.sort((a, b) => new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp));
        setContacts(updatedContacts);
      } else {
        console.warn("No conversation found for contact");
        setMessages([]);
      }
    });
  
    return unsubscribe;
  };
  
  

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    const unsubscribe = fetchMessages(contact.id);
    if (window.innerWidth <= 768) {  // Close sidebar only on mobile devices
      setIsSidebarOpen(false);
    }
    if (conversationViewRef.current) {
      conversationViewRef.current.scrollTop = 0;
    }
    return () => unsubscribe();
  };
  

  

  const applyShortcut = async (type) => {
    switch (type) {
      case 'getAvailability':
        try {
          const response = await fetch(
            'https://us-central1-dotg-d6313.cloudfunctions.net/lawrence-phone-availability'
          );
          if (response.ok) {
            const data = await response.json();
            setMessage(`My next availability is: ${data}`);
          } else {
            setMessage('Failed to fetch availability.');
          }
        } catch (error) {
          setMessage('Error fetching availability.');
        }
        break;
      case 'onMyWay':
        setMessage(`I'm headed your way now.`);
        break;
      case 'arrived':
        setMessage(`I've just arrived, and will start shortly.`);
        break;
      case 'delay':
        setMessage(
          `My current detail is taking a bit longer than expected, so I may be running late to our appointment today. I apologize for the delay and will update you as soon as I'm on my way.
        `);
        break;
      case 'early':
        setMessage(
          `I've just finished my current detail earlier than expected, and can head your way now if that works with your schedule. Let me know if not - thanks!
       ` );
        break;
      case 'finished1':
        setMessage(
          `I'm close to wrapping up your detail now! If it's convenient, would you like to come look?
        `);
        break;
      case 'finished2':
        setMessage(
          `I’ve just finished your detail. Thank you very much for having me out today, I’ll see you next time!
        `);
        break;
      case 'LWRReview':
        setMessage(
          `I really appreciate you using my services, as there are lots of options. It would mean a lot if you left a review, it goes a long way for a small business! Here’s a temporary link if you enjoyed your detail: https://g.page/r/CcNAaNthnDf3EBM/review
       ` );
        break;
      case 'KCReview':
        setMessage(
          `I really appreciate you using my services, as there are lots of options. It would mean a lot if you left a review, it goes a long way for a small business! Here’s a temporary link if you enjoyed your detail: https://g.page/r/CS98X9jMS0IREBM/review
        `);
        break;
      case 'STLReview':
        setMessage(
          `I really appreciate you using my services, as there are lots of options. It would mean a lot if you left a review, it goes a long way for a small business! Here’s a temporary link if you enjoyed your detail: https://g.page/r/CaNuJ0ypIXA7EBM/review
        `);
        break;
      default:
        break;
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    const phoneNumber = selectedContact.id;
    const employeeName = "Levi"; // Or get this from a prop/context
    const businessNumber = "+17856156156"; // Replace with your actual business number
    const formattedMessage = `${message.trim()} - ${employeeName}, Detail On The Go`;

    try {
      // Create the message object
      const newMessage = {
        direction: 'outgoing',
        message: formattedMessage,
        timestamp: Timestamp.now()
      };

      // Update the SMS document
      const smsRef = doc(db, "sms-lwr", phoneNumber);
      await setDoc(smsRef, {
        messages: arrayUnion(newMessage)
      }, { merge: true });

      // Create a record in the messages collection
      const now = new Date();
      const dateString = now.toISOString();
      const messageDocId = `${phoneNumber},${dateString}`;
      const messagesRef = doc(db, 'messages', messageDocId);
      await setDoc(messagesRef, {
        to: phoneNumber,
        body: formattedMessage,
        from: businessNumber,
        timestamp: Timestamp.now()
      });

      // // Update local state
      // setMessages(prevMessages => [...prevMessages, {
      //   ...newMessage,
      //   id: Date.now()
      // }]);

      // Update the selected contact's last message and timestamp
      const updatedContacts = contacts.map(contact =>
        contact.id === selectedContact.id
          ? {
              ...contact,
              lastMessage: formattedMessage,
              lastMessageTimestamp: new Date().toLocaleString(),
            }
          : contact
      );

      // Sort contacts by most recent timestamp
      updatedContacts.sort((a, b) => 
        new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp)
      );
      setContacts(updatedContacts);

      setMessage('');
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 0);

    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  

  const initiateCall = () => {
    if (selectedContact) {
      const clientNumber = selectedContact.phone;
      const businessNumber = '+17856156156'; 
      const employeeNumber = '+19137771848'; 

      fetch(`https://us-central1-dotg-d6313.cloudfunctions.net/LWR-create-call?businessnumber=${businessNumber}&forwardnumber=${employeeNumber}&clientnumber=${clientNumber}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ clientNumber: clientNumber })
      })
        .then(response => response.json())
        .then(data => {
          alert('Call initiated successfully!');
        })
        .catch((error) => {
          console.error('Error initiating call:', error);
          alert('Error initiating call. Please try again.');
        });
    } else {
      alert('Please select a contact to initiate a call.');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery)
  );

  return (
    <div className="flex h-screen bg-gray-50 relative">
      {/* Mobile Header - Always visible on mobile */}
      <div className="lg:hidden fixed top-[70px] left-0 right-0 bg-white z-50 border-t flex justify-between items-center p-4 shadow-sm">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-700"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        {selectedContact && !isSidebarOpen && (
          <div className="flex items-center gap-4">
            <div>
              <h2 className="font-semibold text-gray-900">{selectedContact.name}</h2>
              <p className="text-sm text-gray-600">{selectedContact.phone}</p>
            </div>
            <button
              onClick={initiateCall}
              className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 shadow-sm"
            >
              <Phone size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Contacts Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40 w-full lg:w-1/3 bg-white transform transition-transform duration-300 ease-in-out shadow-lg lg:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${selectedContact ? 'lg:border-r' : ''}
        ${isSidebarOpen ? 'h-screen' : 'h-0 lg:h-screen'}
      `}>
        <div className="p-4 mt-16 lg:mt-0">
          <input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-4 p-3 w-full border rounded-lg shadow-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-8rem)]">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className={`cursor-pointer p-4 hover:bg-gray-50 rounded-lg transition-colors
                  ${selectedContact?.id === contact.id ? 'border-l-4 border-blue-600 bg-blue-50' : ''}
                `}
                onClick={() => handleSelectContact(contact)}
              >
                <h3 className="font-medium text-gray-900">{contact.name || contact.phone}</h3>
                <p className="text-sm text-gray-600">{contact.phone}</p>
                <p className="text-sm text-gray-700 mt-1 font-medium">{contact.lastMessage}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      

      {/* Chat Area */}
      <div className={`
        flex-1 flex flex-col 
        ${!isSidebarOpen ? 'visible' : 'hidden lg:flex'}
        h-screen pt-16 lg:pt-0
      `}>
        {/* Desktop Header */}
        <div className="hidden lg:flex bg-white border-b p-4 justify-between items-center shadow-sm">
          {selectedContact && (
            <>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedContact.name}</h2>
                <p className="text-gray-600">{selectedContact.phone}</p>
              </div>
              <button
                onClick={initiateCall}
                className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 shadow-sm transition-colors"
              >
                <Phone size={20} />
              </button>
            </>
          )}
        </div>

        {selectedContact ? (
          <>
            <div ref={conversationViewRef} className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {messages.length > 0 ? (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`max-w-[85%] mb-4 p-3 rounded-lg shadow-sm ${
                      msg.direction === 'outgoing'
                        ? 'ml-auto bg-blue-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <p className="break-words leading-relaxed">{msg.message}</p>
                    {msg.timestamp?.seconds && (
                      <span className={`text-xs block mt-1 ${
                        msg.direction === 'outgoing' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(msg.timestamp.seconds * 1000).toLocaleString()}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-600 text-center font-medium">No messages yet</p>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 sm:p-4 bg-white border-t shadow-sm">
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  onChange={(e) => applyShortcut(e.target.value)}
                  className="p-3 border rounded-lg text-gray-900 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Shortcut Messages</option>
                  <option value="getAvailability">Get Availability</option>
                  <option value="onMyWay">On My Way</option>
                  <option value="arrived">Arrived</option>
                  <option value="delay">Delay</option>
                  <option value="early">Early Finish</option>
                  <option value="finished1">Close to Wrapping Up</option>
                  <option value="finished2">Finished Detail</option>
                  <option value="LWRReview">LWR Review</option>
                  <option value="KCReview">KC Review</option>
                  <option value="STLReview">STL Review</option>
                </select>
                <div className="flex gap-2 flex-1">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 p-3 border rounded-lg shadow-sm text-gray-900 placeholder-gray-500 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={1}
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors font-medium whitespace-nowrap"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-600 font-medium">
            <p className="text-center">Select a contact to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessengerPage;