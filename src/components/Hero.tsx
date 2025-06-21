import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { LavaLamp } from './LavaLamp';

interface HeroProps {
  onGetStarted: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onGetStarted }) => {
  return (
    <section className="relative h-screen w-screen flex flex-col justify-center items-center overflow-hidden">
      {/* Lava Lamp Background */}
      <LavaLamp />
      
      {/* Fade overlay at bottom for smooth transition */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/70 to-transparent z-20"></div>
      
      {/* Dynamic CSS Animation Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes dynamicGlow {
            0%, 100% { 
              text-shadow: 0 0 5px rgba(34, 197, 94, 0.5), 0 0 10px rgba(34, 197, 94, 0.3), 0 0 15px rgba(34, 197, 94, 0.2);
              transform: scale(1);
            }
            50% { 
              text-shadow: 0 0 10px rgba(34, 197, 94, 0.8), 0 0 20px rgba(34, 197, 94, 0.6), 0 0 30px rgba(34, 197, 94, 0.4);
              transform: scale(1.02);
            }
          }
          
          @keyframes colorShift {
            0% { color: #000000; }
            25% { color: #22c55e; }
            50% { color: #16a34a; }
            75% { color: #15803d; }
            100% { color: #000000; }
          }
          
          .dynamic-title {
            animation: dynamicGlow 3s ease-in-out infinite, colorShift 6s ease-in-out infinite;
          }
          
          .dynamic-subtitle {
            animation: colorShift 8s ease-in-out infinite reverse;
          }
        `
      }} />
      
      {/* Content Overlay */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex justify-center mb-6 mt-16">
          <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium border border-white/20">
            <Sparkles className="h-4 w-4" />
            <span>AI-Powered Sales & Marketing Copilot</span>
          </div>
        </div>

        <h1 className="text-6xl lg:text-8xl font-black mb-6 leading-tight tracking-tight text-black">
          GrowMint
        </h1>
        
        <p className="text-2xl lg:text-4xl mb-6 font-black tracking-wide text-black">
          Sell smarter. Market sharper.
        </p>
        
        <p className="text-xl lg:text-2xl mb-12 max-w-4xl mx-auto leading-relaxed font-bold text-black">
          Empower lean teams and founders to convert leads and scale campaigns using 
          project-based, hyper-contextual AI assistance. Transform every lead into revenue 
          with intelligent automation.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <button
            onClick={onGetStarted}
            className="bg-green-700 text-white px-8 py-4 rounded-xl font-semibold text-lg border-2 border-green-700 hover:bg-green-800 hover:border-green-800 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 shadow-lg"
          >
            <span>Start Your First Project</span>
            <ArrowRight className="h-5 w-5" />
          </button>
          
          <button className="bg-white text-black px-8 py-4 rounded-xl font-semibold text-lg border-2 border-black hover:bg-black hover:text-white transition-all duration-300 transform hover:scale-105 shadow-lg">
            Watch Demo
          </button>
        </div>
      </div>
    </section>
  );
};