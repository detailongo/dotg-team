'use client';

import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, onSnapshot } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import MessengerPopup from './sms-pop';
import ContactPopup from './contact-popup'; // new popup for adding/editing contacts

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
  const [isLoading, setIsLoading] = useState(true); // New state
  const [selectedContact, setSelectedContact] = useState(null);
  const [showConversation, setShowConversation] = useState(false);
  const [filterMode, setFilterMode] = useState('all');
  const auth = getAuth();
  const [userName, setUserName] = useState(''); // Ensure this is present
  const [showContactPopup, setShowContactPopup] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setUserName('');
        return;
      }
      setUserName(user.displayName || '');
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const storedLocationDetails = sessionStorage.getItem('locationDetails');
    if (storedLocationDetails) {
      setLocationDetails(JSON.parse(storedLocationDetails));
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!locationDetails?.collectionId) return;

    const smsCollection = collection(db, locationDetails.collectionId);
    const unsubscribe = onSnapshot(smsCollection, (snapshot) => {
      const contactsArr = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const allMsgs = data.messages || [];

        allMsgs.sort((a, b) => {
          const aTime = (a.timestamp?.seconds || 0) * 1000;
          const bTime = (b.timestamp?.seconds || 0) * 1000;
          return bTime - aTime;
        });

        const lastMessage = allMsgs[0] || {};
        const lastMsgTimestamp = lastMessage.timestamp
          ? new Date(lastMessage.timestamp.seconds * 1000).toLocaleString()
          : null;

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

      contactsArr.sort((a, b) => b.lastMsgRawMillis - a.lastMsgRawMillis);
      setContacts(contactsArr);
    });

    return () => unsubscribe();
  }, [locationDetails]);

  const handleMarkAsRead = (contact) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === contact.id ? { ...c, isUnread: false } : c))
    );

    fetch(
      `https://us-central1-detail-on-the-go-universal.cloudfunctions.net/read-text?to=${encodeURIComponent(
        contact.phone
      )}&from=${encodeURIComponent(locationDetails?.businessNumber || '')}&message=${encodeURIComponent(
        'Read'
      )}&delay=0`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }
    ).catch((err) => {
      console.error('Error marking as read:', err);
    });
  };

  const filteredContacts = contacts
    .filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
    )
    .filter((c) => (filterMode === 'unread' ? c.isUnread : true));

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    setShowConversation(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {isLoading ? (
        <div className="flex justify-center items-center h-screen">
          <p>Loading...</p>
        </div>
      ) : !locationDetails ? (
        <div className="flex justify-center items-center h-screen">
          <p>Please sign in with an authorized email to access this page.</p>
        </div>
      ) : (
        <>
          {locationDetails && (
            <div className="mb-4 text-gray-700">
              <h2 className="font-bold text-lg">{userName}</h2>
              <p className="text-sm">{locationDetails.location}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-3 flex-1 border rounded-lg shadow-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="p-2 border rounded-md"
            >
              <option value="all">All Contacts</option>
              <option value="unread">Unread Only</option>
            </select>
            {/* Add Contact button */}
            <button
              onClick={() => setShowContactPopup(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md"
            >
              Add Contact
            </button>
          </div>

          <div className="space-y-2 overflow-y-auto">
            {filteredContacts.map((contact) => {
              // ...existing contact card code
              const selectedClass =
                selectedContact?.id === contact.id
                  ? 'border-l-4 border-blue-600 bg-blue-50'
                  : 'hover:bg-gray-100';

              return (
                <div
                  key={contact.id}
                  className={`relative p-4 rounded-lg cursor-pointer transition-colors ${selectedClass}`}
                  onClick={() => handleSelectContact(contact)}
                >
                  {contact.isUnread && (
                    <div className="absolute inset-0 bg-red-200 animate-pulse pointer-events-none" />
                  )}
                  <div className="relative z-10">
                    <h3 className="font-medium text-gray-900">
                      {contact.name || contact.phone}
                    </h3>
                    <p className="text-sm text-gray-600">{contact.phone}</p>
                    <p className="text-sm text-gray-700 mt-1 font-medium">
                      {contact.lastMessage}
                    </p>
                    {contact.isUnread && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(contact);
                        }}
                        className="mt-2 px-3 py-1 bg-blue-600 text-white rounded-md"
                      >
                        Read
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

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

          {/* Render the Add/Edit Contact popup */}
          {showContactPopup && (
            <ContactPopup
              isOpen={showContactPopup}
              onClose={() => setShowContactPopup(false)}
              businessNumber={locationDetails?.businessNumber || ''}
            />
          )}
        </>
      )}
    </div>
  );
}
