"use client";

import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

type Fish = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type FormState = {
  name: string;
  description: string;
  imageUrl: string;
  sortOrder: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  imageUrl: "",
  sortOrder: "0",
  isActive: true,
};

function toPayload(form: FormState) {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    imageUrl: form.imageUrl.trim(),
    sortOrder: Number(form.sortOrder || 0),
    isActive: form.isActive,
  };
}

function toForm(fish: Fish): FormState {
  return {
    name: fish.name,
    description: fish.description,
    imageUrl: fish.imageUrl || "",
    sortOrder: String(fish.sortOrder ?? 0),
    isActive: fish.isActive !== false,
  };
}

function sortFish(items: Fish[]) {
  return [...items].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }

    return a.name.localeCompare(b.name);
  });
}

export default function AdminDiscoverScubaFishPage() {
  const [fishItems, setFishItems] = useState<Fish[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReordering, setIsReordering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [draggedFishId, setDraggedFishId] = useState<string | null>(null);
  const [dragOverFishId, setDragOverFishId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sortedFish = useMemo(() => sortFish(fishItems), [fishItems]);

  async function loadFish() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/discover-scuba-fish", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "목록을 불러오지 못했습니다.");
      }

      setFishItems(Array.isArray(data.fish) ? data.fish : []);

      if (data.message) {
        setMessage(data.message);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "목록을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadFish();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setMessage("");
  }

  function startEdit(fish: Fish) {
    setForm(toForm(fish));
    setEditingId(fish.id);
    setError("");
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = toPayload(form);
      const response = await fetch(
        editingId
          ? `/api/admin/discover-scuba-fish/${editingId}`
          : "/api/admin/discover-scuba-fish",
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "저장하지 못했습니다.");
      }

      setMessage(editingId ? "생물 정보를 수정했습니다." : "생물 정보를 등록했습니다.");
      resetForm();
      await loadFish();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "저장하지 못했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadImage(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    setIsUploading(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "/api/admin/discover-scuba-fish/upload-image",
        {
          method: "POST",
          body: formData,
        },
      );
      const data = await response.json();

      if (!response.ok || !data.ok || !data.imageUrl) {
        throw new Error(data.message || "이미지를 업로드하지 못했습니다.");
      }

      setForm((prev) => ({
        ...prev,
        imageUrl: data.imageUrl,
      }));
      setMessage("이미지를 업로드했습니다.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "이미지를 업로드하지 못했습니다.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      void uploadImage(file);
    }

    event.target.value = "";
  }

  async function handleDelete(fish: Fish) {
    if (!window.confirm(`${fish.name} 항목을 삭제할까요?`)) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/discover-scuba-fish/${fish.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "삭제하지 못했습니다.");
      }

      setMessage("생물 항목을 삭제했습니다.");
      if (editingId === fish.id) {
        resetForm();
      }
      await loadFish();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "삭제하지 못했습니다.",
      );
    }
  }

  async function toggleActive(fish: Fish) {
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/discover-scuba-fish/${fish.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !fish.isActive,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "노출 상태를 변경하지 못했습니다.");
      }

      await loadFish();
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "노출 상태를 변경하지 못했습니다.",
      );
    }
  }

  async function persistReorderedItems(items: Fish[]) {
    const reorderedItems = items.map((fish, index) => ({
      ...fish,
      sortOrder: (index + 1) * 10,
    }));

    setFishItems(reorderedItems);
    setIsReordering(true);
    setError("");
    setMessage("");

    try {
      await Promise.all(
        reorderedItems.map((fish) =>
          fetch(`/api/admin/discover-scuba-fish/${fish.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sortOrder: fish.sortOrder,
            }),
          }).then(async (response) => {
            const data = await response.json();

            if (!response.ok || !data.ok) {
              throw new Error(data.message || "순서를 저장하지 못했습니다.");
            }
          }),
        ),
      );

      if (editingId) {
        const editingItem = reorderedItems.find((fish) => fish.id === editingId);

        if (editingItem) {
          setForm((prev) => ({
            ...prev,
            sortOrder: String(editingItem.sortOrder),
          }));
        }
      }

      setMessage("노출 순서를 변경했습니다.");
    } catch (reorderError) {
      setError(
        reorderError instanceof Error
          ? reorderError.message
          : "순서를 저장하지 못했습니다.",
      );
      await loadFish();
    } finally {
      setIsReordering(false);
    }
  }

  function handleDragStart(event: DragEvent<HTMLElement>, fishId: string) {
    setDraggedFishId(fishId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", fishId);
  }

  function handleDragOver(event: DragEvent<HTMLElement>, fishId: string) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverFishId(fishId);
  }

  function handleDragEnd() {
    setDraggedFishId(null);
    setDragOverFishId(null);
  }

  function handleDrop(event: DragEvent<HTMLElement>, targetFishId: string) {
    event.preventDefault();

    const sourceFishId =
      draggedFishId || event.dataTransfer.getData("text/plain");

    setDraggedFishId(null);
    setDragOverFishId(null);

    if (!sourceFishId || sourceFishId === targetFishId) {
      return;
    }

    const sourceIndex = sortedFish.findIndex((fish) => fish.id === sourceFishId);
    const targetIndex = sortedFish.findIndex((fish) => fish.id === targetFishId);

    if (sourceIndex < 0 || targetIndex < 0) {
      return;
    }

    const nextItems = [...sortedFish];
    const [movedItem] = nextItems.splice(sourceIndex, 1);
    nextItems.splice(targetIndex, 0, movedItem);

    void persistReorderedItems(nextItems);
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-600">
              Discover Scuba
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">
              체험 생물 관리
            </h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              체험다이빙 상세 페이지의 물고기, 소라, 해삼, 해조류 등 바다 생물 정보를 관리합니다.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadFish()}
            className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            <RefreshCw className="h-4 w-4" />
            새로고침
          </button>
        </div>

        {message ? (
          <div className="mb-4 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-800">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-black">
                {editingId ? "항목 수정" : "새 항목 등록"}
              </h2>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
                  aria-label="수정 취소"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <Plus className="h-5 w-5 text-cyan-600" />
              )}
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-black text-slate-700">이름</span>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                  placeholder="자리돔"
                />
              </label>

              <div>
                <span className="text-sm font-black text-slate-700">
                  이미지
                </span>
                <label className="mt-2 flex min-h-44 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center transition hover:border-cyan-300 hover:bg-cyan-50/50">
                  {form.imageUrl ? (
                    <img
                      src={form.imageUrl}
                      alt="바다 생물 이미지 미리보기"
                      className="mb-4 h-32 w-full rounded-xl object-cover"
                    />
                  ) : (
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-cyan-600 shadow-sm">
                      {isUploading ? (
                        <Loader2 className="h-7 w-7 animate-spin" />
                      ) : (
                        <UploadCloud className="h-7 w-7" />
                      )}
                    </div>
                  )}

                  <p className="text-sm font-black text-slate-800">
                    {isUploading ? "업로드 중입니다" : "클릭해서 이미지 업로드"}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    JPG, PNG, WEBP, GIF, AVIF / 최대 10MB
                  </p>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>

                {form.imageUrl ? (
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        imageUrl: "",
                      }))
                    }
                    className="mt-2 text-xs font-black text-rose-600 hover:text-rose-700"
                  >
                    이미지 제거
                  </button>
                ) : null}
              </div>

              <label className="block">
                <span className="text-sm font-black text-slate-700">설명</span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  className="mt-2 min-h-32 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-7 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                  placeholder="체험 중 만날 수 있는 바다 생물 설명"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-black text-slate-700">
                    정렬순서
                  </span>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        sortOrder: event.target.value,
                      }))
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                  />
                </label>

                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        isActive: event.target.checked,
                      }))
                    }
                    className="h-5 w-5 rounded border-slate-300 text-cyan-600"
                  />
                  <span className="text-sm font-black text-slate-700">
                    상세 페이지 노출
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                저장하기
              </button>
            </div>
          </form>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-black">등록된 바다 생물</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                {sortedFish.length}개
              </span>
            </div>

            {isLoading ? (
              <div className="flex h-48 items-center justify-center text-sm font-bold text-slate-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                불러오는 중
              </div>
            ) : sortedFish.length === 0 ? (
              <div className="flex h-48 items-center justify-center rounded-2xl bg-slate-50 text-sm font-bold text-slate-500">
                등록된 바다 생물이 없습니다.
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {sortedFish.map((fish) => (
                  <article
                    key={fish.id}
                    draggable={!isReordering}
                    onDragStart={(event) => handleDragStart(event, fish.id)}
                    onDragOver={(event) => handleDragOver(event, fish.id)}
                    onDragLeave={() => setDragOverFishId(null)}
                    onDrop={(event) => handleDrop(event, fish.id)}
                    onDragEnd={handleDragEnd}
                    className={[
                      "overflow-hidden rounded-2xl border bg-white transition",
                      isReordering ? "cursor-wait" : "cursor-grab active:cursor-grabbing",
                      draggedFishId === fish.id
                        ? "border-cyan-300 opacity-60"
                        : dragOverFishId === fish.id
                          ? "border-cyan-400 ring-4 ring-cyan-100"
                          : "border-slate-200",
                    ].join(" ")}
                  >
                    <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-slate-100">
                      {fish.imageUrl ? (
                        <img
                          src={fish.imageUrl}
                          alt={fish.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-cyan-700 shadow-sm">
                          <ImageIcon className="h-7 w-7" />
                        </div>
                      )}
                      <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
                        #{fish.sortOrder}
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-black">
                            {fish.name}
                          </h3>
                          <p className="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-slate-600">
                            {fish.description}
                          </p>
                        </div>
                        <span
                          className={[
                            "shrink-0 rounded-full px-3 py-1 text-xs font-black",
                            fish.isActive
                              ? "bg-cyan-50 text-cyan-700"
                              : "bg-slate-100 text-slate-500",
                          ].join(" ")}
                        >
                          {fish.isActive ? "노출" : "숨김"}
                        </span>
                      </div>

                      <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-black text-slate-500">
                        드래그해서 순서 변경
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(fish)}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-100 text-sm font-black text-slate-700 hover:bg-slate-200"
                        >
                          <Pencil className="h-4 w-4" />
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => void toggleActive(fish)}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-100 text-sm font-black text-slate-700 hover:bg-slate-200"
                        >
                          {fish.isActive ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          {fish.isActive ? "숨김" : "노출"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(fish)}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-50 text-sm font-black text-rose-700 hover:bg-rose-100"
                        >
                          <Trash2 className="h-4 w-4" />
                          삭제
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
