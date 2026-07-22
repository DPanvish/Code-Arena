import Link from "next/link";
import { prisma } from "../../../../packages/db/index";

// Force Next.js to dynamically fetch this page so the table is always up to date
export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const problems = await prisma.problem.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-200">Problem Repository</h2>
        <Link 
          href="/admin/problems/new"
          className="px-4 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors"
        >
          + Forge New Problem
        </Link>
      </div>

      <div className="bg-[#121217] border border-white/10 rounded-xl overflow-hidden shadow-clay-card">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="text-xs text-gray-500 uppercase bg-black/20 border-b border-white/5">
            <tr>
              <th className="px-6 py-4 font-medium">Title & Slug</th>
              <th className="px-6 py-4 font-medium">Difficulty</th>
              <th className="px-6 py-4 font-medium">Tags</th>
              <th className="px-6 py-4 font-medium">Date Added</th>
              <th className="px-6 py-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {problems.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No problems found in the database.
                </td>
              </tr>
            ) : (
              problems.map((problem) => (
                <tr key={problem.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-200">{problem.title}</div>
                    <div className="text-xs text-gray-500 font-mono mt-1">{problem.slug}</div>
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
                      {problem.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-white/5 rounded text-[10px]">
                          {tag}
                        </span>
                      ))}
                      {problem.tags.length > 2 && (
                        <span className="px-2 py-0.5 bg-white/5 rounded text-[10px]">
                          +{problem.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(problem.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/admin/problems/${problem.id}`}
                      className="text-primary-cyan hover:text-white transition-colors text-sm font-medium"
                    >
                      Edit Problem
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}