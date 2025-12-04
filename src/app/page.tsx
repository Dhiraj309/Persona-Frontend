"use client";

import Chat from "./chat/page";
import TextType from "@/components/TextType";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Prism from "@/components/Prism";

export default function Page() {
  const router = useRouter();

  return (
    <main className="relative flex min-h-screen bg-black items-center justify-center overflow-hidden">

      {/* 🔥 Background Prism — now properly behind content */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <Prism
          animationType="rotate"
          timeScale={0.5}
          height={3.5}
          baseWidth={5.5}
          scale={3.6}
          hueShift={0}
          colorFrequency={1}
          noise={0.1}
          glow={1}
        />
      </div>

      {/* 🔥 Foreground Content */}
      <div className="relative z-20 text-center flex flex-col items-center gap-8">
        
        {/* Typing Text */}
        <TextType
          className="text-2xl md:text-4xl font-bold text-white"
          text={[
            "Hey, I was waiting for you...",
            "Got a question? I’ve got the answers.",
            "Lost in docs? I’ll guide you out.",
            "Wanna search smarter, not harder?",
            "Need an anime-style image? Say the word.",
            "I’m not just AI... I’m your sidekick.",
            "Ready to explore together?",
          ]}
          typingSpeed={55}
          pauseDuration={1500}
          showCursor={true}
          cursorCharacter="|"
        />

        {/* CTA Button */}
        <Button
          variant="outline"
          className="px-6 py-3 text-lg font-medium hover:bg-white/20"
          onClick={() => router.push("/login")}
        >
          Get Started
        </Button>

      </div>
    </main>
  );
}
