import axios from "axios";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:3000";

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Session expired / not logged in: drop the stale local login state and return to the login screen.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url: string = err?.config?.url ?? "";
    if (err?.response?.status === 401 && !url.startsWith("/auth/")) {
      localStorage.removeItem("taskflow_user");
      window.location.reload();
    }
    return Promise.reject(err);
  },
);

export const apiGet = async <T>(url: string): Promise<ApiResponse<T>> => {
  const { data } = await api.get<ApiResponse<T>>(url);
  return data;
};

export const apiPost = async <T>(url: string, payload: unknown): Promise<ApiResponse<T>> => {
  const { data } = await api.post<ApiResponse<T>>(url, payload);
  return data;
};

export const apiDelete = async <T>(url: string, payload?: unknown): Promise<ApiResponse<T>> => {
  const { data } = await api.delete<ApiResponse<T>>(url, payload ? { data: payload } : undefined);
  return data;
};

export default api;
