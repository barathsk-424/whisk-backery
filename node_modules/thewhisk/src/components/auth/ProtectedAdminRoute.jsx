import { Navigate } from "react-router-dom";

const ProtectedAdminRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) return <Navigate to="/login" replace />;

  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) throw new Error("Invalid Token Structure");
    
    // Use safe decoding for web
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const decoded = JSON.parse(jsonPayload);

    if (decoded.role !== "admin" && decoded.source !== "master") {
      return (
        <div className="min-h-screen flex items-center justify-center bg-secondary">
          <div className="text-center p-12 bg-white rounded-[3rem] shadow-2xl border border-error/20">
            <h2 className="text-3xl font-black text-error uppercase tracking-tighter">
              Access Denied
            </h2>
            <p className="text-brown-400 font-black uppercase text-[10px] tracking-[0.4em] mt-4">
              Insufficient Clearance for Command Protocols
            </p>
            <a
              href="/"
              className="mt-8 inline-block px-10 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest"
            >
              Abort & Exit
            </a>
          </div>
        </div>
      );
    }
    return children;
  } catch (err) {
    console.error("[App] Token Verification Interrupted:", err.message);
    localStorage.removeItem("token"); // Cleanup malformed signal
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedAdminRoute;
