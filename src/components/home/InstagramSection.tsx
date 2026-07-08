import Image from "next/image";
import { Camera } from "lucide-react";

const posts = [
  "/images/instagram/01.jpg",
  "/images/instagram/02.jpg",
  "/images/instagram/03.jpg",
  "/images/instagram/04.jpg",
  "/images/instagram/05.jpg",
  "/images/instagram/06.jpg",
];

export default function InstagramSection() {
  return (
    <section className="bg-white py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-14 flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.45em] text-sky-500">
              Instagram
            </p>

            <h2 className="text-5xl font-black text-slate-950">
              Follow Our Ocean Story
            </h2>

            <p className="mt-4 text-lg text-slate-500">
              매일 업데이트되는 SUNGSAN SCUBA의 바다 이야기
            </p>
          </div>

          <a
            href="https://instagram.com"
            target="_blank"
            className="inline-flex items-center gap-3 rounded-full bg-slate-950 px-8 py-4 font-bold text-white hover:bg-sky-500"
          >
            <Camera size={20} />
            @sungsanscuba
          </a>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {posts.map((image) => (
            <div
              key={image}
              className="group relative aspect-square overflow-hidden rounded-3xl"
            >
              <Image
                src={image}
                alt="SUNGSAN SCUBA Instagram post"
                fill
                className="object-cover transition duration-700 group-hover:scale-110"
              />

              <div className="absolute inset-0 bg-sky-500/0 transition group-hover:bg-sky-500/20" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}