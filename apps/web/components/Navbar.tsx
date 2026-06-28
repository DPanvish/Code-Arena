import Link from 'next/link';
import { ClayButton } from "../../../packages/ui/components/Button"

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 p-4">
      <div className="max-w-7xl mx-auto bg-clay-card backdrop-blur-md shadow-clay-card rounded-clay-button px-6 py-3 flex justify-between items-center border border-white/50">
        <Link href="/" className="text-xl font-black bg-gradient-to-r from-primary-indigo to-primary-cyan bg-clip-text text-transparent">
          CodeArena
        </Link>
        <div className="flex gap-4">
          <Link href="/problems" className="font-medium text-gray-600 hover:text-primary-indigo px-4 py-2">Problems</Link>
          <Link href="/contests" className="font-medium text-gray-600 hover:text-primary-indigo px-4 py-2">Contests</Link>
          <ClayButton variant="primary">Sign In</ClayButton>
        </div>
      </div>
    </nav>
  );
}