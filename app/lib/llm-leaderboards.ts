export type LeaderboardRow = {
  model: string;
  lab: string;
  value: string;
  highlight?: boolean;
};

// Static snapshot verified from the linked leaderboard pages on 2026-08-25.
// Each board stores up to the first 50 published rows; shorter boards store every published scored row.
export const CURRENT_LEADERBOARD_ROWS = {
  "Text / Overall": [
    {
      "model": "claude-fable-5",
      "lab": "Anthropic",
      "value": "1508 ±5"
    },
    {
      "model": "claude-opus-4-6-high",
      "lab": "Anthropic",
      "value": "1504 ±4"
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
      "model": "muse-spark-1.1",
      "lab": "Meta",
      "value": "1491 ±5"
    },
    {
      "model": "gemini-3.7-flash-high",
      "lab": "Google",
      "value": "1490 ±8 Preliminary"
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
      "model": "claude-opus-5-max",
      "lab": "Anthropic",
      "value": "1487 ±6"
    },
    {
      "model": "glm-5.3-max",
      "lab": "Z.ai",
      "value": "1487 ±10"
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
      "model": "gpt-5.6-sol-xhigh",
      "lab": "OpenAI",
      "value": "1482 ±5"
    },
    {
      "model": "gpt-5.5-high",
      "lab": "OpenAI",
      "value": "1482 ±4"
    },
    {
      "model": "claude-opus-4-8-high",
      "lab": "Anthropic",
      "value": "1482 ±4"
    },
    {
      "model": "qwen3.8-max",
      "lab": "Alibaba",
      "value": "1481 ±7"
    },
    {
      "model": "gemini-3.6-flash-high",
      "lab": "Google",
      "value": "1481 ±5"
    },
    {
      "model": "gemini-3.5-flash-high",
      "lab": "Google",
      "value": "1478 ±5"
    },
    {
      "model": "gpt-5.4-high",
      "lab": "OpenAI",
      "value": "1476 ±4"
    },
    {
      "model": "gpt-5.5",
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
      "model": "gpt-5.5-instant",
      "lab": "OpenAI",
      "value": "1474 ±5"
    },
    {
      "model": "claude-opus-4-8",
      "lab": "Anthropic",
      "value": "1473 ±4"
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
      "value": "1470 ±5"
    },
    {
      "model": "grok-4.5",
      "lab": "SpaceXAI",
      "value": "1470 ±5"
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
      "model": "ernie-5.1",
      "lab": "Baidu",
      "value": "1468 ±5"
    },
    {
      "model": "glm-5.1",
      "lab": "Z.ai",
      "value": "1468 ±4"
    },
    {
      "model": "mimo-v2.5-pro",
      "lab": "Xiaomi",
      "value": "1468 ±4"
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
      "model": "qwen3.5-max-preview",
      "lab": "Alibaba",
      "value": "1465 ±5"
    },
    {
      "model": "gpt-5.6-terra-xhigh",
      "lab": "OpenAI",
      "value": "1465 ±5"
    },
    {
      "model": "claude-sonnet-5-high",
      "lab": "Anthropic",
      "value": "1461 ±5"
    },
    {
      "model": "grok-4.6-high",
      "lab": "SpaceXAI",
      "value": "1461 ±10 Preliminary"
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
      "model": "deepseek-v4-pro-high-20260813",
      "lab": "DeepSeek",
      "value": "1459 ±10"
    }
  ],
  "Coding Arena": [
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
      "model": "claude-fable-5",
      "lab": "Anthropic",
      "value": "1551 ±8"
    },
    {
      "model": "claude-opus-4-7",
      "lab": "Anthropic",
      "value": "1547 ±6"
    },
    {
      "model": "claude-opus-4-6",
      "lab": "Anthropic",
      "value": "1546 ±5"
    },
    {
      "model": "kimi-k3-max",
      "lab": "Moonshot",
      "value": "1542 ±10"
    },
    {
      "model": "claude-opus-5-high",
      "lab": "Anthropic",
      "value": "1533 ±8"
    },
    {
      "model": "claude-opus-4-8-high",
      "lab": "Anthropic",
      "value": "1533 ±7"
    },
    {
      "model": "muse-spark-1.2 (xHigh)",
      "lab": "Meta",
      "value": "1531 ±20"
    },
    {
      "model": "glm-5.3-max",
      "lab": "Z.ai",
      "value": "1531 ±19"
    },
    {
      "model": "gpt-5.6-sol-xhigh",
      "lab": "OpenAI",
      "value": "1530 ±9"
    },
    {
      "model": "claude-opus-4-5-20251101-high-32k",
      "lab": "Anthropic",
      "value": "1530 ±7"
    },
    {
      "model": "muse-spark-1.1",
      "lab": "Meta",
      "value": "1530 ±8"
    },
    {
      "model": "claude-sonnet-4-6",
      "lab": "Anthropic",
      "value": "1528 ±6"
    },
    {
      "model": "claude-opus-4-8",
      "lab": "Anthropic",
      "value": "1527 ±7"
    },
    {
      "model": "muse-spark",
      "lab": "Meta",
      "value": "1526 ±10"
    },
    {
      "model": "qwen3.7-max-preview",
      "lab": "Alibaba",
      "value": "1524 ±18"
    },
    {
      "model": "claude-opus-5-max",
      "lab": "Anthropic",
      "value": "1524 ±10"
    },
    {
      "model": "claude-opus-4-5-20251101",
      "lab": "Anthropic",
      "value": "1523 ±6"
    },
    {
      "model": "grok-4.5",
      "lab": "SpaceXAI",
      "value": "1523 ±8"
    },
    {
      "model": "gemini-3.7-flash-high",
      "lab": "Google",
      "value": "1521 ±15 Preliminary"
    },
    {
      "model": "gemini-3.1-pro-preview",
      "lab": "Google",
      "value": "1521 ±5"
    },
    {
      "model": "claude-sonnet-5-high",
      "lab": "Anthropic",
      "value": "1521 ±8"
    },
    {
      "model": "gpt-5.4-high",
      "lab": "OpenAI",
      "value": "1520 ±6"
    },
    {
      "model": "qwen3.8-max",
      "lab": "Alibaba",
      "value": "1520 ±11"
    },
    {
      "model": "claude-sonnet-4-5-20250929-high-32k",
      "lab": "Anthropic",
      "value": "1519 ±5"
    },
    {
      "model": "mimo-v2.5-pro",
      "lab": "Xiaomi",
      "value": "1519 ±6"
    },
    {
      "model": "gpt-5.5-high",
      "lab": "OpenAI",
      "value": "1519 ±6"
    },
    {
      "model": "gemini-3.6-flash-high",
      "lab": "Google",
      "value": "1518 ±9"
    },
    {
      "model": "gemini-3-pro",
      "lab": "Google",
      "value": "1518 ±7"
    },
    {
      "model": "gpt-5.6-terra-xhigh",
      "lab": "OpenAI",
      "value": "1517 ±9"
    },
    {
      "model": "glm-5.1",
      "lab": "Z.ai",
      "value": "1515 ±6"
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
      "model": "gpt-5.5-instant",
      "lab": "OpenAI",
      "value": "1514 ±8"
    },
    {
      "model": "ernie-5.1",
      "lab": "Baidu",
      "value": "1514 ±7"
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
      "model": "deepseek-v4-pro-high-20260813",
      "lab": "DeepSeek",
      "value": "1510 ±18"
    },
    {
      "model": "grok-4.6-high",
      "lab": "SpaceXAI",
      "value": "1509 ±21 Preliminary"
    },
    {
      "model": "qwen3.6-max-preview",
      "lab": "Alibaba",
      "value": "1509 ±15"
    },
    {
      "model": "gpt-5.5",
      "lab": "OpenAI",
      "value": "1509 ±6"
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
      "model": "gemini-3.5-flash-high",
      "lab": "Google",
      "value": "1507 ±7"
    }
  ],
  "WebDev Arena": [
    {
      "model": "claude-opus-5-max",
      "lab": "Anthropic",
      "value": "1691 +9/-9"
    },
    {
      "model": "kimi-k3-max",
      "lab": "Moonshot",
      "value": "1674 +11/-11"
    },
    {
      "model": "qwen3.8-max",
      "lab": "Alibaba",
      "value": "1669 +13/-13 Preliminary"
    },
    {
      "model": "claude-opus-5-high",
      "lab": "Anthropic",
      "value": "1663 +8/-8"
    },
    {
      "model": "grok-4.6-high",
      "lab": "SpaceXAI",
      "value": "1629 +17/-17 Preliminary"
    },
    {
      "model": "claude-fable-5",
      "lab": "Anthropic",
      "value": "1626 +8/-8"
    },
    {
      "model": "gpt-5.6-sol-xhigh (codex-harness)",
      "lab": "OpenAI",
      "value": "1619 +8/-8"
    },
    {
      "model": "glm-5.3-max",
      "lab": "Z.ai",
      "value": "1599 +15/-15"
    },
    {
      "model": "qwen3.8-27b",
      "lab": "Alibaba",
      "value": "1595 +13/-13"
    },
    {
      "model": "gemini-3.7-flash-high",
      "lab": "Google",
      "value": "1587 +13/-13 Preliminary"
    },
    {
      "model": "glm-5.2-max",
      "lab": "Z.ai",
      "value": "1582 +8/-8"
    },
    {
      "model": "deepseek-v4-pro-high-20260813",
      "lab": "DeepSeek",
      "value": "1582 +12/-12"
    },
    {
      "model": "deepseek-v4-flash-high",
      "lab": "DeepSeek",
      "value": "1579 +11/-11"
    },
    {
      "model": "claude-opus-4-8-high",
      "lab": "Anthropic",
      "value": "1563 +7/-7"
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
      "value": "1556 +8/-8"
    },
    {
      "model": "claude-opus-4-6-high",
      "lab": "Anthropic",
      "value": "1546 +6/-6"
    },
    {
      "model": "claude-opus-4-8",
      "lab": "Anthropic",
      "value": "1539 +7/-7"
    },
    {
      "model": "muse-spark-1.1",
      "lab": "Meta",
      "value": "1539 +8/-8"
    },
    {
      "model": "gemini-3.6-flash-high",
      "lab": "Google",
      "value": "1539 +9/-9"
    },
    {
      "model": "claude-sonnet-5-high",
      "lab": "Anthropic",
      "value": "1539 +8/-8"
    },
    {
      "model": "claude-opus-4-6",
      "lab": "Anthropic",
      "value": "1536 +6/-6"
    },
    {
      "model": "muse-spark-1.2 (xHigh)",
      "lab": "Meta",
      "value": "1534 +14/-14"
    },
    {
      "model": "claude-sonnet-4-6",
      "lab": "Anthropic",
      "value": "1522 +5/-5"
    },
    {
      "model": "seed-2.1-pro-preview",
      "lab": "Bytedance",
      "value": "1521 +8/-8",
      "highlight": true
    },
    {
      "model": "gpt-5.6-terra-xhigh (codex-harness)",
      "lab": "OpenAI",
      "value": "1520 +9/-9"
    },
    {
      "model": "hy3",
      "lab": "Tencent",
      "value": "1518 +12/-12"
    },
    {
      "model": "gpt-5.6-luna-xhigh (codex-harness)",
      "lab": "OpenAI",
      "value": "1518 +9/-9"
    },
    {
      "model": "qwen3.7-max-20260517",
      "lab": "Alibaba",
      "value": "1517 +8/-8"
    },
    {
      "model": "glm-5.1",
      "lab": "Z.ai",
      "value": "1509 +7/-7"
    },
    {
      "model": "kimi-k2.6",
      "lab": "Moonshot",
      "value": "1509 +7/-7"
    },
    {
      "model": "gpt-5.5-xhigh (codex-harness)",
      "lab": "OpenAI",
      "value": "1508 +6/-6"
    },
    {
      "model": "gemini-3.5-flash-high",
      "lab": "Google",
      "value": "1499 +8/-8"
    },
    {
      "model": "claude-opus-4-5-20251101-high-32k",
      "lab": "Anthropic",
      "value": "1494 +8/-8"
    },
    {
      "model": "gemini-3.5-flash-medium",
      "lab": "Google",
      "value": "1490 +7/-7"
    },
    {
      "model": "minimax-m3",
      "lab": "MiniMax",
      "value": "1488 +7/-7"
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
      "value": "1476 +6/-6"
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
      "value": "1460 +6/-6"
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
      "value": "1446 +5/-5"
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
    }
  ],
  "Vision Arena": [
    {
      "model": "claude-fable-5",
      "lab": "Anthropic",
      "value": "1312 ±9"
    },
    {
      "model": "qwen3.8-max",
      "lab": "Alibaba",
      "value": "1302 ±8"
    },
    {
      "model": "claude-opus-4-7-high",
      "lab": "Anthropic",
      "value": "1301 ±7"
    },
    {
      "model": "claude-opus-4-7",
      "lab": "Anthropic",
      "value": "1299 ±7"
    },
    {
      "model": "claude-opus-4-6-high",
      "lab": "Anthropic",
      "value": "1299 ±7"
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
      "value": "1292 ±15"
    },
    {
      "model": "claude-opus-5-high",
      "lab": "Anthropic",
      "value": "1292 ±9"
    },
    {
      "model": "gemini-3-pro",
      "lab": "Google",
      "value": "1289 ±8"
    },
    {
      "model": "gemini-3.5-flash-high",
      "lab": "Google",
      "value": "1286 ±9"
    },
    {
      "model": "claude-opus-4-8-high",
      "lab": "Anthropic",
      "value": "1285 ±8"
    },
    {
      "model": "gemini-3.6-flash-high",
      "lab": "Google",
      "value": "1285 ±12"
    },
    {
      "model": "gpt-5.5",
      "lab": "OpenAI",
      "value": "1285 ±7"
    },
    {
      "model": "gemini-3.5-flash-medium",
      "lab": "Google",
      "value": "1285 ±9"
    },
    {
      "model": "gpt-5.5-high",
      "lab": "OpenAI",
      "value": "1282 ±7"
    },
    {
      "model": "grok-4.5",
      "lab": "SpaceXAI",
      "value": "1282 ±9"
    },
    {
      "model": "muse-spark-1.1",
      "lab": "Meta",
      "value": "1281 ±9"
    },
    {
      "model": "gpt-5.6-sol-xhigh",
      "lab": "OpenAI",
      "value": "1281 ±10"
    },
    {
      "model": "gpt-5.4",
      "lab": "OpenAI",
      "value": "1280 ±7"
    },
    {
      "model": "gpt-5.4-high",
      "lab": "OpenAI",
      "value": "1280 ±7"
    },
    {
      "model": "claude-opus-4-8",
      "lab": "Anthropic",
      "value": "1278 ±8"
    },
    {
      "model": "gpt-5.2-chat-latest-20260210",
      "lab": "OpenAI",
      "value": "1278 ±7"
    },
    {
      "model": "gemini-3.1-pro-preview",
      "lab": "Google",
      "value": "1277 ±6"
    },
    {
      "model": "gpt-5.5-instant",
      "lab": "OpenAI",
      "value": "1277 ±9"
    },
    {
      "model": "claude-sonnet-4-6",
      "lab": "Anthropic",
      "value": "1275 ±6"
    },
    {
      "model": "claude-sonnet-5-high",
      "lab": "Anthropic",
      "value": "1271 ±9"
    },
    {
      "model": "gemini-3-flash",
      "lab": "Google",
      "value": "1271 ±5"
    },
    {
      "model": "gemini-3.5-flash-lite",
      "lab": "Google",
      "value": "1270 ±12"
    },
    {
      "model": "gpt-5.6-terra-xhigh",
      "lab": "OpenAI",
      "value": "1266 ±10"
    },
    {
      "model": "qwen3.7-plus",
      "lab": "Alibaba",
      "value": "1265 ±8"
    },
    {
      "model": "kimi-k2.6",
      "lab": "Moonshot",
      "value": "1263 ±7"
    },
    {
      "model": "gemma-4-31b",
      "lab": "Google",
      "value": "1260 ±7"
    },
    {
      "model": "gemini-3-flash (thinking-minimal)",
      "lab": "Google",
      "value": "1260 ±6"
    },
    {
      "model": "dola-seed-2.0-pro",
      "lab": "Bytedance",
      "value": "1258 ±8",
      "highlight": true
    },
    {
      "model": "grok-4.20-beta-0309-reasoning",
      "lab": "SpaceXAI",
      "value": "1256 ±6"
    },
    {
      "model": "qwen3.8-27b",
      "lab": "Alibaba",
      "value": "1253 ±13"
    },
    {
      "model": "gpt-5.6-luna-xhigh",
      "lab": "OpenAI",
      "value": "1253 ±10"
    },
    {
      "model": "gpt-5.4-mini-high",
      "lab": "OpenAI",
      "value": "1252 ±7"
    },
    {
      "model": "grok-4.20-multi-agent-beta-0309",
      "lab": "SpaceXAI",
      "value": "1252 ±6"
    },
    {
      "model": "gpt-5.1-high",
      "lab": "OpenAI",
      "value": "1250 ±8"
    },
    {
      "model": "kimi-k2.5-thinking",
      "lab": "Moonshot",
      "value": "1250 ±6"
    },
    {
      "model": "qwen3.5-397b-a17b",
      "lab": "Alibaba",
      "value": "1248 ±6"
    },
    {
      "model": "gemini-2.5-pro",
      "lab": "Google",
      "value": "1246 ±5"
    },
    {
      "model": "gpt-5.2-high",
      "lab": "OpenAI",
      "value": "1244 ±6"
    },
    {
      "model": "gemma-4-26b-a4b",
      "lab": "Google",
      "value": "1242 ±7"
    },
    {
      "model": "grok-4.3",
      "lab": "SpaceXAI",
      "value": "1241 ±7"
    },
    {
      "model": "chatgpt-4o-latest-20250326",
      "lab": "OpenAI",
      "value": "1241 ±6"
    },
    {
      "model": "gpt-5.1",
      "lab": "OpenAI",
      "value": "1238 ±8"
    },
    {
      "model": "kimi-k2.5-instant",
      "lab": "Moonshot",
      "value": "1238 ±11"
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
    },
    {
      "model": "wan2.7-image-pro",
      "lab": "Alibaba",
      "value": "1103 ±5"
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
      "value": "1494 ±17 Preliminary"
    },
    {
      "model": "dreamina-seedance-2.0-720p",
      "lab": "Bytedance",
      "value": "1482 ±10",
      "highlight": true
    },
    {
      "model": "dreamina-seedance-2.5-720p",
      "lab": "Bytedance",
      "value": "1477 ±19",
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
      "value": "1453 ±13"
    },
    {
      "model": "happyhorse-1.0",
      "lab": "Alibaba-ATH",
      "value": "1428 ±13"
    },
    {
      "model": "sora-2-pro",
      "lab": "OpenAI",
      "value": "1364 ±7"
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
      "value": "1361 ±10"
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
      "value": "1345 ±7"
    },
    {
      "model": "wan2.7-t2v",
      "lab": "Alibaba",
      "value": "1344 ±9"
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
      "value": "1330 ±8"
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
      "lab": "Unknown",
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
      "lab": "Unknown",
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
      "value": "1204 ±7"
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
      "value": "1163 ±16"
    },
    {
      "model": "kling-v2.1-master",
      "lab": "KlingAI",
      "value": "1162 ±10"
    },
    {
      "model": "ltx-2-19b",
      "lab": "Unknown",
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
      "value": "1068 ±16"
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
  "Intelligence Index v4.1.1": [
    {
      "model": "Claude Opus 5 (max)",
      "lab": "Anthropic",
      "value": "63"
    },
    {
      "model": "Claude Fable 5 (with fallback)",
      "lab": "Anthropic",
      "value": "62"
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
      "model": "GLM-5.3 (max)",
      "lab": "Z AI",
      "value": "60"
    },
    {
      "model": "Qwen3.8 2.4T A95B",
      "lab": "Alibaba",
      "value": "58"
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
      "model": "Gemini 3.7 Flash (high)",
      "lab": "Google",
      "value": "56"
    },
    {
      "model": "DeepSeek V4 Pro 0813 (max)",
      "lab": "DeepSeek",
      "value": "53"
    },
    {
      "model": "GPT-5.6 Luna (max)",
      "lab": "OpenAI",
      "value": "52"
    },
    {
      "model": "Qwen3.8 27B (xhigh)",
      "lab": "Alibaba",
      "value": "52"
    },
    {
      "model": "Motif 3",
      "lab": "Motif Technologies",
      "value": "47"
    },
    {
      "model": "MiniMax-M3",
      "lab": "MiniMax",
      "value": "45"
    },
    {
      "model": "Inkling",
      "lab": "Thinking Machines",
      "value": "42"
    },
    {
      "model": "Nemotron 3 Ultra",
      "lab": "NVIDIA",
      "value": "38"
    },
    {
      "model": "Gemini 3.5 Flash-Lite",
      "lab": "Google",
      "value": "37"
    },
    {
      "model": "Solar Open2 250B",
      "lab": "Upstage",
      "value": "37"
    },
    {
      "model": "Muse Glimmer (high)",
      "lab": "Meta",
      "value": "35"
    },
    {
      "model": "A.X-K2",
      "lab": "SK Telecom",
      "value": "35"
    },
    {
      "model": "K-EXAONE 2.0",
      "lab": "LG AI Research",
      "value": "31"
    },
    {
      "model": "Mistral Medium 3.5",
      "lab": "Mistral",
      "value": "30"
    },
    {
      "model": "Claude 4.5 Haiku",
      "lab": "Anthropic",
      "value": "30"
    },
    {
      "model": "Nemotron 3 Super",
      "lab": "NVIDIA",
      "value": "26"
    },
    {
      "model": "gpt-oss-120b (high)",
      "lab": "OpenAI",
      "value": "24"
    },
    {
      "model": "Nemotron 3.5 Lightning",
      "lab": "NVIDIA",
      "value": "24"
    },
    {
      "model": "Command A+",
      "lab": "Cohere",
      "value": "23"
    }
  ],
  "Coding Agent Index": [
    {
      "model": "Claude Code - Opus 5 (xhigh)",
      "lab": "Anthropic",
      "value": "68"
    },
    {
      "model": "Claude Code - Fable 5 (max) (with fallback)",
      "lab": "Anthropic",
      "value": "67"
    },
    {
      "model": "Claude Code - Opus 5 (max)",
      "lab": "Anthropic",
      "value": "67"
    },
    {
      "model": "Claude Code - Opus 5 (high)",
      "lab": "Anthropic",
      "value": "66"
    },
    {
      "model": "Codex - GPT-5.6 Sol (max)",
      "lab": "OpenAI",
      "value": "65"
    },
    {
      "model": "Codex - GPT-5.6 Sol (high)",
      "lab": "OpenAI",
      "value": "64"
    },
    {
      "model": "Grok Build - Grok 4.5 (high)",
      "lab": "xAI",
      "value": "64"
    },
    {
      "model": "Claude Code - Opus 5 (medium)",
      "lab": "Anthropic",
      "value": "64"
    },
    {
      "model": "Codex - GPT-5.6 Sol (xhigh)",
      "lab": "OpenAI",
      "value": "63"
    },
    {
      "model": "Kimi Code CLI - Kimi K3",
      "lab": "Moonshot AI",
      "value": "63"
    },
    {
      "model": "Claude Code - Opus 4.8 (max)",
      "lab": "Anthropic",
      "value": "62"
    },
    {
      "model": "Muse Code - Muse Spark 1.2 (xhigh)",
      "lab": "Meta",
      "value": "62"
    },
    {
      "model": "Codex - GPT-5.6 Sol (medium)",
      "lab": "OpenAI",
      "value": "62"
    },
    {
      "model": "Claude Code - Qwen3.8 Max",
      "lab": "Alibaba Cloud",
      "value": "61"
    },
    {
      "model": "Codex - GPT-5.5 (xhigh)",
      "lab": "OpenAI",
      "value": "61"
    },
    {
      "model": "Codex - GPT-5.6 Terra (max)",
      "lab": "OpenAI",
      "value": "60"
    },
    {
      "model": "Opencode - Gemini 3.7 Flash (high)",
      "lab": "Google",
      "value": "60"
    },
    {
      "model": "Claude Code - Opus 5 (low)",
      "lab": "Anthropic",
      "value": "59"
    },
    {
      "model": "Claude Code - Opus 4.8 (xhigh)",
      "lab": "Anthropic",
      "value": "59"
    },
    {
      "model": "Opencode - Muse Spark 1.2 (xhigh)",
      "lab": "Meta",
      "value": "59"
    },
    {
      "model": "Claude Code - Opus 4.8 (high)",
      "lab": "Anthropic",
      "value": "58"
    },
    {
      "model": "Codex - GPT-5.6 Luna (max)",
      "lab": "OpenAI",
      "value": "57"
    },
    {
      "model": "Antigravity SDK - Gemini 3.7 Flash (high)",
      "lab": "Google",
      "value": "57"
    },
    {
      "model": "Codex - GPT-5.6 Terra (xhigh)",
      "lab": "OpenAI",
      "value": "56"
    },
    {
      "model": "Claude Code - Opus 4.8 (medium)",
      "lab": "Anthropic",
      "value": "56"
    },
    {
      "model": "Codex - GPT-5.5 (medium)",
      "lab": "OpenAI",
      "value": "55"
    },
    {
      "model": "Codex - GPT-5.6 Sol (low)",
      "lab": "OpenAI",
      "value": "55"
    },
    {
      "model": "Opencode - Muse Spark 1.1 (xhigh)",
      "lab": "Meta",
      "value": "55"
    },
    {
      "model": "Codex - GPT-5.6 Terra (high)",
      "lab": "OpenAI",
      "value": "55"
    },
    {
      "model": "Codex - GPT-5.6 Luna (xhigh)",
      "lab": "OpenAI",
      "value": "53"
    },
    {
      "model": "Codex - GPT-5.6 Luna (high)",
      "lab": "OpenAI",
      "value": "52"
    },
    {
      "model": "Claude Code - Opus 4.7 (max)",
      "lab": "Anthropic",
      "value": "52"
    },
    {
      "model": "Opencode - Opus 4.7 (medium)",
      "lab": "Anthropic",
      "value": "51"
    },
    {
      "model": "Codex - DeepSeek V4 Flash 0731 (max)",
      "lab": "DeepSeek",
      "value": "50"
    },
    {
      "model": "Claude Code - Opus 4.8 (low)",
      "lab": "Anthropic",
      "value": "49"
    },
    {
      "model": "Codex - GPT-5.6 Terra (medium)",
      "lab": "OpenAI",
      "value": "48"
    },
    {
      "model": "Opencode - Gemini 3.6 Flash (high)",
      "lab": "Google",
      "value": "47"
    },
    {
      "model": "Cursor CLI - GPT-5.5 (medium)",
      "lab": "OpenAI",
      "value": "47"
    },
    {
      "model": "Cursor CLI - Opus 4.7 (medium)",
      "lab": "Anthropic",
      "value": "47"
    },
    {
      "model": "Codex - GPT-5.6 Sol (none)",
      "lab": "OpenAI",
      "value": "43"
    },
    {
      "model": "Claude Code - GLM-5.2",
      "lab": "Z.ai",
      "value": "43"
    },
    {
      "model": "Codex - DeepSeek V4 Pro 0813 (max)",
      "lab": "DeepSeek",
      "value": "43"
    },
    {
      "model": "Claude Code - Opus 4.7 (medium)",
      "lab": "Anthropic",
      "value": "42"
    },
    {
      "model": "Codex - GPT-5.6 Luna (medium)",
      "lab": "OpenAI",
      "value": "42"
    },
    {
      "model": "Claude Code - Sonnet 4.6 (medium)",
      "lab": "Anthropic",
      "value": "39"
    },
    {
      "model": "Codex - GPT-5.6 Terra (low)",
      "lab": "OpenAI",
      "value": "39"
    },
    {
      "model": "Cursor CLI - Composer 2.5",
      "lab": "Cursor",
      "value": "38"
    },
    {
      "model": "Cursor CLI - Composer 2.5 Fast",
      "lab": "Cursor",
      "value": "38"
    },
    {
      "model": "Claude Code - Qwen3.7 Plus (thinking)",
      "lab": "Alibaba Cloud",
      "value": "38"
    },
    {
      "model": "Claude Code - GLM-5.1",
      "lab": "Z.ai",
      "value": "37"
    }
  ],
  "Agentic Index": [
    {
      "model": "Claude Opus 5 (max)",
      "lab": "Anthropic",
      "value": "59"
    },
    {
      "model": "GLM-5.3 (max)",
      "lab": "Z AI",
      "value": "59"
    },
    {
      "model": "Grok 4.6 (high)",
      "lab": "SpaceXAI",
      "value": "59"
    },
    {
      "model": "GPT-5.6 Sol (max)",
      "lab": "OpenAI",
      "value": "58"
    },
    {
      "model": "Qwen3.8 2.4T A95B",
      "lab": "Alibaba",
      "value": "57"
    },
    {
      "model": "Claude Fable 5 (with fallback)",
      "lab": "Anthropic",
      "value": "57"
    },
    {
      "model": "Kimi K3 (max)",
      "lab": "Kimi",
      "value": "54"
    },
    {
      "model": "Qwen3.8 27B (xhigh)",
      "lab": "Alibaba",
      "value": "51"
    },
    {
      "model": "GPT-5.6 Terra (max)",
      "lab": "OpenAI",
      "value": "50"
    },
    {
      "model": "DeepSeek V4 Pro 0813 (max)",
      "lab": "DeepSeek",
      "value": "50"
    },
    {
      "model": "Muse Spark 1.2 (xhigh)",
      "lab": "Meta",
      "value": "49"
    },
    {
      "model": "GPT-5.6 Luna (max)",
      "lab": "OpenAI",
      "value": "47"
    },
    {
      "model": "Gemini 3.7 Flash (high)",
      "lab": "Google",
      "value": "45"
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
      "model": "Inkling",
      "lab": "Thinking Machines",
      "value": "34"
    },
    {
      "model": "Solar Open2 250B",
      "lab": "Upstage",
      "value": "28"
    },
    {
      "model": "Nemotron 3 Ultra",
      "lab": "NVIDIA",
      "value": "27"
    },
    {
      "model": "Gemini 3.5 Flash-Lite",
      "lab": "Google",
      "value": "27"
    },
    {
      "model": "A.X-K2",
      "lab": "SK Telecom",
      "value": "26"
    },
    {
      "model": "Muse Glimmer (high)",
      "lab": "Meta",
      "value": "23"
    },
    {
      "model": "K-EXAONE 2.0",
      "lab": "LG AI Research",
      "value": "20"
    },
    {
      "model": "Mistral Medium 3.5",
      "lab": "Mistral",
      "value": "19"
    },
    {
      "model": "Claude 4.5 Haiku",
      "lab": "Anthropic",
      "value": "16"
    },
    {
      "model": "Nemotron 3.5 Lightning",
      "lab": "NVIDIA",
      "value": "14"
    },
    {
      "model": "gpt-oss-120b (high)",
      "lab": "OpenAI",
      "value": "13"
    },
    {
      "model": "Command A+",
      "lab": "Cohere",
      "value": "9"
    },
    {
      "model": "Nemotron 3 Super",
      "lab": "NVIDIA",
      "value": "9"
    }
  ],
  "AA-Briefcase": [
    {
      "model": "Claude Opus 5 (max)",
      "lab": "Anthropic",
      "value": "1710"
    },
    {
      "model": "Claude Opus 5 (xhigh)",
      "lab": "Anthropic",
      "value": "1686"
    },
    {
      "model": "Claude Opus 5 (high)",
      "lab": "Anthropic",
      "value": "1606"
    },
    {
      "model": "Grok 4.6 (xhigh)",
      "lab": "SpaceXAI",
      "value": "1587"
    },
    {
      "model": "Grok 4.6 (high)",
      "lab": "SpaceXAI",
      "value": "1576"
    },
    {
      "model": "Claude Fable 5 (with fallback)",
      "lab": "Anthropic",
      "value": "1572"
    },
    {
      "model": "Kimi K3 (max)",
      "lab": "Kimi",
      "value": "1542"
    },
    {
      "model": "GPT-5.6 Sol (max)",
      "lab": "OpenAI",
      "value": "1503"
    },
    {
      "model": "Muse Spark 1.2 (xhigh)",
      "lab": "Meta",
      "value": "1363"
    },
    {
      "model": "Gemini 3.7 Flash (high)",
      "lab": "Google",
      "value": "1132"
    },
    {
      "model": "MiniMax-M3",
      "lab": "MiniMax",
      "value": "1107"
    },
    {
      "model": "Nemotron 3 Ultra",
      "lab": "NVIDIA",
      "value": "875"
    },
    {
      "model": "Inkling",
      "lab": "Thinking Machines",
      "value": "838"
    },
    {
      "model": "Gemini 3.5 Flash-Lite",
      "lab": "Google",
      "value": "636"
    },
    {
      "model": "Claude 4.5 Haiku",
      "lab": "Anthropic",
      "value": "612"
    },
    {
      "model": "Mistral Medium 3.5",
      "lab": "Mistral",
      "value": "518"
    },
    {
      "model": "Command A+",
      "lab": "Cohere",
      "value": "371"
    },
    {
      "model": "gpt-oss-120b (high)",
      "lab": "OpenAI",
      "value": "10"
    },
    {
      "model": "Nemotron 3 Super",
      "lab": "NVIDIA",
      "value": "0"
    }
  ]
} satisfies Record<string, LeaderboardRow[]>;

export const LEADERBOARD_ROW_COUNTS = Object.fromEntries(
  Object.entries(CURRENT_LEADERBOARD_ROWS).map(([name, rows]) => [name, rows.length]),
) as Record<keyof typeof CURRENT_LEADERBOARD_ROWS, number>;
