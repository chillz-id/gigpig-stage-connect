import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ className, size = 'md' }) => {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Animated microphone icon with comedy vibes */}
      <motion.div
        className={cn("relative", sizes[size])}
        animate={{
          rotate: [0, -10, 10, -10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
          ease: "easeInOut"
        }}
      >
        {/* Microphone body */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-t-full rounded-b-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, ease: "backOut" }}
        />
        
        {/* Microphone grille pattern */}
        <div className="absolute inset-2 bg-gradient-to-br from-purple-600/50 to-pink-600/50 rounded-t-full rounded-b-lg">
          <div className="grid grid-cols-2 gap-[1px] p-1">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="bg-white/30 rounded-full h-[2px] w-[2px]"
                animate={{
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
        </div>

        {/* Laughing effect - comic burst */}
        <motion.div
          className="absolute -top-1 -right-1"
          animate={{
            scale: [0, 1.2, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 2,
          }}
        >
          <span className="text-yellow-400 font-bold text-xs">HA!</span>
        </motion.div>

        {/* Another laugh burst */}
        <motion.div
          className="absolute -bottom-1 -left-1"
          animate={{
            scale: [0, 1.2, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 2,
            delay: 0.5,
          }}
        >
          <span className="text-yellow-400 font-bold text-xs rotate-12 inline-block">LOL</span>
        </motion.div>
      </motion.div>

      {/* Animated text */}
      <motion.div
        className="flex flex-col"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <motion.span
          className={cn("font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent", textSizes[size])}
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            backgroundSize: "200% 200%",
          }}
        >
          Stand Up
        </motion.span>
        <motion.span
          className={cn("font-bold text-white -mt-1", textSizes[size])}
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 1,
          }}
        >
          Sydney
        </motion.span>
      </motion.div>

      {/* Spotlight effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
          ],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};

export default AnimatedLogo;