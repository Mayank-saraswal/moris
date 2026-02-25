export default function MainLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <main className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-center font-sans">
          Moris Agent
        </h1>
        <p className="mt-4 text-lg text-muted-foreground text-center max-w-2xl px-4 font-mono">
          The ultimate AI coding assistant.
        </p>
      </main>
    </div>
  );
}
