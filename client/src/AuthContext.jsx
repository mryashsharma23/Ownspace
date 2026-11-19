import { createContext, useContext, useState } from "react";
import api from "./api";

const Ctx = createContext();
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("ownspace_user") || "null")
  );

  const save = (u) => {
    localStorage.setItem("ownspace_user", JSON.stringify(u));
    setUser(u);
  };

  const login = async (form) => save((await api.post("/auth/login", form)).data);
  const register = async (form) => save((await api.post("/auth/register", form)).data);

  // merge changed profile fields (name, email, phone, photo) into the logged-in user
  const updateUser = (partial) => {
    setUser((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem("ownspace_user", JSON.stringify(next));
      return next;
    });
  };

  const logout = () => {
    localStorage.removeItem("ownspace_user");
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, login, register, logout, updateUser }}>{children}</Ctx.Provider>
  );
}