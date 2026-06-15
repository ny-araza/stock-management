import "./App.css"
import {Routes, Route} from "react-router-dom"
import Login from "./pages/login/login"
import MainLayout from "./layout/main-layout/main-layout"

function App() {
  return (
    <>
      <div className="containe">
        <Routes>
          <Route path="" element={<Login/>}/>
          <Route path="/home" element={<MainLayout/>}/>
        </Routes>
      </div>
    </>
  )
}

export default App
