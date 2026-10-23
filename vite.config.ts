import { defineConfig } from 'vite'

export default defineConfig({
  // 상대 경로: GitHub Pages 하위 경로와 Capacitor 앱(파일 로딩) 양쪽에서 동작
  base: './',
  // 같은 와이파이의 휴대폰에서 개발 서버 접속 허용
  server: { host: true },
})
