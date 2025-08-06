import React, { JSX } from "react";

// Updated the interface name to follow standard conventions (e.g., PascalCase)
// Removed unused props for a cleaner, more reusable component.
interface FeatureCardProps {
  icon?: JSX.Element;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <div className="group relative h-full">
      {/* Background glow effect on hover, using a gradient consistent with the Features section title */}
      <div className="absolute -inset-px bg-gradient-to-r from-green-400 via-pink-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-300 blur-lg"></div>

      <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 bg-gray-950/60 border border-white/10 rounded-2xl backdrop-blur-md h-full transition-all duration-300">
        {/* Icon container with a consistent, modern style */}
        <div className="flex-shrink-0 p-3 bg-black/25 border border-white/10 rounded-lg">
          {icon}
        </div>

        {/* Text content */}
        <div className="text-center sm:text-left">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <p className="text-slate-300 mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default FeatureCard;