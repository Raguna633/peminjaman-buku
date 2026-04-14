import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("perpus_user");
    const storedToken = localStorage.getItem("auth_token");
    
    if (storedUser && storedToken && storedUser !== "undefined" && storedToken !== "undefined") {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("perpus_user");
        localStorage.removeItem("auth_token");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        username,
        password,
      });

      const responseData = response.data.data;
      const authToken = responseData.token;
      const userData = responseData.user;

      localStorage.setItem("auth_token", authToken);
      localStorage.setItem("perpus_user", JSON.stringify(userData));

      setToken(authToken);
      setUser(userData);

      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

      return { success: true, user: userData, token: authToken };
    }
    catch (error) {
      const message = error.response?.data?.message || "Login gagal";
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, userData);
      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || "Registrasi gagal";
      return { success: false, message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("perpus_user");
    delete axios.defaults.headers.common["Authorization"];
  };

  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem("perpus_user", JSON.stringify(newUser));
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    register,
    token,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
