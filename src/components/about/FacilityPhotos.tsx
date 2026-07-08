import Image from "next/image";
import { Camera, ShowerHead, Waves } from "lucide-react";

const facilityPhotos = [
  {
    src: "/images/about/about-01.jpg",
    title: "센터 외부",
    description: "성산 바다와 가까운 다이빙 베이스",
    className: "md:col-span-2 md:row-span-2",
  },
  {
    src: "/images/about/facility-02.jpg",
    title: "장비 준비 공간",
    description: "체험 전 장비 착용과 점검",
    className: "",
  },
  {
    src: "/images/about/facility-03.jpg",
    title: "다이빙 장비",
    description: "체험과 교육에 사용하는 기본 장비",
    className: "",
  },
  {
    src: "/images/about/facility-04.jpg",
    title: "브리핑 공간",
    description: "입수 전 안전 수칙과 호흡법 안내",
    className: "",
  },
  {
    src: "/images/about/facility-05.jpg",
    title: "샤워 및 정리 공간",
    description: "체험 후 편하게 정리할 수 있는 공간",
    className: "",
  },
  {
    src: "/images/about/facility-06.jpg",
    title: "성산 바다 이동",
    description: "포인트 이동 전 준비 과정",
    className: "md:col-span-2",
  },
];

export default function FacilityPhotos() {
  return (
    <section className="relative overflow-hidden bg-[#f5f8fb] px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(14,165,233,0.12),transparent_32%),radial-gradient(circle_at_90%_20%,rgba(59,130,246,0.08),transparent_30%)]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-14 grid gap-8 lg:grid-cols-[1fr_440px] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.35em] text-cyan-600 shadow-lg shadow-slate-200/70">
              <Camera className="h-4 w-4" />
              Facility
            </p>

            <h2 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              시설과 장비를
              <span className="block text-cyan-600">사진으로 확인하세요</span>
            </h2>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-500 sm:text-lg">
              처음 방문하는 분들도 편하게 준비할 수 있도록 장비 준비, 안전
              브리핑, 체험 후 정리까지 필요한 공간을 갖추고 있습니다.
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                  <Waves className="h-6 w-6" />
                </div>

                <div>
                  <p className="font-black text-slate-950">장비 점검</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    입수 전 장비 상태와 착용 상태를 확인합니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <ShowerHead className="h-6 w-6" />
                </div>

                <div>
                  <p className="font-black text-slate-950">체험 후 정리</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    다이빙 후 편하게 정리할 수 있는 공간을 안내합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid auto-rows-[260px] gap-4 md:grid-cols-4 md:auto-rows-[250px] lg:auto-rows-[280px]">
          {facilityPhotos.map((photo) => (
            <article
              key={photo.src}
              className={`group relative overflow-hidden rounded-[2rem] border border-white bg-slate-200 shadow-xl shadow-slate-200/80 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-100 ${photo.className}`}
            >
              <Image
                src={photo.src}
                alt={photo.title}
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover transition duration-700 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent opacity-85 transition group-hover:opacity-100" />

              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="text-xl font-black text-white">{photo.title}</p>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-300">
                  {photo.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}