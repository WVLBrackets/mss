"use client";

import { useCallback, useRef, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { getCroppedAvatarJpegBlob, jpegBlobToAvatarFile } from "@/lib/avatarCrop";

export interface AvatarCropDialogProps {
  /** Typically a `blob:` URL from `URL.createObjectURL(file)`. */
  imageSrc: string;
  onCancel: () => void;
  /** Delivers a square JPEG file ready to upload. */
  onComplete: (file: File) => void | Promise<void>;
}

/**
 * Full-screen overlay: pan + zoom (slider and scroll wheel), circular crop mask, then export a square JPEG.
 */
export function AvatarCropDialog({ imageSrc, onCancel, onComplete }: AvatarCropDialogProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaReady, setMediaReady] = useState(false);
  const croppedPixelsRef = useRef<Area | null>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    croppedPixelsRef.current = croppedAreaPixels;
  }, []);

  async function applyCrop() {
    const pixels = croppedPixelsRef.current;
    if (!pixels) {
      setError("Image is still loading. Try again in a moment.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const blob = await getCroppedAvatarJpegBlob(imageSrc, pixels);
      const file = jpegBlobToAvatarFile(blob);
      await onComplete(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not crop image");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Adjust avatar"
      data-testid="avatar-crop-dialog"
    >
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-3">
        <p className="text-center text-sm text-white/90">
          Drag to reposition. Use the slider or scroll wheel to zoom. Then apply your crop.
        </p>

        <div className="relative min-h-[min(55vh,420px)] w-full flex-1 overflow-hidden rounded-lg bg-neutral-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            minZoom={0.2}
            maxZoom={4}
            zoomWithScroll
            objectFit="contain"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            onMediaLoaded={() => {
              setMediaReady(true);
              croppedPixelsRef.current = null;
            }}
            style={{}}
            classes={{}}
            mediaProps={{}}
            cropperProps={{}}
          />
        </div>

        <label className="mx-auto flex w-full max-w-xs flex-col gap-1 text-xs text-white/90">
          <span className="text-center">Zoom</span>
          <input
            type="range"
            min={0.2}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-white"
            data-testid="avatar-crop-zoom"
          />
        </label>

        {error ? <p className="text-center text-sm text-red-300">{error}</p> : null}

        <div className="flex justify-center gap-3 pb-2">
          <button
            type="button"
            className="rounded-md border border-white/40 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            onClick={onCancel}
            disabled={busy}
            data-testid="avatar-crop-cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 disabled:opacity-50"
            onClick={() => void applyCrop()}
            disabled={busy || !mediaReady}
            data-testid="avatar-crop-apply"
          >
            {busy ? "Working…" : "Use photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
