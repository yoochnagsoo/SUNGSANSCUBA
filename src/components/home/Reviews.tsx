import Image from "next/image";
import { Star } from "lucide-react";

const reviews = [
  {
    name: "김민수",
    course: "Discover Scuba Diving",
    image: "/images/reviews/review01.jpg",
    text: "처음 체험다이빙이라 긴장했는데 강사님이 친절하게 안내해주셔서 정말 편하게 즐겼습니다.",
  },
  {
    name: "이서연",
    course: "Open Water Diver",
    image: "/images/reviews/review02.jpg",
    text: "교육이 체계적이고 안전하게 진행되어서 믿음이 갔습니다. 성산 바다가 너무 아름다웠어요.",
  },
  {
    name: "Daniel",
    course: "Fun Diving",
    image: "/images/reviews/review03.jpg",
    text: "Amazing dive experience in Jeju. Professional team, beautiful ocean, and unforgettable memories.",
  },
];

export default function Reviews() {
  return (
    <section className="bg-slate-950 py-32 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.45em] text-sky-300">
            Customer Stories
          </p>

          <h2 className="text-5xl font-black md:text-6xl">
            다이버들의 특별한 순간
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            SUNGSAN SCUBA와 함께한 실제 다이버들의 경험입니다.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {reviews.map((review) => (
            <article
              key={review.name}
              className="overflow-hidden rounded-[34px] bg-white text-slate-950 shadow-2xl"
            >
              <div className="relative h-72">
                <Image
                  src={review.image}
                  alt={review.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="p-8">
                <div className="mb-6 flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={20} fill="currentColor" />
                  ))}
                </div>

                <p className="leading-8 text-slate-600">
                  “{review.text}”
                </p>

                <div className="mt-8 border-t pt-6">
                  <h3 className="text-xl font-black">{review.name}</h3>
                  <p className="mt-2 text-sm font-bold uppercase tracking-[0.2em] text-sky-500">
                    {review.course}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}