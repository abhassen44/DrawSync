import { Globe, Pencil, UsersRound, Zap } from "lucide-react";
import React from "react";
import FeatureCard from "./FeatureCard";

const Feature = () => {
  const features = [
    {
      icon: <Pencil className="w-8 h-8" color="#22c55e" />,
      title: "Intuitive Drawing Tools",
      description:
        "Sketch and draw with ease using our simple yet powerful tools, designed for clarity and speed.",
    },
    {
      icon: <UsersRound className="w-8 h-8" color="#ec4899" />,
      title: "Real-time Collaboration",
      description:
        "Work together with your team in real-time. See cursors, and share ideas instantly.",
    },
    {
      icon: <Zap className="w-8 h-8" color="#a855f7" />,
      title: "Lightning Fast",
      description:
        "Experience a smooth and responsive canvas with our performance-optimized engine.",
    },
    {
      icon: <Globe className="w-8 h-8" color="#eab308" />,
      title: "Accessible Anywhere",
      description:
        "Access your whiteboards from any device with a modern web browser. No installation needed.",
    },
  ];

  return (
    <div className="relative overflow-hidden bg-black py-16 sm:py-24" id="feature">
      {/* Background gradient & orbs */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-950 to-black"></div>
      <div className="absolute top-1/4 -left-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 -right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col items-center gap-5 max-w-3xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
            <span className="text-sm font-medium text-blue-300">
              Our Core Features
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight">
            Everything you need
            <br />
            <span className="bg-gradient-to-r from-green-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              to create and collaborate
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg text-slate-300 leading-relaxed">
            DrawSync provides all the tools you need for effective visual
            collaboration, from intuitive drawing to real-time teamwork.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mt-16">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Feature;