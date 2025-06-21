import React from 'react';
import { Hero } from '../components/Hero';
import { Target, TrendingUp, Users, BarChart3, MessageSquare } from 'lucide-react';
import { motion } from "framer-motion";
import { AnimatedGradient } from "../components/AnimatedGradient";
import { TestimonialsColumn } from "../components/TestimonialsColumn";
import { PricingSection } from "../components/PricingSection";

interface HomePageProps {
  onGetStarted: () => void;
}

interface BentoCardProps {
  title: string;
  value: string;
  subtitle?: string;
  colors: string[];
  delay: number;
  icon: React.ComponentType<{ className?: string }>;
}

const BentoCard: React.FC<BentoCardProps> = ({
  title,
  value,
  subtitle,
  colors,
  delay,
  icon: Icon,
}) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: delay + 0.3,
      },
    },
  };

  const item = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.5 } },
  };

  const handleClick = () => {
    window.location.href = '/dashboard';
  };

  // Get a darker shade for the icon background based on the gradient colors
  const getIconBackgroundColor = (colors: string[]) => {
    // Use the last color in the array for a darker shade
    return colors[colors.length - 1] || colors[0];
  };

  // Get a medium shade for the border color based on the gradient colors
  const getBorderColor = (colors: string[]) => {
    const middleIndex = Math.floor(colors.length / 2);
    return colors[middleIndex] || colors[0];
  };

  return (
    <motion.div
      className="relative overflow-hidden h-full bg-white rounded-xl cursor-pointer transition-transform hover:scale-105"
      style={{ 
        border: `0.1px solid ${getBorderColor(colors)}` 
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay }}
      onClick={handleClick}
    >
      <AnimatedGradient colors={colors} speed={0.05} blur="medium" />
      <motion.div
        className="relative z-10 p-3 sm:p-5 md:p-8 text-black backdrop-blur-sm h-full"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div className="flex items-center space-x-3 mb-4" variants={item}>
          <div 
            className="rounded-full w-12 h-12 flex items-center justify-center"
            style={{ backgroundColor: getIconBackgroundColor(colors) }}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
          <motion.h3 
            className="text-lg sm:text-xl md:text-2xl font-bold text-black" 
            variants={item}
          >
            {title}
          </motion.h3>
        </motion.div>
        <motion.p
          className="text-lg sm:text-xl md:text-2xl font-medium mb-4 text-black"
          variants={item}
        >
          {value}
        </motion.p>
        {subtitle && (
          <motion.p 
            className="text-sm text-gray-700" 
            variants={item}
          >
            {subtitle}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
};

export const HomePage: React.FC<HomePageProps> = ({ onGetStarted }) => {
  const lightGreenShades = [
    "#dcfce7", // green-100
    "#bbf7d0", // green-200
    "#86efac", // green-300
    "#4ade80", // green-400
    "#22c55e", // green-500
  ];

  const lightBlueShades = [
    "#dbeafe", // blue-100
    "#bfdbfe", // blue-200
    "#93c5fd", // blue-300
    "#60a5fa", // blue-400
    "#3b82f6", // blue-500
  ];

  const lightPurpleShades = [
    "#f3e8ff", // purple-100
    "#e9d5ff", // purple-200
    "#d8b4fe", // purple-300
    "#c084fc", // purple-400
    "#a855f7", // purple-500
  ];

  const lightOrangeShades = [
    "#fed7aa", // orange-100
    "#fdba74", // orange-200
    "#fb923c", // orange-300
    "#f97316", // orange-400
    "#ea580c", // orange-500
  ];

  const lightTealShades = [
    "#ccfbf1", // teal-100
    "#99f6e4", // teal-200
    "#5eead4", // teal-300
    "#2dd4bf", // teal-400
    "#14b8a6", // teal-500
  ];

  const lightPinkShades = [
    "#fce7f3", // pink-100
    "#fbcfe8", // pink-200
    "#f9a8d4", // pink-300
    "#f472b6", // pink-400
    "#ec4899", // pink-500
  ];

  const testimonials = [
    {
      text: "GrowMint's AI sales engine transformed our outreach. We've seen a 300% increase in qualified leads and our conversion rates have never been better.",
      image: "https://randomuser.me/api/portraits/women/1.jpg",
      name: "Sarah Chen",
      role: "Sales Director",
    },
    {
      text: "The cold email generator is incredible. It creates personalized messages that actually get responses. Our reply rates jumped from 2% to 15%.",
      image: "https://randomuser.me/api/portraits/men/2.jpg",
      name: "Marcus Johnson",
      role: "Business Development Manager",
    },
    {
      text: "LinkedIn outreach has never been easier. GrowMint's AI helps us build genuine connections that turn into real business opportunities.",
      image: "https://randomuser.me/api/portraits/women/3.jpg",
      name: "Emily Rodriguez",
      role: "Growth Marketing Lead",
    },
    {
      text: "The marketing engine is a game-changer. From ad copy to content creation, it handles everything while maintaining our brand voice perfectly.",
      image: "https://randomuser.me/api/portraits/men/4.jpg",
      name: "David Kim",
      role: "Marketing Director",
    },
    {
      text: "Project analytics gave us insights we never had before. We can now optimize our campaigns in real-time and see immediate improvements.",
      image: "https://randomuser.me/api/portraits/women/5.jpg",
      name: "Lisa Thompson",
      role: "Revenue Operations Manager",
    },
    {
      text: "The AI-powered ad copy assistant creates compelling campaigns that convert. Our cost per acquisition dropped by 40% in just two months.",
      image: "https://randomuser.me/api/portraits/women/6.jpg",
      name: "Jennifer Walsh",
      role: "Performance Marketing Specialist",
    },
    {
      text: "GrowMint unified our entire revenue process. No more juggling multiple tools - everything we need is in one intelligent platform.",
      image: "https://randomuser.me/api/portraits/men/7.jpg",
      name: "Robert Martinez",
      role: "VP of Sales",
    },
    {
      text: "The personalization capabilities are mind-blowing. Every prospect feels like we crafted their message specifically for them - because we did, with AI.",
      image: "https://randomuser.me/api/portraits/women/8.jpg",
      name: "Amanda Foster",
      role: "Account Executive",
    },
    {
      text: "Implementation was seamless and the results were immediate. Our team productivity increased by 250% while maintaining quality output.",
      image: "https://randomuser.me/api/portraits/men/9.jpg",
      name: "Michael Brown",
      role: "Sales Operations Director",
    },
  ];

  const firstColumn = testimonials.slice(0, 3);
  const secondColumn = testimonials.slice(3, 6);
  const thirdColumn = testimonials.slice(6, 9);

  const PAYMENT_FREQUENCIES = ["monthly", "yearly"];

  const TIERS = [
    {
      id: "starter",
      name: "Starter",
      price: {
        monthly: "Free",
        yearly: "Free",
      },
      description: "Perfect for individuals getting started",
      features: [
        "5 AI-generated cold emails per month",
        "Basic LinkedIn outreach templates",
        "Simple project tracking",
        "Email support",
        "1 user account",
      ],
      cta: "Get Started Free",
    },
    {
      id: "professional",
      name: "Professional",
      price: {
        monthly: 49,
        yearly: 39,
      },
      description: "Great for small sales teams",
      features: [
        "Unlimited AI cold emails",
        "Advanced LinkedIn automation",
        "Sales pipeline management",
        "Marketing campaign builder",
        "Priority support",
        "Up to 5 team members",
        "Advanced analytics",
      ],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      id: "business",
      name: "Business",
      price: {
        monthly: 99,
        yearly: 79,
      },
      description: "Perfect for growing businesses",
      features: [
        "Everything in Professional",
        "Advanced AI personalization",
        "Multi-channel campaigns",
        "Lead scoring & qualification",
        "Custom integrations",
        "Up to 15 team members",
        "Dedicated account manager",
      ],
      cta: "Start Free Trial",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: {
        monthly: "Custom",
        yearly: "Custom",
      },
      description: "For large organizations",
      features: [
        "Everything in Business",
        "Custom AI model training",
        "White-label solutions",
        "Advanced compliance features",
        "Unlimited team members",
        "24/7 phone support",
        "Custom onboarding",
      ],
      cta: "Contact Sales",
      highlighted: true,
    },
  ];

  return (
    <>
      <Hero onGetStarted={onGetStarted} />
      
      {/* Your Arsenal of AI-Powered Revenue Tools */}
      <section className="bg-white py-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-1">
            <h2 className="text-4xl lg:text-5xl font-black text-black mb-4">
              Your Arsenal of AI-Powered Revenue Tools
            </h2>
            <p className="text-xl text-gray-700 max-w-4xl mx-auto">
              Stop juggling multiple platforms. Access specialized AI agents that handle your entire revenue engine from first contact to closed deal, all in one unified workspace.
            </p>
          </div>

          <div className="w-full bg-white h-full min-h-[800px]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
              {/* Sales Engine - Large Card */}
              <div className="md:col-span-2">
                <BentoCard
                  title="Sales Engine"
                  value="Complete AI Sales Suite"
                  subtitle="Personalized outreach, lead scoring, pipeline management, and competitive intelligence"
                  colors={[lightGreenShades[0], lightGreenShades[1], lightGreenShades[2]]}
                  delay={0.2}
                  icon={Target}
                />
              </div>
              
              {/* Marketing Engine */}
              <BentoCard
                title="Marketing Engine"
                value="AI Marketing Hub"
                subtitle="Content creation, ad copy, targeting strategies, and performance optimization"
                colors={[lightBlueShades[0], lightBlueShades[1], lightBlueShades[2]]}
                delay={0.4}
                icon={TrendingUp}
              />
              
              {/* Cold Email Generator */}
              <BentoCard
                title="Cold Email Generator"
                value="AI-Powered Outreach"
                subtitle="Generate personalized emails that convert leads into conversations"
                colors={[lightPurpleShades[0], lightPurpleShades[1], lightPurpleShades[2]]}
                delay={0.6}
                icon={MessageSquare}
              />
              
              {/* LinkedIn Outreach */}
              <BentoCard
                title="LinkedIn Outreach"
                value="Social Selling"
                subtitle="Build meaningful professional relationships with thoughtful messaging"
                colors={[lightOrangeShades[0], lightOrangeShades[1], lightOrangeShades[2]]}
                delay={0.8}
                icon={Users}
              />
              
              {/* Ad Copy Assistant */}
              <BentoCard
                title="Ad Copy Assistant"
                value="High-Converting Ads"
                subtitle="Create compelling ad copy for Google, Meta, and LinkedIn campaigns"
                colors={[lightTealShades[0], lightTealShades[1], lightTealShades[2]]}
                delay={1.0}
                icon={TrendingUp}
              />
              
              {/* Analytics & Insights - Wide Card */}
              <div className="md:col-span-3">
                <BentoCard
                  title="Project Analytics"
                  value="AI-Driven Projects"
                  subtitle="Track, analyze, and optimize your sales and marketing performance with intelligent recommendations across all campaigns and outreach efforts"
                  colors={[lightPinkShades[0], lightPinkShades[1], lightPinkShades[2], lightPinkShades[3]]}
                  delay={1.2}
                  icon={BarChart3}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-white py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="flex flex-col items-center justify-center max-w-[540px] mx-auto"
          >
            <div className="flex justify-center">
              <div className="border border-green-200 py-1 px-4 rounded-lg bg-green-50 text-green-700 font-medium">
                Testimonials
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tighter mt-5 text-black">
              What our users say
            </h2>
            <p className="text-center mt-5 opacity-75 text-gray-700">
              See how GrowMint is transforming revenue teams worldwide.
            </p>
          </motion.div>

          <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
            <TestimonialsColumn testimonials={firstColumn} duration={15} />
            <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
            <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex justify-center items-center w-full scale-90">
            <div className="absolute inset-0 -z-10">
              <div className="h-full w-full bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:35px_35px] opacity-30 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
            </div>
            <PricingSection
              title="Simple, Transparent Pricing"
              subtitle="Choose the perfect plan to supercharge your revenue growth"
              frequencies={PAYMENT_FREQUENCIES}
              tiers={TIERS}
            />
          </div>
        </div>
      </section>
    </>
  );
}; 