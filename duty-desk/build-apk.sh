#!/bin/bash
# 静态导出工作台前端 → 拷贝到 Capacitor（打包完整功能的 APK）
set -e
cd /Users/a1-6/Documents/12/duty-desk

cleanup() {
  [ -d app/_api_off ] && mv app/_api_off app/api
  [ -f app/_manifest_off.ts ] && mv app/_manifest_off.ts app/manifest.ts
}
trap cleanup EXIT

mv app/api app/_api_off
mv app/manifest.ts app/_manifest_off.ts
EXPORT=1 npm run build
rm -f out/app.apk   # 避免 APK 里嵌套 APK

rm -rf /Users/a1-6/Documents/12/desk-app/www
cp -r out /Users/a1-6/Documents/12/desk-app/www
echo "STATIC_DONE"
