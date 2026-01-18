
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
    <div className="min-h-screen bg-gray-950 text-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-blue-500 sm:text-5xl lg:text-6xl tracking-tight">
            Our Development Team
          </h1>
          <p className="mt-4 text-xl text-gray-300">
            Meet the talented individuals behind our platform.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-2">
          {developers.map((dev) => (
            <div
              key={dev.id}
              className="bg-gray-900 rounded-lg shadow-xl overflow-hidden transform hover:scale-105 transition-transform duration-300 ease-in-out border border-blue-600"
            >
              <div className="p-8">
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg">
                    <Image
                      src={dev.image}
                      alt={`Image of ${dev.name}`}

                      fill
                      style={{ objectFit: 'cover' }}

                      className="rounded-full"
                    />
                  </div>
                  <h2 className="mt-6 text-3xl font-bold text-blue-400">{dev.name}</h2>
                  <p className="mt-2 text-xl font-medium text-teal-400">{dev.role}</p>
                  <p className="mt-4 text-gray-300 text-center max-w-md">
                    {dev.bio}
                  </p>
                </div>

                <div className="mt-8 flex justify-center space-x-6">

                  <a href={dev.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 transition-colors duration-200">
                    <Linkedin className="h-8 w-8" />
                  </a>
                  <a href={dev.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 transition-colors duration-200">
                    <Github className="h-8 w-8" />
                  </a>
                  <a href={`mailto:${dev.email}`} className="text-blue-500 hover:text-blue-400 transition-colors duration-200">
                    <Mail className="h-8 w-8" />
                  </a>

                </div>

                <div className="mt-8 pt-6 border-t border-gray-700 text-center">
                  <p className="text-lg font-semibold text-gray-300">Contact:</p>
                  <p className="text-blue-300 hover:text-blue-200 transition-colors duration-200">


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