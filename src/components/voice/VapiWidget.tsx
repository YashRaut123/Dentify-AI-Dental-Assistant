"use client";

import Image from "next/image";
import { vapi } from "@/lib/vapi";
import { useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { InitialAvatar } from "@/components/ui/avatar";

const EXPECTED_VAPI_END_PATTERNS = [
  "meeting ended due to ejection",
  "meeting has ended",
  "meeting ended",
  "ejection",
  "call ended",
];

const extractErrorText = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value instanceof Error) return `${value.name}: ${value.message}`;

  if (value && typeof value === "object") {
    const candidate = value as { message?: unknown; error?: unknown; reason?: unknown };
    const parts = [candidate.message, candidate.error, candidate.reason]
      .map((part) => (typeof part === "string" ? part : ""))
      .filter(Boolean);

    if (parts.length > 0) return parts.join(" | ");
  }

  return "";
};

const isExpectedVapiMeetingEnd = (error: unknown): boolean => {
  const text = extractErrorText(error).toLowerCase();
  if (!text) return false;

  return EXPECTED_VAPI_END_PATTERNS.some((pattern) => text.includes(pattern));
};

function VapiWidget() {
  const [callActive, setCallActive] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Array<{ content: string; role: string }>>([]);
  const [callEnded, setCallEnded] = useState(false);
  const [callStatus, setCallStatus] = useState("Waiting...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { user, isLoaded } = useUser();
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const displayName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "Guest";

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleCallStart = () => {
      setConnecting(false);
      setCallActive(true);
      setCallEnded(false);
      setErrorMessage(null);
      setCallStatus("Listening...");

      // Ensure mic is unmuted at start in case SDK retained a muted state.
      vapi.setMuted(false);
    };

    const handleCallEnd = () => {
      setCallActive(false);
      setConnecting(false);
      setIsSpeaking(false);
      setCallEnded(true);
      setCallStatus("Call ended");
    };

    const handleSpeechStart = () => {
      setIsSpeaking(true);
      setCallStatus("Assistant speaking...");
    };

    const handleSpeechEnd = () => {
      setIsSpeaking(false);
      setCallStatus("Listening...");
    };

    const handleMessage = (message: any) => {
      if (message?.type === "transcript" && message?.transcriptType === "final") {
        const transcript = typeof message?.transcript === "string" ? message.transcript : "";
        const role = typeof message?.role === "string" ? message.role : "assistant";

        if (transcript) {
          setMessages((prev) => [...prev, { content: transcript, role }]);
        }
      }

      if (message?.type === "status-update" && typeof message?.status === "string") {
        if (message.status === "active") setCallStatus("Listening...");
        if (message.status === "ended") setCallStatus("Call ended");
      }
    };

    const handleCallStartProgress = (progress: any) => {
      if (!progress?.stage || callActive) return;
      const stageText = String(progress.stage).replaceAll("-", " ");
      setCallStatus(`Connecting (${stageText})...`);
    };

    const handleCallStartFailed = (payload: any) => {
      setConnecting(false);
      setCallActive(false);
      setIsSpeaking(false);
      setCallEnded(false);
      setCallStatus("Start failed");

      const reason =
        typeof payload?.error === "string"
          ? payload.error
          : "Could not start voice call. Check microphone permission and Vapi assistant settings.";
      setErrorMessage(reason);
    };

    const handleError = (error: unknown) => {
      if (isExpectedVapiMeetingEnd(error)) {
        setConnecting(false);
        setCallActive(false);
        setIsSpeaking(false);
        setCallEnded(true);
        setCallStatus("Call ended");
        return;
      }

      setConnecting(false);
      setCallActive(false);
      setIsSpeaking(false);
      setCallStatus("Error");
      setErrorMessage(extractErrorText(error) || "Voice connection failed.");
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (!isExpectedVapiMeetingEnd(event.reason)) return;

      event.preventDefault();
      setConnecting(false);
      setCallActive(false);
      setIsSpeaking(false);
      setCallEnded(true);
      setCallStatus("Call ended");
    };

    vapi
      .on("call-start", handleCallStart)
      .on("call-end", handleCallEnd)
      .on("call-start-progress", handleCallStartProgress)
      .on("call-start-failed", handleCallStartFailed)
      .on("speech-start", handleSpeechStart)
      .on("speech-end", handleSpeechEnd)
      .on("message", handleMessage)
      .on("error", handleError);

    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      vapi
        .off("call-start", handleCallStart)
        .off("call-end", handleCallEnd)
        .off("call-start-progress", handleCallStartProgress)
        .off("call-start-failed", handleCallStartFailed)
        .off("speech-start", handleSpeechStart)
        .off("speech-end", handleSpeechEnd)
        .off("message", handleMessage)
        .off("error", handleError);

      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, [callActive]);

  const toggleCall = async () => {
    if (callActive) {
      setCallStatus("Ending call...");
      vapi.stop();
      return;
    }

    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
    if (!assistantId) {
      setErrorMessage("Missing NEXT_PUBLIC_VAPI_ASSISTANT_ID environment variable.");
      setCallStatus("Configuration error");
      return;
    }

    try {
      setConnecting(true);
      setMessages([]);
      setCallEnded(false);
      setErrorMessage(null);
      setCallStatus("Requesting microphone...");

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Your browser does not support microphone input (getUserMedia).");
      }

      // Prompt for microphone access before SDK start to avoid silent startup failures.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());

      setCallStatus("Connecting...");
      const startedCall = await vapi.start(assistantId);

      if (!startedCall) {
        setConnecting(false);
        setCallStatus("Start failed");
        setErrorMessage(
          "Voice call could not start. Allow microphone access and verify your Vapi assistant is active.",
        );
      }
    } catch (error) {
      setConnecting(false);
      setCallActive(false);
      setIsSpeaking(false);
      setCallEnded(false);
      setCallStatus("Start failed");
      setErrorMessage(extractErrorText(error) || "Unable to access microphone or start call.");
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 flex flex-col overflow-hidden pb-20">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold font-mono">
          <span>Talk to Your </span>
          <span className="text-primary uppercase">AI Dental Assistant</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Have a voice conversation with our AI assistant for dental advice and guidance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-card/90 backdrop-blur-sm border border-border overflow-hidden relative">
          <div className="aspect-video flex flex-col items-center justify-center p-6 relative">
            <div
              className={`absolute inset-0 ${
                isSpeaking ? "opacity-30" : "opacity-0"
              } transition-opacity duration-300`}
            >
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-center items-center h-20">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`mx-1 h-16 w-1 bg-primary rounded-full ${
                      isSpeaking ? "animate-sound-wave" : ""
                    }`}
                    style={{
                      animationDelay: `${i * 0.1}s`,
                      height: isSpeaking ? `${Math.random() * 50 + 20}%` : "5%",
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="relative size-32 mb-4">
              <div
                className={`absolute inset-0 bg-primary opacity-10 rounded-full blur-lg ${
                  isSpeaking ? "animate-pulse" : ""
                }`}
              />

              <div className="relative w-full h-full rounded-full bg-card flex items-center justify-center border border-border overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-b from-primary/10 to-primary/5"></div>
                <Image
                  src="/logo.png"
                  alt="AI Dental Assistant"
                  width={80}
                  height={80}
                  className="w-20 h-20 object-contain"
                />
              </div>
            </div>

            <h2 className="text-xl font-bold text-foreground">Dentify AI</h2>
            <p className="text-sm text-muted-foreground mt-1">Dental Assistant</p>

            <div
              className={`mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border ${
                isSpeaking ? "border-primary" : ""
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isSpeaking ? "bg-primary animate-pulse" : "bg-muted"
                }`}
              />

              <span className="text-xs text-muted-foreground">{callStatus}</span>
            </div>

            {errorMessage && (
              <p className="mt-3 text-center text-xs text-destructive max-w-xs">{errorMessage}</p>
            )}
          </div>
        </Card>

        <Card className="bg-card/90 backdrop-blur-sm border overflow-hidden relative">
          <div className="aspect-video flex flex-col items-center justify-center p-6 relative">
            <div className="relative size-32 mb-4">
              <InitialAvatar
                name={displayName}
                size="lg"
                className="w-32 h-32 text-2xl"
              />
            </div>

            <h2 className="text-xl font-bold text-foreground">You</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {displayName}
            </p>

            <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-card border">
              <div className="w-2 h-2 rounded-full bg-muted" />
              <span className="text-xs text-muted-foreground">Ready</span>
            </div>
          </div>
        </Card>
      </div>

      {messages.length > 0 && (
        <div
          ref={messageContainerRef}
          className="w-full bg-card/90 backdrop-blur-sm border border-border rounded-xl p-4 mb-8 h-64 overflow-y-auto transition-all duration-300 scroll-smooth"
        >
          <div className="space-y-3">
            {messages.map((msg, index) => (
              <div key={index} className="message-item animate-in fade-in duration-300">
                <div className="font-semibold text-xs text-muted-foreground mb-1">
                  {msg.role === "assistant" ? "Dentify AI" : "You"}:
                </div>
                <p className="text-foreground">{msg.content}</p>
              </div>
            ))}

            {callEnded && (
              <div className="message-item animate-in fade-in duration-300">
                <div className="font-semibold text-xs text-primary mb-1">System:</div>
                <p className="text-foreground">Call ended. Thank you for using DentWise AI!</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="w-full flex justify-center gap-4">
        <Button
          className={`w-44 text-xl rounded-3xl ${
            callActive
              ? "bg-destructive hover:bg-destructive/90"
              : callEnded
              ? "bg-red-500 hover:bg-red-700"
              : "bg-primary hover:bg-primary/90"
          } text-white relative`}
          onClick={toggleCall}
          disabled={connecting}
        >
          {connecting && (
            <span className="absolute inset-0 rounded-full animate-ping bg-primary/50 opacity-75"></span>
          )}

          <span>
            {callActive
              ? "End Call"
              : connecting
              ? "Connecting..."
              : callEnded
              ? "Start New Call"
              : "Start Call"}
          </span>
        </Button>
      </div>
    </div>
  );
}

export default VapiWidget;
