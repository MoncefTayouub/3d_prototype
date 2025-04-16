import React, { useRef, useEffect, useState } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";
// import face from './files/face.png'; // Ensure this path is correct


interface Landmark {
  x: number;
  y: number;
  z: number;
}

interface FaceLandmarks {
  leftEyeLeftCorner: Landmark;
  leftEyeRightCorner: Landmark;
  rightEyeLeftCorner: Landmark;
  rightEyeRightCorner: Landmark;
  noseBridge: Landmark;
  leftEar: Landmark;
  rightEar: Landmark;
}

interface Results {
  multiFaceLandmarks?: Landmark[][];
}

const EyesDetector05_06_08: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [glassesPosition, setGlassesPosition] = useState<FaceLandmarks | null>(null);
  const [faceWidth, setFaceWidth] = useState<number | null>(null);
  const [rotationDirection, setRotationDirection] = useState<"right" | "left" | null>(null);
  const glassesImageRef = useRef<HTMLImageElement | null>(null);
  const prevRotationDirection = useRef<"right" | "left" | null>(null);
  const rotationThreshold = 0.02;

  // Preload the image
  useEffect(() => {
    const glassesImage = new Image();
    glassesImage.src = face;
    glassesImage.onload = () => {
      glassesImageRef.current = glassesImage;
    };
    glassesImage.onerror = () => {
      console.error("Failed to load the eyeglasses image.");
    };
  }, []);

  useEffect(() => {
    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults((results: Results) => {
      if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;
      const landmarks = results.multiFaceLandmarks[0];

      // Extracting key points for eyeglasses detection
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
        rightEyeRightCorner: rightEyeRightCorner,
        noseBridge,
        leftEar,
        rightEar,
      });

      console.log("Left Ear Y:", leftEar.y, "Right Ear Y:", rightEar.y);

      let newRotationDirection: "right" | "left" | null = null;
      if (leftEar && rightEar) {
        const yDifference = leftEar.y - rightEar.y;
        const xDifference = leftEar.x - rightEar.x;
        const angle = Math.atan2(yDifference, xDifference);

        if (angle > rotationThreshold) {
          newRotationDirection = "left";
        } else if (angle < -rotationThreshold) {
          newRotationDirection = "right";
        } else {
          newRotationDirection = prevRotationDirection.current;
        }
      }

      if (newRotationDirection !== prevRotationDirection.current) {
        setRotationDirection(newRotationDirection);
        prevRotationDirection.current = newRotationDirection;
      }

      drawResults(
        results,
        leftEyeLeftCorner,
        leftEyeRightCorner,
        rightEyeLeftCorner,
        rightEyeRightCorner,
        leftEar,
        rightEar,
        newRotationDirection
      );
    });

    if (videoRef.current) {
        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current) {
              await faceMesh.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480,
        });
        camera.start();
      }
  }, []);

  const drawResults = (
    results: Results,
    leftEyeLeftCorner: Landmark,
    leftEyeRightCorner: Landmark,
    rightEyeLeftCorner: Landmark,
    rightEyeRightCorner: Landmark,
    leftEar: Landmark,
    rightEar: Landmark,
    positionRotation: "right" | "left" | null
  ) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
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
  
        if (glassesImageRef.current) {
          const glassesWidth = scaledDistance;
          const glassesHeight = glassesImageRef.current.height * (glassesWidth / glassesImageRef.current.width);
  
          ctx.save();
          ctx.translate(midX, midY);
          ctx.rotate(angle);
  
          ctx.drawImage(
            glassesImageRef.current,
            -glassesWidth / 2,
            -glassesHeight / 2,
            glassesWidth,
            glassesHeight
          );
  
          ctx.strokeStyle = "purple";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-glassesWidth / 2, 0);
          ctx.lineTo(glassesWidth / 2, 0);
          ctx.stroke();
  
          if (leftEar && rightEar) {
            const leftEarX = leftEar.x * canvas.width;
            const leftEarY = leftEar.y * canvas.height;
            const rightEarX = rightEar.x * canvas.width;
            const rightEarY = rightEar.y * canvas.height;
  
            const leftEarLocalX = leftEarX - midX;
            const leftEarLocalY = leftEarY - midY;
            const rightEarLocalX = rightEarX - midX;
            const rightEarLocalY = rightEarY - midY;
  
            const rotatePoint = (x: number, y: number, angle: number) => {
              const cos = Math.cos(angle);
              const sin = Math.sin(angle);
              return {
                x: x * cos - y * sin,
                y: x * sin + y * cos,
              };
            };
  
            const leftEarRotated = rotatePoint(leftEarLocalX, leftEarLocalY, -angle);
            const rightEarRotated = rotatePoint(rightEarLocalX, rightEarLocalY, -angle);
  
            ctx.strokeStyle = "orange";
            ctx.lineWidth = 2;
            console.log('positionRotation drawing', positionRotation);
            if (positionRotation === "left") {
              ctx.beginPath();
              ctx.moveTo(glassesWidth / 2, 0);
              ctx.lineTo(rightEarRotated.x, rightEarRotated.y);
              ctx.stroke();
            } else if (positionRotation === "right") {
              ctx.beginPath();
              ctx.moveTo(-glassesWidth / 2, 0);
              ctx.lineTo(leftEarRotated.x, leftEarRotated.y);
              ctx.stroke();
            }
          }
  
          ctx.restore();
        }
      }
  
      if (leftEyeLeftCorner && rightEyeRightCorner) {
        ctx.fillStyle = "green";
        ctx.beginPath();
        ctx.arc(leftEyeLeftCorner.x * canvas.width, leftEyeLeftCorner.y * canvas.height, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(rightEyeRightCorner.x * canvas.width, rightEyeRightCorner.y * canvas.height, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
  
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
      <video ref={videoRef} style={{ 
        position: "absolute",
        top: "0",
        left: "0", 
        opacity: 0.4,
       }} autoPlay playsInline></video>
      <canvas ref={canvasRef} width={640} height={480} style={{ 
        border: "1px solid black",
        position: "absolute",
        top: "0",
        left: "0", 
       }}></canvas>
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
      {faceWidth !== null && (
        <div>
          <p>Face Width: {Math.round(faceWidth * 100)}% of canvas width</p>
        </div>
      )}
      {rotationDirection && (
        <div>
          <p>Rotation Direction: {rotationDirection}</p>
          <p>right: {rotationDirection === "right" ? 'true' : 'false'}</p>
          <p>left: {rotationDirection === "left"?'true' : 'false'}</p>
        </div>
      )}
    </div>
  );
};

export default EyesDetector05_06_08;