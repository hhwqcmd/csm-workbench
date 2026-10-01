import type { SeedreamModel } from "./seedream-examples";

const SEEDREAM_PRO_MODEL: SeedreamModel = "doubao-seedream-5-0-pro-260628";

export type SeedreamAnnotation = {
  id: string;
  type: "point" | "bbox";
  imageNumber: number;
  coordinates: number[];
  start: number;
  end: number;
  raw: string;
};

const ANNOTATION_PATTERN =
  /图(\d+)<(point|bbox)>\s*(-?\d+)\s+(-?\d+)(?:\s+(-?\d+)\s+(-?\d+))?\s*<\/\2>/g;
const COORDINATE_MARKUP_PATTERN = /<\/?(?:point|bbox)>/;

export function parseSeedreamAnnotations(prompt: string): SeedreamAnnotation[] {
  const annotations: SeedreamAnnotation[] = [];
  for (const match of prompt.matchAll(ANNOTATION_PATTERN)) {
    const start = match.index ?? 0;
    const type = match[2] as SeedreamAnnotation["type"];
    const coordinates = [match[3], match[4], match[5], match[6]]
      .filter((value): value is string => value !== undefined)
      .map(Number);
    annotations.push({
      id: `${start}-${type}-${annotations.length}`,
      type,
      imageNumber: Number(match[1]),
      coordinates,
      start,
      end: start + match[0].length,
      raw: match[0],
    });
  }
  return annotations;
}

export function validateSeedreamAnnotations(input: {
  prompt: string;
  imageCount: number;
  model: SeedreamModel;
}): string[] {
  const errors: string[] = [];
  const annotations = parseSeedreamAnnotations(input.prompt);
  const remaining = removeRanges(
    input.prompt,
    annotations.map((item) => [item.start, item.end]),
  );
  if (COORDINATE_MARKUP_PATTERN.test(remaining)) {
    errors.push(
      "Prompt 中存在格式错误的 point/bbox 标签；请使用“图N<point>x y</point>”或“图N<bbox>x1 y1 x2 y2</bbox>”。",
    );
  }
  if (
    (annotations.length > 0 || COORDINATE_MARKUP_PATTERN.test(input.prompt)) &&
    input.model !== SEEDREAM_PRO_MODEL
  ) {
    errors.push("point/bbox 坐标标注仅 Seedream 5.0 Pro 支持。");
  }
  for (const [index, annotation] of annotations.entries()) {
    const label = `标注 ${index + 1}`;
    if (
      annotation.imageNumber < 1 ||
      annotation.imageNumber > input.imageCount
    ) {
      errors.push(`${label} 引用了不存在的图${annotation.imageNumber}。`);
    }
    if (
      annotation.coordinates.some(
        (coordinate) =>
          !Number.isInteger(coordinate) || coordinate < 0 || coordinate > 999,
      )
    ) {
      errors.push(`${label} 的坐标必须是 0–999 的整数。`);
    }
    if (annotation.type === "point" && annotation.coordinates.length !== 2) {
      errors.push(`${label} 的 point 必须包含 2 个坐标。`);
    }
    if (annotation.type === "bbox") {
      if (annotation.coordinates.length !== 4) {
        errors.push(`${label} 的 bbox 必须包含 4 个坐标。`);
      } else {
        const [x1, y1, x2, y2] = annotation.coordinates;
        if (x1 >= x2 || y1 >= y2) {
          errors.push(`${label} 的 bbox 必须满足 x1 < x2 且 y1 < y2。`);
        }
      }
    }
  }
  return Array.from(new Set(errors));
}

export function appendSeedreamPoint(
  prompt: string,
  imageNumber: number,
  x: number,
  y: number,
): string {
  return appendTag(
    prompt,
    `图${imageNumber}<point>${clampCoordinate(x)} ${clampCoordinate(y)}</point>`,
  );
}

export function appendSeedreamBbox(
  prompt: string,
  imageNumber: number,
  first: { x: number; y: number },
  second: { x: number; y: number },
): string {
  const x1 = clampCoordinate(Math.min(first.x, second.x));
  const y1 = clampCoordinate(Math.min(first.y, second.y));
  const x2 = clampCoordinate(Math.max(first.x, second.x));
  const y2 = clampCoordinate(Math.max(first.y, second.y));
  return appendTag(prompt, `图${imageNumber}<bbox>${x1} ${y1} ${x2} ${y2}</bbox>`);
}

export function removeSeedreamAnnotation(
  prompt: string,
  annotation: SeedreamAnnotation,
): string {
  return `${prompt.slice(0, annotation.start)}${prompt.slice(annotation.end)}`
    .replace(/ {2,}/g, " ")
    .trim();
}

export function clearSeedreamAnnotations(prompt: string): string {
  const annotations = parseSeedreamAnnotations(prompt);
  return removeRanges(
    prompt,
    annotations.map((item) => [item.start, item.end]),
  )
    .replace(/ {2,}/g, " ")
    .trim();
}

export function normalizeSeedreamPoint(
  x: number,
  y: number,
  width: number,
  height: number,
): { x: number; y: number } {
  return {
    x: normalizeAxis(x, width),
    y: normalizeAxis(y, height),
  };
}

function appendTag(prompt: string, tag: string): string {
  return prompt.trim() ? `${prompt.trim()} ${tag}` : tag;
}

function normalizeAxis(value: number, size: number): number {
  if (!Number.isFinite(size) || size <= 0) return 0;
  return clampCoordinate((value / size) * 999);
}

function clampCoordinate(value: number): number {
  return Math.max(0, Math.min(999, Math.round(value)));
}

function removeRanges(value: string, ranges: Array<[number, number]>): string {
  let result = value;
  for (const [start, end] of [...ranges].sort((a, b) => b[0] - a[0])) {
    result = `${result.slice(0, start)}${result.slice(end)}`;
  }
  return result;
}
