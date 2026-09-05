"use client";
import ChatBox from "@/components/ChatBox";

export default function ChatPage() {
  return (
    <div className="space-y-2 md:mx-auto md:max-w-3xl">
      <h1 className="text-xl font-bold md:text-2xl">AI 助手</h1>
      <ChatBox />
    </div>
  );
}
