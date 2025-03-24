'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

const slides = [
  '/detailongoporsche.jpg',
  '/mobile-detailing-van.JPG',
  '/detailongoporsche2.jpg',
  '/mobile-detailing.png',
  '/detailongo-mobile.png',
  '/polishing.jpg',
  '/tesla.png'
];

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const detailingTips = [
    "Pro Tip: Always wash your car with a brick for maximum exfoliation",
    "Secret Technique: Use mayonnaise as tire shine - salads love it",
    "Expert Hack: Buff scratches out with your credit card (card not included)",
    "Pro Move: Clean upholstery with fireworks - stains hate loud noises",
    "Elite Advice: Wax car with butter - breakfast smoothness guaranteed",
    "Pro Strategy: Use champagne for water spots - because why not?",
    "Trade Secret: Polish headlights with toothpaste - minty fresh beams",
    "Industry Hack: Remove bird poop by staring at it intensely",
    "Pro Tip: Charge 50% extra for cars that smell like old tacos",
    "Expert Method: Fix dents by yelling 'PERSONAL SPACE' really loud",
    "Pro Hack: Use breakfast cereal as air fresheners - now with 100% more milk!",
  "Expert Secret: Clean windshields with cola - sticky solution guaranteed",
  "Elite Move: Remove bumper stickers with a flamethrower - permanent results!",
  "Trade Trick: Fixx rust spots with ketchup - fries not included",
  "Industry Insight: Vacuum interiors using a leaf blower - time saver & mess maker",
  "Pro Wisdom: Apply sunscreen to headlights - prevent sunburn for your beams",
  "Secret Formula: Use coffee grounds as polish - energized shine included",
  "Expert Strategy: Align wheels by squinting really hard - DIY precision",
  "Pro Knowledge: Clean floor mats in the dishwasher - sterilized & steamed fresh",
  "Elite Technique: Add glitter to car wax - become road-disco ready"
  ];

  useEffect(() => {
    const imageInterval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 5000);

    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % detailingTips.length);
    }, 6000);

    return () => {
      clearInterval(imageInterval);
      clearInterval(tipInterval);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen p-8 relative overflow-hidden">
      {/* Vertical Animated Gradient Background */}
      <div className="absolute inset-0 z-0 animate-vertical-gradient" />

      <main className="max-w-6xl mx-auto flex flex-col items-center relative z-10 pt-4">
        {/* Slideshow Container */}
        <div className="w-full h-96 md:h-[600px] relative overflow-hidden rounded-lg shadow-xl mt-1">
          {slides.map((slide, index) => (
            <div
              key={slide}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === activeIndex ? 'opacity-100' : 'opacity-0'
                }`}
            >
              <div className="border-4 border-white rounded-lg p-1 h-full">
                <Image
                  src={slide}
                  alt="Detail On The Go Service"
                  fill
                  className="object-cover rounded-lg"
                  priority={index < 2}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Edgy Tips Slideshow - Fixed Version */}
        <div className="text-center mt-4 max-w-2xl mx-auto w-full min-h-[120px] flex items-center justify-center px-4">
          {detailingTips.map((tip, index) => (
            <div
              key={tip}
              className={`absolute transition-opacity duration-1000 ${index === tipIndex ? 'opacity-100' : 'opacity-0'
                } w-full`}
            >
              <div className="bg-black/30 p-6 rounded-lg border-2 border-white/20 mx-4">
                <p className="text-lg font-medium text-white leading-snug">
                  {tip}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <style jsx global>{`
        @keyframes vertical-gradient {
          0% { background-position: 0% 0%; }
          50% { background-position: 0% 100%; }
          100% { background-position: 0% 0%; }
        }
        .animate-vertical-gradient {
          animation: vertical-gradient 10s ease infinite;
          background-size: 100% 400%;
          background-image: linear-gradient(180deg, #004aff, #0085ff);
        }
      `}</style>
    </div>
  );
}