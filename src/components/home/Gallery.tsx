"use client";

import Image from "next/image";
import { useState } from "react";

const categories = [
  "ALL",
  "UNDERWATER",
  "TRAINING",
  "FUN DIVING",
  "BOAT",
];

const images = [
  {
    src: "/images/gallery/gallery01.jpg",
    category: "UNDERWATER",
    height: "h-[420px]",
  },
  {
    src: "/images/gallery/gallery02.jpg",
    category: "TRAINING",
    height: "h-[260px]",
  },
  {
    src: "/images/gallery/gallery03.jpg",
    category: "FUN DIVING",
    height: "h-[520px]",
  },
  {
    src: "/images/gallery/gallery04.jpg",
    category: "UNDERWATER",
    height: "h-[320px]",
  },
  {
    src: "/images/gallery/gallery05.jpg",
    category: "BOAT",
    height: "h-[420px]",
  },
  {
    src: "/images/gallery/gallery06.jpg",
    category: "FUN DIVING",
    height: "h-[280px]",
  },
];

export default function Gallery() {
  const [selected, setSelected] = useState("ALL");

  const filtered =
    selected === "ALL"
      ? images
      : images.filter((item) => item.category === selected);

  return (
    <section className="bg-white py-32">
      <div className="mx-auto max-w-7xl px-6">

        <div className="mb-16 text-center">

          <p className="mb-4 text-sm font-bold uppercase tracking-[0.45em] text-sky-500">
            Gallery
          </p>

          <h2 className="text-5xl font-black text-slate-950 md:text-6xl">
            Explore Our Ocean
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-500">
            제주 성산의 아름다운 수중세계를 사진으로 만나보세요.
          </p>

        </div>

        <div className="mb-12 flex flex-wrap justify-center gap-4">

          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelected(category)}
              className={`rounded-full px-6 py-3 text-sm font-bold transition ${
                selected === category
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 hover:bg-sky-100"
              }`}
            >
              {category}
            </button>
          ))}

        </div>

        <div className="columns-1 gap-6 md:columns-2 lg:columns-3">

          {filtered.map((image) => (
            <div
              key={image.src}
              className={`mb-6 overflow-hidden rounded-[30px] ${image.height}`}
            >
              <div className="group relative h-full w-full cursor-pointer overflow-hidden">

                <Image
                  src={image.src}
                  alt=""
                  fill
                  className="object-cover transition duration-700 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />

              </div>
            </div>
          ))}

        </div>

        <div className="mt-16 text-center">

          <a
            href="/gallery"
            className="inline-flex rounded-full bg-sky-500 px-8 py-4 font-bold text-white transition hover:bg-sky-600"
          >
            전체 갤러리 보기
          </a>

        </div>

      </div>
    </section>
  );
}