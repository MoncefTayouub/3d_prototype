import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface ModelProps {
  url: string;
  coordinates: Coordinates;
}

interface Coordinates {
  left_ear: { x: number; y: number } | null;
  right_ear: { x: number; y: number } | null;
  leftEye: { x: number; y: number } | null;
  RightEye: { x: number; y: number } | null;
}

const Model: React.FC<ModelProps> = ({ url, coordinates }) => {
  const { scene } = useGLTF(url);
  
  // Calculate transformations based on facial coordinates
  useMemo(() => {
    if (!coordinates.leftEye || !coordinates.RightEye || !coordinates.left_ear || !coordinates.right_ear) {
      return;
    }

    // 1. Calculate scale based on eye distance (normalized to model size)
    const eyeDistance = Math.sqrt(
      Math.pow(coordinates.RightEye.x - coordinates.leftEye.x, 2) +
      Math.pow(coordinates.RightEye.y - coordinates.leftEye.y, 2)
    );
    const scale = eyeDistance * 10; // Adjust multiplier based on your model

    // 2. Calculate yaw rotation (left-right head turn)
    const yawAngle = Math.atan2(
      coordinates.RightEye.y - coordinates.leftEye.y,
      coordinates.RightEye.x - coordinates.leftEye.x
    );

    // 3. Calculate pitch rotation (up-down head tilt)
    // Using average of eye and ear positions for better stability
    const leftMidPoint = {
      x: (coordinates.leftEye.x + coordinates.left_ear.x) / 2,
      y: (coordinates.leftEye.y + coordinates.left_ear.y) / 2
    };
    const rightMidPoint = {
      x: (coordinates.RightEye.x + coordinates.right_ear.x) / 2,
      y: (coordinates.RightEye.y + coordinates.right_ear.y) / 2
    };
    
    const verticalAngle = Math.atan2(
      rightMidPoint.y - leftMidPoint.y,
      rightMidPoint.x - leftMidPoint.x
    );
    const pitchAngle = verticalAngle - yawAngle;

    // 4. Calculate position (center between eyes)
    const centerX = (coordinates.leftEye.x + coordinates.RightEye.x) / 2 - 0.5;
    const centerY = (coordinates.leftEye.y + coordinates.RightEye.y) / 2 - 0.5;

    // Apply transformations
    scene.scale.set(scale, scale, scale);
    scene.rotation.set(pitchAngle * 0.5, -yawAngle, 0); // Reduced pitch effect for natural look
    scene.position.set(centerX * 10, -centerY * 10, -Math.abs(centerY) * 5);

    // Optional: Adjust based on ear positions for better fit
    const earDistance = Math.sqrt(
      Math.pow(coordinates.right_ear.x - coordinates.left_ear.x, 2) +
      Math.pow(coordinates.right_ear.y - coordinates.left_ear.y, 2)
    );
    scene.scale.z = earDistance * 8; // Depth scaling

  }, [scene, coordinates]);

  return <primitive object={scene} dispose={null} />;
};

interface Handl3dProps {
  modelUrl?: string;
  coordinates: Coordinates;
}

const Handl3d: React.FC<Handl3dProps> = ({ 
  modelUrl = '/files/eyeglasses.glb', 
  coordinates 
}) => {
  return (
    <div style={{ width: '100%', height: '500px' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        <Suspense fallback={null}>
          <Model url={modelUrl} coordinates={coordinates} />
        </Suspense>
        <OrbitControls />
      </Canvas>
    </div>
  );
};

export default Handl3d;