"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  GripVertical,
  ImagePlus,
  Loader2,
  Pencil,
  RotateCcw,
  Save,
  Trash2,
  UploadCloud,
} from "lucide-react";

type GalleryImage = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

type GalleryListResponse = {
  ok: boolean;
  images?: GalleryImage[];
  message?: string;
};

type GallerySaveResponse = {
  ok: boolean;
  image?: GalleryImage;
  message?: string;
};

type UploadResponse = {
  ok: boolean;
  key?: string;
  url?: string;
  imageUrl?: string;
  publicUrl?: string;
  message?: string;
};

const initialForm = {
  title: "",
  description: "",
  imageUrl: "",
  sortOrder: "999",
  isVisible: true,
};

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

export default function AdminGalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [form, setForm] = useState(initialForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [draggingImageId, setDraggingImageId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const [message, setMessage] = useState("");

  const visibleCount = useMemo(
    () => images.filter((image) => image.isVisible).length,
    [images],
  );

  const isEditing = Boolean(editingImageId);

  async function loadImages() {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/gallery?admin=1", {
        cache: "no-store",
      });

      const data = (await response.json()) as GalleryListResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? "갤러리 목록을 불러오지 못했습니다.");
      }

      setImages(data.images ?? []);
      setHasOrderChanged(false);
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "갤러리 목록을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadImages();
  }, []);

  function resetForm() {
    setForm(initialForm);
    setSelectedFile(null);
    setEditingImageId(null);
    setMessage("");
  }

  function startEdit(image: GalleryImage) {
    setEditingImageId(image.id);
    setSelectedFile(null);
    setForm({
      title: image.title,
      description: image.description,
      imageUrl: image.imageUrl,
      sortOrder: String(image.sortOrder),
      isVisible: image.isVisible,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    setMessage(`"${image.title}" 이미지를 수정 중입니다.`);
  }

  function handleDragStart(imageId: string) {
    setDraggingImageId(imageId);
  }

  function handleDragOver(targetImageId: string) {
    if (!draggingImageId || draggingImageId === targetImageId) {
      return;
    }

    setImages((currentImages) => {
      const fromIndex = currentImages.findIndex(
        (image) => image.id === draggingImageId,
      );
      const toIndex = currentImages.findIndex(
        (image) => image.id === targetImageId,
      );

      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return currentImages;
      }

      return moveItem(currentImages, fromIndex, toIndex);
    });

    setHasOrderChanged(true);
  }

  function handleDragEnd() {
    setDraggingImageId(null);
  }

  async function handleSaveOrder() {
    if (!hasOrderChanged) {
      setMessage("변경된 순서가 없습니다.");
      return;
    }

    setIsSavingOrder(true);
    setMessage("");

    try {
      const orderedImages = images.map((image, index) => ({
        ...image,
        sortOrder: index + 1,
      }));

      await Promise.all(
        orderedImages.map((image) =>
          fetch(`/api/gallery/${image.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sortOrder: image.sortOrder,
            }),
          }).then(async (response) => {
            const data = await response.json();

            if (!response.ok || !data.ok) {
              throw new Error(
                data.message ?? `"${image.title}" 순서 저장 실패`,
              );
            }
          }),
        ),
      );

      setImages(orderedImages);
      setHasOrderChanged(false);
      setMessage("갤러리 순서가 저장되었습니다.");
      await loadImages();
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "갤러리 순서를 저장하지 못했습니다.",
      );
    } finally {
      setIsSavingOrder(false);
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      setMessage("업로드할 이미지를 먼저 선택해주세요.");
      return;
    }

    setIsUploading(true);
    setMessage("");

    try {
      const uploadForm = new FormData();
      uploadForm.append("file", selectedFile);

      const response = await fetch("/api/admin/gallery/upload", {
        method: "POST",
        body: uploadForm,
      });

      const data = (await response.json()) as UploadResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? "이미지 업로드에 실패했습니다.");
      }

      const uploadedUrl = data.url ?? data.imageUrl ?? data.publicUrl;

      if (!uploadedUrl) {
        throw new Error("업로드 URL을 응답에서 찾을 수 없습니다.");
      }

      setForm((prev) => ({
        ...prev,
        imageUrl: uploadedUrl,
        title: prev.title || selectedFile.name.replace(/\.[^/.]+$/, ""),
      }));

      setMessage("이미지 업로드가 완료되었습니다. URL이 자동 입력되었습니다.");
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = form.title.trim();
    const imageUrl = form.imageUrl.trim();
    const sortOrder = Number(form.sortOrder || 999);

    if (!title) {
      setMessage("제목을 입력해주세요.");
      return;
    }

    if (!imageUrl) {
      setMessage("이미지 URL을 입력해주세요.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const endpoint = isEditing
        ? `/api/gallery/${editingImageId}`
        : "/api/gallery";

      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description: form.description.trim(),
          imageUrl,
          sortOrder: Number.isFinite(sortOrder) ? sortOrder : 999,
          isVisible: form.isVisible,
        }),
      });

      const data = (await response.json()) as GallerySaveResponse;

      if (!response.ok || !data.ok) {
        throw new Error(
          data.message ??
            (isEditing
              ? "갤러리 이미지를 수정하지 못했습니다."
              : "갤러리 이미지를 등록하지 못했습니다."),
        );
      }

      setForm(initialForm);
      setSelectedFile(null);
      setEditingImageId(null);
      setMessage(
        isEditing
          ? "갤러리 이미지가 수정되었습니다."
          : "갤러리 이미지가 등록되었습니다.",
      );

      await loadImages();
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : isEditing
            ? "갤러리 이미지를 수정하지 못했습니다."
            : "갤러리 이미지를 등록하지 못했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleVisible(image: GalleryImage) {
    setMessage("");

    try {
      const response = await fetch(`/api/gallery/${image.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isVisible: !image.isVisible,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? "노출 상태를 변경하지 못했습니다.");
      }

      await loadImages();

      if (editingImageId === image.id) {
        setForm((prev) => ({
          ...prev,
          isVisible: !image.isVisible,
        }));
      }
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "노출 상태를 변경하지 못했습니다.",
      );
    }
  }

  async function handleDelete(image: GalleryImage) {
    const confirmed = window.confirm(
      `"${image.title}" 이미지를 삭제하시겠습니까?\n\n갤러리 등록 정보와 S3에 업로드된 원본 이미지가 함께 삭제됩니다.`,
    );

    if (!confirmed) {
      return;
    }

    setMessage("");

    try {
      const response = await fetch(`/api/gallery/${image.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? "갤러리 이미지를 삭제하지 못했습니다.");
      }

      if (editingImageId === image.id) {
        resetForm();
      }

      await loadImages();
      setMessage("갤러리 이미지가 삭제되었습니다.");
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "갤러리 이미지를 삭제하지 못했습니다.",
      );
    }
  }

  return (
    <div className="space-y-8 text-slate-950">
      <section className="overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 px-6 py-7 text-white">
          <p className="text-sm font-black text-cyan-100">Gallery Admin</p>

          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                갤러리 관리
              </h1>
              <p className="mt-2 text-sm font-semibold text-slate-100">
                S3에 이미지를 업로드하고 갤러리 노출 여부와 표시 순서를 관리합니다.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                <p className="font-bold text-slate-100">전체 이미지</p>
                <p className="mt-1 text-2xl font-black text-white">
                  {images.length}
                </p>
              </div>

              <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                <p className="font-bold text-slate-100">노출 중</p>
                <p className="mt-1 text-2xl font-black text-white">
                  {visibleCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 p-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-3xl border border-dashed border-slate-400 bg-slate-100 p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-cyan-600 text-white">
                  <UploadCloud size={22} />
                </div>

                <div>
                  <h2 className="font-black text-slate-950">이미지 업로드</h2>
                  <p className="text-xs font-bold text-slate-700">
                    S3 업로드 후 URL 자동 입력
                  </p>
                </div>
              </div>

              <input
                type="file"
                accept="image/*"
                className="mt-5 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-black file:text-white"
                onChange={(event) => {
                  setSelectedFile(event.target.files?.[0] ?? null);
                }}
              />

              <button
                type="button"
                onClick={handleUpload}
                disabled={isUploading || !selectedFile}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:text-slate-100"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    업로드 중
                  </>
                ) : (
                  <>
                    <UploadCloud size={18} />
                    S3 업로드
                  </>
                )}
              </button>

              {form.imageUrl ? (
                <div className="mt-5 overflow-hidden rounded-2xl border border-slate-300 bg-white">
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={form.imageUrl}
                      alt="업로드 이미지 미리보기"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 360px"
                      unoptimized
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-5 flex aspect-[4/3] items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-700">
                  <div className="text-center">
                    <ImagePlus className="mx-auto mb-2" size={32} />
                    <p className="text-sm font-bold">이미지 미리보기</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5 lg:col-span-2">
            {isEditing ? (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-100 px-4 py-3 text-sm text-amber-950">
                <Pencil className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-black">수정 모드</p>
                  <p className="mt-1 font-semibold">
                    현재 선택한 갤러리 이미지를 수정 중입니다. 새 이미지를
                    업로드하면 이미지 URL이 새 파일로 교체됩니다.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-black text-slate-950">제목</span>
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                  placeholder="예: 성산 바다 체험다이빙"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-950">
                  정렬 순서
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
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                  placeholder="낮을수록 먼저 노출"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-black text-slate-950">설명</span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                rows={4}
                className="mt-2 w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                placeholder="갤러리 이미지 설명을 입력하세요."
              />
            </label>

            <label className="block">
              <span className="text-sm font-black text-slate-950">
                이미지 URL
              </span>
              <input
                value={form.imageUrl}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    imageUrl: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                placeholder="S3 업로드 후 자동 입력됩니다."
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3">
              <input
                type="checkbox"
                checked={form.isVisible}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    isVisible: event.target.checked,
                  }))
                }
                className="size-4 rounded border-slate-400"
              />
              <span className="text-sm font-black text-slate-950">
                홈페이지 갤러리에 노출
              </span>
            </label>

            {message ? (
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-black text-slate-950">
                {message}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              {isEditing ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-400 bg-white px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-100"
                >
                  <RotateCcw size={18} />
                  새 등록으로 전환
                </button>
              ) : null}

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    저장 중
                  </>
                ) : isEditing ? (
                  <>
                    <CheckCircle2 size={18} />
                    수정 저장
                  </>
                ) : (
                  <>
                    <ImagePlus size={18} />
                    갤러리 등록
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black text-cyan-700">
              Registered Images
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-950">
              등록된 갤러리
            </h2>
            <p className="mt-2 text-sm font-bold text-slate-700">
              카드를 드래그해서 표시 순서를 바꾼 뒤 순서 저장을 눌러주세요.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={loadImages}
              className="rounded-2xl border border-slate-400 bg-white px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-slate-100"
            >
              새로고침
            </button>

            <button
              type="button"
              onClick={handleSaveOrder}
              disabled={!hasOrderChanged || isSavingOrder}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2 text-sm font-black text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSavingOrder ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  저장 중
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  순서 저장
                </>
              )}
            </button>
          </div>
        </div>

        {hasOrderChanged ? (
          <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-100 px-4 py-3 text-sm font-black text-amber-950">
            순서가 변경되었습니다. 반영하려면 “순서 저장”을 눌러주세요.
          </div>
        ) : null}

        {isLoading ? (
          <div className="mt-8 flex items-center justify-center rounded-3xl bg-slate-100 py-16 text-slate-900">
            <Loader2 className="mr-2 animate-spin" size={20} />
            <span className="font-black">갤러리 목록을 불러오는 중입니다.</span>
          </div>
        ) : images.length === 0 ? (
          <div className="mt-8 flex items-center justify-center rounded-3xl bg-slate-100 py-16 text-center font-black text-slate-900">
            등록된 갤러리 이미지가 없습니다.
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {images.map((image, index) => {
              const isCurrentEditing = editingImageId === image.id;
              const isDragging = draggingImageId === image.id;

              return (
                <article
                  key={image.id}
                  draggable
                  onDragStart={() => handleDragStart(image.id)}
                  onDragOver={(event) => {
                    event.preventDefault();
                    handleDragOver(image.id);
                  }}
                  onDragEnd={handleDragEnd}
                  className={[
                    "overflow-hidden rounded-3xl border bg-white shadow-sm transition",
                    "cursor-grab active:cursor-grabbing",
                    isDragging ? "scale-[0.98] opacity-60" : "",
                    isCurrentEditing
                      ? "border-amber-400 ring-4 ring-amber-100"
                      : "border-slate-300",
                  ].join(" ")}
                >
                  <div className="relative aspect-[4/3] bg-slate-200">
                    <Image
                      src={image.imageUrl}
                      alt={image.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      unoptimized
                    />

                    <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-slate-950 shadow-sm backdrop-blur">
                      <GripVertical className="h-3.5 w-3.5" />
                      {index + 1}
                    </div>

                    <div
                      className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-black shadow-sm backdrop-blur ${
                        image.isVisible
                          ? "bg-cyan-600 text-white"
                          : "bg-slate-900 text-white"
                      }`}
                    >
                      {image.isVisible ? "노출중" : "숨김"}
                    </div>

                    {isCurrentEditing ? (
                      <div className="absolute bottom-3 left-3 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-amber-950 shadow-sm">
                        수정 중
                      </div>
                    ) : null}
                  </div>

                  <div className="p-5">
                    <h3 className="line-clamp-1 text-base font-black text-slate-950">
                      {image.title}
                    </h3>

                    <p className="mt-2 line-clamp-2 min-h-10 text-sm font-bold text-slate-700">
                      {image.description || "설명 없음"}
                    </p>

                    <p className="mt-3 truncate rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                      {image.imageUrl}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(image)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-400 bg-white px-3 py-2 text-sm font-black text-slate-950 transition hover:bg-slate-100"
                      >
                        <Pencil size={16} />
                        수정
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleVisible(image)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-400 bg-white px-3 py-2 text-sm font-black text-slate-950 transition hover:bg-slate-100"
                      >
                        {image.isVisible ? (
                          <>
                            <EyeOff size={16} />
                            숨김
                          </>
                        ) : (
                          <>
                            <Eye size={16} />
                            노출
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(image)}
                        className="col-span-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-100 px-3 py-2 text-sm font-black text-rose-700 transition hover:bg-rose-200"
                      >
                        <Trash2 size={16} />
                        삭제
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}