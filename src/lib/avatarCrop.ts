import type { Area } from "react-easy-crop";

const AVATAR_OUTPUT_PX = 512;

/**
 * Loads an image URL (including blob: URLs) into an `HTMLImageElement` for canvas use.
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("Failed to load image")));
    image.src = url;
  });
}

/**
 * Renders the given pixel crop from the source image into a square canvas and returns a JPEG blob.
 *
 * @param imageSrc Same URL passed to the cropper (e.g. object URL).
 * @param pixelCrop `croppedAreaPixels` from `react-easy-crop` `onCropComplete`.
 * @returns A JPEG blob suitable for avatar upload.
 */
export async function getCroppedAvatarJpegBlob(
  imageSrc: string,
  pixelCrop: Area,
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_OUTPUT_PX;
  canvas.height = AVATAR_OUTPUT_PX;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    AVATAR_OUTPUT_PX,
    AVATAR_OUTPUT_PX,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not encode image"));
      },
      "image/jpeg",
      0.9,
    );
  });
}

/**
 * Wraps a cropped avatar blob as a `File` for `FormData` uploads.
 */
export function jpegBlobToAvatarFile(blob: Blob): File {
  return new File([blob], "avatar.jpg", { type: "image/jpeg" });
}
