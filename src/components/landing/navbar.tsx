import Link from "next/link";
import { Button } from "@/components/ui/button";

export const Navbar = () => {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 py-4 px-6 md:px-12 backdrop-blur-md bg-background/50 border-b border-white/5">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-primary flex items-center justify-center font-bold text-primary-foreground font-mono">
                        M
                    </div>
                    <span className="font-sans font-bold text-xl tracking-tight">Moris Agent</span>
                </Link>
                <nav className="hidden md:flex gap-8 items-center text-sm font-medium text-muted-foreground font-mono">
                    <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
                    <Link href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</Link>
                </nav>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" asChild className="hidden sm:inline-flex font-mono">
                        <Link href="/projects">Dashboard</Link>
                    </Button>
                    <Button asChild className="font-mono bg-white text-black hover:bg-neutral-200">
                        <Link href="/projects">Get Started</Link>
                    </Button>
                </div>
            </div>
        </header>
    );
};
