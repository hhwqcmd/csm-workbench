export type LeaderboardRow = {
  model: string;
  lab: string;
  value: string;
  highlight?: boolean;
};

// Static snapshot verified from the linked leaderboard pages on 2026-08-13.
// Each board stores up to the first 50 published rows; shorter boards store every published row.
export const CURRENT_LEADERBOARD_ROWS = {
  "Text / Overall": [
    {
      "model": "claude-fable-5",
      "lab": "Anthropic",
      "value": "1506 ±5"
    },
    {
      "model": "claude-opus-4-6-high",
      "lab": "Anthropic",
      "value": "1505 ±4"
    },
    {
      "model": "claude-opus-4-7-high",
      "lab": "Anthropic",
      "value": "1502 ±4"
    },
    {
      "model": "muse-spark-1.2 (xHigh)",
      "lab": "Meta",
      "value": "1498 ±10"
    },
    {
      "model": "claude-opus-4-6",
      "lab": "Anthropic",
      "value": "1497 ±3"
    },
    {
      "model": "claude-opus-4-7",
      "lab": "Anthropic",
      "value": "1494 ±4"
    },
    {
      "model": "claude-opus-5-high",
      "lab": "Anthropic",
      "value": "1493 ±5"
    },
    {
      "model": "qwen3.8-max",
      "lab": "Alibaba",
      "value": "1491 ±8"
    },
    {
      "model": "claude-opus-5-max",
      "lab": "Anthropic",
      "value": "1489 ±7"
    },
    {
      "model": "muse-spark-1.1",
      "lab": "Meta",
      "value": "1489 ±6"
    },
    {
      "model": "kimi-k3-max",
      "lab": "Moonshot",
      "value": "1489 ±6"
    },
    {
      "model": "muse-spark",
      "lab": "Meta",
      "value": "1488 ±6"
    },
    {
      "model": "gemini-3.1-pro-preview",
      "lab": "Google",
      "value": "1486 ±3"
    },
    {
      "model": "gemini-3-pro",
      "lab": "Google",
      "value": "1485 ±4"
    },
    {
      "model": "gemini-3.6-flash-high",
      "lab": "Google",
      "value": "1484 ±6"
    },
    {
      "model": "gpt-5.5-high",
      "lab": "OpenAI",
      "value": "1482 ±4"
    },
    {
      "model": "claude-opus-4-8-high",
      "lab": "Anthropic",
      "value": "1481 ±5"
    },
    {
      "model": "gpt-5.6-sol-xhigh",
      "lab": "OpenAI",
      "value": "1481 ±6"
    },
    {
      "model": "gemini-3.5-flash-high",
      "lab": "Google",
      "value": "1477 ±5"
    },
    {
      "model": "gpt-5.5",
      "lab": "OpenAI",
      "value": "1477 ±4"
    },
    {
      "model": "gpt-5.4-high",
      "lab": "OpenAI",
      "value": "1476 ±4"
    },
    {
      "model": "gpt-5.2-chat-latest-20260210",
      "lab": "OpenAI",
      "value": "1476 ±4"
    },
    {
      "model": "grok-4.20-beta1",
      "lab": "SpaceXAI",
      "value": "1475 ±5"
    },
    {
      "model": "gemini-3.5-flash-medium",
      "lab": "Google",
      "value": "1474 ±5"
    },
    {
      "model": "qwen3.7-max-preview",
      "lab": "Alibaba",
      "value": "1474 ±10"
    },
    {
      "model": "claude-opus-4-8",
      "lab": "Anthropic",
      "value": "1474 ±5"
    },
    {
      "model": "gpt-5.5-instant",
      "lab": "OpenAI",
      "value": "1473 ±5"
    },
    {
      "model": "gemini-3-flash",
      "lab": "Google",
      "value": "1473 ±4"
    },
    {
      "model": "claude-opus-4-5-20251101-high-32k",
      "lab": "Anthropic",
      "value": "1473 ±4"
    },
    {
      "model": "claude-sonnet-4-6",
      "lab": "Anthropic",
      "value": "1472 ±4"
    },
    {
      "model": "grok-4.20-beta-0309-reasoning",
      "lab": "SpaceXAI",
      "value": "1472 ±4"
    },
    {
      "model": "glm-5.2-max",
      "lab": "Z.ai",
      "value": "1471 ±5"
    },
    {
      "model": "grok-4.20-multi-agent-beta-0309",
      "lab": "SpaceXAI",
      "value": "1470 ±4"
    },
    {
      "model": "claude-opus-4-5-20251101",
      "lab": "Anthropic",
      "value": "1469 ±3"
    },
    {
      "model": "grok-4.5",
      "lab": "SpaceXAI",
      "value": "1469 ±5"
    },
    {
      "model": "ernie-5.1",
      "lab": "Baidu",
      "value": "1468 ±5"
    },
    {
      "model": "mimo-v2.5-pro",
      "lab": "Xiaomi",
      "value": "1468 ±4"
    },
    {
      "model": "glm-5.1",
      "lab": "Z.ai",
      "value": "1467 ±4"
    },
    {
      "model": "qwen3.5-max-preview",
      "lab": "Alibaba",
      "value": "1466 ±5"
    },
    {
      "model": "gpt-5.4",
      "lab": "OpenAI",
      "value": "1466 ±4"
    },
    {
      "model": "grok-4.1-thinking",
      "lab": "SpaceXAI",
      "value": "1466 ±3"
    },
    {
      "model": "gpt-5.6-terra-xhigh",
      "lab": "OpenAI",
      "value": "1464 ±6"
    },
    {
      "model": "grok-4.6-high",
      "lab": "SpaceXAI",
      "value": "1464 ±10 Preliminary"
    },
    {
      "model": "claude-sonnet-5-high",
      "lab": "Anthropic",
      "value": "1462 ±5"
    },
    {
      "model": "kimi-k2.6",
      "lab": "Moonshot",
      "value": "1461 ±5"
    },
    {
      "model": "qwen3.6-max-preview",
      "lab": "Alibaba",
      "value": "1460 ±8"
    },
    {
      "model": "grok-4.1",
      "lab": "SpaceXAI",
      "value": "1459 ±3"
    },
    {
      "model": "qwen3.7-plus",
      "lab": "Alibaba",
      "value": "1458 ±5"
    },
    {
      "model": "gemini-3-flash (thinking-minimal)",
      "lab": "Google",
      "value": "1458 ±3"
    },
    {
      "model": "deepseek-v4-pro",
      "lab": "DeepSeek",
      "value": "1458 ±4"
    }
  ],
  "Coding Arena": [
    {
      "model": "claude-fable-5",
      "lab": "Anthropic",
      "value": "1554 ±9"
    },
    {
      "model": "claude-opus-4-7-high",
      "lab": "Anthropic",
      "value": "1552 ±6"
    },
    {
      "model": "claude-opus-4-6-high",
      "lab": "Anthropic",
      "value": "1551 ±6"
    },
    {
      "model": "claude-opus-4-7",
      "lab": "Anthropic",
      "value": "1548 ±6"
    },
    {
      "model": "claude-opus-4-6",
      "lab": "Anthropic",
      "value": "1547 ±6"
    },
    {
      "model": "kimi-k3-max",
      "lab": "Moonshot",
      "value": "1544 ±11"
    },
    {
      "model": "claude-opus-4-8-high",
      "lab": "Anthropic",
      "value": "1533 ±7"
    },
    {
      "model": "muse-spark-1.2 (xHigh)",
      "lab": "Meta",
      "value": "1533 ±20"
    },
    {
      "model": "claude-opus-5-high",
      "lab": "Anthropic",
      "value": "1531 ±9"
    },
    {
      "model": "muse-spark-1.1",
      "lab": "Meta",
      "value": "1531 ±9"
    },
    {
      "model": "claude-opus-4-5-20251101-high-32k",
      "lab": "Anthropic",
      "value": "1530 ±7"
    },
    {
      "model": "claude-opus-5-max",
      "lab": "Anthropic",
      "value": "1530 ±12"
    },
    {
      "model": "qwen3.8-max",
      "lab": "Alibaba",
      "value": "1529 ±13"
    },
    {
      "model": "claude-sonnet-4-6",
      "lab": "Anthropic",
      "value": "1528 ±6"
    },
    {
      "model": "gpt-5.6-sol-xhigh",
      "lab": "OpenAI",
      "value": "1526 ±9"
    },
    {
      "model": "muse-spark",
      "lab": "Meta",
      "value": "1526 ±10"
    },
    {
      "model": "qwen3.7-max-preview",
      "lab": "Alibaba",
      "value": "1525 ±18"
    },
    {
      "model": "claude-opus-4-8",
      "lab": "Anthropic",
      "value": "1524 ±7"
    },
    {
      "model": "claude-sonnet-5-high",
      "lab": "Anthropic",
      "value": "1523 ±8"
    },
    {
      "model": "claude-opus-4-5-20251101",
      "lab": "Anthropic",
      "value": "1523 ±6"
    },
    {
      "model": "gemini-3.6-flash-high",
      "lab": "Google",
      "value": "1523 ±10"
    },
    {
      "model": "gemini-3.1-pro-preview",
      "lab": "Google",
      "value": "1521 ±5"
    },
    {
      "model": "gpt-5.4-high",
      "lab": "OpenAI",
      "value": "1521 ±6"
    },
    {
      "model": "mimo-v2.5-pro",
      "lab": "Xiaomi",
      "value": "1520 ±7"
    },
    {
      "model": "grok-4.5",
      "lab": "SpaceXAI",
      "value": "1520 ±9"
    },
    {
      "model": "gpt-5.5-high",
      "lab": "OpenAI",
      "value": "1520 ±6"
    },
    {
      "model": "claude-sonnet-4-5-20250929-high-32k",
      "lab": "Anthropic",
      "value": "1519 ±5"
    },
    {
      "model": "gemini-3-pro",
      "lab": "Google",
      "value": "1518 ±7"
    },
    {
      "model": "gpt-5.6-terra-xhigh",
      "lab": "OpenAI",
      "value": "1516 ±9"
    },
    {
      "model": "glm-5.1",
      "lab": "Z.ai",
      "value": "1515 ±7"
    },
    {
      "model": "gpt-5.2-chat-latest-20260210",
      "lab": "OpenAI",
      "value": "1515 ±7"
    },
    {
      "model": "kimi-k2.6",
      "lab": "Moonshot",
      "value": "1514 ±7"
    },
    {
      "model": "ernie-5.1",
      "lab": "Baidu",
      "value": "1514 ±7"
    },
    {
      "model": "gpt-5.5-instant",
      "lab": "OpenAI",
      "value": "1514 ±8"
    },
    {
      "model": "gpt-5.4",
      "lab": "OpenAI",
      "value": "1514 ±6"
    },
    {
      "model": "qwen3.5-max-preview",
      "lab": "Alibaba",
      "value": "1513 ±8"
    },
    {
      "model": "claude-sonnet-4-5-20250929",
      "lab": "Anthropic",
      "value": "1513 ±5"
    },
    {
      "model": "dola-seed-2.0-pro",
      "lab": "Bytedance",
      "value": "1513 ±6",
      "highlight": true
    },
    {
      "model": "claude-opus-4-1-20250805-thinking-16k",
      "lab": "Anthropic",
      "value": "1512 ±6"
    },
    {
      "model": "grok-4.20-beta-0309-reasoning",
      "lab": "SpaceXAI",
      "value": "1511 ±6"
    },
    {
      "model": "gpt-5.5",
      "lab": "OpenAI",
      "value": "1510 ±6"
    },
    {
      "model": "gemini-3.5-flash-high",
      "lab": "Google",
      "value": "1509 ±8"
    },
    {
      "model": "qwen3.6-max-preview",
      "lab": "Alibaba",
      "value": "1509 ±15"
    },
    {
      "model": "grok-4.6-high",
      "lab": "SpaceXAI",
      "value": "1509 ±21 Preliminary"
    },
    {
      "model": "grok-4.20-beta1",
      "lab": "SpaceXAI",
      "value": "1508 ±8"
    },
    {
      "model": "grok-4.20-multi-agent-beta-0309",
      "lab": "SpaceXAI",
      "value": "1508 ±6"
    },
    {
      "model": "gemini-3-flash",
      "lab": "Google",
      "value": "1508 ±8"
    },
    {
      "model": "gemini-3.5-flash-medium",
      "lab": "Google",
      "value": "1507 ±8"
    },
    {
      "model": "qwen3.7-plus",
      "lab": "Alibaba",
      "value": "1506 ±7"
    },
    {
      "model": "glm-5.2-max",
      "lab": "Z.ai",
      "value": "1506 ±8"
    }
  ],
  "WebDev Arena": [
    {
      "model": "claude-opus-5-max",
      "lab": "Anthropic",
      "value": "1691 +10/-10"
    },
    {
      "model": "kimi-k3-max",
      "lab": "Moonshot",
      "value": "1674 +11/-11"
    },
    {
      "model": "qwen3.8-max",
      "lab": "Alibaba",
      "value": "1669 +14/-14 Preliminary"
    },
    {
      "model": "claude-opus-5-high",
      "lab": "Anthropic",
      "value": "1664 +9/-9"
    },
    {
      "model": "grok-4.6-high",
      "lab": "SpaceXAI",
      "value": "1630 +18/-18 Preliminary"
    },
    {
      "model": "claude-fable-5",
      "lab": "Anthropic",
      "value": "1627 +9/-9"
    },
    {
      "model": "gpt-5.6-sol-xhigh (codex-harness)",
      "lab": "OpenAI",
      "value": "1622 +8/-8"
    },
    {
      "model": "glm-5.2-max",
      "lab": "Z.ai",
      "value": "1587 +8/-8"
    },
    {
      "model": "deepseek-v4-flash-high",
      "lab": "DeepSeek",
      "value": "1582 +12/-12"
    },
    {
      "model": "claude-opus-4-8-high",
      "lab": "Anthropic",
      "value": "1564 +7/-7"
    },
    {
      "model": "claude-opus-4-7",
      "lab": "Anthropic",
      "value": "1558 +6/-6"
    },
    {
      "model": "claude-opus-4-7-high",
      "lab": "Anthropic",
      "value": "1557 +6/-6"
    },
    {
      "model": "grok-4.5",
      "lab": "SpaceXAI",
      "value": "1554 +9/-9"
    },
    {
      "model": "claude-opus-4-6-high",
      "lab": "Anthropic",
      "value": "1545 +6/-6"
    },
    {
      "model": "claude-sonnet-5-high",
      "lab": "Anthropic",
      "value": "1541 +8/-8"
    },
    {
      "model": "claude-opus-4-8",
      "lab": "Anthropic",
      "value": "1539 +7/-7"
    },
    {
      "model": "muse-spark-1.1",
      "lab": "Meta",
      "value": "1538 +9/-9"
    },
    {
      "model": "gemini-3.6-flash-high",
      "lab": "Google",
      "value": "1538 +9/-9"
    },
    {
      "model": "claude-opus-4-6",
      "lab": "Anthropic",
      "value": "1537 +6/-6"
    },
    {
      "model": "muse-spark-1.2 (xHigh)",
      "lab": "Meta",
      "value": "1535 +14/-14"
    },
    {
      "model": "claude-sonnet-4-6",
      "lab": "Anthropic",
      "value": "1524 +6/-6"
    },
    {
      "model": "hy3",
      "lab": "Tencent",
      "value": "1523 +13/-13"
    },
    {
      "model": "gpt-5.6-terra-xhigh (codex-harness)",
      "lab": "OpenAI",
      "value": "1523 +10/-10"
    },
    {
      "model": "seed-2.1-pro-preview",
      "lab": "Bytedance",
      "value": "1522 +8/-8"
    },
    {
      "model": "gpt-5.6-luna-xhigh (codex-harness)",
      "lab": "OpenAI",
      "value": "1519 +9/-9"
    },
    {
      "model": "qwen3.7-max-20260517",
      "lab": "Alibaba",
      "value": "1517 +8/-8"
    },
    {
      "model": "glm-5.1",
      "lab": "Z.ai",
      "value": "1511 +7/-7"
    },
    {
      "model": "kimi-k2.6",
      "lab": "Moonshot",
      "value": "1509 +7/-7"
    },
    {
      "model": "gpt-5.5-xhigh (codex-harness)",
      "lab": "OpenAI",
      "value": "1509 +7/-7"
    },
    {
      "model": "gemini-3.5-flash-high",
      "lab": "Google",
      "value": "1506 +10/-10"
    },
    {
      "model": "claude-opus-4-5-20251101-high-32k",
      "lab": "Anthropic",
      "value": "1494 +8/-8"
    },
    {
      "model": "gemini-3.5-flash",
      "lab": "Google",
      "value": "1492 +14/-14"
    },
    {
      "model": "minimax-m3",
      "lab": "MiniMax",
      "value": "1491 +7/-7"
    },
    {
      "model": "gemini-3.5-flash-medium",
      "lab": "Google",
      "value": "1488 +8/-8"
    },
    {
      "model": "gpt-5.5-high (codex-harness)",
      "lab": "OpenAI",
      "value": "1486 +6/-6"
    },
    {
      "model": "qwen3.6-max-preview",
      "lab": "Alibaba",
      "value": "1479 +13/-13"
    },
    {
      "model": "mimo-v2.5-pro",
      "lab": "Xiaomi",
      "value": "1474 +6/-6"
    },
    {
      "model": "kimi-k2.7-code",
      "lab": "Moonshot",
      "value": "1473 +10/-10"
    },
    {
      "model": "claude-opus-4-5-20251101",
      "lab": "Anthropic",
      "value": "1468 +7/-7"
    },
    {
      "model": "deepseek-v4-pro-high-preview",
      "lab": "DeepSeek",
      "value": "1464 +7/-7"
    },
    {
      "model": "gpt-5.4-high (codex-harness)",
      "lab": "OpenAI",
      "value": "1463 +19/-19"
    },
    {
      "model": "qwen3.6-plus",
      "lab": "Alibaba",
      "value": "1459 +6/-6"
    },
    {
      "model": "gpt-5.5 (codex-harness)",
      "lab": "OpenAI",
      "value": "1458 +6/-6"
    },
    {
      "model": "gemini-3.5-flash-lite",
      "lab": "Google",
      "value": "1449 +43/-43"
    },
    {
      "model": "gemini-3.1-pro-preview",
      "lab": "Google",
      "value": "1447 +5/-5"
    },
    {
      "model": "deepseek-v4-pro",
      "lab": "DeepSeek",
      "value": "1445 +7/-7"
    },
    {
      "model": "gpt-5.4-medium (codex-harness)",
      "lab": "OpenAI",
      "value": "1442 +19/-19"
    },
    {
      "model": "mimo-v2.5",
      "lab": "Xiaomi",
      "value": "1438 +7/-7"
    },
    {
      "model": "gemini-3-flash",
      "lab": "Google",
      "value": "1438 +9/-9"
    },
    {
      "model": "gemini-3-pro",
      "lab": "Google",
      "value": "1438 +9/-9"
    }
  ],
  "Vision Arena": [
    {
      "model": "claude-fable-5",
      "lab": "Anthropic",
      "value": "1315 ±9"
    },
    {
      "model": "qwen3.8-max",
      "lab": "Alibaba",
      "value": "1301 ±9"
    },
    {
      "model": "claude-opus-4-7-high",
      "lab": "Anthropic",
      "value": "1301 ±7"
    },
    {
      "model": "claude-opus-4-6-high",
      "lab": "Anthropic",
      "value": "1300 ±7"
    },
    {
      "model": "claude-opus-4-7",
      "lab": "Anthropic",
      "value": "1299 ±7"
    },
    {
      "model": "claude-opus-5-high",
      "lab": "Anthropic",
      "value": "1297 ±11"
    },
    {
      "model": "gemini-3.6-flash-high",
      "lab": "Google",
      "value": "1295 ±18"
    },
    {
      "model": "muse-spark",
      "lab": "Meta",
      "value": "1294 ±9"
    },
    {
      "model": "claude-opus-4-6",
      "lab": "Anthropic",
      "value": "1293 ±7"
    },
    {
      "model": "muse-spark-1.2 (xHigh)",
      "lab": "Meta",
      "value": "1290 ±18"
    },
    {
      "model": "gemini-3-pro",
      "lab": "Google",
      "value": "1289 ±8"
    },
    {
      "model": "gpt-5.5",
      "lab": "OpenAI",
      "value": "1286 ±7"
    },
    {
      "model": "grok-4.5",
      "lab": "SpaceXAI",
      "value": "1285 ±11"
    },
    {
      "model": "claude-opus-4-8-high",
      "lab": "Anthropic",
      "value": "1284 ±8"
    },
    {
      "model": "gemini-3.5-flash-medium",
      "lab": "Google",
      "value": "1284 ±10"
    },
    {
      "model": "gpt-5.5-high",
      "lab": "OpenAI",
      "value": "1283 ±7"
    },
    {
      "model": "gemini-3.5-flash-high",
      "lab": "Google",
      "value": "1283 ±10"
    },
    {
      "model": "gpt-5.4-high",
      "lab": "OpenAI",
      "value": "1283 ±7"
    },
    {
      "model": "muse-spark-1.1",
      "lab": "Meta",
      "value": "1282 ±10"
    },
    {
      "model": "gpt-5.4",
      "lab": "OpenAI",
      "value": "1280 ±7"
    },
    {
      "model": "claude-opus-4-8",
      "lab": "Anthropic",
      "value": "1280 ±8"
    },
    {
      "model": "gpt-5.6-sol-xhigh",
      "lab": "OpenAI",
      "value": "1280 ±11"
    },
    {
      "model": "gpt-5.2-chat-latest-20260210",
      "lab": "OpenAI",
      "value": "1278 ±7"
    },
    {
      "model": "gpt-5.5-instant",
      "lab": "OpenAI",
      "value": "1278 ±9"
    },
    {
      "model": "gemini-3.1-pro-preview",
      "lab": "Google",
      "value": "1277 ±6"
    },
    {
      "model": "claude-sonnet-4-6",
      "lab": "Anthropic",
      "value": "1275 ±7"
    },
    {
      "model": "claude-sonnet-5-high",
      "lab": "Anthropic",
      "value": "1273 ±9"
    },
    {
      "model": "gemini-3-flash",
      "lab": "Google",
      "value": "1271 ±6"
    },
    {
      "model": "gpt-5.6-terra-xhigh",
      "lab": "OpenAI",
      "value": "1270 ±12"
    },
    {
      "model": "kimi-k2.6",
      "lab": "Moonshot",
      "value": "1263 ±7"
    },
    {
      "model": "qwen3.7-plus",
      "lab": "Alibaba",
      "value": "1262 ±9"
    },
    {
      "model": "gemini-3.5-flash-lite",
      "lab": "Google",
      "value": "1260 ±18"
    },
    {
      "model": "gemini-3-flash (thinking-minimal)",
      "lab": "Google",
      "value": "1259 ±6"
    },
    {
      "model": "dola-seed-2.0-pro",
      "lab": "Bytedance",
      "value": "1258 ±8",
      "highlight": true
    },
    {
      "model": "gemma-4-31b",
      "lab": "Google",
      "value": "1256 ±7"
    },
    {
      "model": "grok-4.20-beta-0309-reasoning",
      "lab": "SpaceXAI",
      "value": "1255 ±6"
    },
    {
      "model": "gpt-5.4-mini-high",
      "lab": "OpenAI",
      "value": "1253 ±7"
    },
    {
      "model": "grok-4.20-multi-agent-beta-0309",
      "lab": "SpaceXAI",
      "value": "1252 ±7"
    },
    {
      "model": "gpt-5.1-high",
      "lab": "OpenAI",
      "value": "1250 ±8"
    },
    {
      "model": "gpt-5.6-luna-xhigh",
      "lab": "OpenAI",
      "value": "1249 ±12"
    },
    {
      "model": "kimi-k2.5-thinking",
      "lab": "Moonshot",
      "value": "1249 ±6"
    },
    {
      "model": "qwen3.5-397b-a17b",
      "lab": "Alibaba",
      "value": "1247 ±6"
    },
    {
      "model": "gemini-2.5-pro",
      "lab": "Google",
      "value": "1246 ±5"
    },
    {
      "model": "grok-4.3",
      "lab": "SpaceXAI",
      "value": "1244 ±7"
    },
    {
      "model": "gpt-5.2-high",
      "lab": "OpenAI",
      "value": "1244 ±6"
    },
    {
      "model": "chatgpt-4o-latest-20250326",
      "lab": "OpenAI",
      "value": "1241 ±6"
    },
    {
      "model": "minimax-m3",
      "lab": "MiniMax",
      "value": "1240 ±8"
    },
    {
      "model": "gemma-4-26b-a4b",
      "lab": "Google",
      "value": "1240 ±7"
    },
    {
      "model": "gpt-5.1",
      "lab": "OpenAI",
      "value": "1238 ±8"
    },
    {
      "model": "mimo-v2.5",
      "lab": "Xiaomi",
      "value": "1238 ±7"
    }
  ],
  "Text-to-Image": [
    {
      "model": "gpt-image-2 (medium)",
      "lab": "OpenAI",
      "value": "1381 ±5"
    },
    {
      "model": "mai-image-2.6-preview",
      "lab": "Microsoft AI",
      "value": "1336 ±11"
    },
    {
      "model": "grok-imagine-image-2.0 (low)",
      "lab": "SpaceXAI",
      "value": "1316 ±12 Preliminary"
    },
    {
      "model": "reve-2.1",
      "lab": "Reve",
      "value": "1302 ±8"
    },
    {
      "model": "muse-image",
      "lab": "Meta",
      "value": "1282 ±7"
    },
    {
      "model": "reve-2.0",
      "lab": "Reve",
      "value": "1270 ±6"
    },
    {
      "model": "gemini-3.1-flash-image (nano-banana-2) [web-search]",
      "lab": "Google",
      "value": "1264 ±5"
    },
    {
      "model": "seedream-5.0-pro",
      "lab": "Bytedance",
      "value": "1258 ±5",
      "highlight": true
    },
    {
      "model": "qwen-image-3.0-pro",
      "lab": "Alibaba",
      "value": "1257 ±9"
    },
    {
      "model": "mai-image-2.5",
      "lab": "Microsoft AI",
      "value": "1256 ±4"
    },
    {
      "model": "gemini-3.1-flash-lite-image (nano-banana-2-lite)",
      "lab": "Google",
      "value": "1251 ±6"
    },
    {
      "model": "gemini-3-pro-image-2k (nano-banana-pro)",
      "lab": "Google",
      "value": "1246 ±3"
    },
    {
      "model": "gpt-image-1.5-high-fidelity",
      "lab": "OpenAI",
      "value": "1239 ±3"
    },
    {
      "model": "gemini-3-pro-image-preview (nano-banana-pro)",
      "lab": "Google",
      "value": "1232 ±5"
    },
    {
      "model": "grok-imagine-image-quality",
      "lab": "SpaceXAI",
      "value": "1228 ±4"
    },
    {
      "model": "ideogram-4.0-quality",
      "lab": "Ideogram",
      "value": "1204 ±5"
    },
    {
      "model": "qwen-image-2.0-pro-2026-06-22",
      "lab": "Alibaba",
      "value": "1191 ±6"
    },
    {
      "model": "uni-1.1-max",
      "lab": "Luma AI",
      "value": "1188 ±6"
    },
    {
      "model": "mai-image-2",
      "lab": "Microsoft AI",
      "value": "1183 ±5"
    },
    {
      "model": "uni-1.1",
      "lab": "Luma AI",
      "value": "1181 ±5"
    },
    {
      "model": "Cosmos3-Super-Text2Image (Agentic)",
      "lab": "Nvidia",
      "value": "1175 ±10"
    },
    {
      "model": "grok-imagine-image",
      "lab": "SpaceXAI",
      "value": "1171 ±3"
    },
    {
      "model": "recraft-v4.1-utility-pro",
      "lab": "Recraft",
      "value": "1169 ±11"
    },
    {
      "model": "flux-2-max",
      "lab": "Black Forest Labs",
      "value": "1162 ±4"
    },
    {
      "model": "grok-imagine-image-pro",
      "lab": "SpaceXAI",
      "value": "1161 ±4"
    },
    {
      "model": "flux-2-flex",
      "lab": "Black Forest Labs",
      "value": "1157 ±3"
    },
    {
      "model": "flux-2-pro",
      "lab": "Black Forest Labs",
      "value": "1155 ±3"
    },
    {
      "model": "Cosmos3-Super-Text2Image",
      "lab": "Nvidia",
      "value": "1155 ±8"
    },
    {
      "model": "reve-v1.5",
      "lab": "Reve",
      "value": "1154 ±4"
    },
    {
      "model": "hunyuan-image-3.0",
      "lab": "Tencent",
      "value": "1151 ±3"
    },
    {
      "model": "gemini-2.5-flash-image-preview (nano-banana)",
      "lab": "Google",
      "value": "1150 ±3"
    },
    {
      "model": "imagen-ultra-4.0-generate-001",
      "lab": "Google",
      "value": "1148 ±4"
    },
    {
      "model": "seedream-4.5",
      "lab": "Bytedance",
      "value": "1147 ±3",
      "highlight": true
    },
    {
      "model": "flux-2-dev",
      "lab": "Black Forest Labs",
      "value": "1145 ±4"
    },
    {
      "model": "seedream-4-2k",
      "lab": "Bytedance",
      "value": "1140 ±7",
      "highlight": true
    },
    {
      "model": "seedream-5.0-lite",
      "lab": "Bytedance",
      "value": "1137 ±4",
      "highlight": true
    },
    {
      "model": "wan2.6-t2i",
      "lab": "Alibaba",
      "value": "1136 ±3"
    },
    {
      "model": "recraft-v4.1-pro",
      "lab": "Recraft",
      "value": "1130 ±11"
    },
    {
      "model": "imagen-4.0-generate-001",
      "lab": "Google",
      "value": "1129 ±3"
    },
    {
      "model": "qwen-image-2512",
      "lab": "Alibaba",
      "value": "1125 ±4"
    },
    {
      "model": "krea-2-medium",
      "lab": "Krea",
      "value": "1122 ±5"
    },
    {
      "model": "wan2.5-t2i-preview",
      "lab": "Alibaba",
      "value": "1117 ±3"
    },
    {
      "model": "hidream-o1-image",
      "lab": "HiDream",
      "value": "1117 ±4"
    },
    {
      "model": "seedream-4-fal",
      "lab": "Bytedance",
      "value": "1116 ±7",
      "highlight": true
    },
    {
      "model": "gpt-image-1",
      "lab": "OpenAI",
      "value": "1115 ±3"
    },
    {
      "model": "recraft-v4",
      "lab": "Recraft",
      "value": "1114 ±4"
    },
    {
      "model": "seedream-4-high-res-fal",
      "lab": "Bytedance",
      "value": "1113 ±3",
      "highlight": true
    },
    {
      "model": "krea-2-turbo",
      "lab": "Krea",
      "value": "1111 ±5"
    },
    {
      "model": "gpt-image-1-mini",
      "lab": "OpenAI",
      "value": "1109 ±3"
    },
    {
      "model": "krea-2-large",
      "lab": "Krea",
      "value": "1107 ±5"
    }
  ],
  "Text-to-Video": [
    {
      "model": "gemini-omni-flash",
      "lab": "Google",
      "value": "1512 ±11"
    },
    {
      "model": "flux-3-video",
      "lab": "Black Forest Labs",
      "value": "1496 ±17 Preliminary"
    },
    {
      "model": "dreamina-seedance-2.0-720p",
      "lab": "Bytedance",
      "value": "1478 ±9",
      "highlight": true
    },
    {
      "model": "muse-video",
      "lab": "Meta",
      "value": "1457 ±15"
    },
    {
      "model": "minimax-h3",
      "lab": "MiniMax",
      "value": "1453 ±14"
    },
    {
      "model": "happyhorse-1.0",
      "lab": "Alibaba-ATH",
      "value": "1428 ±13"
    },
    {
      "model": "sora-2-pro",
      "lab": "OpenAI",
      "value": "1366 ±7"
    },
    {
      "model": "veo-3.1-audio",
      "lab": "Google",
      "value": "1364 ±14"
    },
    {
      "model": "veo-3.1-audio-1080p",
      "lab": "Google",
      "value": "1363 ±10"
    },
    {
      "model": "veo-3.1-fast-audio",
      "lab": "Google",
      "value": "1362 ±10"
    },
    {
      "model": "veo-3.1-fast-audio-1080p",
      "lab": "Google",
      "value": "1358 ±10"
    },
    {
      "model": "veo-3-fast-audio",
      "lab": "Google",
      "value": "1347 ±11"
    },
    {
      "model": "grok-imagine-video-720p",
      "lab": "SpaceXAI",
      "value": "1347 ±7"
    },
    {
      "model": "wan2.7-t2v",
      "lab": "Alibaba",
      "value": "1343 ±8"
    },
    {
      "model": "sora-2",
      "lab": "OpenAI",
      "value": "1340 ±7"
    },
    {
      "model": "veo-3-audio",
      "lab": "Google",
      "value": "1339 ±13"
    },
    {
      "model": "wan2.6-t2v",
      "lab": "Alibaba",
      "value": "1333 ±8"
    },
    {
      "model": "seedance-v1.5-pro",
      "lab": "Bytedance",
      "value": "1256 ±7",
      "highlight": true
    },
    {
      "model": "veo-3",
      "lab": "Google",
      "value": "1253 ±11"
    },
    {
      "model": "wan2.5-t2v-preview",
      "lab": "Alibaba",
      "value": "1249 ±9"
    },
    {
      "model": "veo-3-fast",
      "lab": "Google",
      "value": "1248 ±12"
    },
    {
      "model": "pixverse-v5.6",
      "lab": "Proprietary",
      "value": "1240 ±11"
    },
    {
      "model": "runway-gen-4.5",
      "lab": "Runway",
      "value": "1223 ±10"
    },
    {
      "model": "kling-2.5-turbo-1080p",
      "lab": "KlingAI",
      "value": "1219 ±17"
    },
    {
      "model": "kling-2.6-pro",
      "lab": "KlingAI",
      "value": "1217 ±7"
    },
    {
      "model": "p-video",
      "lab": "Proprietary",
      "value": "1207 ±16"
    },
    {
      "model": "kling-o1-pro",
      "lab": "KlingAI",
      "value": "1205 ±27"
    },
    {
      "model": "ray-3",
      "lab": "Luma AI",
      "value": "1205 ±22"
    },
    {
      "model": "hailuo-2.3",
      "lab": "MiniMax",
      "value": "1203 ±6"
    },
    {
      "model": "hailuo-02-pro",
      "lab": "MiniMax",
      "value": "1198 ±12"
    },
    {
      "model": "seedance-v1-pro",
      "lab": "Bytedance",
      "value": "1190 ±11",
      "highlight": true
    },
    {
      "model": "hailuo-02-standard",
      "lab": "MiniMax",
      "value": "1180 ±12"
    },
    {
      "model": "kandinsky-5.0-t2v-pro",
      "lab": "Kandinsky",
      "value": "1172 ±20"
    },
    {
      "model": "hunyuan-video-1.5",
      "lab": "Tencent",
      "value": "1169 ±16"
    },
    {
      "model": "veo-2",
      "lab": "Google",
      "value": "1164 ±16"
    },
    {
      "model": "kling-v2.1-master",
      "lab": "KlingAI",
      "value": "1162 ±10"
    },
    {
      "model": "ltx-2-19b",
      "lab": "ltx-2-community-license-agreement",
      "value": "1151 ±8"
    },
    {
      "model": "wan-v2.2-a14b",
      "lab": "Alibaba",
      "value": "1131 ±15"
    },
    {
      "model": "kandinsky-5.0-t2v-lite",
      "lab": "Kandinsky",
      "value": "1113 ±18"
    },
    {
      "model": "seedance-v1-lite",
      "lab": "Bytedance",
      "value": "1112 ±10",
      "highlight": true
    },
    {
      "model": "sora",
      "lab": "OpenAI",
      "value": "1069 ±16"
    },
    {
      "model": "ray2",
      "lab": "Luma AI",
      "value": "1064 ±17"
    },
    {
      "model": "pika-v2.2",
      "lab": "Pika",
      "value": "1008 ±15"
    },
    {
      "model": "mochi-v1",
      "lab": "Genmo AI",
      "value": "1005 ±17"
    }
  ],
  "Intelligence Index v4.1": [
    {
      "model": "Claude Opus 5 (max)",
      "lab": "Anthropic",
      "value": "63"
    },
    {
      "model": "Claude Opus 5 (xhigh)",
      "lab": "Anthropic",
      "value": "63"
    },
    {
      "model": "Claude Fable 5 (with fallback)",
      "lab": "Anthropic",
      "value": "62"
    },
    {
      "model": "Claude Opus 5 (high)",
      "lab": "Anthropic",
      "value": "61"
    },
    {
      "model": "GPT-5.6 Sol (max)",
      "lab": "OpenAI",
      "value": "61"
    },
    {
      "model": "Grok 4.6 (high)",
      "lab": "SpaceXAI",
      "value": "61"
    },
    {
      "model": "Kimi K3 (max)",
      "lab": "Kimi",
      "value": "60"
    },
    {
      "model": "GPT-5.6 Sol (xhigh)",
      "lab": "OpenAI",
      "value": "59"
    },
    {
      "model": "Claude Opus 5 (medium)",
      "lab": "Anthropic",
      "value": "59"
    },
    {
      "model": "Qwen3.8 Max",
      "lab": "Alibaba",
      "value": "58"
    },
    {
      "model": "GPT-5.6 Sol (high)",
      "lab": "OpenAI",
      "value": "57"
    },
    {
      "model": "Claude Opus 4.8 (max)",
      "lab": "Anthropic",
      "value": "57"
    },
    {
      "model": "Muse Spark 1.2 (xhigh)",
      "lab": "Meta",
      "value": "57"
    },
    {
      "model": "GPT-5.6 Terra (max)",
      "lab": "OpenAI",
      "value": "57"
    },
    {
      "model": "GPT-5.5 (xhigh)",
      "lab": "OpenAI",
      "value": "56"
    },
    {
      "model": "Grok 4.5 (high)",
      "lab": "SpaceXAI",
      "value": "56"
    },
    {
      "model": "GPT-5.6 Sol (medium)",
      "lab": "OpenAI",
      "value": "56"
    },
    {
      "model": "Claude Sonnet 5 (max)",
      "lab": "Anthropic",
      "value": "55"
    },
    {
      "model": "Claude Opus 4.7 (max)",
      "lab": "Anthropic",
      "value": "55"
    },
    {
      "model": "GPT-5.5 (high)",
      "lab": "OpenAI",
      "value": "55"
    },
    {
      "model": "Muse Spark 1.1 (xhigh)",
      "lab": "Meta",
      "value": "53"
    },
    {
      "model": "GPT-5.4 (xhigh)",
      "lab": "OpenAI",
      "value": "53"
    },
    {
      "model": "DeepSeek V4 Pro 0813 (max)",
      "lab": "DeepSeek",
      "value": "53"
    },
    {
      "model": "GPT-5.6 Terra (xhigh)",
      "lab": "OpenAI",
      "value": "53"
    },
    {
      "model": "GLM-5.2 (max)",
      "lab": "Z AI",
      "value": "53"
    },
    {
      "model": "Claude Opus 5 (low)",
      "lab": "Anthropic",
      "value": "52"
    },
    {
      "model": "GPT-5.6 Luna (max)",
      "lab": "OpenAI",
      "value": "52"
    },
    {
      "model": "Gemini 3.5 Flash",
      "lab": "Google",
      "value": "52"
    },
    {
      "model": "DeepSeek V4 Flash 0731 (max)",
      "lab": "DeepSeek",
      "value": "52"
    },
    {
      "model": "Gemini 3.6 Flash",
      "lab": "Google",
      "value": "52"
    },
    {
      "model": "GPT-5.5 (medium)",
      "lab": "OpenAI",
      "value": "51"
    },
    {
      "model": "GPT-5.6 Sol (low)",
      "lab": "OpenAI",
      "value": "51"
    },
    {
      "model": "GPT-5.6 Terra (high)",
      "lab": "OpenAI",
      "value": "50"
    },
    {
      "model": "GPT-5.6 Luna (xhigh)",
      "lab": "OpenAI",
      "value": "50"
    },
    {
      "model": "Claude Sonnet 4.6 (max)",
      "lab": "Anthropic",
      "value": "48"
    },
    {
      "model": "Kimi K3 (low)",
      "lab": "Kimi",
      "value": "48"
    },
    {
      "model": "Gemini 3.1 Pro Preview",
      "lab": "Google",
      "value": "48"
    },
    {
      "model": "Motif 3",
      "lab": "Motif Technologies",
      "value": "47"
    },
    {
      "model": "GPT-5.6 Luna (high)",
      "lab": "OpenAI",
      "value": "47"
    },
    {
      "model": "GPT-5.6 Terra (medium)",
      "lab": "OpenAI",
      "value": "47"
    },
    {
      "model": "Qwen3.7 Max",
      "lab": "Alibaba",
      "value": "47"
    },
    {
      "model": "MiniMax-M3",
      "lab": "MiniMax",
      "value": "45"
    },
    {
      "model": "DeepSeek V4 Pro (max)",
      "lab": "DeepSeek",
      "value": "45"
    },
    {
      "model": "Kimi K2.6",
      "lab": "Kimi",
      "value": "45"
    },
    {
      "model": "GPT-5.5 (low)",
      "lab": "OpenAI",
      "value": "44"
    },
    {
      "model": "DeepSeek V4 Pro (high)",
      "lab": "DeepSeek",
      "value": "44"
    },
    {
      "model": "Kimi K2.7 Code",
      "lab": "Kimi",
      "value": "43"
    },
    {
      "model": "MiMo-V2.5-Pro",
      "lab": "Xiaomi",
      "value": "43"
    },
    {
      "model": "Claude Sonnet 5 (Non-reasoning)",
      "lab": "Anthropic",
      "value": "43"
    },
    {
      "model": "Inkling",
      "lab": "Thinking Machines",
      "value": "42"
    }
  ],
  "Coding Agent Index": [
    {
      "model": "Claude Code - Opus 5 (max)",
      "lab": "Anthropic",
      "value": "66"
    },
    {
      "model": "Codex - GPT-5.6 Sol (xhigh)",
      "lab": "OpenAI",
      "value": "65"
    },
    {
      "model": "Codex - GPT-5.6 Sol (high)",
      "lab": "OpenAI",
      "value": "64"
    },
    {
      "model": "Claude Code - Opus 5 (high)",
      "lab": "Anthropic",
      "value": "63"
    },
    {
      "model": "Codex - GPT-5.6 Terra (max)",
      "lab": "OpenAI",
      "value": "62"
    },
    {
      "model": "Claude Code - Opus 5 (medium)",
      "lab": "Anthropic",
      "value": "62"
    },
    {
      "model": "Codex - GPT-5.5 (xhigh)",
      "lab": "OpenAI",
      "value": "61"
    },
    {
      "model": "Codex - GPT-5.6 Sol (medium)",
      "lab": "OpenAI",
      "value": "61"
    },
    {
      "model": "Claude Code - Opus 4.8 (max)",
      "lab": "Anthropic",
      "value": "61"
    },
    {
      "model": "Claude Code - Qwen3.8 Max",
      "lab": "Alibaba Cloud",
      "value": "59"
    },
    {
      "model": "Codex - GPT-5.6 Luna (max)",
      "lab": "OpenAI",
      "value": "59"
    },
    {
      "model": "Claude Code - Opus 4.8 (xhigh)",
      "lab": "Anthropic",
      "value": "58"
    },
    {
      "model": "Codex - GPT-5.6 Terra (xhigh)",
      "lab": "OpenAI",
      "value": "57"
    },
    {
      "model": "Claude Code - Opus 5 (low)",
      "lab": "Anthropic",
      "value": "57"
    },
    {
      "model": "Claude Code - Opus 4.8 (high)",
      "lab": "Anthropic",
      "value": "57"
    },
    {
      "model": "Codex - GPT-5.6 Terra (high)",
      "lab": "OpenAI",
      "value": "56"
    },
    {
      "model": "Codex - GPT-5.6 Luna (xhigh)",
      "lab": "OpenAI",
      "value": "55"
    },
    {
      "model": "Codex - GPT-5.5 (medium)",
      "lab": "OpenAI",
      "value": "54"
    },
    {
      "model": "Codex - GPT-5.6 Sol (low)",
      "lab": "OpenAI",
      "value": "54"
    },
    {
      "model": "Claude Code - Opus 4.8 (medium)",
      "lab": "Anthropic",
      "value": "54"
    },
    {
      "model": "Codex - GPT-5.6 Luna (high)",
      "lab": "OpenAI",
      "value": "51"
    },
    {
      "model": "Claude Code - Opus 4.7 (max)",
      "lab": "Anthropic",
      "value": "50"
    },
    {
      "model": "Opencode - Opus 4.7 (medium)",
      "lab": "Anthropic",
      "value": "50"
    },
    {
      "model": "Codex - GPT-5.6 Terra (medium)",
      "lab": "OpenAI",
      "value": "48"
    },
    {
      "model": "Claude Code - Opus 4.8 (low)",
      "lab": "Anthropic",
      "value": "47"
    },
    {
      "model": "Claude Code - Opus 4.6 (medium)",
      "lab": "Anthropic",
      "value": "46"
    },
    {
      "model": "Cursor CLI - GPT-5.5 (medium)",
      "lab": "OpenAI",
      "value": "46"
    },
    {
      "model": "Cursor CLI - Opus 4.7 (medium)",
      "lab": "Anthropic",
      "value": "45"
    },
    {
      "model": "Codex - GPT-5.6 Sol (none)",
      "lab": "OpenAI",
      "value": "43"
    },
    {
      "model": "Codex - GPT-5.6 Luna (medium)",
      "lab": "OpenAI",
      "value": "42"
    },
    {
      "model": "Claude Code - Opus 4.7 (medium)",
      "lab": "Anthropic",
      "value": "40"
    },
    {
      "model": "Codex - GPT-5.4 (medium)",
      "lab": "OpenAI",
      "value": "39"
    },
    {
      "model": "Cursor CLI - Composer 2.5",
      "lab": "Cursor",
      "value": "38"
    },
    {
      "model": "Claude Code - Sonnet 4.6 (medium)",
      "lab": "Anthropic",
      "value": "38"
    },
    {
      "model": "Cursor CLI - GPT-5.4 (medium)",
      "lab": "OpenAI",
      "value": "37"
    },
    {
      "model": "Codex - GPT-5.6 Terra (low)",
      "lab": "OpenAI",
      "value": "37"
    },
    {
      "model": "Claude Code - GLM-5.1",
      "lab": "Z.ai",
      "value": "36"
    },
    {
      "model": "Claude Code - Qwen3.7 Plus (thinking)",
      "lab": "Alibaba Cloud",
      "value": "36"
    },
    {
      "model": "Claude Code - Kimi K2.6",
      "lab": "Moonshot AI",
      "value": "33"
    },
    {
      "model": "Claude Code - DeepSeek V4 Pro (high)",
      "lab": "DeepSeek",
      "value": "31"
    },
    {
      "model": "Gemini CLI - Gemini 3.1 Pro (high)",
      "lab": "Google",
      "value": "30"
    },
    {
      "model": "Cursor CLI - Composer 2",
      "lab": "Cursor",
      "value": "27"
    },
    {
      "model": "Codex - GPT-5.6 Luna (low)",
      "lab": "OpenAI",
      "value": "25"
    },
    {
      "model": "Codex - GPT-5.6 Terra (none)",
      "lab": "OpenAI",
      "value": "24"
    },
    {
      "model": "Codex - GPT-5.6 Luna (none)",
      "lab": "OpenAI",
      "value": "20"
    }
  ],
  "Agentic Index": [
    {
      "model": "Claude Opus 5 (max)",
      "lab": "Anthropic",
      "value": "59"
    },
    {
      "model": "Grok 4.6 (high)",
      "lab": "SpaceXAI",
      "value": "59"
    },
    {
      "model": "Claude Opus 5 (xhigh)",
      "lab": "Anthropic",
      "value": "58"
    },
    {
      "model": "Qwen3.8 Max",
      "lab": "Alibaba",
      "value": "58"
    },
    {
      "model": "GPT-5.6 Sol (max)",
      "lab": "OpenAI",
      "value": "58"
    },
    {
      "model": "Claude Fable 5 (with fallback)",
      "lab": "Anthropic",
      "value": "57"
    },
    {
      "model": "Claude Opus 5 (high)",
      "lab": "Anthropic",
      "value": "56"
    },
    {
      "model": "Kimi K3 (max)",
      "lab": "Kimi",
      "value": "54"
    },
    {
      "model": "GPT-5.6 Sol (xhigh)",
      "lab": "OpenAI",
      "value": "54"
    },
    {
      "model": "GPT-5.6 Sol (high)",
      "lab": "OpenAI",
      "value": "51"
    },
    {
      "model": "Claude Opus 5 (medium)",
      "lab": "Anthropic",
      "value": "50"
    },
    {
      "model": "GPT-5.6 Terra (max)",
      "lab": "OpenAI",
      "value": "50"
    },
    {
      "model": "Claude Sonnet 5 (max)",
      "lab": "Anthropic",
      "value": "50"
    },
    {
      "model": "DeepSeek V4 Pro 0813 (max)",
      "lab": "DeepSeek",
      "value": "50"
    },
    {
      "model": "Claude Opus 4.8 (max)",
      "lab": "Anthropic",
      "value": "49"
    },
    {
      "model": "Muse Spark 1.2 (xhigh)",
      "lab": "Meta",
      "value": "49"
    },
    {
      "model": "Grok 4.5 (high)",
      "lab": "SpaceXAI",
      "value": "49"
    },
    {
      "model": "DeepSeek V4 Flash 0731 (max)",
      "lab": "DeepSeek",
      "value": "48"
    },
    {
      "model": "GPT-5.6 Sol (medium)",
      "lab": "OpenAI",
      "value": "48"
    },
    {
      "model": "GPT-5.5 (xhigh)",
      "lab": "OpenAI",
      "value": "47"
    },
    {
      "model": "GPT-5.6 Luna (max)",
      "lab": "OpenAI",
      "value": "47"
    },
    {
      "model": "GPT-5.6 Terra (xhigh)",
      "lab": "OpenAI",
      "value": "46"
    },
    {
      "model": "Claude Opus 4.7 (max)",
      "lab": "Anthropic",
      "value": "46"
    },
    {
      "model": "GPT-5.5 (high)",
      "lab": "OpenAI",
      "value": "46"
    },
    {
      "model": "GLM-5.2 (max)",
      "lab": "Z AI",
      "value": "46"
    },
    {
      "model": "GPT-5.6 Luna (xhigh)",
      "lab": "OpenAI",
      "value": "44"
    },
    {
      "model": "GPT-5.4 (xhigh)",
      "lab": "OpenAI",
      "value": "44"
    },
    {
      "model": "GPT-5.6 Terra (high)",
      "lab": "OpenAI",
      "value": "43"
    },
    {
      "model": "Claude Opus 5 (low)",
      "lab": "Anthropic",
      "value": "42"
    },
    {
      "model": "Claude Sonnet 4.6 (max)",
      "lab": "Anthropic",
      "value": "42"
    },
    {
      "model": "GPT-5.6 Sol (low)",
      "lab": "OpenAI",
      "value": "42"
    },
    {
      "model": "GPT-5.6 Luna (high)",
      "lab": "OpenAI",
      "value": "41"
    },
    {
      "model": "Gemini 3.6 Flash",
      "lab": "Google",
      "value": "41"
    },
    {
      "model": "Muse Spark 1.1 (xhigh)",
      "lab": "Meta",
      "value": "40"
    },
    {
      "model": "Gemini 3.5 Flash",
      "lab": "Google",
      "value": "40"
    },
    {
      "model": "Kimi K3 (low)",
      "lab": "Kimi",
      "value": "40"
    },
    {
      "model": "GPT-5.5 (medium)",
      "lab": "OpenAI",
      "value": "39"
    },
    {
      "model": "GPT-5.6 Terra (medium)",
      "lab": "OpenAI",
      "value": "39"
    },
    {
      "model": "DeepSeek V4 Pro (max)",
      "lab": "DeepSeek",
      "value": "38"
    },
    {
      "model": "Motif 3",
      "lab": "Motif Technologies",
      "value": "38"
    },
    {
      "model": "MiniMax-M3",
      "lab": "MiniMax",
      "value": "36"
    },
    {
      "model": "GPT-5.6 Sol (Non-reasoning)",
      "lab": "OpenAI",
      "value": "36"
    },
    {
      "model": "DeepSeek V4 Pro (high)",
      "lab": "DeepSeek",
      "value": "35"
    },
    {
      "model": "GLM-5.2",
      "lab": "Z AI",
      "value": "35"
    },
    {
      "model": "Claude Sonnet 5 (Non-reasoning)",
      "lab": "Anthropic",
      "value": "34"
    },
    {
      "model": "Inkling",
      "lab": "Thinking Machines",
      "value": "34"
    },
    {
      "model": "DeepSeek V4 Flash (max)",
      "lab": "DeepSeek",
      "value": "34"
    },
    {
      "model": "Solar Pro 4",
      "lab": "Upstage",
      "value": "34"
    },
    {
      "model": "Inkling Small",
      "lab": "Thinking Machines",
      "value": "32"
    },
    {
      "model": "GPT-5.6 Luna (medium)",
      "lab": "OpenAI",
      "value": "32"
    }
  ],
  "AA-Briefcase": [
    {
      "model": "Claude Opus 5 (max)",
      "lab": "Anthropic",
      "value": "1715"
    },
    {
      "model": "Claude Opus 5 (xhigh)",
      "lab": "Anthropic",
      "value": "1690"
    },
    {
      "model": "Claude Opus 5 (high)",
      "lab": "Anthropic",
      "value": "1606"
    },
    {
      "model": "Grok 4.6 (high)",
      "lab": "SpaceXAI",
      "value": "1577"
    },
    {
      "model": "Claude Fable 5 (with fallback)",
      "lab": "Anthropic",
      "value": "1574"
    },
    {
      "model": "Kimi K3 (max)",
      "lab": "Kimi",
      "value": "1541"
    },
    {
      "model": "GPT-5.6 Sol (max)",
      "lab": "OpenAI",
      "value": "1502"
    },
    {
      "model": "Claude Opus 5 (medium)",
      "lab": "Anthropic",
      "value": "1469"
    },
    {
      "model": "Qwen3.8 Max",
      "lab": "Alibaba",
      "value": "1420"
    },
    {
      "model": "Claude Sonnet 5 (max)",
      "lab": "Anthropic",
      "value": "1383"
    },
    {
      "model": "Muse Spark 1.2 (xhigh)",
      "lab": "Meta",
      "value": "1358"
    },
    {
      "model": "Claude Opus 4.8 (max)",
      "lab": "Anthropic",
      "value": "1340"
    },
    {
      "model": "Grok 4.5 (high)",
      "lab": "SpaceXAI",
      "value": "1313"
    },
    {
      "model": "Claude Sonnet 5 (xhigh)",
      "lab": "Anthropic",
      "value": "1292"
    },
    {
      "model": "DeepSeek V4 Flash 0731 (max)",
      "lab": "DeepSeek",
      "value": "1286"
    },
    {
      "model": "Claude Opus 4.7 (max)",
      "lab": "Anthropic",
      "value": "1276"
    },
    {
      "model": "GLM-5.2 (max)",
      "lab": "Z AI",
      "value": "1252"
    },
    {
      "model": "Claude Opus 5 (low)",
      "lab": "Anthropic",
      "value": "1225"
    },
    {
      "model": "Claude Sonnet 5 (high)",
      "lab": "Anthropic",
      "value": "1193"
    },
    {
      "model": "GPT-5.5 (xhigh)",
      "lab": "OpenAI",
      "value": "1150"
    },
    {
      "model": "MiniMax-M3",
      "lab": "MiniMax",
      "value": "1107"
    },
    {
      "model": "GPT-5.5 (high)",
      "lab": "OpenAI",
      "value": "1099"
    },
    {
      "model": "Claude Opus 4.7 (Non-reasoning, high)",
      "lab": "Anthropic",
      "value": "1082"
    },
    {
      "model": "Claude Sonnet 4.6 (max)",
      "lab": "Anthropic",
      "value": "1075"
    },
    {
      "model": "Claude Sonnet 5 (medium)",
      "lab": "Anthropic",
      "value": "1057"
    },
    {
      "model": "GPT-5.5 (medium)",
      "lab": "OpenAI",
      "value": "1000"
    },
    {
      "model": "GLM-5.1",
      "lab": "Z AI",
      "value": "971"
    },
    {
      "model": "Gemini 3.6 Flash",
      "lab": "Google",
      "value": "963"
    },
    {
      "model": "Claude Sonnet 5 (low)",
      "lab": "Anthropic",
      "value": "931"
    },
    {
      "model": "DeepSeek V4 Pro (max)",
      "lab": "DeepSeek",
      "value": "930"
    },
    {
      "model": "Inkling Small",
      "lab": "Thinking Machines",
      "value": "917"
    },
    {
      "model": "Qwen3.7 Max",
      "lab": "Alibaba",
      "value": "914"
    },
    {
      "model": "MiMo-V2.5-Pro",
      "lab": "Xiaomi",
      "value": "880"
    },
    {
      "model": "Nemotron 3 Ultra",
      "lab": "NVIDIA",
      "value": "874"
    },
    {
      "model": "Gemini 3.5 Flash",
      "lab": "Google",
      "value": "872"
    },
    {
      "model": "Gemini 3.5 Flash (medium)",
      "lab": "Google",
      "value": "871"
    },
    {
      "model": "GPT-5.3 Codex (xhigh)",
      "lab": "OpenAI",
      "value": "870"
    },
    {
      "model": "Muse Spark 1.1 (xhigh)",
      "lab": "Meta",
      "value": "869"
    },
    {
      "model": "Inkling",
      "lab": "Thinking Machines",
      "value": "842"
    },
    {
      "model": "DeepSeek V4 Flash (max)",
      "lab": "DeepSeek",
      "value": "834"
    },
    {
      "model": "Kimi K2.6",
      "lab": "Kimi",
      "value": "819"
    },
    {
      "model": "Qwen3.6 27B",
      "lab": "Alibaba",
      "value": "810"
    },
    {
      "model": "Grok 4.3 (high)",
      "lab": "SpaceXAI",
      "value": "760"
    },
    {
      "model": "GPT-5.4 mini (xhigh)",
      "lab": "OpenAI",
      "value": "717"
    },
    {
      "model": "Muse Spark",
      "lab": "Meta",
      "value": "643"
    },
    {
      "model": "Gemini 3.5 Flash-Lite",
      "lab": "Google",
      "value": "635"
    },
    {
      "model": "Claude 4.5 Haiku",
      "lab": "Anthropic",
      "value": "612"
    },
    {
      "model": "KAT-Coder-Pro V1",
      "lab": "KwaiKAT",
      "value": "599"
    },
    {
      "model": "Qwen3.5 397B A17B",
      "lab": "Alibaba",
      "value": "554"
    },
    {
      "model": "Mistral Medium 3.5",
      "lab": "Mistral",
      "value": "517"
    }
  ]
} satisfies Record<string, LeaderboardRow[]>;

export const LEADERBOARD_ROW_COUNTS = Object.fromEntries(
  Object.entries(CURRENT_LEADERBOARD_ROWS).map(([name, rows]) => [name, rows.length]),
) as Record<keyof typeof CURRENT_LEADERBOARD_ROWS, number>;
