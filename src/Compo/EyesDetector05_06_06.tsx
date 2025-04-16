import React, { useRef, useEffect } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

interface Landmark {
  x: number;
  y: number;
  z: number;
}

interface GlassesPosition {
  leftEyeLeftCorner: Landmark;
  leftEyeRightCorner: Landmark;
  rightEyeLeftCorner: Landmark;
  rightEyeRightCorner: Landmark;
  noseBridge: Landmark;
  leftEar: Landmark;
  rightEar: Landmark;
}

interface Coordinates {
  left_ear: { x: number; y: number } | null;
  right_ear: { x: number; y: number } | null;
  leftEye: { x: number; y: number } | null;
  RightEye: { x: number; y: number } | null;
}

interface FaceMeshResults {
  multiFaceLandmarks?: Landmark[][];
}

interface EyesDetectorProps {
  coordinates: Coordinates;
  setCoordinates: React.Dispatch<React.SetStateAction<Coordinates>>;
}

const EyesDetector05_06_06: React.FC<EyesDetectorProps> = ({ coordinates, setCoordinates }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [glassesPosition, setGlassesPosition] = React.useState<GlassesPosition | null>(null);
  const [faceWidth, setFaceWidth] = React.useState<number | null>(null);
  const [rotationDirection, setRotationDirection] = React.useState<"right" | "left" | null>(null);

  useEffect(() => {
    const faceMesh = new FaceMesh({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults((results: FaceMeshResults) => {
      if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;
      const landmarks = results.multiFaceLandmarks[0];

      // Extracting key points
      const leftEyeLeftCorner = landmarks[33];
      const leftEyeRightCorner = landmarks[133];
      const rightEyeLeftCorner = landmarks[362];
      const rightEyeRightCorner = landmarks[263];
      const noseBridge = landmarks[168];
      const leftEar = landmarks[127];
      const rightEar = landmarks[356];

      const width = Math.sqrt(
        Math.pow(rightEar.x - leftEar.x, 2) + Math.pow(rightEar.y - leftEar.y, 2)
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

      // Determine rotation direction
      let positionRotation: "left" | "right" | null = null;
      if (leftEar && rightEar) {
        if (leftEar.y < rightEar.y) {
          positionRotation = "left";
        } else if (leftEar.y > rightEar.y) {
          positionRotation = "right";
        }
      }
      setRotationDirection(positionRotation);

      // Calculate purple line edges
      let leftEye = null;
      let RightEye = null;
      
      if (leftEyeLeftCorner && rightEyeRightCorner) {
        const leftEyeOuterX = leftEyeLeftCorner.x;
        const leftEyeOuterY = leftEyeLeftCorner.y;
        const rightEyeOuterX = rightEyeRightCorner.x;
        const rightEyeOuterY = rightEyeRightCorner.y;

        const distanceBetweenEyes = Math.sqrt(
          Math.pow(rightEyeOuterX - leftEyeOuterX, 2) + Math.pow(rightEyeOuterY - leftEyeOuterY, 2)
        );

        const scaledDistance = distanceBetweenEyes * 1.4;
        const midX = (leftEyeOuterX + rightEyeOuterX) / 2;
        const midY = (leftEyeOuterY + rightEyeOuterY) / 2;
        const angle = Math.atan2(rightEyeOuterY - leftEyeOuterY, rightEyeOuterX - leftEyeOuterX);

        // Calculate purple line endpoints in normalized coordinates
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);
        
        leftEye = {
          x: midX - (scaledDistance / 2) * cosAngle,
          y: midY - (scaledDistance / 2) * sinAngle
        };
        
        RightEye = {
          x: midX + (scaledDistance / 2) * cosAngle,
          y: midY + (scaledDistance / 2) * sinAngle
        };
      }

      // Update coordinates through props
      setCoordinates({
        left_ear: leftEar ? { x: leftEar.x, y: leftEar.y } : null,
        right_ear: rightEar ? { x: rightEar.x, y: rightEar.y } : null,
        leftEye,
        RightEye   ,
      });

      drawResults(results, leftEyeLeftCorner, leftEyeRightCorner, rightEyeLeftCorner, rightEyeRightCorner, leftEar, rightEar, positionRotation);
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
  }, [setCoordinates]);

  const drawResults = (
    results: FaceMeshResults,
    leftEyeLeftCorner: Landmark,
    leftEyeRightCorner: Landmark,
    rightEyeLeftCorner: Landmark,
    rightEyeRightCorner: Landmark,
    leftEar: Landmark,
    rightEar: Landmark,
    positionRotation: "left" | "right" | null
  ) => {
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

      if (leftEyeLeftCorner && rightEyeRightCorner) {
        const leftEyeOuterX = leftEyeLeftCorner.x * canvas.width;
        const leftEyeOuterY = leftEyeLeftCorner.y * canvas.height;
        const rightEyeOuterX = rightEyeRightCorner.x * canvas.width;
        const rightEyeOuterY = rightEyeRightCorner.y * canvas.height;

        const distanceBetweenEyes = Math.sqrt(
          Math.pow(rightEyeOuterX - leftEyeOuterX, 2) + Math.pow(rightEyeOuterY - leftEyeOuterY, 2)
        );

        const scaledDistance = distanceBetweenEyes * 1.4;
        const midX = (leftEyeOuterX + rightEyeOuterX) / 2;
        const midY = (leftEyeOuterY + rightEyeOuterY) / 2;
        const angle = Math.atan2(rightEyeOuterY - leftEyeOuterY, rightEyeOuterX - leftEyeOuterX);

        ctx.save();
        ctx.translate(midX, midY);
        ctx.rotate(angle);

        // Draw purple line (center of glasses)
        ctx.strokeStyle = "purple";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-scaledDistance / 2, 0);
        ctx.lineTo(scaledDistance / 2, 0);
        ctx.stroke();

        // Draw the orange line based on rotationDirection
        if (leftEar && rightEar) {
          const leftEarX = leftEar.x * canvas.width;
          const leftEarY = leftEar.y * canvas.height;
          const rightEarX = rightEar.x * canvas.width;
          const rightEarY = rightEar.y * canvas.height;

          // Transform ear coordinates to the local coordinate system
          const leftEarLocalX = leftEarX - midX;
          const leftEarLocalY = leftEarY - midY;
          const rightEarLocalX = rightEarX - midX;
          const rightEarLocalY = rightEarY - midY;

          ctx.strokeStyle = "orange";
          ctx.lineWidth = 2;
          if (positionRotation === "left") {
            ctx.beginPath();
            ctx.moveTo(scaledDistance / 2, 0);
            ctx.lineTo(rightEarLocalX, rightEarLocalY);
            ctx.stroke();
          } else if (positionRotation === "right") {
            ctx.beginPath();
            ctx.moveTo(-scaledDistance / 2, 0);
            ctx.lineTo(leftEarLocalX, leftEarLocalY);
            ctx.stroke();
          }
        }

        ctx.restore();
      }

      // Draw the outer corners of the eyes in green (for reference)
      if (leftEyeLeftCorner && rightEyeRightCorner) {
        ctx.fillStyle = "green";
        ctx.beginPath();
        ctx.arc(leftEyeLeftCorner.x * canvas.width, leftEyeLeftCorner.y * canvas.height, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(rightEyeRightCorner.x * canvas.width, rightEyeRightCorner.y * canvas.height, 5, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Draw yellow points indicating the ears' position
      if (leftEar && rightEar) {
        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(leftEar.x * canvas.width, leftEar.y * canvas.height, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(rightEar.x * canvas.width, rightEar.y * canvas.height, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  };

  return (
    <div>
      <video 
        ref={videoRef} 
        style={{ 
          position: "absolute",
          top: "0",
          left: "0", 
          opacity: 0.4,
        }} 
        autoPlay 
        playsInline
      ></video>
      <canvas 
        ref={canvasRef} 
        width={640} 
        height={480} 
        style={{ 
          border: "1px solid black",
          position: "absolute",
          top: "0",
          left: "0", 
        }}
      ></canvas>
      
      {glassesPosition && (
        <div style={{ position: "absolute", top: 480, left: 0, padding: 10, background: "white" }}>
          <p>Glasses Position:</p>
          <p>Left Eye Left Corner: {JSON.stringify(glassesPosition.leftEyeLeftCorner)}</p>
          <p>Left Eye Right Corner: {JSON.stringify(glassesPosition.leftEyeRightCorner)}</p>
          <p>Right Eye Left Corner: {JSON.stringify(glassesPosition.rightEyeLeftCorner)}</p>
          <p>Right Eye Right Corner: {JSON.stringify(glassesPosition.rightEyeRightCorner)}</p>
          <p>Nose Bridge: {JSON.stringify(glassesPosition.noseBridge)}</p>
        </div>
      )}
      
      <div style={{ position: "absolute", top: 480, left: 300, padding: 10, background: "purple" }}>
        <h3>Coordinates:</h3>
        <pre>{JSON.stringify(coordinates, null, 2)}</pre>
      </div>
      
      {faceWidth !== null && (
        <div style={{ position: "absolute", top: 480, left: 600, padding: 10, background: "blue" }}>
          <p>Face Width: {Math.round(faceWidth * 100)}% of canvas width</p>
        </div>
      )}
      
      {rotationDirection && (
        <div style={{ position: "absolute", top: 520, left: 600, padding: 10, background: "red" }}>
          <p>Rotation Direction: {rotationDirection}</p>
          <p>right: {rotationDirection === "right" ? 'true' : 'false'}</p>
          <p>left: {rotationDirection === "left" ? 'true' : 'false'}</p>
        </div>
      )}
    </div>
  );
};

export default EyesDetector05_06_06;