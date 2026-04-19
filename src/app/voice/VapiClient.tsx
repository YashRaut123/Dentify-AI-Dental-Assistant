"use client";

import dynamic from "next/dynamic";

const VapiWidget = dynamic(() => import("@/components/voice/VapiWidget"), {
  ssr: false,
});

export default function VapiClient() {
  return <VapiWidget />;
}
