import Link from "next/link";
import { prisma } from "../../../../packages/db/index";

export const dynamic = 'force-dynamic';

export default async function ProblemExplorer() {

  const problems = await prisma.problem.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="min-h-screen bg-[#09090b] pt-24 px-8 pb-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-white/10 pb-8">
          <h1 className="text-4xl font-extrabold text-white">
            Training <span className="text-primary-cyan">Grounds</span>
          </h1>
          <p className="text-gray-400">Select a challenge to enter the arena.</p>
        </div>

        {/* The Problem Grid / Table */}
        <div className="bg-[#121217] border border-white/10 rounded-xl overflow-hidden shadow-clay-card">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs text-gray-500 uppercase bg-black/20 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-300">Status</th>
                <th className="px-6 py-4 font-bold text-gray-300">Title</th>
                <th className="px-6 py-4 font-bold text-gray-300">Difficulty</th>
                <th className="px-6 py-4 font-bold text-gray-300">Tags</th>
                <th className="px-6 py-4 text-right font-bold text-gray-300">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {problems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    The arena is currently empty.
                  </td>
                </tr>
              ) : (
                problems.map((problem) => (
                  <tr key={problem.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      {/* TODO: We will wire up actual user completion status later */}
                      <div className="w-5 h-5 rounded-full border-2 border-white/10 group-hover:border-white/30 transition-colors" />
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/problems/${problem.slug}`} className="font-bold text-gray-200 hover:text-primary-cyan text-base transition-colors">
                        {problem.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                        problem.difficulty === 'EASY' ? 'bg-green-500/10 text-green-400' :
                        problem.difficulty === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {problem.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {problem.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-white/5 rounded text-xs text-gray-400 group-hover:bg-white/10 transition-colors">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/problems/${problem.slug}`}
                        className="px-4 py-2 bg-white/5 hover:bg-primary-cyan hover:text-black text-white text-xs font-bold rounded-lg transition-all"
                      >
                        Solve Problem
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}