import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';

interface ModelProps {
  url: string;
  coordinates: Coordinates;
  setCoordinates: React.Dispatch<React.SetStateAction<Coordinates>>;
}

interface Coordinates {
  left_ear: { x: number; y: number } | null;
  right_ear: { x: number; y: number } | null;
  leftEye: { x: number; y: number } | null;
  RightEye: { x: number; y: number } | null;
}

const Model: React.FC<ModelProps> = ({ url, coordinates, setCoordinates }) => {

  console.log('Coordinates:', coordinates);
  const { scene } = useGLTF(url);
  // You can use coordinates and setCoordinates here if needed
  return <primitive object={scene} dispose={null} />;
};

interface Handl3dProps {
  modelUrl?: string;
  coordinates: Coordinates;
  setCoordinates: React.Dispatch<React.SetStateAction<Coordinates>>;
}

const Handl3d: React.FC<Handl3dProps> = ({ 
  modelUrl = '/files/left_arm.glb', 
  coordinates, 
  setCoordinates 
}) => {
  return (
    <div style={{ width: '100%', height: '500px' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        <Suspense fallback={null}>
          <Model 
            url={modelUrl} 
            coordinates={coordinates} 
            setCoordinates={setCoordinates} 
          />
        </Suspense>
        <OrbitControls />
      </Canvas>
    </div>
  );
};

export default Handl3d;