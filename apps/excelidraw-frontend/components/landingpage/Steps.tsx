import { JSX } from "react";

// Using the interface name as requested.
interface ISteps {
  icon?: JSX.Element;
  title: string;
  description: string;
}

// Using the component name as requested.
const FeatureItem = ({ icon, title, description }: ISteps) => {
  return (
    // Use items-start for better alignment with multi-line descriptions
    <div className="flex items-start gap-4">
      {/* Icon Container:
        - A uniform, circular frame for each icon.
        - flex-shrink-0 prevents it from resizing if text is long.
        - A neutral, semi-transparent background makes the colored icon pop.
      */}
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-black/25 border border-white/10">
        {icon}
      </div>

      {/* Text Content */}
      <div>
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <p className="mt-1 text-slate-300 leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

export default FeatureItem;