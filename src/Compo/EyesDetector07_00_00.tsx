import React, { useRef, useEffect, useState } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

interface LandmarkCoordinate {
  x: string;
  y: string;
  z: string;
  visibility: number | undefined;
}

interface GlassesPosition {
  leftEyeLeftCorner: LandmarkCoordinate;
  leftEyeRightCorner: LandmarkCoordinate;
  rightEyeLeftCorner: LandmarkCoordinate;
  rightEyeRightCorner: LandmarkCoordinate;
  noseBridge: LandmarkCoordinate;
  leftEar: LandmarkCoordinate;
  rightEar: LandmarkCoordinate;
}

const EyesDetector07_00_00: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [glassesPosition, setGlassesPosition] = useState<GlassesPosition | null>(null);
  const [faceWidth, setFaceWidth] = useState<number | null>(null);

  const setCord = (cord: { x: number; y: number; z: number; visibility?: number }): LandmarkCoordinate => {
    return {
      x: parseFloat(cord.x.toString()).toFixed(2),
      y: parseFloat(cord.y.toString()).toFixed(2),
      z: parseFloat(cord.z.toString()).toFixed(2),
      visibility: cord.visibility
    };
  };

  useEffect(() => {
    const initFaceMesh = async () => {
      // Initialize FaceMesh with the correct constructor
      const faceMesh = new FaceMesh({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults((results) => {
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;

        const landmarks = results.multiFaceLandmarks[0];

        const leftEyeLeftCorner = setCord(landmarks[33]);
        const leftEyeRightCorner = setCord(landmarks[133]);
        const rightEyeLeftCorner = setCord(landmarks[362]);
        const rightEyeRightCorner = setCord(landmarks[263]);
        const noseBridge = setCord(landmarks[168]);
        const leftEar = setCord(landmarks[127]);
        const rightEar = setCord(landmarks[356]);

        const width = Math.sqrt(
          Math.pow(parseFloat(rightEar.x) - parseFloat(leftEar.x), 2) + 
          Math.pow(parseFloat(rightEar.y) - parseFloat(leftEar.y), 2)
        );
        setFaceWidth(width);

        setGlassesPosition({
          leftEyeLeftCorner,
          leftEyeRightCorner,
          rightEyeLeftCorner,
          rightEyeRightCorner,
          noseBridge,
          leftEar,
          rightEar,
        });

        const leftEyeToNoseDistance = Math.sqrt(
          Math.pow(parseFloat(leftEyeLeftCorner.x) - parseFloat(noseBridge.x), 2) + 
          Math.pow(parseFloat(leftEyeLeftCorner.y) - parseFloat(noseBridge.y), 2)
        );
        const rightEyeToNoseDistance = Math.sqrt(
          Math.pow(parseFloat(rightEyeRightCorner.x) - parseFloat(noseBridge.x), 2) + 
          Math.pow(parseFloat(rightEyeRightCorner.y) - parseFloat(noseBridge.y), 2)
        );

        let positionRotation: "left" | "right" | null = null;
        if (leftEyeToNoseDistance < rightEyeToNoseDistance) {
          positionRotation = "left";
        } else if (leftEyeToNoseDistance > rightEyeToNoseDistance) {
          positionRotation = "right";
        }

        drawResults(results);
      });

      if (videoRef.current) {
        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            await faceMesh.send({ image: videoRef.current! });
          },
          width: 640,
          height: 480,
        });
        camera.start();
      }
    };

    initFaceMesh();
  }, []);

  const drawResults = (results: { multiFaceLandmarks?: { x: number; y: number; z: number }[][] }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks) {
      results.multiFaceLandmarks.forEach((landmarks) => {
        ctx.fillStyle = "red";
        landmarks.forEach((point) => {
          ctx.beginPath();
          ctx.arc(point.x * canvas.width, point.y * canvas.height, 2, 0, 2 * Math.PI);
          ctx.fill();
        });
      });
    }
  };

  return (
    <div>
      <video ref={videoRef} style={{ display: "none" }}></video>
      <canvas ref={canvasRef} width="640" height="480" />
    </div>
  );
};

export default EyesDetector07_00_00;