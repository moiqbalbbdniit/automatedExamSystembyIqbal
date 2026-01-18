
'use client';

import React, { useState, FormEvent } from 'react';

interface FormData {
    name: string;
    email: string;
    university: string;
    message: string;
}

const SimpleContactForm: React.FC = () => {
    const [formData, setFormData] = useState<FormData>({ 
        name: '', 
        email: '', 
        university: '', 
        message: '' 
    });
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [responseMessage, setResponseMessage] = useState<string>('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!formData.name || !formData.email || !formData.university || !formData.message) {
            setResponseMessage('Please fill out all required fields.');
            setStatus('error');
            return;
        }

        setStatus('sending');
        setResponseMessage('Sending request...');

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setResponseMessage(data.message || 'Request sent successfully!');
                setFormData({ name: '', email: '', university: '', message: '' }); 
            } else {
                setStatus('error');
                setResponseMessage(data.message || 'Failed to send request. Server error.');
            }
        } catch (error) {
            setStatus('error');
            setResponseMessage('A network error occurred. Please check your connection.');
        }
    };
    
    const isButtonDisabled = status === 'sending';
    const buttonText = status === 'sending' ? 'Sending...' : 'Schedule Your Free Consultation';
    
    // Status box classes (blue & black)
    const statusClasses = 
        status === 'success' ? 'bg-blue-100 text-blue-800 border-blue-300' :
        status === 'error' ? 'bg-red-100 text-red-800 border-red-300' : // optional red for errors
        'hidden'; 

    return (

        <div className="max-w-2xl mx-auto p-6 bg-gray-800 shadow-lg rounded-xl border border-blue-800">
            
            {/* Header Content */}
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-blue-400">
                    Ready to Revolutionize Your Assessment?
                </h2>
                <p className="mt-2 text-md text-blue-200">
                    Contact our team to integrate AI-powered exam management into your university.
                </p>
                <p className="mt-4 text-lg font-semibold text-blue-500">
                    Schedule Your Free Consultation
                </p>
            </div>

            {/* Status Message */}
            {status !== 'idle' && (
                <div className={`p-3 mb-4 rounded-lg font-medium border text-center ${statusClasses}`}>
                    {responseMessage}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Name */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-blue-300 mb-1">Name</label>
                    <input
                        type="text"
                        placeholder='Enter Your Name'
                        name="name"
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={isButtonDisabled}
                        className="w-full p-2 border border-blue-600 rounded-md bg-gray-700 text-blue-100 placeholder-blue-400 focus:border-blue-400 focus:ring-blue-400"
                    />
                </div>

                {/* Email */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-blue-300 mb-1">Email</label>
                    <input
                        type="email"
                        name="email"
                        placeholder='Enter your Email'
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={isButtonDisabled}
                        className="w-full p-2 border border-blue-600 rounded-md bg-gray-700 text-blue-100 placeholder-blue-400 focus:border-blue-400 focus:ring-blue-400"
                    />
                </div>

                {/* University */}
                <div>
                    <label htmlFor="university" className="block text-sm font-medium text-blue-300 mb-1">University / Institution</label>
                    <input
                        type="text"
                        name="university"
                        id="university"
                        placeholder='xyz university'
                        value={formData.university}
                        onChange={handleChange}
                        required
                        disabled={isButtonDisabled}
                        className="w-full p-2 border border-blue-600 rounded-md bg-gray-700 text-blue-100 placeholder-blue-400 focus:border-blue-400 focus:ring-blue-400"
                    />
                </div>

                {/* Message */}
                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-blue-300 mb-1">Message</label>
                    <textarea
                        name="message"
                        id="message"
                        placeholder='Enter Message...'
                        rows={4}
                        value={formData.message}
                        onChange={handleChange}
                        required
                        disabled={isButtonDisabled}
                        className="w-full p-2 border border-blue-600 rounded-md bg-gray-700 text-blue-100 placeholder-blue-400 focus:border-blue-400 focus:ring-blue-400 resize-none"
                    />
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isButtonDisabled}
                    className="w-full py-2 rounded-md font-semibold text-white transition duration-150 
                               bg-blue-800 hover:bg-blue-900 disabled:bg-blue-800 cursor-pointer"
                >
                    {buttonText}
                </button>
            </form>
        </div>
      
    );
};

export default SimpleContactForm;
