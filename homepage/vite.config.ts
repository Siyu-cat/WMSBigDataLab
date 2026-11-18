import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // 图片直链：/uploads/xxx → 后端 /api/media/uploads/xxx（与生产 nginx 兜底一致）
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/uploads/, '/api/media/uploads'),
      },
      // dev 模式下通过 5174 访问百科（生产由 nginx 负责 /bigdatalab 路由）
      '/bigdatalab': {
        target: 'http://localhost:5173',
        changeOrigin: true,
      },
    }
  }
})
