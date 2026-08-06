"use client";

import { useEffect, useState } from "react";
import {
  hasSavedMaterial,
  importGeneratedMaterial,
  MATERIAL_LIBRARY_EVENT,
  openMaterialLibrary,
  readMaterialAssets,
  type MaterialKind,
} from "../lib/material-assets";
import { navigateWorkspace } from "../lib/workspace-navigation";

export function SaveToMaterialLibraryButton({
  kind,
  source,
  sourceRef,
  sourceValue,
  name,
  compact = false,
}: {
  kind: "video" | "image";
  source: "seedance" | "seedream";
  sourceRef: string;
  sourceValue: string;
  name: string;
  compact?: boolean;
}) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "failed">(
    "idle",
  );
  const [error, setError] = useState("");

  useEffect(() => {
    function sync() {
      setState(
        hasSavedMaterial(readMaterialAssets(), kind, sourceRef)
          ? "saved"
          : "idle",
      );
    }
    sync();
    window.addEventListener(MATERIAL_LIBRARY_EVENT, sync);
    return () => window.removeEventListener(MATERIAL_LIBRARY_EVENT, sync);
  }, [kind, sourceRef]);

  async function save() {
    if (state === "saving" || state === "saved") return;
    setState("saving");
    setError("");
    try {
      await importGeneratedMaterial({
        kind,
        source,
        sourceRef,
        sourceValue,
        name,
      });
      setState("saved");
    } catch (saveError) {
      setState("failed");
      setError(
        saveError instanceof Error ? saveError.message : "保存到素材库失败。",
      );
    }
  }

  function viewLibrary() {
    navigateWorkspace("templates");
    window.setTimeout(() => openMaterialLibrary(kind as MaterialKind), 0);
  }

  return (
    <div className={`material-save-action${compact ? " is-compact" : ""}`}>
      {state === "saved" ? (
        <>
          <span>已保存到素材库</span>
          <button onClick={viewLibrary} type="button">
            查看素材库 →
          </button>
        </>
      ) : (
        <button
          className="material-save-button"
          disabled={state === "saving"}
          onClick={() => void save()}
          type="button"
        >
          {state === "saving"
            ? "保存中…"
            : state === "failed"
              ? "重试保存到素材库"
              : "保存到素材库"}
        </button>
      )}
      {error && <small role="alert">{error}</small>}
    </div>
  );
}
