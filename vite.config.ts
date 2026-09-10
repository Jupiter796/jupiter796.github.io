import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 这是「用户主页仓库」（<用户名>.github.io），站点固定挂在域名根路径
// https://jupiter796.github.io/ ，所以 base 保持默认的 '/'，不要改成 '/仓库名/'。
export default defineConfig({
  plugins: [react()],
})
