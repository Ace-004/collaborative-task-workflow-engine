import axios from "axios";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:3000";

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use((response)=>response,(error)=>{
  if(error.response?.status===401){
    localStorage.clear();
    window.location.href='/'
  }
})

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
