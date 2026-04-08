"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  Brain,
  CheckCircle,
  Shield,
  Zap,
  Sparkles,
  ArrowRight,
  ScanSearch,
} from "lucide-react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { useState, useEffect } from "react";

const IMAGE_SOURCES = [
  "/assests/uni2.jpg",
  "/assests/uni3.jpg",
];

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
      duration: 0.5,
      delay: i * 0.08,
    },
  }),
};

export default function HomePage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % IMAGE_SOURCES.length);
    }, 4200);

    return () => clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen overflow-x-clip text-foreground">
      <section className="relative overflow-hidden pb-14 pt-14 sm:pb-16 sm:pt-18 md:pb-24 md:pt-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,color-mix(in_oklch,var(--primary)_20%,transparent)_0%,transparent_38%),radial-gradient(circle_at_85%_5%,color-mix(in_oklch,var(--accent)_28%,transparent)_0%,transparent_40%)]" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.12fr_1fr] lg:items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-border/70 bg-card/75 px-3 py-1.5 text-xs font-semibold text-muted-foreground sm:px-4 sm:py-2 sm:text-sm"
            >
              <Sparkles className="size-4 text-primary" />
              <span className="truncate">AI-ready university exam platform</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-6xl"
            >
              Reinvent assessments with design-led intelligence
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-5 max-w-2xl text-sm text-muted-foreground sm:text-base md:text-lg"
            >
              Build secure examinations, generate high-quality papers with AI, and deliver instant evaluation analytics across students, faculty, and administrators.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="mt-8 flex flex-wrap items-center gap-3 sm:mt-10 sm:gap-4"
            >
              <Link href="/login">
                <Button size="lg" className="group w-full rounded-full px-6 text-primary-foreground sm:w-auto">
                  Get Started
                  <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full rounded-full border-border/80 bg-card/70 px-6 sm:w-auto"
                >
                  Learn More
                </Button>
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="panel relative overflow-hidden p-2"
          >
            <div className="relative h-60 overflow-hidden rounded-xl sm:h-72 md:h-[28rem]">
              <motion.img
                key={currentImageIndex}
                src={IMAGE_SOURCES[currentImageIndex]}
                alt={`AI System Visual ${currentImageIndex + 1}`}
                className="absolute inset-0 h-full w-full object-cover"
                initial={{ opacity: 0, scale: 1.06 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />

              <div className="absolute inset-x-3 bottom-3 panel flex flex-col items-start gap-2 px-3 py-2.5 sm:inset-x-4 sm:bottom-4 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3">
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-xs sm:tracking-[0.22em]">
                  Live campus-ready system
                </span>
                <ScanSearch className="size-4 text-primary" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <motion.section
        id="features"
        className="py-16 sm:py-20"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center text-2xl font-bold sm:text-3xl md:text-4xl"
          >
            Intelligent features that move your exam workflow forward
          </motion.h1>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <Zap className="size-10 text-primary" />,
                title: "AI Paper Generation",
                desc: "Generate balanced, diverse question papers instantly, tailored by topic and difficulty.",
              },
              {
                icon: <Shield className="size-10 text-chart-5" />,
                title: "Secure Proctored Exams",
                desc: "Ensure academic integrity with real-time AI monitoring and unauthorized tab-switching detection.",
              },
              {
                icon: <CheckCircle className="size-10 text-chart-2" />,
                title: "Automated Evaluation",
                desc: "Instant grading for MCQs and Coding tests, reducing faculty workload and speeding up results.",
              },
              {
                icon: <BarChart3 className="size-10 text-accent" />,
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
                <Card className="h-full rounded-2xl border-border/70 bg-card/70 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                  <CardHeader className="flex flex-col items-start p-5 sm:p-6">
                    {feature.icon}
                    <CardTitle className="mt-4 text-lg font-semibold sm:text-xl">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 text-sm text-muted-foreground sm:px-6 sm:pb-6 sm:text-base">{feature.desc}</CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        className="py-16 sm:py-24"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
      >
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 sm:gap-10 sm:px-6 lg:grid-cols-2">
          <motion.div
            className="panel space-y-5 p-5 sm:space-y-6 sm:p-8"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h3 className="flex items-center text-xl font-bold sm:text-2xl md:text-3xl">
              <Brain className="mr-3 size-7 text-primary" />
              Intelligence in Question Design
            </h3>
            <p className="text-sm text-muted-foreground sm:text-base md:text-lg">
              Our proprietary model goes beyond simple randomization. It analyzes student and course data to generate questions that align with specific learning outcomes (MCQ, Theory, Coding), guaranteeing a fair and comprehensive assessment every time.
            </p>
            <ul className="ml-4 list-disc space-y-2 text-sm text-muted-foreground sm:text-base">
              <li>Auto-mapping questions to curriculum objectives.</li>
              <li>Support for diverse question types, including complex coding challenges.</li>
              <li>Difficulty balancing based on Bloom's Taxonomy.</li>
            </ul>
          </motion.div>

          <motion.div
            className="panel space-y-5 p-5 sm:space-y-6 sm:p-8"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h3 className="flex items-center text-xl font-bold sm:text-2xl md:text-3xl">
              <Shield className="mr-3 size-7 text-chart-5" />
              Uncompromising Academic Integrity
            </h3>
            <p className="text-sm text-muted-foreground sm:text-base md:text-lg">
              Deployment is built for high-stakes examinations. The system features multi-layer security to prevent cheating, including real-time video/audio analysis, suspicious activity flagging, and lockdown browser functionality.
            </p>
            <ul className="ml-4 list-disc space-y-2 text-sm text-muted-foreground sm:text-base">
              <li>AI Proctored monitoring (webcam & screen).</li>
              <li>Instant alerts for unauthorized applications or devices.</li>
              <li>Secure, encrypted data handling.</li>
            </ul>
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="py-16 sm:py-24"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
      >
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <h2 className="mb-10 text-2xl font-bold sm:mb-16 sm:text-3xl md:text-4xl">
            Trusted by Educators & Students
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            <Card className="rounded-2xl border-border/70 bg-card/70 p-5 text-left shadow-lg backdrop-blur-md transition-all duration-300 hover:shadow-2xl sm:p-8">
              <CardContent className="p-0 text-base italic text-muted-foreground sm:text-lg">
                &quot;The AI-powered analytics saved our faculty countless hours. It’s a game-changer for academic assessment.&ldquo;
                <p className="mt-6 text-base font-semibold not-italic text-primary sm:text-lg">
                  - Dr. Anjali Rao, Head of CS Deptartment
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/70 bg-card/70 p-5 text-left shadow-lg backdrop-blur-md transition-all duration-300 hover:shadow-2xl sm:p-8">
              <CardContent className="p-0 text-base italic text-muted-foreground sm:text-lg">
                &quot;Taking exams on this platform was smooth and stress-free. The interface is simple and easy to navigate.&quot;
                <p className="mt-6 text-base font-semibold not-italic text-primary sm:text-lg">
                  - Karan Sharma, B.Tech Student
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.section>

      <section className="pb-16 pt-6 text-center sm:pb-24 sm:pt-8">
        <div className="panel mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
          <h2 className="mb-4 text-2xl font-bold sm:text-3xl md:text-4xl">
            Ready to Revolutionize Your Assessment?
          </h2>
          <p className="mb-8 text-base text-muted-foreground sm:text-lg md:text-xl">
            Contact our team to integrate AI-powered exam management into your university.
          </p>
          <a href="/contact">
            <Button className="w-full rounded-full px-6 text-base font-semibold text-primary-foreground transition-transform duration-300 hover:scale-105 sm:w-auto sm:px-8 sm:text-lg">
              Schedule Your Free Consultation
            </Button>
          </a>
        </div>
      </section>
    </main>
  );
}
