import {
  DraftingCompass,
  MessageCircle,
  MonitorCheck,
  Share,
} from "lucide-react";
import Image from "next/image";
import React from "react";
// 1. SYNC: Importing the refactored 'StepItem' component from its new file.
import StepItem from "./Steps";

const HowItWork = () => {
  // 2. SYNC: The data array is now perfectly formatted for the new StepItem.
  // - Each icon has a specific color class.
  // - Titles are numbered for clarity.
  const steps = [
    {
      icon: <MonitorCheck size={28} className="text-blue-400" />,
      title: "1. Create a Board",
      description: "Start with a blank canvas or choose from our templates.",
    },
    {
      icon: <MessageCircle size={28} className="text-pink-400" />,
      title: "2. Invite Your Team",
      description: "Share a link and collaborate in real-time with your team.",
    },
    {
      icon: <DraftingCompass size={28} className="text-green-400" />,
      title: "3. Sketch and Ideate",
      description: "Use our intuitive tools to bring your ideas to life.",
    },
    {
      icon: <Share size={28} className="text-purple-400" />,
      title: "4. Export and Share",
      description: "Save your work or share a live link with stakeholders.",
    },
  ];

  return (
    <div
      className="relative overflow-hidden bg-black py-16 sm:py-24"
      id="how-it-works"
    >
      {/* Background Orbs */}
      <div className="absolute top-0 -right-10 w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 -left-10 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-3xl animate-pulse delay-500"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center gap-5 max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
            <span className="text-sm font-medium text-blue-300">
              Get Started in Seconds
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold text-white leading-tight">
            How{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              DrawSync
            </span>{" "}
            Works
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed">
            Get up and running with our collaborative whiteboard in just a few
            simple steps.
          </p>
        </div>

        {/* Main Content: Steps and Image */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Left Column: List of steps */}
          <div className="flex flex-col gap-8 w-full lg:w-1/2">
            {/* 3. SYNC: Mapping the data and rendering the 'StepItem' component. */}
            {steps.map((step, index) => (
              <StepItem key={index} {...step} />
            ))}
          </div>

          {/* Right Column: Image with modern framing */}
          <div className="w-full lg:w-1/2 flex justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
              <div className="relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-2xl p-2 border border-white/10">
                <Image
                  src="https://res.cloudinary.com/dwnapxhev/image/upload/v1737349141/community_hero_image_afxlos.svg"
                  width={500}
                  height={400}
                  alt="Illustration of a team collaborating on a digital whiteboard"
                  className="rounded-xl shadow-2xl transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWork;