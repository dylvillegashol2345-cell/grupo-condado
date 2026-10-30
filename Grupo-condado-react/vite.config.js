import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // IIS Express solo acepta el host localhost: changeOrigin lo reescribe
    proxy: { "/api": { target: "http://localhost:56153", changeOrigin: true } },
  },
})
