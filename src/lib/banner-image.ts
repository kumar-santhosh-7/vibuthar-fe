/** Matches the home carousel source photos (`width={1600}` `height={1008}`). */
export const BANNER_IMAGE = {
  ratio: 1600 / 1008,
  width: 1600,
  height: 1008,
  maxBytes: 2.5 * 1024 * 1024,
} as const;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const ALLOWED_EXT = /\.(jpe?g|png|webp)$/i;

function isAllowedImage(file: File) {
  if (ALLOWED_TYPES.has(file.type)) return true;
  return !file.type && ALLOWED_EXT.test(file.name);
}

export function assertBannerFile(file: File) {
  return assertImageFile(file, BANNER_IMAGE, "home carousel photos");
}

/** Matches the public course-card frame (`aspect-16/10`). */
export const COURSE_THUMBNAIL = {
  ratio: 16 / 10,
  width: 1280,
  height: 800,
  maxBytes: 2 * 1024 * 1024,
} as const;

export function assertCourseThumbnailFile(file: File) {
  return assertImageFile(file, COURSE_THUMBNAIL, "course cards");
}

function assertImageFile(
  file: File,
  spec: { ratio: number; width: number; height: number; maxBytes: number },
  shapeLabel: string,
) {
  return new Promise<File>((resolve, reject) => {
    if (!isAllowedImage(file)) {
      reject(new Error("Use a JPG, PNG or WebP image."));
      return;
    }
    if (file.size > spec.maxBytes) {
      reject(new Error(`Keep the image under ${(spec.maxBytes / (1024 * 1024)).toFixed(1)} MB.`));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const ratio = image.naturalWidth / image.naturalHeight;
      if (Math.abs(ratio - spec.ratio) > 0.08) {
        reject(
          new Error(
            `Use the same shape as the ${shapeLabel} (${spec.width}×${spec.height}). This file is ${image.naturalWidth}×${image.naturalHeight}.`,
          ),
        );
        return;
      }
      if (image.naturalWidth < spec.width || image.naturalHeight < spec.height) {
        reject(
          new Error(
            `Image must be at least ${spec.width}×${spec.height} px. This file is ${image.naturalWidth}×${image.naturalHeight}.`,
          ),
        );
        return;
      }
      resolve(file);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("This image cannot be used."));
    };
    image.src = objectUrl;
  });
}
