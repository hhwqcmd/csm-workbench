"use client";

import { useEffect, useRef, useState } from "react";
import {
  buildCurlCommand,
  type CurlRequest,
} from "../lib/curl-command";

type CopyState = "idle" | "copied" | "error";

type CopyCurlButtonProps = CurlRequest & {
  className?: string;
  containsApiKey?: boolean;
};

export function CopyCurlButton({
  className,
  containsApiKey = false,
  ...request
}: CopyCurlButtonProps) {
  const [state, setState] = useState<CopyState>("idle");
  const resetTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    },
    [],
  );

  async function copyCurl() {
    try {
      await navigator.clipboard.writeText(buildCurlCommand(request));
      setState("copied");
    } catch {
      setState("error");
    }

    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = window.setTimeout(() => setState("idle"), 2_000);
  }

  return (
    <button
      aria-label="复制完整 cURL 请求"
      className={["copy-curl-button", className].filter(Boolean).join(" ")}
      data-state={state}
      onClick={() => void copyCurl()}
      title={
        containsApiKey
          ? "复制内容包含当前 API Key，请妥善保管。"
          : "未填写 API Key，将保留 <ARK_API_KEY> 占位符。"
      }
      type="button"
    >
      {state === "copied"
        ? containsApiKey
          ? "已复制（含 Key）"
          : "已复制"
        : state === "error"
          ? "复制失败"
          : containsApiKey
            ? "复制 cURL（含 Key）"
            : "复制 cURL"}
    </button>
  );
}
