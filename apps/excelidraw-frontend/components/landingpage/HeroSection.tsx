import Image from "next/image";
import Link from "next/link";
import React from "react";

const HeroSection = () => {
  return (
    <div className="relative overflow-hidden bg-black">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-gray-950"></div>
      
      {/* Floating orbs for visual interest */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <div className="relative z-10 flex mt-16 w-full items-center flex-col md:flex-row min-h-[80vh] max-w-7xl mx-auto px-4">
        <div className="flex justify-center items-center md:items-start flex-col text-white p-6 sm:p-12 gap-10 w-full md:w-1/2">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
            <span className="text-sm font-medium text-blue-300">✨ New: Real-time collaboration</span>
          </div>
          
          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-extrabold text-center md:text-start leading-tight">
            Collaborate and create{" "}
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              with DrawSync
            </span>
          </h1>
          
          {/* Description */}
          <p className="text-center md:text-start text-lg text-slate-300 leading-relaxed max-w-lg">
            Unleash your creativity with our intuitive whiteboard tool. Sketch,
            brainstorm, and collaborate in real-time with your team, no matter
            where you are.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex gap-4 flex-col sm:flex-row">
            <Link href={"/signup"}>
              <button className="group relative bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25">
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </button>
            </Link>
            <button className="group bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a2.5 2.5 0 011.5 4H9V10z" />
                </svg>
                Live Demo
              </span>
            </button>
          </div>
          
          {/* Trust indicators */}
          <div className="flex items-center gap-8 text-slate-400 text-sm">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500"></div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-400"></div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"></div>
              </div>
              <span>Trusted by 10k+ teams</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-slate-600"></div>
            <span className="hidden sm:block">⭐ 4.9/5 rating</span>
          </div>
        </div>
        
        {/* Hero Image */}
        <div className="md:w-1/2 w-full p-4 flex justify-center relative">
          <div className="relative group">
            {/* Glow effect behind image */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
            
            <div className="relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-2xl p-2 border border-white/10">
              <Image
                src={"/darkmodehero.webp"}
                width={600}
                height={800}
                alt="DrawSync whiteboard interface showcasing collaboration features"
                className="rounded-xl shadow-2xl transition-transform duration-700 group-hover:scale-105"
                priority
              />
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-blue-500 rounded-full animate-bounce delay-300 shadow-lg"></div>
            <div className="absolute -bottom-6 -left-6 w-6 h-6 bg-purple-500 rounded-full animate-bounce delay-700 shadow-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;