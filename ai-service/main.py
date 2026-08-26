import io
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import cv2

# Import our custom modules
from rule_engine import RuleEngine
from compliance_checker import ComplianceChecker
from image_preprocessor import ImagePreprocessor
from font_size_estimator import FontSizeEstimator

# Global OCR Reader instance
# We load it globally so it's not reloaded on every request
reader = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global reader
    print("Initializing EasyOCR reader (Hi + En)...")
    import easyocr
    reader = easyocr.Reader(['hi', 'en'], gpu=False) # Fallback to CPU if no CUDA
    print("EasyOCR initialized.")
    yield
    print("Shutting down AI service.")

app = FastAPI(title="LabelCheck AI Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiate services
rule_engine = RuleEngine()
compliance_checker = ComplianceChecker(rules_path="rules.json")
preprocessor = ImagePreprocessor()
font_estimator = FontSizeEstimator()

@app.get("/health")
def health_check():
    return {"status": "healthy", "model_loaded": reader is not None}

@app.post("/extract")
async def extract_label_data(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
        
    start_time = time.time()
    
    # 1. Read image
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image file")
        
    # 2. Preprocess image
    processed_img = preprocessor.process_for_ocr(img)
    
    # 3. Perform OCR
    # detail=1 returns [([[x,y],[x,y],[x,y],[x,y]], text, confidence), ...]
    ocr_results = reader.readtext(processed_img, detail=1)
    
    # 4. Extract declarations using regex rules
    declarations = rule_engine.extract_declarations(ocr_results)
    
    # 5. Check compliance against legal metrology rules
    compliance_result = compliance_checker.evaluate(declarations)
    
    # Optional: Font size estimation (without reference object, just returns pixel heights)
    font_estimates = font_estimator.estimate_sizes(ocr_results)
    
    processing_time = time.time() - start_time
    
    return {
        "success": True,
        "processing_time_sec": round(processing_time, 2),
        "declarations": declarations,
        "compliance": compliance_result,
        "font_estimates": font_estimates,
        "raw_text": " ".join([r[1] for r in ocr_results])
    }

@app.post("/font-check")
async def check_font_sizes(
    file: UploadFile = File(...), 
    ref_pixel_width: float = None, 
    ref_pixel_height: float = None
):
    """
    Endpoint specifically for calculating font sizes with a reference object.
    Must provide either ref_pixel_width or ref_pixel_height of a standard ID-1 card in the image.
    """
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    processed_img = preprocessor.process_for_ocr(img)
    ocr_results = reader.readtext(processed_img, detail=1)
    
    font_estimates = font_estimator.estimate_sizes(
        ocr_results, 
        ref_pixel_width=ref_pixel_width, 
        ref_pixel_height=ref_pixel_height
    )
    
    return {"font_estimates": font_estimates}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
