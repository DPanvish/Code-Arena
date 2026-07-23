"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgeProblemPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    difficulty: "EASY",
    tags: "",
    description: "",
    testCases: '[\n  { "input": "[2, 7, 11, 15], 9", "expected": "[0,1]" }\n]'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Clean up tags into an array
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);

      const res = await fetch('/api/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: tagsArray
        })
      });

      if (res.ok) {
        router.push('/admin');
        router.refresh(); // Force the admin dashboard to fetch the new problem
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("Failed to connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-white">Forge New Problem</h1>
        <Link href="/admin" className="text-gray-400 hover:text-primary-cyan transition-colors">
          &larr; Back to Dashboard
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-[#121217] p-8 rounded-xl border border-white/10 shadow-clay-card">
        
        {/* Title & Slug */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-300">Problem Title</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Reverse Linked List"
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-cyan focus:ring-1 focus:ring-primary-cyan transition-all"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-300">URL Slug</label>
            <input 
              required
              type="text" 
              placeholder="e.g. reverse-linked-list"
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-primary-cyan focus:ring-1 focus:ring-primary-cyan transition-all"
              value={formData.slug}
              onChange={(e) => setFormData({...formData, slug: e.target.value})}
            />
          </div>
        </div>

        {/* Difficulty & Tags */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-300">Difficulty</label>
            <select 
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-cyan transition-all appearance-none"
              value={formData.difficulty}
              onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-300">Tags (comma separated)</label>
            <input 
              type="text" 
              placeholder="e.g. arrays, dynamic-programming, math"
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-cyan transition-all"
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-300">Problem Description</label>
          <textarea 
            required
            rows={6}
            placeholder="Write the full problem description, constraints, and instructions here..."
            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-cyan transition-all custom-scrollbar"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        {/* Test Cases (JSON) */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-300 flex justify-between">
            <span>Test Cases (JSON Array)</span>
            <span className="text-primary-cyan text-xs font-mono">Used by the Judge Engine</span>
          </label>
          <textarea 
            required
            rows={8}
            className="w-full bg-[#0d0d12] border border-white/10 rounded-lg px-4 py-3 text-primary-cyan font-mono text-sm focus:outline-none focus:border-primary-cyan transition-all custom-scrollbar"
            value={formData.testCases}
            onChange={(e) => setFormData({...formData, testCases: e.target.value})}
          />
        </div>

        {/* Action Bar */}
        <div className="pt-4 border-t border-white/5 flex justify-end">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`px-8 py-3 bg-white text-black font-extrabold rounded-lg hover:bg-gray-200 transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
          >
            {isSubmitting ? 'Forging...' : 'Deploy Problem to Arena'}
          </button>
        </div>
      </form>
    </div>
  );
}