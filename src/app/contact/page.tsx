'use client'; 

import React from 'react';
import SimpleContactForm from '@/components/ui/simple-contactform';

export default function ContactPage() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl panel p-4 sm:p-6 lg:p-8">
        <SimpleContactForm />
      </div>
    </div>
  );
}
