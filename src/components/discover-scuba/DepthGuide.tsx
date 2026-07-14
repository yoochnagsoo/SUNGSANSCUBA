import { discoverScubaDepthStages } from "@/data/discoverScuba";

export default function DepthGuide() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {discoverScubaDepthStages.map((stage, index) => (
        <article
          key={stage.depth}
          className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black text-cyan-600">
                STEP {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-2 text-2xl font-black text-slate-950">
                {stage.depth}
              </h3>
            </div>
            <div className="rounded-2xl bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-700 ring-1 ring-cyan-100">
              최대 5m
            </div>
          </div>

          <p className="mt-4 text-lg font-black text-slate-900">
            {stage.title}
          </p>
          <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
            {stage.description}
          </p>
        </article>
      ))}
    </div>
  );
}
