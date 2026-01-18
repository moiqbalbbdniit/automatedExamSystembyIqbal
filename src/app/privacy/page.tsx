'use client';

import { motion } from 'framer-motion';

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black text-blue-100 font-sans px-6 py-20">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
        className="max-w-4xl mx-auto space-y-12"
      >
        <h1 className="text-5xl font-bold text-blue-400 text-center mb-12 sm:text-[2rem]">
          Privacy Policy
        </h1>

        <section className="space-y-4">
          <p className="text-blue-200 text-lg">
            We respect your privacy and are committed to protecting your personal data. The information
            you provide will be used solely for facilitating academic assessments and communication
            related to your institution.
          </p>
          <ul className="list-disc list-inside text-blue-200 space-y-2 ml-4">
            <li>We collect basic account information: name, email, and institution.</li>
            <li>All sensitive data, including exam responses, is encrypted and securely stored.</li>
            <li>We do not share your data with third parties without your explicit consent.</li>
            <li>You have the right to request access, correction, or deletion of your personal data.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-3xl font-semibold text-blue-500 border-b border-blue-600 pb-2">
            User Rights
          </h2>
          <p className="text-blue-200 text-lg">
            Users may review, update, or delete their personal information at any time by contacting
            the support team. All requests are handled in accordance with applicable data protection laws.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-3xl font-semibold text-blue-500 border-b border-blue-600 pb-2">
            Updates
          </h2>
          <p className="text-blue-200 text-lg">
            This privacy policy may be updated periodically. Users are encouraged to review it regularly
            for any changes.
          </p>
        </section>
      </motion.div>
    </main>
  );
}