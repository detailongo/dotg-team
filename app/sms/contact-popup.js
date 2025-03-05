'use client';
import { useState } from 'react';

export default function ContactPopup({ isOpen, onClose, businessNumber }) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const signature = firstName ? `-${firstName}, Detail On The Go` : '-Detail On The Go';
        const fullMessage = `${message.trim()} ${signature}`;
        try {
            const smsResponse = await fetch(
                `https://edit-create-contact-896343340170.us-central1.run.app?to=${encodeURIComponent(
                    phone
                )}&from=${encodeURIComponent(businessNumber)}&firstName=${encodeURIComponent(firstName)}&lastName=${encodeURIComponent(lastName)}&message=${encodeURIComponent(fullMessage)}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            if (smsResponse.ok) {
                // Optionally, clear fields or update state after submission.
                setFirstName('');
                setLastName('');
                setPhone('');
                setMessage('');
                onClose();
            } else {
                console.error('Failed to send SMS');
            }
        } catch (error) {
            console.error('Error sending SMS:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                <h2 className="text-xl font-semibold mb-4">Add / Edit Contact</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">First Name</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full p-2 border rounded-md"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Last Name</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full p-2 border rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Phone Number</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full p-2 border rounded-md"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Message</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full p-2 border rounded-md resize-none"
                            rows={3}
                            required
                        />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md"
                        >
                            {isSubmitting ? 'Sending...' : 'Send'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
