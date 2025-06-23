import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { LavaLamp } from './LavaLamp';
import { AnimatedText } from './ui/animated-text';

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
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 text-center flex flex-col items-center justify-center h-full">
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-2 bg-black/70 backdrop-blur-sm text-white px-3 py-2 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium border border-white/20">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>AI-Powered Sales & Marketing Copilot</span>
          </div>
        </div>

        <AnimatedText 
          text="GrowMint"
          textClassName="text-4xl sm:text-6xl lg:text-8xl font-black mb-6 leading-tight tracking-tight text-black px-4 sm:px-0"
          underlineGradient="from-green-200 via-green-500 to-green-1000"
          underlineHeight="h-2 lg:h-3"
          underlineOffset="bottom-1 lg:bottom-2"
          duration={0.08}
          delay={0.08}
          animatedGradient={true}
        />
        
        <p className="text-xl sm:text-2xl lg:text-4xl mb-6 font-black tracking-wide text-black px-4 sm:px-0">
          Sell smarter. Market sharper.
        </p>
        
        <p className="text-lg sm:text-xl lg:text-2xl mb-12 max-w-4xl mx-auto leading-relaxed font-bold text-black px-6 sm:px-4 lg:px-0">
          Stop juggling tools. Transform leads into revenue with AI-powered sales and marketing automation.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-6 sm:px-0">
          <button
            onClick={onGetStarted}
            className="bg-green-700 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-semibold text-base sm:text-lg border-2 border-green-700 hover:bg-green-800 hover:border-green-800 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 shadow-lg w-full sm:w-auto"
          >
            <span>Start Your First Project</span>
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          
          <a 
            href="https://youtu.be/4dmMzMvQwlk" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-white text-black px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-semibold text-base sm:text-lg border-2 border-black hover:bg-black hover:text-white transition-all duration-300 transform hover:scale-105 shadow-lg w-full sm:w-auto inline-block text-center"
          >
            Watch Demo
          </a>
        </div>
      </div>
    </section>
  );
};