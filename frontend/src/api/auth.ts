import { api } from "./client";

export async function register(username: string, email: string, password: string) {
    const { data } = await api.post("/auth/register/", { username, email, password });
    return data;
}

export async function login(username: string, password: string) {
    const { data } = await api.post("/auth/token/", { username, password });
    localStorage.setItem("access_token", data.access);
    localStorage.setItem("refresh_token", data.refresh);
    window.dispatchEvent(new Event("auth:updated"));
    return data;
}

export async function me() {
    const { data } = await api.get("/me/");
    return data;
}

export function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.dispatchEvent(new Event("auth:updated"));
}