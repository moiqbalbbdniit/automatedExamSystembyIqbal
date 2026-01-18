// components/AdminNotificationForm.tsx

'use client'; // Required for client-side components in Next.js App Router

import React, { useState, FormEvent } from 'react';

// Define the shape of the form data
interface FormData {
  message: string;
  // targetUser can be added if you implement selective targeting later
}

const AdminNotificationForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({ message: '' });
  const [status, setStatus] = useState<'idle' | 'posting' | 'success' | 'error'>('idle');
  const [responseMessage, setResponseMessage] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, message: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) return;

    setStatus('posting');
    setResponseMessage('');

    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setResponseMessage(data.message || 'Notification posted successfully! 🎉');
        setFormData({ message: '' }); // Clear the form
      } else {
        setStatus('error');
        // Display backend error message if available
        setResponseMessage(data.message || 'Failed to post notification.');
      }
    } catch (error) {
      console.error('Network Error:', error);
      setStatus('error');
      setResponseMessage('A network error occurred. Please try again.');
    }
  };
  
  // Dynamic styling based on status
  const buttonText = status === 'posting' ? 'Posting...' : 'Post Notification';
  const isButtonDisabled = status === 'posting' || !formData.message.trim();
  const statusClasses = 
    status === 'success' ? 'text-green-600 border-green-200' :
    status === 'error' ? 'text-red-600 border-red-200' :
    'hidden'; // Hide status message initially or when idle

  return (
    <div className="p-6 max-w-xl mx-auto bg-slate-800 shadow-xl rounded-lg border border-gray-800">
      <h2 className="text-2xl font-semibold text-blue-500 mb-4">
        Post System Notification
      </h2>
      <p className="text-sm text-white mb-6">
        This notification will be visible to all users (targetUser: &lsquo;all&lsquo;).
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="message" className="block text-sm font-medium text-blue-600 mb-2">
            Notification Message
          </label>
          <textarea
            id="message"
            rows={5}
            value={formData.message}
            onChange={handleChange}
            className="w-full p-3 border border-gray-900 placeholder:text-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150"
            placeholder="Enter the message you want to broadcast to users..."
            required
            disabled={status === 'posting'}
          />
        </div>

        <button
          type="submit"
          disabled={isButtonDisabled}
          className={`w-full py-3 px-4 rounded-lg font-bold text-white transition duration-200 
            ${isButtonDisabled 
              ? 'bg-blue-600 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 shadow-md'
            }`}
        >
          {buttonText}
        </button>
      </form>

      {/* Status Message Display */}
      {(status === 'success' || status === 'error') && (
        <div className={`mt-5 p-3 rounded-md border text-center font-medium ${statusClasses}`}>
          {responseMessage}
        </div>
      )}
    </div>
  );
};

export default AdminNotificationForm;
