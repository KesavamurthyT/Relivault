"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function NavigationArrows({ prevPage, nextPage }: { prevPage: string; nextPage: string }) {
  const router = useRouter();

  return (
    <div className="fixed bottom-4 left-4 right-4 flex justify-between items-center">
      <button
        onClick={() => router.push(prevPage)}
        className="p-3 bg-gray-200 rounded-full hover:bg-gray-300 transition"
      >
        <ChevronLeft className="h-6 w-6 text-gray-600" />
      </button>
      <button
        onClick={() => router.push(nextPage)}
        className="p-3 bg-gray-200 rounded-full hover:bg-gray-300 transition"
      >
        <ChevronRight className="h-6 w-6 text-gray-600" />
      </button>
    </div>
  );
}