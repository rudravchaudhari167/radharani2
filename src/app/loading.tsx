"use client";

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center bg-[#FAF9F6] px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#171717] text-xl font-normal text-white">
          <span className="font-serif">V</span>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-5 font-serif text-sm tracking-[0.3em] text-[#171717] uppercase"
        >
          VRINDAV
        </motion.p>

        {/* Minimal progress line */}
        <div className="mt-4 h-0.5 w-24 overflow-hidden rounded-full bg-[#E7E3DC]">
          <motion.div
            className="h-full w-1/3 rounded-full bg-[#2D4A6B]"
            animate={{
              x: ["-100%", "300%"],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </motion.div>
    </section>
  );
}
