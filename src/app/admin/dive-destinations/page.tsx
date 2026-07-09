"use client";

import Image from "next/image";
import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Thermometer,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

type DiveDestinationWaterTemperature = {
  season: string;
  months: string;
  temperature: string;
};

type DiveDestination = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrls: string[];
  depth: string;
  level: string;
  highlights: string[];
  waterTemperatures: DiveDestinationWaterTemperature[];
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type FormState = {
  title: string;
  subtitle: string;
  description: string;
  imageUrls: string[];
  depth: string;
  level: string;
  highlightsText: string;
  waterTemperatures: DiveDestinationWaterTemperature[];
  sortOrder: string;
  isActive: boolean;
};

const defaultWaterTemperatures: DiveDestinationWaterTemperature[] = [
  {
    season: "봄",
    months: "3~5월",
    temperature: "14~18°C",
  },
  {
    season: "여름",
    months: "6~8월",
    temperature: "20~27°C",
  },
  {
    season: "가을",
    months: "9~11월",
    temperature: "19~25°C",
  },
  {
    season: "겨울",
    months: "12~2월",
    temperature: "13~16°C",
  },
];

function createDefaultWaterTemperatures(): DiveDestinationWaterTemperature[] {
  return defaultWaterTemperatures.map((item) => ({
    ...item,
  }));
}

function createEmptyForm(): FormState {
  return {
    title: "",
    subtitle: "",
    description: "",
    imageUrls: [],
    depth: "",
    level: "",
    highlightsText: "",
    waterTemperatures: createDefaultWaterTemperatures(),
    sortOrder: "0",
    isActive: true,
  };
}

function normalizeWaterTemperatures(
  value: unknown
): DiveDestinationWaterTemperature[] {
  if (!Array.isArray(value)) {
    return createDefaultWaterTemperatures();
  }

  const items = value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const data = item as Record<string, unknown>;

      return {
        season: String(data.season ?? "").trim(),
        months: String(data.months ?? "").trim(),
        temperature: String(data.temperature ?? "").trim(),
      };
    })
    .filter(
      (item): item is DiveDestinationWaterTemperature =>
        !!item && !!item.season && !!item.temperature
    );

  return items.length > 0 ? items : createDefaultWaterTemperatures();
}

function normalizeDestination(item: Partial<DiveDestination>): DiveDestination {
  return {
    id: String(item.id ?? ""),
    title: String(item.title ?? ""),
    subtitle: String(item.subtitle ?? ""),
    description: String(item.description ?? ""),
    imageUrls: Array.isArray(item.imageUrls)
      ? item.imageUrls.map(String).filter(Boolean)
      : [],
    depth: String(item.depth ?? ""),
    level: String(item.level ?? ""),
    highlights: Array.isArray(item.highlights)
      ? item.highlights.map(String).filter(Boolean)
      : [],
    waterTemperatures: normalizeWaterTemperatures(item.waterTemperatures),
    sortOrder:
      typeof item.sortOrder === "number"
        ? item.sortOrder
        : Number(item.sortOrder ?? 0),
    isActive: item.isActive !== false,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function toFormState(destination: DiveDestination): FormState {
  return {
    title: destination.title,
    subtitle: destination.subtitle,
    description: destination.description,
    imageUrls: Array.isArray(destination.imageUrls)
      ? destination.imageUrls
      : [],
    depth: destination.depth,
    level: destination.level,
    highlightsText: Array.isArray(destination.highlights)
      ? destination.highlights.join("\n")
      : "",
    waterTemperatures: normalizeWaterTemperatures(
      destination.waterTemperatures
    ),
    sortOrder: String(destination.sortOrder),
    isActive: destination.isActive,
  };
}

function toPayload(form: FormState) {
  const waterTemperatures = Array.isArray(form.waterTemperatures)
    ? form.waterTemperatures
    : createDefaultWaterTemperatures();

  return {
    title: form.title.trim(),
    subtitle: form.subtitle.trim(),
    description: form.description.trim(),
    imageUrls: form.imageUrls.map((url) => url.trim()).filter(Boolean),
    depth: form.depth.trim(),
    level: form.level.trim(),
    highlights: form.highlightsText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
    waterTemperatures: waterTemperatures
      .map((item) => ({
        season: item.season.trim(),
        months: item.months.trim(),
        temperature: item.temperature.trim(),
      }))
      .filter((item) => item.season && item.temperature),
    sortOrder: Number(form.sortOrder || 0),
    isActive: form.isActive,
  };
}

function extractUploadedImageUrl(result: unknown): string {
  if (!result || typeof result !== "object") {
    return "";
  }

  const data = result as Record<string, unknown>;

  const candidates = [
    data.imageUrl,
    data.url,
    data.publicUrl,
    data.location,
    data.fileUrl,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

export default function AdminDiveDestinationsPage() {
  const [destinations, setDestinations] = useState<DiveDestination[]>([]);
  const [form, setForm] = useState<FormState>(() => createEmptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const sortedDestinations = useMemo(() => {
    return [...destinations].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }

      return a.title.localeCompare(b.title);
    });
  }, [destinations]);

  const editingDestination = useMemo(() => {
    if (!editingId) {
      return null;
    }

    return destinations.find((item) => item.id === editingId) ?? null;
  }, [destinations, editingId]);

  const safeWaterTemperatures = Array.isArray(form.waterTemperatures)
    ? form.waterTemperatures
    : createDefaultWaterTemperatures();

  async function loadDestinations() {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/dive-destinations", {
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ??
            data?.error ??
            "다이빙 포인트 목록을 불러오지 못했습니다."
        );
      }

      const rawItems = Array.isArray(data)
        ? data
        : Array.isArray(data?.destinations)
          ? data.destinations
          : Array.isArray(data?.items)
            ? data.items
            : [];

      setDestinations(rawItems.map(normalizeDestination));
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "다이빙 포인트 목록을 불러오지 못했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDestinations();
  }, []);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function updateWaterTemperature(
    index: number,
    key: keyof DiveDestinationWaterTemperature,
    value: string
  ) {
    setForm((prev) => {
      const currentWaterTemperatures = Array.isArray(prev.waterTemperatures)
        ? prev.waterTemperatures
        : createDefaultWaterTemperatures();

      return {
        ...prev,
        waterTemperatures: currentWaterTemperatures.map((item, currentIndex) =>
          currentIndex === index
            ? {
                ...item,
                [key]: value,
              }
            : item
        ),
      };
    });
  }

  function addWaterTemperature() {
    setForm((prev) => {
      const currentWaterTemperatures = Array.isArray(prev.waterTemperatures)
        ? prev.waterTemperatures
        : createDefaultWaterTemperatures();

      return {
        ...prev,
        waterTemperatures: [
          ...currentWaterTemperatures,
          {
            season: "",
            months: "",
            temperature: "",
          },
        ],
      };
    });
  }

  function removeWaterTemperature(index: number) {
    setForm((prev) => {
      const currentWaterTemperatures = Array.isArray(prev.waterTemperatures)
        ? prev.waterTemperatures
        : createDefaultWaterTemperatures();

      return {
        ...prev,
        waterTemperatures: currentWaterTemperatures.filter(
          (_, currentIndex) => currentIndex !== index
        ),
      };
    });
  }

  function resetWaterTemperatures() {
    setForm((prev) => ({
      ...prev,
      waterTemperatures: createDefaultWaterTemperatures(),
    }));
  }

  function resetForm() {
    setForm(createEmptyForm());
    setEditingId(null);
    setMessage("");
  }

  function startEdit(destination: DiveDestination) {
    setEditingId(destination.id);
    setForm(toFormState(destination));
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function addImageUrl(imageUrl: string) {
    setForm((prev) => ({
      ...prev,
      imageUrls: [...prev.imageUrls, imageUrl],
    }));
  }

  function removeImageUrl(index: number) {
    setForm((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter(
        (_, currentIndex) => currentIndex !== index
      ),
    }));
  }

  function moveImage(index: number, direction: "left" | "right") {
    setForm((prev) => {
      const nextImageUrls = [...prev.imageUrls];
      const targetIndex = direction === "left" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= nextImageUrls.length) {
        return prev;
      }

      const current = nextImageUrls[index];
      nextImageUrls[index] = nextImageUrls[targetIndex];
      nextImageUrls[targetIndex] = current;

      return {
        ...prev,
        imageUrls: nextImageUrls,
      };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = toPayload(form);

    if (!payload.title) {
      setMessage("제목을 입력해주세요.");
      return;
    }

    if (!payload.description) {
      setMessage("설명을 입력해주세요.");
      return;
    }

    if (payload.imageUrls.length === 0) {
      setMessage("이미지를 1장 이상 업로드해주세요.");
      return;
    }

    if (payload.waterTemperatures.length === 0) {
      setMessage("수온 정보를 1개 이상 입력해주세요.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const endpoint = editingId
        ? `/api/admin/dive-destinations/${editingId}`
        : "/api/admin/dive-destinations";

      const response = await fetch(endpoint, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ??
            data?.error ??
            (editingId
              ? "다이빙 포인트 수정 중 오류가 발생했습니다."
              : "다이빙 포인트 등록 중 오류가 발생했습니다.")
        );
      }

      setMessage(
        editingId
          ? "다이빙 포인트가 수정되었습니다."
          : "다이빙 포인트가 등록되었습니다."
      );

      resetForm();
      await loadDestinations();
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error ? error.message : "저장 중 오류가 발생했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadFiles(files: File[]) {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      setMessage("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    setIsUploading(true);
    setMessage("");

    try {
      for (const file of imageFiles) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
          "/api/admin/dive-destinations/upload-image",
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message ??
              data?.error ??
              "이미지 업로드 중 오류가 발생했습니다."
          );
        }

        const imageUrl = extractUploadedImageUrl(data);

        if (!imageUrl) {
          throw new Error("업로드 응답에서 이미지 URL을 찾지 못했습니다.");
        }

        addImageUrl(imageUrl);
      }

      setMessage(`${imageFiles.length}장의 이미지가 업로드되었습니다.`);
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "이미지 업로드 중 오류가 발생했습니다."
      );
    } finally {
      setIsUploading(false);
      setDragActive(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length > 0) {
      uploadFiles(files);
    }

    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();

    const files = Array.from(event.dataTransfer.files ?? []);

    if (files.length > 0) {
      uploadFiles(files);
    }
  }

  async function handleDelete(destination: DiveDestination) {
    const ok = window.confirm(
      `"${destination.title}" 다이빙 포인트를 삭제할까요?\n삭제 후에는 복구할 수 없습니다.`
    );

    if (!ok) {
      return;
    }

    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/dive-destinations/${destination.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ??
            data?.error ??
            "다이빙 포인트 삭제 중 오류가 발생했습니다."
        );
      }

      if (editingId === destination.id) {
        resetForm();
      }

      setMessage("다이빙 포인트가 삭제되었습니다.");
      await loadDestinations();
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error ? error.message : "삭제 중 오류가 발생했습니다."
      );
    }
  }

  async function toggleActive(destination: DiveDestination) {
    try {
      const response = await fetch(
        `/api/admin/dive-destinations/${destination.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...destination,
            isActive: !destination.isActive,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ??
            data?.error ??
            "노출 상태 변경 중 오류가 발생했습니다."
        );
      }

      await loadDestinations();
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "노출 상태 변경 중 오류가 발생했습니다."
      );
    }
  }

  async function moveSortOrder(
    destination: DiveDestination,
    direction: "up" | "down"
  ) {
    const nextSortOrder =
      direction === "up"
        ? destination.sortOrder - 1
        : destination.sortOrder + 1;

    try {
      const response = await fetch(
        `/api/admin/dive-destinations/${destination.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...destination,
            sortOrder: nextSortOrder,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ??
            data?.error ??
            "정렬 순서 변경 중 오류가 발생했습니다."
        );
      }

      await loadDestinations();
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "정렬 순서 변경 중 오류가 발생했습니다."
      );
    }
  }

  return (
    <div className="w-full min-w-0 space-y-8 overflow-x-hidden">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-600">
              Dive Destinations
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              다이빙 포인트 관리
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              메인 페이지 Dive Destinations 영역에 노출되는 포인트, 이미지,
              수온 정보를 관리합니다.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDestinations}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            새로고침
          </button>
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-5 py-4 text-sm font-semibold text-cyan-800">
          {message}
        </div>
      ) : null}

      <div className="grid min-w-0 gap-8 2xl:grid-cols-[440px_minmax(0,1fr)]">
        <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                {editingId ? "다이빙 포인트 수정" : "다이빙 포인트 등록"}
              </h2>
              {editingDestination ? (
                <p className="mt-1 text-xs font-medium text-slate-500">
                  수정 중: {editingDestination.title}
                </p>
              ) : (
                <p className="mt-1 text-xs font-medium text-slate-500">
                  첫 번째 이미지가 대표 이미지로 사용됩니다.
                </p>
              )}
            </div>

            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                취소
              </button>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-bold text-slate-800">
                포인트 이미지
              </label>

              <label
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setDragActive(false);
                }}
                onDrop={handleDrop}
                className={[
                  "mt-2 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-4 py-6 text-center transition",
                  dragActive
                    ? "border-cyan-400 bg-cyan-50"
                    : "border-slate-200 bg-slate-50 hover:border-cyan-300 hover:bg-cyan-50/50",
                ].join(" ")}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-cyan-600 shadow-sm">
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <UploadCloud className="h-6 w-6" />
                  )}
                </div>
                <p className="mt-3 text-sm font-bold text-slate-800">
                  여러 이미지를 드래그하거나 클릭해서 업로드
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  첫 번째 이미지가 대표 이미지입니다.
                </p>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>

              {form.imageUrls.length > 0 ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {form.imageUrls.map((imageUrl, index) => (
                    <div
                      key={`${imageUrl}-${index}`}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewImageUrl(imageUrl)}
                        className="relative h-28 w-full bg-slate-100"
                      >
                        <Image
                          src={imageUrl}
                          alt={`다이빙 포인트 이미지 ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        {index === 0 ? (
                          <span className="absolute left-2 top-2 rounded-full bg-cyan-500 px-2 py-1 text-[10px] font-black text-white">
                            대표
                          </span>
                        ) : null}
                      </button>

                      <div className="grid grid-cols-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => moveImage(index, "left")}
                          className="flex items-center justify-center py-2 text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                          disabled={index === 0}
                          aria-label="이미지 왼쪽 이동"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(index, "right")}
                          className="flex items-center justify-center py-2 text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                          disabled={index === form.imageUrls.length - 1}
                          aria-label="이미지 오른쪽 이동"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImageUrl(index)}
                          className="flex items-center justify-center py-2 text-rose-500 hover:bg-rose-50"
                          aria-label="이미지 삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div>
              <label className="text-sm font-bold text-slate-800">제목</label>
              <input
                value={form.title}
                onChange={(event) => updateForm("title", event.target.value)}
                placeholder="예: 섬여"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-800">
                부제목 / 위치
              </label>
              <input
                value={form.subtitle}
                onChange={(event) => updateForm("subtitle", event.target.value)}
                placeholder="예: SEONGSAN PORT"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-slate-800">수심</label>
                <input
                  value={form.depth}
                  onChange={(event) => updateForm("depth", event.target.value)}
                  placeholder="예: 10~30m"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-800">
                  난이도
                </label>
                <input
                  value={form.level}
                  onChange={(event) => updateForm("level", event.target.value)}
                  placeholder="예: Beginner ~ Advanced"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-800">설명</label>
              <textarea
                value={form.description}
                onChange={(event) =>
                  updateForm("description", event.target.value)
                }
                placeholder="메인 화면에 표시될 다이빙 포인트 설명"
                rows={5}
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-800">
                특징 / 하이라이트
              </label>
              <textarea
                value={form.highlightsText}
                onChange={(event) =>
                  updateForm("highlightsText", event.target.value)
                }
                placeholder={"한 줄에 하나씩 입력\n예: 자리돔\n예: 연산호"}
                rows={4}
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </div>

            <div className="min-w-0 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-5 w-5 shrink-0 text-cyan-600" />
                  <h3 className="text-sm font-black text-slate-900">
                    계절별 수온
                  </h3>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={resetWaterTemperatures}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    기본값
                  </button>
                  <button
                    type="button"
                    onClick={addWaterTemperature}
                    className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-700"
                  >
                    추가
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {safeWaterTemperatures.map((item, index) => (
                  <div
                    key={`${item.season}-${index}`}
                    className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-black text-slate-500">
                        수온 정보 {index + 1}
                      </p>

                      <button
                        type="button"
                        onClick={() => removeWaterTemperature(index)}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50"
                        aria-label="수온 정보 삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 grid min-w-0 gap-2">
                      <input
                        value={item.season}
                        onChange={(event) =>
                          updateWaterTemperature(
                            index,
                            "season",
                            event.target.value
                          )
                        }
                        placeholder="계절 예: 봄"
                        className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                      />

                      <input
                        value={item.months}
                        onChange={(event) =>
                          updateWaterTemperature(
                            index,
                            "months",
                            event.target.value
                          )
                        }
                        placeholder="월 예: 3~5월"
                        className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                      />

                      <input
                        value={item.temperature}
                        onChange={(event) =>
                          updateWaterTemperature(
                            index,
                            "temperature",
                            event.target.value
                          )
                        }
                        placeholder="수온 예: 14~18°C"
                        className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-slate-800">
                  정렬 순서
                </label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(event) =>
                    updateForm("sortOrder", event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-800">
                  노출 여부
                </label>
                <button
                  type="button"
                  onClick={() => updateForm("isActive", !form.isActive)}
                  className={[
                    "mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition",
                    form.isActive
                      ? "border-cyan-200 bg-cyan-50 text-cyan-700"
                      : "border-slate-200 bg-slate-50 text-slate-500",
                  ].join(" ")}
                >
                  {form.isActive ? (
                    <>
                      <Eye className="h-4 w-4" />
                      노출
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4" />
                      숨김
                    </>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingId ? (
                <Save className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {editingId ? "수정 저장" : "새 포인트 등록"}
            </button>
          </form>
        </section>

        <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                등록된 다이빙 포인트
              </h2>
              <p className="mt-1 text-xs font-medium text-slate-500">
                총 {destinations.length}개 등록됨
              </p>
            </div>
            <p className="text-xs font-semibold text-slate-400">
              정렬 순서가 낮을수록 먼저 노출됩니다.
            </p>
          </div>

          {isLoading ? (
            <div className="flex min-h-80 items-center justify-center rounded-3xl bg-slate-50">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-600" />
                <p className="mt-3 text-sm font-bold text-slate-500">
                  목록을 불러오는 중입니다.
                </p>
              </div>
            </div>
          ) : sortedDestinations.length === 0 ? (
            <div className="flex min-h-80 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
              <div>
                <ImageIcon className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-bold text-slate-700">
                  등록된 다이빙 포인트가 없습니다.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  왼쪽 등록 폼에서 첫 번째 포인트를 추가해주세요.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedDestinations.map((destination) => {
                const mainImageUrl = destination.imageUrls[0];

                return (
                  <article
                    key={destination.id}
                    className={[
                      "overflow-hidden rounded-3xl border bg-white transition",
                      editingId === destination.id
                        ? "border-cyan-300 ring-4 ring-cyan-100"
                        : "border-slate-200 hover:border-slate-300",
                    ].join(" ")}
                  >
                    <div className="grid gap-4 p-4 xl:grid-cols-[220px_minmax(0,1fr)]">
                      <button
                        type="button"
                        onClick={() =>
                          mainImageUrl
                            ? setPreviewImageUrl(mainImageUrl)
                            : undefined
                        }
                        className="relative h-44 overflow-hidden rounded-2xl bg-slate-100 xl:h-full"
                      >
                        {mainImageUrl ? (
                          <Image
                            src={mainImageUrl}
                            alt={destination.title}
                            fill
                            className="object-cover transition duration-500 hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-slate-300" />
                          </div>
                        )}

                        <span
                          className={[
                            "absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-black",
                            destination.isActive
                              ? "bg-cyan-500 text-white"
                              : "bg-slate-900/70 text-white",
                          ].join(" ")}
                        >
                          {destination.isActive ? "노출" : "숨김"}
                        </span>

                        {destination.imageUrls.length > 1 ? (
                          <span className="absolute bottom-3 right-3 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-black text-white">
                            +{destination.imageUrls.length - 1}장
                          </span>
                        ) : null}
                      </button>

                      <div className="min-w-0">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0">
                            <p className="text-xs font-black text-cyan-600">
                              SORT {destination.sortOrder}
                            </p>
                            <h3 className="mt-1 truncate text-xl font-black text-slate-950">
                              {destination.title}
                            </h3>
                            {destination.subtitle ? (
                              <p className="mt-1 text-sm font-bold text-slate-500">
                                {destination.subtitle}
                              </p>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => moveSortOrder(destination, "up")}
                              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                              위
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSortOrder(destination, "down")}
                              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                              아래
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleActive(destination)}
                              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                            >
                              {destination.isActive ? "숨김" : "노출"}
                            </button>
                            <button
                              type="button"
                              onClick={() => startEdit(destination)}
                              className="inline-flex items-center gap-1 rounded-xl border border-cyan-200 px-3 py-2 text-xs font-bold text-cyan-700 hover:bg-cyan-50"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              수정
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(destination)}
                              className="inline-flex items-center gap-1 rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              삭제
                            </button>
                          </div>
                        </div>

                        <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                          {destination.description}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {destination.depth ? (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                              수심 {destination.depth}
                            </span>
                          ) : null}
                          {destination.level ? (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                              {destination.level}
                            </span>
                          ) : null}
                          {destination.waterTemperatures.length > 0 ? (
                            <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                              수온 {destination.waterTemperatures.length}개
                            </span>
                          ) : null}
                          {destination.highlights.slice(0, 3).map((highlight) => (
                            <span
                              key={highlight}
                              className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700"
                            >
                              {highlight}
                            </span>
                          ))}
                        </div>

                        {destination.imageUrls.length > 1 ? (
                          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                            {destination.imageUrls.map((imageUrl, index) => (
                              <button
                                key={`${imageUrl}-${index}`}
                                type="button"
                                onClick={() => setPreviewImageUrl(imageUrl)}
                                className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100"
                              >
                                <Image
                                  src={imageUrl}
                                  alt={`${destination.title} 썸네일 ${
                                    index + 1
                                  }`}
                                  fill
                                  className="object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {previewImageUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewImageUrl(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-3 text-white backdrop-blur hover:bg-white/20"
            aria-label="미리보기 닫기"
          >
            <X className="h-6 w-6" />
          </button>

          <div
            className="relative h-[80vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={previewImageUrl}
              alt="다이빙 포인트 이미지 미리보기"
              fill
              className="object-contain"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}