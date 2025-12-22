import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar.jsx";
import "./App.css";
import "./styles/fonts.css";
import Footer from "./components/Footer/Footer.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  return (
    <>
      <div className="app">
        <Navbar />
        <main className="app-main">
          <Outlet />
        </main>
        <Footer />
      </div>

      <ToastContainer
      position="top-right"
      autoClose={2200}
      newestOnTop
      closeOnClick
      pauseOnHover
      draggable
      limit={2}
      theme="dark"
      toastClassName="cf-toast"
      bodyClassName="cf-toast-body"
/>
    </>
  );
}
