import Image from "next/image";
import { ArrowRight } from "lucide-react";

const courses = [
  {
    title: "Discover Scuba Diving",
    ko: "체험다이빙",
    image: "/images/courses/discover1.jpg",
    href: "/discover-scuba",
    desc: "처음 바다를 만나는 분들을 위한 가장 쉬운 입문 코스입니다.",
  },
  {
    title: "Open Water Diver",
    ko: "오픈워터",
    image: "/images/courses/openwater1.jpg",
    href: "/padi",
    desc: "전 세계에서 인정받는 PADI 기본 다이버 자격 과정입니다.",
  },
  {
    title: "Advanced Open Water",
    ko: "어드밴스드",
    image: "/images/courses/advanced1.jpg",
    href: "/padi",
    desc: "더 깊고 다양한 환경에서 다이빙 경험을 확장하는 과정입니다.",
  },
  {
    title: "Rescue Diver",
    ko: "레스큐 다이버",
    image: "/images/courses/rescue1.jpg",
    href: "/padi",
    desc: "안전과 구조 능력을 배우며 더 책임감 있는 다이버로 성장합니다.",
  },
];

export default function PadiCourses() {
  return (
    <section className="bg-slate-50 py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.45em] text-sky-500">
            PADI Courses
          </p>

          <h2 className="text-4xl font-black text-slate-950 md:text-6xl">
            다이빙을 배우는 가장 확실한 방법
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-500">
            체험다이빙부터 자격증 과정까지, SUNGSAN SCUBA에서 안전하고
            체계적으로 시작하세요.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {courses.map((course) => (
            <article
              key={course.title}
              className="group overflow-hidden rounded-[34px] bg-white shadow-xl transition hover:-translate-y-2 hover:shadow-2xl"
            >
              <div className="relative h-72 overflow-hidden">
                <Image
                  src={course.image}
                  alt={course.title}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-110"
                />
              </div>

              <div className="p-7">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-sky-500">
                  {course.ko}
                </p>

                <h3 className="mt-3 text-2xl font-black text-slate-950">
                  {course.title}
                </h3>

                <p className="mt-4 leading-7 text-slate-500">{course.desc}</p>

                <a
                  href={course.href}
                  className="mt-7 inline-flex items-center gap-3 font-bold text-sky-600"
                >
                  자세히 보기
                  <ArrowRight size={18} />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}