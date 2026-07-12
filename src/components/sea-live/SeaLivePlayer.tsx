"use client";

import Hls from "hls.js";
import {
  useEffect,
  useRef,
  useState,
} from "react";

type SeaLivePlayerProps = {
  streamPath: string;
};

export default function SeaLivePlayer({
  streamPath,
}: SeaLivePlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    setErrorMessage("");

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamPath;
      return;
    }

    if (!Hls.isSupported()) {
      setErrorMessage(
        "현재 브라우저에서 실시간 영상을 재생할 수 없습니다.",
      );
      return;
    }

    const hls = new Hls({
      lowLatencyMode: true,
      liveSyncDurationCount: 3,
    });

    hls.loadSource(streamPath);
    hls.attachMedia(video);
    hls.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal) {
        setErrorMessage(
          "실시간 영상 연결이 지연되고 있습니다. 잠시 후 다시 시도해주세요.",
        );
      }
    });

    return () => {
      hls.destroy();
    };
  }, [streamPath]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-950 shadow-2xl ring-1 ring-slate-200">
      <video
        ref={videoRef}
        className="aspect-video w-full bg-slate-950 object-contain"
        controls
        muted
        playsInline
        autoPlay
      />

      <div className="absolute left-4 top-4 flex items-center gap-2">
        <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white shadow-lg">
          LIVE
        </span>
        <span className="rounded-full bg-slate-950/75 px-3 py-1 text-xs font-black text-white backdrop-blur">
          수마포구 실시간
        </span>
      </div>

      {errorMessage ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/85 px-6 text-center">
          <p className="max-w-md text-sm font-bold leading-6 text-white">
            {errorMessage}
          </p>
        </div>
      ) : null}
    </div>
  );
}
