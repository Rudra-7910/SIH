"""
PaddleOCR Inference Script for Legal Metrology Inspection Assistant
Accepts an image path, executes PaddleOCR detection & recognition,
and outputs standardized JSON to stdout.
"""

import sys
import os
import json
import time

def run():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)

    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(json.dumps({"error": f"Image file not found: {image_path}"}))
        sys.exit(1)

    lang = 'en'
    if len(sys.argv) >= 3:
        lang = sys.argv[2]

    start_time = time.time()

    # Ensure stable CPU inference without oneDNN PIR conflict
    os.environ['PADDLE_PDX_ENABLE_MKLDNN_BYDEFAULT'] = '0'
    os.environ['FLAGS_use_mkldnn'] = '0'

    try:
        from PIL import Image
        from paddleocr import PaddleOCR

        img = Image.open(image_path)
        img_w, img_h = img.size

        # Initialize PaddleOCR engine
        ocr = PaddleOCR(lang=lang)
        result = ocr.ocr(image_path)

        lines = []
        total_conf = 0.0

        if result and len(result) > 0 and result[0]:
            first_res = result[0]
            # Handle PaddleOCR 3.x / PaddleX dict output format
            if isinstance(first_res, dict) and 'rec_texts' in first_res:
                rec_texts = first_res.get('rec_texts', [])
                rec_scores = first_res.get('rec_scores', [])
                rec_boxes = first_res.get('rec_boxes', [])
                dt_polys = first_res.get('dt_polys', [])

                for idx, text in enumerate(rec_texts):
                    conf = float(rec_scores[idx]) if idx < len(rec_scores) else 0.95
                    
                    if idx < len(rec_boxes):
                        box = rec_boxes[idx]
                        # box format: [min_x, min_y, max_x, max_y]
                        min_x, min_y, max_x, max_y = float(box[0]), float(box[1]), float(box[2]), float(box[3])
                    elif idx < len(dt_polys):
                        poly = dt_polys[idx]
                        xs = [float(p[0]) for p in poly]
                        ys = [float(p[1]) for p in poly]
                        min_x, max_x = min(xs), max(xs)
                        min_y, max_y = min(ys), max(ys)
                    else:
                        min_x, min_y, max_x, max_y = 0.0, 0.0, 10.0, 10.0

                    bbox = {
                        "id": f"bbox-paddle-{idx}",
                        "x": max(0.0, min(100.0, (min_x / img_w) * 100.0)),
                        "y": max(0.0, min(100.0, (min_y / img_h) * 100.0)),
                        "w": max(0.1, min(100.0, ((max_x - min_x) / img_w) * 100.0)),
                        "h": max(0.1, min(100.0, ((max_y - min_y) / img_h) * 100.0)),
                    }

                    lines.append({
                        "text": str(text).strip(),
                        "confidence": conf,
                        "boundingBox": bbox,
                    })
                    total_conf += conf

            # Handle Classic PaddleOCR 2.x list of tuples format
            elif isinstance(first_res, (list, tuple)):
                for idx, item in enumerate(first_res):
                    box = item[0]  # [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
                    text, conf = item[1]

                    xs = [p[0] for p in box]
                    ys = [p[1] for p in box]
                    min_x, max_x = min(xs), max(xs)
                    min_y, max_y = min(ys), max(ys)

                    bbox = {
                        "id": f"bbox-paddle-{idx}",
                        "x": max(0.0, min(100.0, (min_x / img_w) * 100.0)),
                        "y": max(0.0, min(100.0, (min_y / img_h) * 100.0)),
                        "w": max(0.1, min(100.0, ((max_x - min_x) / img_w) * 100.0)),
                        "h": max(0.1, min(100.0, ((max_y - min_y) / img_h) * 100.0)),
                    }

                    lines.append({
                        "text": str(text).strip(),
                        "confidence": float(conf),
                        "boundingBox": bbox,
                    })
                    total_conf += float(conf)

        avg_conf = (total_conf / len(lines)) if lines else 0.0
        raw_text = "\n".join([l["text"] for l in lines])
        proc_time = int((time.time() - start_time) * 1000)

        output = {
            "lines": lines,
            "rawText": raw_text,
            "averageConfidence": avg_conf,
            "processingTimeMs": proc_time,
            "adapter": "PaddleOCR (Deep Learning)",
        }

        print(json.dumps(output))

    except Exception as e:
        print(json.dumps({
            "error": str(e),
            "lines": [],
            "rawText": "",
            "averageConfidence": 0.0,
            "processingTimeMs": int((time.time() - start_time) * 1000),
        }))
        sys.exit(1)

if __name__ == '__main__':
    run()
