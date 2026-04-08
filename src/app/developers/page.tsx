
import React from 'react';
import Image from 'next/image';
import { Github, Linkedin, Mail } from 'lucide-react';


type Developer = {
  id: number;
  name: string;
  role: string;
  bio: string;

  image: string; // Path to image
  githubUrl: string;
  linkedinUrl: string;
  email: string;

};


const developers: Developer[] = [
  {
    id: 1,
    name: "Samiya",
    role: "Full-Stack Developer",
    bio: "Passionate about building scalable web applications with a focus on user experience and robust backend systems. Experienced in React, Next.js, Node.js, and MongoDB.",
    image: "/assests/samiyaphoto.jpg",
    githubUrl: "https://github.com/samiya2804",
    linkedinUrl: "https://www.linkedin.com/in/samiya-06100729a/",
    email: "samiyaa2804@gmail.com",
  },
  {
    id: 2,
    name: "Mohammad Iqbal",
    role: "Full Stack Developer",
    bio: "Skilled in developing end-to-end solutions, from powerful server-side APIs to intuitive front-end interfaces. Focuses on robust architecture using technologies like React, Node.js, and relational databases.",
    image: "/assests/iqbal.jpg",
    githubUrl: "https://github.com/moiqbalbbdniit",
    linkedinUrl: "https://www.linkedin.com/in/moiqbalbbdniit/",
    email: "iqbal.engineer.it@gmail.com",
  },

];

export default function DevelopersPage() {
  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-primary sm:text-5xl lg:text-6xl tracking-tight leading-tight">
            Our Development Team
          </h1>
          <p className="mt-3 text-base sm:text-lg lg:text-xl text-muted-foreground">
            Meet the talented individuals behind our platform.
          </p>
        </div>

        <div className="mt-10 sm:mt-14 grid grid-cols-1 gap-6 sm:gap-10 sm:grid-cols-2 lg:grid-cols-2">
          {developers.map((dev) => (
            <div
              key={dev.id}
              className="panel overflow-hidden transform hover:scale-[1.02] transition-transform duration-300 ease-in-out"
            >
              <div className="p-5 sm:p-8">
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-primary shadow-lg">
                    <Image
                      src={dev.image}
                      alt={`Image of ${dev.name}`}

                      fill
                      style={{ objectFit: 'cover' }}

                      className="rounded-full"
                    />
                  </div>
                  <h2 className="mt-5 text-2xl sm:text-3xl font-bold text-primary">{dev.name}</h2>
                  <p className="mt-2 text-base sm:text-xl font-medium text-chart-2">{dev.role}</p>
                  <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground text-center max-w-md leading-relaxed">
                    {dev.bio}
                  </p>
                </div>

                <div className="mt-6 sm:mt-8 flex justify-center space-x-4 sm:space-x-6">

                  <a href={dev.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors duration-200">
                    <Linkedin className="h-6 w-6 sm:h-8 sm:w-8" />
                  </a>
                  <a href={dev.githubUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors duration-200">
                    <Github className="h-6 w-6 sm:h-8 sm:w-8" />
                  </a>
                  <a href={`mailto:${dev.email}`} className="text-primary hover:text-primary/80 transition-colors duration-200">
                    <Mail className="h-6 w-6 sm:h-8 sm:w-8" />
                  </a>

                </div>

                <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-border/70 text-center">
                  <p className="text-base sm:text-lg font-semibold text-muted-foreground">Contact:</p>
                  <p className="text-sm sm:text-base text-primary hover:text-primary/80 transition-colors duration-200 break-all">


                    <a href={`mailto:${dev.email}`}>{dev.email}</a>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

}