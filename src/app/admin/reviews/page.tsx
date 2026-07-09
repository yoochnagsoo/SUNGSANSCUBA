"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Edit3,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

type Review = {
  id: string;
  userId: string;
  program: string;
  comment: string;
  images: string[];
  isVisible: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type ReviewFormState = {
  userId: string;
  program: string;
  comment: string;
  imagesText: string;
  isVisible: boolean;
  sortOrder: number;
};

const emptyForm: ReviewFormState = {
  userId: "",
  program: "체험다이빙",
  comment: "",
  imagesText: "",
  isVisible: true,
  sortOrder: 0,
};

const programOptions = [
  "체험다이빙",
  "보트다이빙",
  "펀다이빙",
  "스노클링",
  "PADI 교육",
];

function imagesTextToArray(value: string) {
  return value
    .split("\n")
    .map((image) => image.trim())
    .filter(Boolean)
    .filter((image, index, array) => array.indexOf(image) === index);
}

function imagesArrayToText(images: string[]) {
  return images.join("\n");
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(1)}MB`;
  }

  if (size >= 1024) {
    return `${Math.round(size / 1024)}KB`;
  }

  return `${size}B`;
}

export default function AdminReviewsPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [form, setForm] = useState<ReviewFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [message, setMessage] = useState("");

  const previewImages = useMemo(() => {
    return imagesTextToArray(form.imagesText);
  }, [form.imagesText]);

  async function loadReviews() {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/reviews", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "리뷰 목록을 불러오지 못했습니다.");
      }

      setReviews(data.reviews || []);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "리뷰 목록을 불러오지 못했습니다.";

      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadReviews();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setSelectedPreviewImage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function appendImageUrls(urls: string[]) {
    if (urls.length === 0) {
      return;
    }

    setForm((prev) => {
      const existing = imagesTextToArray(prev.imagesText);
      const merged = [...existing, ...urls].filter(
        (image, index, array) => array.indexOf(image) === index
      );

      return {
        ...prev,
        imagesText: imagesArrayToText(merged),
      };
    });

    setSelectedPreviewImage(urls[0] || null);
  }

  async function uploadFiles(files: FileList | File[]) {
    const fileArray = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (fileArray.length === 0) {
      setMessage("업로드할 이미지 파일을 선택해 주세요.");
      return;
    }

    setIsUploading(true);
    setMessage("");

    try {
      const formData = new FormData();

      for (const file of fileArray) {
        formData.append("images", file);
      }

      const response = await fetch("/api/admin/reviews/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "이미지 업로드 중 오류가 발생했습니다.");
      }

      const urls = (data.images || []).map(
        (image: { url: string }) => image.url
      );

      appendImageUrls(urls);

      const totalSize = fileArray.reduce((sum, file) => sum + file.size, 0);

      setMessage(
        `${fileArray.length}개 이미지 업로드 완료 (${formatFileSize(
          totalSize
        )})`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "이미지 업로드 중 오류가 발생했습니다.";

      setMessage(errorMessage);
    } finally {
      setIsUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function removeImage(imageUrl: string) {
    setForm((prev) => {
      const images = imagesTextToArray(prev.imagesText).filter(
        (image) => image !== imageUrl
      );

      return {
        ...prev,
        imagesText: imagesArrayToText(images),
      };
    });

    setSelectedPreviewImage((prev) => {
      if (prev === imageUrl) {
        return null;
      }

      return prev;
    });
  }

  function moveImage(imageUrl: string, direction: "up" | "down") {
    setForm((prev) => {
      const images = imagesTextToArray(prev.imagesText);
      const index = images.indexOf(imageUrl);

      if (index < 0) {
        return prev;
      }

      const nextIndex = direction === "up" ? index - 1 : index + 1;

      if (nextIndex < 0 || nextIndex >= images.length) {
        return prev;
      }

      const nextImages = [...images];
      const target = nextImages[index];

      nextImages[index] = nextImages[nextIndex];
      nextImages[nextIndex] = target;

      return {
        ...prev,
        imagesText: imagesArrayToText(nextImages),
      };
    });
  }

  function startEdit(review: Review) {
    setEditingId(review.id);
    setForm({
      userId: review.userId,
      program: review.program,
      comment: review.comment,
      imagesText: imagesArrayToText(review.images),
      isVisible: review.isVisible,
      sortOrder: review.sortOrder,
    });
    setSelectedPreviewImage(review.images[0] || null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const images = imagesTextToArray(form.imagesText);

    if (!form.userId.trim()) {
      setMessage("작성자 아이디를 입력해 주세요.");
      return;
    }

    if (!form.program.trim()) {
      setMessage("체험 종류를 입력해 주세요.");
      return;
    }

    if (!form.comment.trim()) {
      setMessage("리뷰 코멘트를 입력해 주세요.");
      return;
    }

    if (images.length === 0) {
      setMessage("이미지를 1개 이상 등록해 주세요.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const url = editingId
        ? `/api/admin/reviews/${editingId}`
        : "/api/admin/reviews";

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: form.userId,
          program: form.program,
          comment: form.comment,
          images,
          isVisible: form.isVisible,
          sortOrder: Number(form.sortOrder || 0),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "리뷰 저장 중 오류가 발생했습니다.");
      }

      setMessage(data.message || "저장되었습니다.");
      resetForm();
      await loadReviews();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "리뷰 저장 중 오류가 발생했습니다.";

      setMessage(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(review: Review) {
    const confirmed = window.confirm(
      `${review.userId}님의 리뷰를 삭제하시겠습니까?`
    );

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/reviews/${review.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "리뷰 삭제 중 오류가 발생했습니다.");
      }

      setMessage(data.message || "삭제되었습니다.");
      await loadReviews();

      if (editingId === review.id) {
        resetForm();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "리뷰 삭제 중 오류가 발생했습니다.";

      setMessage(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-8 text-slate-900">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-black text-cyan-700">Reviews</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">
              리뷰 관리
            </h1>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
              메인 화면 리뷰 영역에 노출될 후기와 사진을 관리합니다.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadReviews()}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            새로고침
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-4 text-sm font-black text-cyan-900">
          {message}
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,520px)_1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                {editingId ? "리뷰 수정" : "리뷰 등록"}
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                이미지는 드래그&드롭으로 업로드할 수 있습니다.
              </p>
            </div>

            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-black text-slate-800 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
                취소
              </button>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                <Plus className="h-5 w-5" />
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-black text-slate-900">
                작성자 아이디
              </label>
              <input
                value={form.userId}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    userId: event.target.value,
                  }))
                }
                placeholder="예: n****"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 placeholder:text-slate-500 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-900">
                체험 종류
              </label>
              <select
                value={form.program}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    program: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              >
                {programOptions.map((program) => (
                  <option key={program} value={program}>
                    {program}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-900">
                정렬순서
              </label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    sortOrder: Number(event.target.value),
                  }))
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              />
              <p className="mt-2 text-xs font-semibold text-slate-600">
                숫자가 작을수록 먼저 노출됩니다.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-900">
                이미지 업로드
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  if (event.target.files) {
                    void uploadFiles(event.target.files);
                  }
                }}
              />

              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragOver(false);

                  if (event.dataTransfer.files) {
                    void uploadFiles(event.dataTransfer.files);
                  }
                }}
                className={`rounded-3xl border-2 border-dashed p-6 text-center transition ${
                  isDragOver
                    ? "border-cyan-500 bg-cyan-50"
                    : "border-slate-300 bg-slate-100"
                }`}
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-cyan-700 shadow-sm">
                  {isUploading ? (
                    <Loader2 className="h-7 w-7 animate-spin" />
                  ) : (
                    <UploadCloud className="h-7 w-7" />
                  )}
                </div>

                <p className="mt-4 text-sm font-black text-slate-950">
                  이미지를 여기에 드래그하거나 클릭해서 업로드
                </p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-700">
                  jpg, png, webp, gif, heic 지원 · 이미지 1개당 최대 10MB
                </p>

                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUploading ? "업로드 중..." : "파일 선택"}
                </button>
              </div>
            </div>

            {previewImages.length > 0 && (
              <div className="rounded-2xl border border-slate-300 bg-slate-100 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900">
                  <ImageIcon className="h-4 w-4 text-cyan-700" />
                  등록 이미지
                </div>

                <div className="space-y-3">
                  {previewImages.map((image, index) => (
                    <div
                      key={image}
                      className="grid gap-3 rounded-2xl border border-slate-300 bg-white p-3 sm:grid-cols-[84px_1fr]"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedPreviewImage(image)}
                        className="relative h-20 overflow-hidden rounded-xl bg-slate-200"
                      >
                        <Image
                          src={image}
                          alt="리뷰 이미지 미리보기"
                          fill
                          sizes="120px"
                          className="object-cover"
                        />
                      </button>

                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-700">
                          {image}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => moveImage(image, "up")}
                            disabled={index === 0}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-black text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            위로
                          </button>

                          <button
                            type="button"
                            onClick={() => moveImage(image, "down")}
                            disabled={index === previewImages.length - 1}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-black text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            아래로
                          </button>

                          <button
                            type="button"
                            onClick={() => removeImage(image)}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-black text-rose-800"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedPreviewImage && (
                  <div className="relative mt-4 h-56 overflow-hidden rounded-2xl bg-slate-200">
                    <Image
                      src={selectedPreviewImage}
                      alt="선택된 리뷰 이미지"
                      fill
                      sizes="480px"
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-black text-slate-900">
                이미지 경로 / URL 직접 입력
              </label>
              <textarea
                value={form.imagesText}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    imagesText: event.target.value,
                  }))
                }
                rows={5}
                placeholder={`/images/reviews/review-01-01.jpg
https://d2ck1cgvtnr7j2.cloudfront.net/reviews/2026/07/09/sample.jpg`}
                className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 font-mono text-xs font-bold text-slate-950 placeholder:text-slate-500 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              />
              <p className="mt-2 text-xs font-semibold text-slate-600">
                업로드하면 자동으로 URL이 추가됩니다. 필요할 때만 직접 수정하세요.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-900">
                리뷰 코멘트
              </label>
              <textarea
                value={form.comment}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    comment: event.target.value,
                  }))
                }
                rows={7}
                placeholder="고객 리뷰 내용을 입력하세요."
                className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-950 placeholder:text-slate-500 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              />
            </div>

            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-300 bg-white px-4 py-3">
              <span className="text-sm font-black text-slate-900">
                메인 화면 노출
              </span>
              <input
                type="checkbox"
                checked={form.isVisible}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    isVisible: event.target.checked,
                  }))
                }
                className="h-5 w-5 accent-cyan-600"
              />
            </label>

            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {editingId ? "리뷰 수정하기" : "리뷰 등록하기"}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-950">등록된 리뷰</h2>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                총 {reviews.length}개의 리뷰가 등록되어 있습니다.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center rounded-3xl bg-slate-100">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-700" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-3xl bg-slate-100 text-center">
              <ImageIcon className="h-10 w-10 text-slate-500" />
              <p className="mt-4 text-sm font-black text-slate-700">
                등록된 리뷰가 없습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-3xl border border-slate-300 bg-white p-4 transition hover:border-cyan-300 hover:bg-cyan-50/40"
                >
                  <div className="grid gap-4 lg:grid-cols-[160px_1fr]">
                    <div className="relative h-36 overflow-hidden rounded-2xl bg-slate-200">
                      {review.images[0] ? (
                        <Image
                          src={review.images[0]}
                          alt={`${review.program} 리뷰 대표 이미지`}
                          fill
                          sizes="180px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-slate-500" />
                        </div>
                      )}

                      <div className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-xs font-black text-white">
                        {review.images.length}장
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                              {review.userId}
                            </span>
                            <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-800">
                              {review.program}
                            </span>
                            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-800">
                              정렬 {review.sortOrder}
                            </span>
                            {review.isVisible ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                                <Eye className="h-3 w-3" />
                                노출
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-800">
                                <EyeOff className="h-3 w-3" />
                                숨김
                              </span>
                            )}
                          </div>

                          <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-slate-800">
                            {review.comment}
                          </p>

                          <p className="mt-3 text-xs font-semibold text-slate-600">
                            수정일: {review.updatedAt || "-"}
                          </p>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(review)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-black text-slate-800 hover:bg-slate-100"
                          >
                            <Edit3 className="h-4 w-4" />
                            수정
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDelete(review)}
                            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-black text-rose-800 hover:bg-rose-100"
                          >
                            <Trash2 className="h-4 w-4" />
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}