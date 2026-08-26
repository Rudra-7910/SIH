from typing import List, Dict, Any, Tuple

class FontSizeEstimator:
    def __init__(self, reference_width_mm: float = 85.6, reference_height_mm: float = 53.98):
        # Default reference is a standard credit card ID-1 format
        self.ref_width_mm = reference_width_mm
        self.ref_height_mm = reference_height_mm

    def estimate_sizes(self, ocr_results: List[Tuple[Any, str, float]], 
                       ref_pixel_width: float = None, 
                       ref_pixel_height: float = None) -> List[Dict[str, Any]]:
        """
        Estimate font height in mm based on a reference object in the image.
        If no reference pixels are provided, we just return the pixel height.
        """
        estimates = []
        
        pixels_per_mm = None
        if ref_pixel_height and self.ref_height_mm:
            # We use height for more accurate vertical text measurement
            pixels_per_mm = ref_pixel_height / self.ref_height_mm
        elif ref_pixel_width and self.ref_width_mm:
            pixels_per_mm = ref_pixel_width / self.ref_width_mm
            
        for bbox, text, prob in ocr_results:
            # bbox is typically a list of 4 points: [top-left, top-right, bottom-right, bottom-left]
            # e.g. [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]
            if len(bbox) == 4:
                # Calculate height in pixels
                y1, y2 = bbox[0][1], bbox[3][1]
                pixel_height = abs(y2 - y1)
                
                est = {
                    "text": text,
                    "pixel_height": float(pixel_height)
                }
                
                if pixels_per_mm:
                    est["estimated_height_mm"] = float(pixel_height / pixels_per_mm)
                else:
                    est["estimated_height_mm"] = None
                    
                estimates.append(est)
                
        return estimates
