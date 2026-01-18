'use client'; 

import React from 'react';
import SimpleContactForm from '@/components/ui/simple-contactform';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <SimpleContactForm />
        
      </div>
    </div>
  );
}
