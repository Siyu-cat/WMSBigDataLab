import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getToken, clearToken } from './auth';

interface ResponseData<T = unknown> {
  code: number;
  message: string;
  data: T;
}

const createRequest = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (response: AxiosResponse<ResponseData>) => {
      if (response.data && response.data.code !== 200) {
        return Promise.reject(new Error(response.data.message || '请求失败'));
      }
      return response;
    },
    (error) => {
      if (error.response) {
        const { status } = error.response;
        if (status === 401) {
          clearToken();
          window.location.href = '/admin/login';
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export const request = createRequest();

export const get = <T = unknown>(url: string, config?: AxiosRequestConfig) => {
  return request.get<ResponseData<T>>(url, config).then((res) => res.data);
};

export const post = <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => {
  return request.post<ResponseData<T>>(url, data, config).then((res) => res.data);
};

export const put = <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => {
  return request.put<ResponseData<T>>(url, data, config).then((res) => res.data);
};

export const del = <T = unknown>(url: string, config?: AxiosRequestConfig) => {
  return request.delete<ResponseData<T>>(url, config).then((res) => res.data);
};