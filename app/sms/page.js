'use client';

import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { Menu, X } from 'lucide-react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import MessengerPopup from './sms-pop'; // <-- new popup component

// Firebase config (no more "whatwg-fetch" import)
export const firebaseConfig = {
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

export default function MessengerPage() {
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationDetails, setLocationDetails] = useState(null);

  // State for the selected contact & popup
  const [selectedContact, setSelectedContact] = useState(null);
  const [showConversation, setShowConversation] = useState(false);

  // Filter state: 'all' or 'unread'
  const [filterMode, setFilterMode] = useState('all');

  const auth = getAuth();

  // Track user login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('User logged in:', user.email);
      } else {
        console.log('No user logged in.');
      }
    });
    return unsubscribe;
  }, []);

  // Load location details from sessionStorage
  useEffect(() => {
    const storedLocationDetails = sessionStorage.getItem('locationDetails');
    if (storedLocationDetails) {
      const parsed = JSON.parse(storedLocationDetails);
      setLocationDetails(parsed);
    }
  }, []);

  // Fetch contacts from Firestore
  useEffect(() => {
    const fetchContacts = async () => {
      if (!locationDetails?.collectionId) return;

      try {
        const smsCollection = locationDetails.collectionId; // e.g. "sms-lwr"
        const snapshot = await getDocs(collection(db, smsCollection));

        const contactsArr = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const allMsgs = data.messages || [];

          // Sort messages by newest first
          allMsgs.sort((a, b) => {
            const aTime = (a.timestamp?.seconds || 0) * 1000;
            const bTime = (b.timestamp?.seconds || 0) * 1000;
            return bTime - aTime;
          });

          const lastMessage = allMsgs[0] || {};
          const lastMsgTimestamp  = lastMessage.timestamp
            ? new Date(lastMessage.timestamp.seconds * 1000).toLocaleString()
            : null;

          // "Unread" if the last message is from the client (direction = 'incoming')
          const isUnread = lastMessage.direction === 'incoming';

          contactsArr.push({
            id: docSnap.id,
            name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
            phone: docSnap.id,
            lastMessage: lastMessage.message || 'No messages yet',
            lastMsgTimestamp,
            lastMsgRawMillis: lastMessage.timestamp
              ? lastMessage.timestamp.seconds * 1000
              : 0,
            isUnread,
          });
        });

        // Default sort: newest-first
        contactsArr.sort((a, b) => b.lastMsgRawMillis - a.lastMsgRawMillis);

        setContacts(contactsArr);
      } catch (error) {
        console.error('Error fetching contacts:', error);
      }
    };

    fetchContacts();
  }, [locationDetails]);

  // Combine search + unread filter
  const filteredContacts = contacts
    // Filter by search
    .filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
    )
    // Filter by unread if needed
    .filter((c) => {
      if (filterMode === 'unread') {
        return c.isUnread;
      }
      return true;
    });

  // Select a contact & show popup
  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    setShowConversation(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* If we have location details, show them at the top */}
      {locationDetails && (
        <div className="mb-4 text-gray-700">
          <h2 className="font-bold text-lg">{locationDetails.employeeName}</h2>
          <p className="text-sm">{locationDetails.location}</p>
        </div>
      )}

      {/* Row of filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Search bar */}
        <input
          placeholder="Search contacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-3 flex-1 border rounded-lg shadow-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />

        {/* Filter by read/unread */}
        <select
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value)}
          className="p-2 border rounded-md"
        >
          <option value="all">All Contacts</option>
          <option value="unread">Unread Only</option>
        </select>
      </div>

      {/* Contact list (full width) */}
      <div className="space-y-2 overflow-y-auto">
        {filteredContacts.map((contact) => {
          // If unread, we add an absolutely positioned overlay
          // with animate-pulse so only the background pulses (not text).
          const highlightOverlay = contact.isUnread ? (
            <div className="absolute inset-0 bg-red-200 animate-pulse pointer-events-none" />
          ) : null;

          // If selected
          const selectedClass = selectedContact?.id === contact.id
            ? 'border-l-4 border-blue-600 bg-blue-50'
            : 'hover:bg-gray-100';

          return (
            <div
              key={contact.id}
              className={`relative p-4 rounded-lg cursor-pointer transition-colors ${selectedClass}`}
              onClick={() => handleSelectContact(contact)}
            >
              {highlightOverlay}

              {/* Content is above any overlay */}
              <div className="relative z-10">
                <h3 className="font-medium text-gray-900">
                  {contact.name || contact.phone}
                </h3>
                <p className="text-sm text-gray-600">{contact.phone}</p>
                <p className="text-sm text-gray-700 mt-1 font-medium">
                  {contact.lastMessage}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Popup for the selected conversation */}
      {showConversation && selectedContact && (
        <MessengerPopup
          isOpen={showConversation}
          onClose={() => {
            setShowConversation(false);
            setSelectedContact(null);
          }}
          businessNumber={locationDetails?.businessNumber || ''}
          clientNumber={selectedContact.phone}
        />
      )}
    </div>
  );
}
