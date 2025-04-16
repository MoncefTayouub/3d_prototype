import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import EyesDetector07_00_00 from './Compo/EyesDetector07_00_00'
import Handl3d from './Compo/Handl3d'
import EyesDetector05_06_06 from './Compo/EyesDetector05_06_06'
import Handl3d_01_00 from './Compo/Handl3d_01_00'
function App() {
  const [count, setCount] = useState(0)
  const [object3d, setObject3d] = useState(null)
  const [swittch , setSwittch] = useState(false)
  const [coordinates, setCoordinates] = useState({
      left_ear: null,
      right_ear: null,
      leftEye: null,
      RightEye: null
    });
  return (
    <>
    

    <EyesDetector05_06_06  setCoordinates = {setCoordinates} coordinates={coordinates}  /> 
    <Handl3d_01_00 modelUrl="/files/left_arm.glb"  setCoordinates = {setCoordinates} coordinates={coordinates} object3d={object3d} setObject3d={setObject3d} /> 

    {/* <EyesDetector05_06_06 /> */}
    </>
  )
}

export default App
