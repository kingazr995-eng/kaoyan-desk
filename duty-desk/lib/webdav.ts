// 坚果云 WebDAV 封装（云端同步用）
import { getSetting } from "./db";

const DAV = "https://dav.jianguoyun.com/dav";

function authHeader(): string | null {
  const user = getSetting("dav_user");
  const pass = getSetting("dav_pass");
  if (!user || !pass) return null;
  return "Basic " + Buffer.from(user + ":" + pass).toString("base64");
}

export function hasDav(): boolean {
  return !!getSetting("dav_user") && !!getSetting("dav_pass");
}

// 上传文件
export async function davPut(path: string, content: string): Promise<boolean> {
  const auth = authHeader();
  if (!auth) return false;
  try {
    const res = await fetch(DAV + path, {
      method: "PUT",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: content,
    });
    return res.ok;
  } catch { return false; }
}

// 下载文件
export async function davGet(path: string): Promise<string | null> {
  const auth = authHeader();
  if (!auth) return null;
  try {
    const res = await fetch(DAV + path, { headers: { Authorization: auth } });
    if (!res.ok) return null;
    return await res.text();
  } catch { return null; }
}

// 创建目录（已存在返回 true）
export async function davMkdir(path: string): Promise<boolean> {
  const auth = authHeader();
  if (!auth) return false;
  try {
    const res = await fetch(DAV + path, { method: "MKCOL", headers: { Authorization: auth } });
    return res.ok || res.status === 405;
  } catch { return false; }
}
