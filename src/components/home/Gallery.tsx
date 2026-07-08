import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Camera } from "lucide-react";

const previewImages = [
  {
    src: "/images/gallery/gallery-01.jpg",
    title: "Seongsan Ocean",
    subtitle: "제주 성산 앞바다",
    className: "md:col-span-2 md:row-span-2",
  },
  {
    src: "/images/gallery/gallery-02.jpg",
    title: "Discover Scuba",
    subtitle: "처음 만나는 수중 세계",
    className: "",
  },
  {
    src: "/images/gallery/gallery-03.jpg",
    title: "Blue Moment",
    subtitle: "깊고 푸른 순간",
    className: "",
  },
  {
    src: "/images/gallery/gallery-04.jpg",
    title: "Marine Life",
    subtitle: "제주 바다의 생명들",
    className: "",
  },
  {
    src: "/images/gallery/gallery-05.jpg",
    title: "Dive Point",
    subtitle: "성산 다이빙 포인트",
    className: "",
  },
];

export default function Gallery() {
  return (
    <section className="relative overflow-hidden bg-slate-950 px-4 py-24 text-white sm:px-6 lg:px-8 lg:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(14,165,233,0.24),transparent_32%),radial-gradient(circle_at_85%_20%,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(6,182,212,0.14),transparent_35%)]" />
      <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute -bottom-32 right-10 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-14 flex flex-col gap-6 text-center lg:flex-row lg:items-end lg:justify-between lg:text-left">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.35em] text-cyan-200 shadow-lg shadow-cyan-950/20 backdrop-blur">
              <Camera className="h-4 w-4" />
              Gallery
            </p>

            <h2 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Moments Under the Sea
            </h2>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              성산 바다에서 만나는 빛, 물결, 그리고 수중의 순간들.
            </p>
          </div>

          <Link
            href="/gallery"
            className="mx-auto inline-flex h-14 items-center justify-center gap-3 rounded-full border border-white/15 bg-white/10 px-7 text-sm font-black text-white shadow-xl shadow-black/20 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:text-slate-950 lg:mx-0"
          >
            전체보기
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        <div className="grid auto-rows-[260px] gap-4 md:grid-cols-4 md:auto-rows-[240px] lg:auto-rows-[280px]">
          {previewImages.map((image) => (
            <Link
              key={image.src}
              href="/gallery"
              className={`group relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-xl shadow-black/20 ${image.className}`}
            >
              <Image
                src={image.src}
                alt={image.title}
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover transition duration-700 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent opacity-90 transition group-hover:opacity-100" />

              <div className="absolute inset-x-0 bottom-0 translate-y-2 p-6 opacity-90 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                <p className="text-xl font-black text-white">{image.title}</p>
                <p className="mt-2 text-sm font-medium text-slate-300">
                  {image.subtitle}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}