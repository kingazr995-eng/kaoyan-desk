/** @type {import('next').NextConfig} */
// 手机访问：dev/start 已绑定 0.0.0.0，同一WiFi下用 http://<电脑IP>:3000 访问
const nextConfig = {
  // 数据存本地 data/desk.db（Node内置SQLite），无外部服务依赖
  serverExternalPackages: [],
  // EXPORT=1 时静态导出（用于打包手机 APK；正常 build 走 server 模式带 API）
  ...(process.env.EXPORT === "1" ? { output: "export", images: { unoptimized: true } } : {}),
};
export default nextConfig;
