'use client';

import { useState } from 'react';
import EmailPopup from '../email/email-popup';
import MessengerPopup from '../sms/sms-pop';

export default function Page() {
  const [isEmailPopupOpen, setIsEmailPopupOpen] = useState(false);
  const [isSMSPopupOpen, setIsSMSPopupOpen] = useState(false);

  // Example values for SMS popup
  const businessNumber = '+17856156156';
  const clientNumber = '+19137771848';

  const toggleEmailPopup = () => {
    setIsEmailPopupOpen(!isEmailPopupOpen);
  };

  const toggleSMSPopup = () => {
    setIsSMSPopupOpen(!isSMSPopupOpen);
  };

  return (
    <div>
      <h1>Popup Test Page</h1>

      {/* Email Popup Button */}
      <button
        onClick={toggleEmailPopup}
        className="bg-blue-600 text-white px-4 py-2 rounded mr-4"
      >
        Open Email Popup
      </button>

      {/* SMS Popup Button */}
      <button
        onClick={toggleSMSPopup}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Open SMS Popup
      </button>

      {/* Email Popup */}
      <EmailPopup isOpen={isEmailPopupOpen} onClose={toggleEmailPopup} />

      {/* SMS Popup */}
      <MessengerPopup
        isOpen={isSMSPopupOpen}
        onClose={toggleSMSPopup}
        businessNumber={businessNumber}
        clientNumber={clientNumber}
      />
    </div>
  );
}
