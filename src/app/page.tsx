"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  FileText,
  Users,
  Brain,
  BookOpen,
  PieChart,
  CheckCircle,
  Shield, // New icon for security
  Zap, // New icon for speed/automation
} from "lucide-react";
import Link from "next/link"; 
import { motion, Variants } from "framer-motion";
import { useState, useEffect } from "react"; // Added useState and useEffect for slideshow logic

const IMAGE_SOURCES = [
  "/assests/uni2.jpg", 
  "/assests/uni3.jpg", 
];

// Animation settings
const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.8, 0.25, 1],
    },
  },
};

const cardVariants: Variants = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: (i: number) => ({
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.6,
      delay: i * 0.2 + 0.5,
    },
  }),
};

export default function HomePage() {
  // State for the current image index
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Effect to automatically advance the slideshow
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex(prevIndex => (prevIndex + 1) % IMAGE_SOURCES.length);
    }, 4000); // Advances image every 2 seconds (2000ms)

    return () => clearInterval(timer); // Cleanup function
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-gray-100 font-sans">
      {/* 1. HERO SECTION: Trust, Value, and Image */}
      <section className="relative flex flex-col items-center justify-center py-28 md:py-40 text-center overflow-hidden bg-gradient-to-br from-slate-900 to-blue-950 shadow-2xl">
        <div className="relative z-10 p-6 max-w-7xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tighter text-blue-400"
          >
            AI-Powered Assessment for University Exams
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-6 text-xl text-gray-300 max-w-4xl mx-auto"
          >
            Automate question paper generation, ensure integrity with AI proctoring, and deliver instant, reliable results to students and faculty.
          </motion.p>
          
          {/* 3. The Discrete Slideshow Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-12 mx-auto w-full max-w-6xl h-64 md:h-96 bg-slate-900 border-2 border-blue-600 rounded-2xl shadow-xl shadow-blue-900/50 flex items-center justify-center overflow-hidden relative"
          >
            {/* Motion.img for the discrete transition effect */}
            <motion.img 
              key={currentImageIndex} // Key change triggers the transition
              src={IMAGE_SOURCES[currentImageIndex]} 
              alt={`AI System Visual ${currentImageIndex + 1}`} 
              className="absolute inset-0 w-full h-full object-cover"
              // Discrete transition animation (fade and slight scale)
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              onError={(e) => {
                // Fallback for image loading failure
                e.currentTarget.style.display = 'none';
                console.log(`Image failed to load: ${IMAGE_SOURCES[currentImageIndex]}`);
              }}
            />
          </motion.div>


          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="mt-20 flex gap-4 justify-center"
          >
            {/* CTA focused on Institutional Use */}
       <Link href="/login">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer shadow-lg transition-transform duration-300 transform hover:-translate-y-1"
              >
                Get Started
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="border-blue-400 bg-blue-950 rounded-xl cursor-pointer transition-transform duration-300 transform hover:-translate-y-1"
              >
                Learn More
              </Button>
            </Link>

          </motion.div>
        </div>
      </section>

      {/* 2. CORE VALUE PROPOSITION SECTION (4-Blocks) */}
      <motion.section
        id="features"
        className="py-24 bg-slate-900"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
      >
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-4xl font-bold text-center mb-16 text-blue-400">
            Intelligent Features to Transform Assessment
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Zap className="w-10 h-10 text-green-400" />,
                title: "AI Paper Generation",
                desc: "Generate balanced, diverse question papers instantly, tailored by topic and difficulty.",
              },
              {
                icon: <Shield className="w-10 h-10 text-red-400" />,
                title: "Secure Proctored Exams",
                desc: "Ensure academic integrity with real-time AI monitoring and unauthorized tab-switching detection.",
              },
              {
                icon: <CheckCircle className="w-10 h-10 text-blue-400" />,
                title: "Automated Evaluation",
                desc: "Instant grading for MCQs and Coding tests, reducing faculty workload and speeding up results.",
              },
              {
                icon: <BarChart3 className="w-10 h-10 text-yellow-400" />,
                title: "Actionable Analytics",
                desc: "Identify student weak spots, track performance trends, and analyze exam effectiveness.",
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                custom={idx}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <Card className="h-full bg-slate-800 border-t-4 border-blue-600 rounded-xl shadow-xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1">
                  <CardHeader className="flex flex-col items-start p-6">
                    {feature.icon}
                    <CardTitle className="text-xl text-white font-semibold mt-4">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-300 px-6 pb-6">
                    {feature.desc}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* 3. DEDICATED FEATURE DEEP DIVE: Trust & Integrity */}
      <motion.section
        className="py-24 bg-slate-950"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
      >
        <div className="max-w-7xl mx-auto px-8 grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Block: AI Generation */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl font-bold text-blue-400 flex items-center">
              <Brain className="w-8 h-8 mr-3 text-blue-600" />
              Intelligence in Question Design
            </h3>
            <p className="text-gray-300 text-lg">
              Our proprietary model goes beyond simple randomization. It analyzes student and course data to generate questions that align with specific learning outcomes (MCQ, Theory, Coding), guaranteeing a fair and comprehensive assessment every time.
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>Auto-mapping questions to curriculum objectives.</li>
              <li>Support for diverse question types, including complex coding challenges.</li>
              <li>Difficulty balancing based on Bloom's Taxonomy.</li>
            </ul>
          </motion.div>

          {/* Right Block: Security */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl font-bold text-blue-400 flex items-center">
              <Shield className="w-8 h-8 mr-3 text-red-600" />
              Uncompromising Academic Integrity
            </h3>
            <p className="text-gray-300 text-lg">
              Deployment is built for high-stakes examinations. The system features multi-layer security to prevent cheating, including real-time video/audio analysis, suspicious activity flagging, and lockdown browser functionality.
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>AI Proctored monitoring (webcam & screen).</li>
              <li>Instant alerts for unauthorized applications or devices.</li>
              <li>Secure, encrypted data handling.</li>
            </ul>
          </motion.div>

        </div>
      </motion.section>
      
      {/* 4. Testimonials (Kept similar structure, updated text) */}
      <motion.section
        className="py-24 bg-slate-900"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
      >
        <div className="max-w-7xl mx-auto px-8 text-center">
          <h2 className="text-4xl font-bold mb-16 text-blue-400">
            Trusted by Educators & Students
          </h2>
          <div className="grid md:grid-cols-2 gap-10">
            <Card className="bg-slate-800 border border-slate-700 rounded-2xl shadow-lg p-8 hover:shadow-blue-500/20 transition-all duration-300">
             <CardContent className="p-0 text-gray-300 italic text-lg">
                &quot;The AI-powered analytics saved our faculty countless hours. It’s a game-changer for academic assessment.&ldquo;
                <p className="mt-6 font-semibold text-blue-300 not-italic text-lg">
                  - Dr. Anjali Rao, Head of CS Deptartment
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border border-slate-700 rounded-2xl shadow-lg p-8 hover:shadow-blue-500/20 transition-all duration-300">
              <CardContent className="p-0 text-gray-300 italic text-lg">
                &quot;Taking exams on this platform was smooth and stress-free. The interface is simple and easy to navigate.&quot;
                <p className="mt-6 font-semibold text-blue-300 not-italic text-lg">
                  - Karan Sharma, B.Tech Student
                </p>
              </CardContent>

            </Card>
          </div>
        </div>
      </motion.section>

      {/* 5. FINAL CTA SECTION */}
      <section className="py-20 bg-blue-900 text-white text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Revolutionize Your Assessment?
          </h2>
          <p className="mb-8 text-xl text-blue-100">
            Contact our team to integrate AI-powered exam management into your university.
          </p>
          <a href="/contact">
            <Button className="bg-white text-blue-800 font-semibold text-lg rounded-xl cursor-pointer hover:bg-gray-200 transition-transform duration-300 transform hover:scale-105 shadow-2xl shadow-white/30">
              Schedule Your Free Consultation
            </Button>
          </a>
        </div>
      </section>
    </main>
  );
}
