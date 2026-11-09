"""
Video Frame Extractor for Wedding Scroll Animation
Usage:
    python tools/extract_frames.py <path_to_video.mp4> [max_frames]

Extracts video frames as optimized WebP images for ultra-smooth scrub animation.
Generates both desktop (1920w) and mobile (960w/1280w) frames.
Automatically writes frames/manifest.json containing the frame count and dimensions.
"""

import os
import sys
import json
import cv2

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRAMES_DIR = os.path.join(ROOT, "frames")
DESKTOP_DIR = os.path.join(FRAMES_DIR, "desktop")
MOBILE_DIR = os.path.join(FRAMES_DIR, "mobile")

def extract(video_path, max_frames=200):
    if not os.path.isfile(video_path):
        print(f"Error: Video file not found at {video_path}")
        sys.exit(1)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: Could not open video file {video_path}")
        sys.exit(1)

    total_video_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    duration = total_video_frames / fps
    print(f"Video Info: {total_video_frames} frames, {fps:.2f} fps, {duration:.2f}s duration")

    # Determine sampling step if total frames > max_frames
    step = max(1, total_video_frames // max_frames) if max_frames and total_video_frames > max_frames else 1

    os.makedirs(DESKTOP_DIR, exist_ok=True)
    os.makedirs(MOBILE_DIR, exist_ok=True)

    # Clean existing frames in directories
    for d in [DESKTOP_DIR, MOBILE_DIR]:
        for f in os.listdir(d):
            if f.endswith(('.webp', '.jpg', '.png')):
                try:
                    os.remove(os.path.join(d, f))
                except Exception:
                    pass

    frame_idx = 0
    saved_count = 0
    first_shape = None

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % step == 0:
            h, w = frame.shape[:2]
            if first_shape is None:
                first_shape = (w, h)

            # Desktop target width: 1920 max
            if w > 1920:
                nh = round(h * 1920 / w)
                desktop_frame = cv2.resize(frame, (1920, nh), interpolation=cv2.INTER_AREA)
            else:
                desktop_frame = frame

            # Mobile target width: 960
            mobile_w = min(960, w)
            mobile_h = round(h * mobile_w / w)
            mobile_frame = cv2.resize(frame, (mobile_w, mobile_h), interpolation=cv2.INTER_AREA)

            saved_count += 1
            desktop_path = os.path.join(DESKTOP_DIR, f"frame_{saved_count:04d}.webp")
            mobile_path = os.path.join(MOBILE_DIR, f"frame_{saved_count:04d}.webp")

            # Save as WebP with high quality
            cv2.imwrite(desktop_path, desktop_frame, [cv2.IMWRITE_WEBP_QUALITY, 90])
            cv2.imwrite(mobile_path, mobile_frame, [cv2.IMWRITE_WEBP_QUALITY, 85])

            if saved_count % 20 == 0:
                print(f"Extracted {saved_count} frames...")

        frame_idx += 1

    cap.release()

    manifest = {
        "frameCount": saved_count,
        "width": first_shape[0] if first_shape else 1920,
        "height": first_shape[1] if first_shape else 1080,
        "fps": fps,
        "source": os.path.basename(video_path)
    }

    manifest_path = os.path.join(FRAMES_DIR, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as mf:
        json.dump(manifest, mf, indent=2)

    print(f"Extraction complete. Total frames saved: {saved_count}")
    print(f"Manifest written to: {manifest_path}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python tools/extract_frames.py <video_path> [max_frames]")
        sys.exit(1)
    
    max_f = int(sys.argv[2]) if len(sys.argv) > 2 else 200
    extract(sys.argv[1], max_f)
