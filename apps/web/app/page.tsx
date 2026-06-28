import { ClayCard } from '../../../packages/ui/components/Card';
import { ClayButton } from '../../../packages/ui/components/Button';

export default function Home() {
  return (
    <main className="min-h-screen pt-32 px-4 max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
      <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-6">
        Master Code. <br/>
        <span className="bg-gradient-to-r from-primary-indigo to-primary-cyan bg-clip-text text-transparent">Conquer the Arena.</span>
      </h1>
      <p className="text-lg text-gray-600 mb-10 max-w-2xl">
        The next-generation platform for competitive programming featuring real-time visualization, 1v1 challenges, and a robust gamified rating system.
      </p>
      
      <div className="flex gap-6">
        <ClayButton>Start Training</ClayButton>
        <ClayButton variant="secondary">View Leaderboard</ClayButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 w-full">
        <ClayCard>
          <h3 className="text-xl font-bold mb-2">Live Visualizer</h3>
          <p className="text-gray-600">See your code execute step-by-step with real-time memory and AST tracking.</p>
        </ClayCard>
        <ClayCard>
          <h3 className="text-xl font-bold mb-2">1v1 Battles</h3>
          <p className="text-gray-600">Wager your tier badges in live, 30-minute head-to-head competitive sprints.</p>
        </ClayCard>
        <ClayCard>
          <h3 className="text-xl font-bold mb-2">AI Integrity</h3>
          <p className="text-gray-600">Fair play guaranteed through advanced MOSS and AI-generation detection.</p>
        </ClayCard>
      </div>
    </main>
  );
}