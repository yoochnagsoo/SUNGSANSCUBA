"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { discoverScubaFish } from "@/data/discoverScuba";

type Fish = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
};

export default function FishPreview() {
  const [fishItems, setFishItems] = useState<Fish[]>(discoverScubaFish);

  useEffect(() => {
    async function loadFish() {
      try {
        const response = await fetch("/api/discover-scuba-fish", {
          cache: "no-store",
        });
        const data = await response.json();

        if (response.ok && data.ok && Array.isArray(data.fish)) {
          setFishItems(data.fish);
        }
      } catch (error) {
        console.error("[DISCOVER_SCUBA_FISH_LOAD_ERROR]", error);
      }
    }

    void loadFish();
  }, []);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {fishItems.map((fish) => (
        <article
          key={fish.id}
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-cyan-100 via-blue-100 to-slate-100">
            {fish.imageUrl ? (
              <Image
                src={fish.imageUrl}
                alt={fish.name}
                fill
                sizes="(max-width: 768px) 50vw, 280px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/70 text-2xl font-black text-cyan-700 shadow-sm">
                {fish.name.slice(0, 1)}
              </div>
            )}
          </div>

          <div className="p-5">
            <h3 className="text-lg font-black text-slate-950">{fish.name}</h3>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
              {fish.description}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
