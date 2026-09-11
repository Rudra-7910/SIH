/**
 * Image Preprocessor
 *
 * ARCHITECTURAL DECISION: Uses 'sharp' instead of OpenCV for preprocessing.
 * sharp is a pure npm package that works on all platforms without native
 * compilation. It provides resize, contrast, grayscale — sufficient for the demo.
 *
 * Upgraded Pipeline (6 steps):
 * 1. Auto-orient  — EXIF rotation correction
 * 2. Upscale      — small images (< 800px) are upscaled 2x for better OCR
 * 3. Grayscale    — early conversion; OCR on greyscale is more accurate
 * 4. Normalize    — histogram stretching for low-contrast packaging
 * 5. Sharpen      — stronger sharpening (sigma 2.5) for text edge clarity
 * 6. Gamma        — brightens dark label text without blowing out highlights
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

export interface PreprocessingResult {
  originalPath: string;
  preprocessedPath: string;
  metadata: {
    originalWidth: number;
    originalHeight: number;
    processedWidth: number;
    processedHeight: number;
    steps: string[];
    processingTimeMs: number;
  };
}

const MAX_DIMENSION = 2400; // Increased from 1600 to preserve more text detail
const MIN_DIMENSION_FOR_UPSCALE = 800; // Upscale images smaller than this dimension

export async function preprocessImage(
  inputPath: string,
  outputDir: string
): Promise<PreprocessingResult> {
  const startTime = Date.now();
  const steps: string[] = [];

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Read original image metadata
  const originalMeta = await sharp(inputPath).metadata();
  const originalWidth = originalMeta.width || 800;
  const originalHeight = originalMeta.height || 600;
  steps.push(`Original size: ${originalWidth}x${originalHeight}`);

  // Build the sharp pipeline — order matters for quality
  let pipeline = sharp(inputPath).rotate(); // Step 1: Auto-orient from EXIF

  // Step 2: Upscale small images before OCR (small text on tiny images is unreadable)
  const minDimension = Math.min(originalWidth, originalHeight);
  const maxDimension = Math.max(originalWidth, originalHeight);

  if (minDimension < MIN_DIMENSION_FOR_UPSCALE) {
    // Scale up 2x (use fit: inside to preserve aspect ratio)
    pipeline = pipeline.resize(
      Math.min(originalWidth * 2, MAX_DIMENSION),
      Math.min(originalHeight * 2, MAX_DIMENSION),
      { fit: 'inside', kernel: 'lanczos3', withoutEnlargement: false }
    );
    steps.push(`Upscaled 2x for small image (was ${minDimension}px min-dimension)`);
  } else if (maxDimension > MAX_DIMENSION) {
    // Downscale very large images to avoid excessive processing time
    pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: 'inside',
      withoutEnlargement: true,
      kernel: 'lanczos3',
    });
    steps.push(`Resized to fit within ${MAX_DIMENSION}px`);
  }

  // Step 3: Convert to greyscale EARLY — OCR engines perform better on greyscale
  pipeline = pipeline.greyscale();
  steps.push('Converted to greyscale (improved OCR accuracy)');

  // Step 4: Normalize contrast — stretches histogram to full 0-255 range
  // Handles dim/overexposed photos of packaging
  pipeline = pipeline.normalize();
  steps.push('Contrast normalized (histogram stretch)');

  // Step 5: Enhanced sharpening — stronger than default to make text edges crisp
  // sigma: 2.5 works well for packaging label text (originally was 1.5)
  // flat: 0.5, jagged: 1.5 = aggressive edge enhancement without halos
  pipeline = pipeline.sharpen({ sigma: 2.5, m1: 0.5, m2: 1.5 });
  steps.push('Sharpened for text clarity (sigma=2.5)');

  // Step 6: Gamma correction — brightens dark packaging text
  // gamma(1.8) = slight brightening without blowing out highlights
  // Helps with dark blue/green/black labels where text is hard to read
  pipeline = pipeline.gamma(1.8);
  steps.push('Gamma corrected (1.8) for dark label text');

  // Output as PNG (lossless, best for OCR)
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const preprocessedPath = path.join(outputDir, `${baseName}_preprocessed.png`);

  await pipeline.png({ compressionLevel: 1 }).toFile(preprocessedPath); // fast compress
  steps.push('Saved as PNG (lossless, OCR-optimized)');

  // Get processed image metadata
  const processedMeta = await sharp(preprocessedPath).metadata();

  return {
    originalPath: inputPath,
    preprocessedPath,
    metadata: {
      originalWidth,
      originalHeight,
      processedWidth: processedMeta.width || originalWidth,
      processedHeight: processedMeta.height || originalHeight,
      steps,
      processingTimeMs: Date.now() - startTime,
    },
  };
}
