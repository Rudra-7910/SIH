import cv2
import numpy as np

class ImagePreprocessor:
    def __init__(self):
        pass

    def process_for_ocr(self, image: np.ndarray) -> np.ndarray:
        """
        Enhance image for better OCR results.
        """
        if image is None:
            raise ValueError("Invalid image array provided")
            
        # Convert to grayscale if it's not already
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
            
        # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
        # Good for uneven lighting on reflective packaging
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        
        # Denoising
        denoised = cv2.fastNlMeansDenoising(enhanced, h=30)
        
        # Adaptive Thresholding (optional, sometimes EasyOCR handles grayscale better than binary)
        # Leaving it as grayscale enhanced for EasyOCR which uses deep learning and often prefers some continuous tones
        
        return denoised
