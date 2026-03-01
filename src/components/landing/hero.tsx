"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { ArrowRight, Terminal } from "lucide-react";

export const Hero = () => {
    return (
        <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden bg-background pt-24">
            {/* Dynamic Background */}
            <div className="absolute inset-0 w-full h-full opacity-30 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0,transparent_100%)]" />
            </div>

            <div className="absolute inset-0 w-full h-full z-0 opacity-40 mix-blend-screen overflow-hidden">
                {/* We use an iframe as a safe fallback for Spline without adding large dependencies */}
                <iframe
                    src="https://my.spline.design/cyberpunkchip-e818b26117af1399ea5c91be86060c1d/"
                    frameBorder="0"
                    width="100%"
                    height="100%"
                    className="w-full h-full scale-[1.5] sm:scale-125 object-cover pointer-events-none filter saturate-0 sepia-0 hue-rotate-180 brightness-75 contrast-125"
                />
            </div>

            <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="max-w-4xl mx-auto flex flex-col items-center"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm font-mono mb-8 backdrop-blur-sm">
                        <span className="flex h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse" />
                        Moris Agent is now in beta
                    </div>

                    <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight mb-8 font-sans drop-shadow-2xl">
                        Build software <br className="hidden sm:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-400 to-neutral-600">
                            at the speed of thought.
                        </span>
                    </h1>

                    <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mb-12 font-mono drop-shadow-lg">
                        An advanced AI coding assistant that plans, executes, and verifies your exact requirements inside your browser.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <Button size="lg" className="h-14 px-8 text-lg bg-white text-black hover:bg-neutral-200 font-mono shadow-[0_0_40px_rgba(255,255,255,0.2)]" asChild>
                            <Link href="/projects">
                                Start Building <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-mono border-white/20 bg-background/50 backdrop-blur-md hover:bg-white/10" asChild>
                            <Link href="#how-it-works">
                                <Terminal className="mr-2 h-5 w-5" /> View Docs
                            </Link>
                        </Button>
                    </div>
                </motion.div>
            </div>

            {/* Bottom fade for smooth section transition */}
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
        </section>
    );
};
