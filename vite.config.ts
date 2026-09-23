import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 상대 경로로 빌드해서 GitHub Pages의 /<repo>/ 하위 경로에서도 동작
  base: './',
})
