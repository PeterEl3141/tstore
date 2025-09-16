import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar.jsx";
import "./App.css";
import "./styles/fonts.css";
import Footer from "./components/Footer/Footer.jsx";

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer/>
    </div>
  );
}
