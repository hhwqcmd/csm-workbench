export type LeaderboardRow = {
  model: string;
  lab: string;
  value: string;
  highlight?: boolean;
};

// Static snapshot verified from the linked leaderboard pages on 2026-09-30.
// Each board stores up to the first 50 published rows; shorter boards store every published scored row.
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
      "value": "1500 ±11"
    },
    {
      "model": "claude-fable-5.1-max",
      "lab": "Anthropic",
      "value": "1498 ±8"
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
      "model": "muse-spark-1.3-max",
      "lab": "Meta",
      "value": "1493 ±9"
    },
    {
      "model": "gemini-3.8-flash-high",
      "lab": "Google",
      "value": "1493 ±9"
    },
    {
      "model": "claude-opus-5-high",
      "lab": "Anthropic",
      "value": "1493 ±4"
    },
    {
      "model": "muse-spark-1.1",
      "lab": "Meta",
      "value": "1493 ±5"
    },
    {
      "model": "gemini-3.7-flash-high",
      "lab": "Google",
      "value": "1490 ±8"
    },
    {
      "model": "muse-spark",
      "lab": "Meta",
      "value": "1488 ±6"
    },
    {
      "model": "claude-opus-5-max",
      "lab": "Anthropic",
      "value": "1487 ±5"
    },
    {
      "model": "gemini-3.1-pro-preview",
      "lab": "Google",
      "value": "1487 ±3"
    },
    {
      "model": "gemini-3-pro",
      "lab": "Google",
      "value": "1485 ±4"
    },
    {
      "model": "kimi-k3-max",
      "lab": "Moonshot",
      "value": "1485 ±5"
    },
    {
      "model": "gpt-5.6-sol-xhigh",
      "lab": "OpenAI",
      "value": "1483 ±5"
    },
    {
      "model": "glm-5.3-max",
      "lab": "Z.ai",
      "value": "1483 ±6"
    },
    {
      "model": "gpt-5.5-high",
      "lab": "OpenAI",
      "value": "1482 ±4"
    },
    {
      "model": "claude-opus-4-8-high",
      "lab": "Anthropic",
      "value": "1481 ±4"
    },
    {
      "model": "qwen3.8-max",
      "lab": "Alibaba",
      "value": "1481 ±6"
    },
    {
      "model": "gemini-3.6-flash-high",
      "lab": "Google",
      "value": "1480 ±5"
    },
    {
      "model": "gpt-6-astra-max",
      "lab": "OpenAI",
      "value": "1480 ±12"
    },
    {
      "model": "gemini-3.5-flash-high",
      "lab": "Google",
      "value": "1478 ±4"
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
      "model": "gpt-5.5",
      "lab": "OpenAI",
      "value": "1476 ±4"
    },
    {
      "model": "glm-5.3-flash",
      "lab": "Z.ai",
      "value": "1475 ±7"
    },
    {
      "model": "grok-4.20-beta1",
      "lab": "SpaceXAI",
      "value": "1475 ±5"
    },
    {
      "model": "gemini-3.5-flash-medium",
      "lab": "Google",
      "value": "1474 ±4"
    },
    {
      "model": "gpt-5.5-instant",
      "lab": "OpenAI",
      "value": "1474 ±5"
    },
    {
      "model": "gemini-3-flash",
      "lab": "Google",
      "value": "1474 ±4"
    },
    {
      "model": "qwen3.7-max-preview",
      "lab": "Alibaba",
      "value": "1473 ±10"
    },
    {
      "model": "claude-opus-4-8",
      "lab": "Anthropic",
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
      "value": "1473 ±4"
    },
    {
      "model": "glm-5.2-max",
      "lab": "Z.ai",
      "value": "1472 ±5"
    },
    {
      "model": "grok-4.20-beta-0309-reasoning",
      "lab": "SpaceXAI",
      "value": "1471 ±4"
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
      "value": "1468 ±5"
    },
    {
      "model": "ernie-5.1",
      "lab": "Baidu",
      "value": "1468 ±5"
    },
    {
      "model": "mimo-v2.5-pro",
      "lab": "Xiaomi",
      "value": "1467 ±4"
    },
    {
      "model": "gpt-5.6-terra-xhigh",
      "lab": "OpenAI",
      "value": "1466 ±5"
    },
    {
      "model": "gpt-5.4",
      "lab": "OpenAI",
      "value": "1466 ±4"
    },
    {
      "model": "glm-5.1",
      "lab": "Z.ai",
      "value": "1466 ±4"
    },
    {
      "model": "grok-4.1-thinking",
      "lab": "SpaceXAI",
      "value": "1465 ±3"
    },
    {
      "model": "qwen3.5-max-preview",
      "lab": "Alibaba",
      "value": "1465 ±5"
    },
    {
      "model": "deepseek-v4-pro-high-20260813",
      "lab": "DeepSeek",
      "value": "1463 ±7"
    }
  ],
  "Coding Arena": [
    {
      "model": "claude-fable-5",
      "lab": "Anthropic",
      "value": "1552 ±7"
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
      "value": "1547 ±6"
    },
    {
      "model": "claude-opus-4-6",
      "lab": "Anthropic",
      "value": "1546 ±6"
    },
    {
      "model": "gpt-6-astra-max",
      "lab": "OpenAI",
      "value": "1543 ±23"
    },
    {
      "model": "kimi-k3-max",
      "lab": "Moonshot",
      "value": "1538 ±9"
    },
    {
      "model": "muse-spark-1.3-max",
      "lab": "Meta",
      "value": "1537 ±16"
    },
    {
      "model": "muse-spark-1.2 (xHigh)",
      "lab": "Meta",
      "value": "1536 ±20"
    },
    {
      "model": "gemini-3.8-flash-high",
      "lab": "Google",
      "value": "1535 ±16"
    },
    {
      "model": "claude-opus-4-8-high",
      "lab": "Anthropic",
      "value": "1533 ±6"
    },
    {
      "model": "claude-opus-5-high",
      "lab": "Anthropic",
      "value": "1533 ±7"
    },
    {
      "model": "muse-spark-1.1",
      "lab": "Meta",
      "value": "1531 ±7"
    },
    {
      "model": "claude-opus-4-5-20251101-high-32k",
      "lab": "Anthropic",
      "value": "1530 ±7"
    },
    {
      "model": "claude-opus-4-8",
      "lab": "Anthropic",
      "value": "1530 ±6"
    },
    {
      "model": "claude-sonnet-4-6",
      "lab": "Anthropic",
      "value": "1528 ±6"
    },
    {
      "model": "gpt-5.6-sol-xhigh",
      "lab": "OpenAI",
      "value": "1528 ±8"
    },
    {
      "model": "claude-opus-5-max",
      "lab": "Anthropic",
      "value": "1526 ±9"
    },
    {
      "model": "muse-spark",
      "lab": "Meta",
      "value": "1526 ±10"
    },
    {
      "model": "glm-5.3-flash",
      "lab": "Z.ai",
      "value": "1525 ±12"
    },
    {
      "model": "qwen3.7-max-preview",
      "lab": "Alibaba",
      "value": "1525 ±18"
    },
    {
      "model": "glm-5.3-max",
      "lab": "Z.ai",
      "value": "1524 ±12"
    },
    {
      "model": "claude-opus-4-5-20251101",
      "lab": "Anthropic",
      "value": "1523 ±6"
    },
    {
      "model": "qwen3.8-max",
      "lab": "Alibaba",
      "value": "1522 ±9"
    },
    {
      "model": "mimo-v2.5-pro",
      "lab": "Xiaomi",
      "value": "1521 ±6"
    },
    {
      "model": "gemini-3.7-flash-high",
      "lab": "Google",
      "value": "1521 ±15"
    },
    {
      "model": "claude-sonnet-5-high",
      "lab": "Anthropic",
      "value": "1520 ±7"
    },
    {
      "model": "gemini-3.1-pro-preview",
      "lab": "Google",
      "value": "1520 ±5"
    },
    {
      "model": "gpt-5.4-high",
      "lab": "OpenAI",
      "value": "1520 ±6"
    },
    {
      "model": "gpt-5.5-high",
      "lab": "OpenAI",
      "value": "1520 ±6"
    },
    {
      "model": "claude-sonnet-4-5-20250929-high-32k",
      "lab": "Anthropic",
      "value": "1520 ±5"
    },
    {
      "model": "claude-fable-5.1-max",
      "lab": "Anthropic",
      "value": "1519 ±18"
    },
    {
      "model": "grok-4.5",
      "lab": "SpaceXAI",
      "value": "1518 ±7"
    },
    {
      "model": "gemini-3-pro",
      "lab": "Google",
      "value": "1518 ±7"
    },
    {
      "model": "gpt-5.6-terra-xhigh",
      "lab": "OpenAI",
      "value": "1518 ±8"
    },
    {
      "model": "gemini-3.6-flash-high",
      "lab": "Google",
      "value": "1517 ±8"
    },
    {
      "model": "gpt-5.2-chat-latest-20260210",
      "lab": "OpenAI",
      "value": "1515 ±7"
    },
    {
      "model": "gpt-5.5-instant",
      "lab": "OpenAI",
      "value": "1514 ±8"
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
      "model": "gpt-5.4",
      "lab": "OpenAI",
      "value": "1513 ±6"
    },
    {
      "model": "claude-sonnet-4-5-20250929",
      "lab": "Anthropic",
      "value": "1513 ±5"
    },
    {
      "model": "qwen3.5-max-preview",
      "lab": "Alibaba",
      "value": "1513 ±8"
    },
    {
      "model": "dola-seed-2.0-pro",
      "lab": "Bytedance",
      "value": "1513 ±6",
      "highlight": true
    },
    {
      "model": "glm-5.1",
      "lab": "Z.ai",
      "value": "1513 ±6"
    },
    {
      "model": "claude-opus-4-1-20250805-thinking-16k",
      "lab": "Anthropic",
      "value": "1512 ±6"
    },
    {
      "model": "grok-4.20-beta-0309-reasoning",
      "lab": "SpaceXAI",
      "value": "1510 ±6"
    },
    {
      "model": "glm-5.2-max",
      "lab": "Z.ai",
      "value": "1510 ±7"
    },
    {
      "model": "qwen3.6-max-preview",
      "lab": "Alibaba",
      "value": "1509 ±16"
    },
    {
      "model": "gpt-5.5",
      "lab": "OpenAI",
      "value": "1509 ±6"
    }
  ],
  "WebDev Arena": [
    {
      "model": "gpt-6-astra-max",
      "lab": "OpenAI",
      "value": "1800 ±16"
    },
    {
      "model": "claude-fable-5.1-max",
      "lab": "Anthropic",
      "value": "1758 ±14"
    },
    {
      "model": "claude-opus-5-max",
      "lab": "Anthropic",
      "value": "1687 ±7"
    },
    {
      "model": "qwen3.8-max-0902",
      "lab": "Alibaba",
      "value": "1681 ±15"
    },
    {
      "model": "kimi-k3-max",
      "lab": "Moonshot",
      "value": "1674 ±11"
    },
    {
      "model": "qwen3.8-max",
      "lab": "Alibaba",
      "value": "1671 ±12"
    },
    {
      "model": "claude-opus-5-high",
      "lab": "Anthropic",
      "value": "1660 ±7"
    },
    {
      "model": "muse-spark-1.3-max",
      "lab": "Meta",
      "value": "1652 ±12"
    },
    {
      "model": "qwen3.8-flash-next",
      "lab": "Alibaba",
      "value": "1635 ±13"
    },
    {
      "model": "claude-fable-5",
      "lab": "Anthropic",
      "value": "1628 ±7"
    },
    {
      "model": "hy4-preview",
      "lab": "Tencent",
      "value": "1624 ±13"
    },
    {
      "model": "muse-spark-1.3 (xHigh)",
      "lab": "Meta",
      "value": "1623 ±14"
    },
    {
      "model": "grok-4.6-high",
      "lab": "SpaceXAI",
      "value": "1618 ±10"
    },
    {
      "model": "gpt-5.6-sol-xhigh (codex-harness)",
      "lab": "OpenAI",
      "value": "1617 ±7"
    },
    {
      "model": "glm-5.3-max",
      "lab": "Z.ai",
      "value": "1614 ±11"
    },
    {
      "model": "deepseek-v4.1-flash-max",
      "lab": "DeepSeek",
      "value": "1614 ±17"
    },
    {
      "model": "glm-5.3-flash",
      "lab": "Z.ai",
      "value": "1607 ±12"
    },
    {
      "model": "qwen3.8-27b",
      "lab": "Alibaba",
      "value": "1593 ±9"
    },
    {
      "model": "glm-5.2-max",
      "lab": "Z.ai",
      "value": "1592 ±7"
    },
    {
      "model": "gemini-3.7-flash-high",
      "lab": "Google",
      "value": "1587 ±12"
    },
    {
      "model": "deepseek-v4-pro-high-20260813",
      "lab": "DeepSeek",
      "value": "1581 ±10"
    },
    {
      "model": "deepseek-v4-flash-high",
      "lab": "DeepSeek",
      "value": "1580 ±10"
    },
    {
      "model": "gemini-3.8-flash-high",
      "lab": "Google",
      "value": "1568 ±12"
    },
    {
      "model": "claude-opus-4-8-high",
      "lab": "Anthropic",
      "value": "1559 ±7"
    },
    {
      "model": "claude-opus-4-7",
      "lab": "Anthropic",
      "value": "1557 ±6"
    },
    {
      "model": "claude-opus-4-7-high",
      "lab": "Anthropic",
      "value": "1555 ±6"
    },
    {
      "model": "grok-4.5",
      "lab": "SpaceXAI",
      "value": "1555 ±8"
    },
    {
      "model": "claude-opus-4-6-high",
      "lab": "Anthropic",
      "value": "1547 ±6"
    },
    {
      "model": "muse-spark-1.1",
      "lab": "Meta",
      "value": "1542 ±8"
    },
    {
      "model": "claude-opus-4-8",
      "lab": "Anthropic",
      "value": "1539 ±6"
    },
    {
      "model": "claude-opus-4-6",
      "lab": "Anthropic",
      "value": "1537 ±5"
    },
    {
      "model": "gemini-3.6-flash-high",
      "lab": "Google",
      "value": "1537 ±8"
    },
    {
      "model": "claude-sonnet-5-high",
      "lab": "Anthropic",
      "value": "1537 ±7"
    },
    {
      "model": "muse-spark-1.2 (xHigh)",
      "lab": "Meta",
      "value": "1534 ±14"
    },
    {
      "model": "gpt-5.6-terra-xhigh (codex-harness)",
      "lab": "OpenAI",
      "value": "1521 ±8"
    },
    {
      "model": "claude-sonnet-4-6",
      "lab": "Anthropic",
      "value": "1521 ±5"
    },
    {
      "model": "gpt-5.6-luna-xhigh (codex-harness)",
      "lab": "OpenAI",
      "value": "1519 ±8"
    },
    {
      "model": "seed-2.1-pro-preview",
      "lab": "Bytedance",
      "value": "1519 ±7",
      "highlight": true
    },
    {
      "model": "qwen3.7-max-20260517",
      "lab": "Alibaba",
      "value": "1517 ±8"
    },
    {
      "model": "hy3",
      "lab": "Tencent",
      "value": "1513 ±11"
    },
    {
      "model": "gpt-5.5-xhigh (codex-harness)",
      "lab": "OpenAI",
      "value": "1510 ±6"
    },
    {
      "model": "kimi-k2.6",
      "lab": "Moonshot",
      "value": "1509 ±7"
    },
    {
      "model": "glm-5.1",
      "lab": "Z.ai",
      "value": "1508 ±7"
    },
    {
      "model": "gemini-3.5-flash-high",
      "lab": "Google",
      "value": "1500 ±7"
    },
    {
      "model": "claude-opus-4-5-20251101-high-32k",
      "lab": "Anthropic",
      "value": "1495 ±8"
    },
    {
      "model": "gemini-3.5-flash-medium",
      "lab": "Google",
      "value": "1492 ±7"
    },
    {
      "model": "gpt-5.5-high (codex-harness)",
      "lab": "OpenAI",
      "value": "1487 ±6"
    },
    {
      "model": "minimax-m3",
      "lab": "MiniMax",
      "value": "1487 ±6"
    },
    {
      "model": "qwen3.6-max-preview",
      "lab": "Alibaba",
      "value": "1479 ±13"
    },
    {
      "model": "mimo-v2.5-pro",
      "lab": "Xiaomi",
      "value": "1475 ±6"
    }
  ],
  "Vision Arena": [
    {
      "model": "claude-fable-5",
      "lab": "Anthropic",
      "value": "1310 ±8"
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
      "value": "1300 ±7"
    },
    {
      "model": "claude-opus-4-6-high",
      "lab": "Anthropic",
      "value": "1299 ±7"
    },
    {
      "model": "muse-spark-1.3-max",
      "lab": "Meta",
      "value": "1294 ±15"
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
      "value": "1289 ±8"
    },
    {
      "model": "claude-fable-5.1-max",
      "lab": "Anthropic",
      "value": "1289 ±12"
    },
    {
      "model": "gemini-3-pro",
      "lab": "Google",
      "value": "1289 ±8"
    },
    {
      "model": "gpt-5.5",
      "lab": "OpenAI",
      "value": "1287 ±6"
    },
    {
      "model": "gpt-5.6-sol-xhigh",
      "lab": "OpenAI",
      "value": "1286 ±8"
    },
    {
      "model": "gpt-5.4-high",
      "lab": "OpenAI",
      "value": "1285 ±6"
    },
    {
      "model": "gpt-6-astra-max",
      "lab": "OpenAI",
      "value": "1284 ±17"
    },
    {
      "model": "gemini-3.5-flash-high",
      "lab": "Google",
      "value": "1284 ±8"
    },
    {
      "model": "claude-opus-4-8-high",
      "lab": "Anthropic",
      "value": "1283 ±7"
    },
    {
      "model": "gpt-5.5-high",
      "lab": "OpenAI",
      "value": "1283 ±6"
    },
    {
      "model": "gemini-3.5-flash-medium",
      "lab": "Google",
      "value": "1283 ±8"
    },
    {
      "model": "gemini-3.6-flash-high",
      "lab": "Google",
      "value": "1283 ±10"
    },
    {
      "model": "muse-spark-1.1",
      "lab": "Meta",
      "value": "1281 ±8"
    },
    {
      "model": "gpt-5.4",
      "lab": "OpenAI",
      "value": "1280 ±7"
    },
    {
      "model": "grok-4.5",
      "lab": "SpaceXAI",
      "value": "1279 ±8"
    },
    {
      "model": "claude-opus-4-8",
      "lab": "Anthropic",
      "value": "1279 ±7"
    },
    {
      "model": "gemini-3.1-pro-preview",
      "lab": "Google",
      "value": "1279 ±5"
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
      "model": "claude-sonnet-4-6",
      "lab": "Anthropic",
      "value": "1275 ±6"
    },
    {
      "model": "glm-5.3-flash",
      "lab": "Z.ai",
      "value": "1275 ±12"
    },
    {
      "model": "gemini-3-flash",
      "lab": "Google",
      "value": "1272 ±5"
    },
    {
      "model": "gpt-5.6-terra-xhigh",
      "lab": "OpenAI",
      "value": "1267 ±8"
    },
    {
      "model": "claude-sonnet-5-high",
      "lab": "Anthropic",
      "value": "1266 ±8"
    },
    {
      "model": "gemini-3.5-flash-lite",
      "lab": "Google",
      "value": "1266 ±10"
    },
    {
      "model": "grok-4.6-high",
      "lab": "SpaceXAI",
      "value": "1265 ±11"
    },
    {
      "model": "qwen3.7-plus",
      "lab": "Alibaba",
      "value": "1263 ±8"
    },
    {
      "model": "kimi-k2.6",
      "lab": "Moonshot",
      "value": "1262 ±7"
    },
    {
      "model": "gemma-4-31b",
      "lab": "Google",
      "value": "1261 ±6"
    },
    {
      "model": "gemini-3-flash (thinking-minimal)",
      "lab": "Google",
      "value": "1260 ±6"
    },
    {
      "model": "gpt-5.6-luna-xhigh",
      "lab": "OpenAI",
      "value": "1258 ±8"
    },
    {
      "model": "dola-seed-2.0-pro",
      "lab": "Bytedance",
      "value": "1257 ±8",
      "highlight": true
    },
    {
      "model": "grok-4.20-beta-0309-reasoning",
      "lab": "SpaceXAI",
      "value": "1256 ±6"
    },
    {
      "model": "gpt-5.4-mini-high",
      "lab": "OpenAI",
      "value": "1252 ±6"
    },
    {
      "model": "grok-4.20-multi-agent-beta-0309",
      "lab": "SpaceXAI",
      "value": "1251 ±6"
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
      "model": "qwen3.8-27b",
      "lab": "Alibaba",
      "value": "1244 ±10"
    },
    {
      "model": "gpt-5.2-high",
      "lab": "OpenAI",
      "value": "1244 ±6"
    }
  ],
  "Text-to-Image": [
    {
      "model": "gpt-image-2.5-sunburst",
      "lab": "OpenAI",
      "value": "1421 ±13"
    },
    {
      "model": "gpt-image-2.5-flare",
      "lab": "OpenAI",
      "value": "1399 ±13"
    },
    {
      "model": "gpt-image-2 (medium)",
      "lab": "OpenAI",
      "value": "1381 ±4"
    },
    {
      "model": "mai-image-2.6",
      "lab": "Microsoft AI",
      "value": "1331 ±7"
    },
    {
      "model": "grok-imagine-image-2.0 (low)",
      "lab": "SpaceXAI",
      "value": "1315 ±12"
    },
    {
      "model": "reve-2.1",
      "lab": "Reve",
      "value": "1301 ±8"
    },
    {
      "model": "muse-image",
      "lab": "Meta",
      "value": "1277 ±6"
    },
    {
      "model": "reve-2.0",
      "lab": "Reve",
      "value": "1270 ±6"
    },
    {
      "model": "gemini-3.1-flash-image (nano-banana-2) [web-search]",
      "lab": "Google",
      "value": "1261 ±5"
    },
    {
      "model": "seedream-5.0-pro",
      "lab": "Bytedance",
      "value": "1257 ±4",
      "highlight": true
    },
    {
      "model": "qwen-image-3.0-pro",
      "lab": "Alibaba",
      "value": "1254 ±7"
    },
    {
      "model": "mai-image-2.5",
      "lab": "Microsoft AI",
      "value": "1254 ±4"
    },
    {
      "model": "gemini-3.1-flash-lite-image (nano-banana-2-lite)",
      "lab": "Google",
      "value": "1250 ±6"
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
      "value": "1204 ±4"
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
      "model": "Cosmos3-Super-Text2Image (Agentic)",
      "lab": "Nvidia",
      "value": "1167 ±8"
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
      "value": "1154 ±3"
    },
    {
      "model": "reve-v1.5",
      "lab": "Reve",
      "value": "1154 ±4"
    },
    {
      "model": "Cosmos3-Super-Text2Image",
      "lab": "Nvidia",
      "value": "1154 ±7"
    },
    {
      "model": "hunyuan-image-3.0",
      "lab": "Tencent",
      "value": "1151 ±3"
    },
    {
      "model": "gemini-2.5-flash-image-preview (nano-banana)",
      "lab": "Google",
      "value": "1150 ±2"
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
      "value": "1138 ±3",
      "highlight": true
    },
    {
      "model": "wan2.6-t2i",
      "lab": "Alibaba",
      "value": "1137 ±3"
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
      "value": "1123 ±5"
    },
    {
      "model": "wan2.5-t2i-preview",
      "lab": "Alibaba",
      "value": "1118 ±3"
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
      "value": "1114 ±3"
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
      "value": "1110 ±5"
    },
    {
      "model": "gpt-image-1-mini",
      "lab": "OpenAI",
      "value": "1109 ±3"
    }
  ],
  "Text-to-Video": [
    {
      "model": "gemini-omni-1.1-flash",
      "lab": "Google",
      "value": "1515 ±15"
    },
    {
      "model": "gemini-omni-flash",
      "lab": "Google",
      "value": "1511 ±10"
    },
    {
      "model": "wan3.0",
      "lab": "Alibaba",
      "value": "1494 ±19"
    },
    {
      "model": "flux-3-video",
      "lab": "Black Forest Labs",
      "value": "1494 ±17"
    },
    {
      "model": "grok-imagine-video-1.5-agent",
      "lab": "SpaceXAI",
      "value": "1491 ±19"
    },
    {
      "model": "dreamina-seedance-2.5-720p",
      "lab": "Bytedance",
      "value": "1482 ±12",
      "highlight": true
    },
    {
      "model": "dreamina-seedance-2.0-720p",
      "lab": "Bytedance",
      "value": "1479 ±8",
      "highlight": true
    },
    {
      "model": "minimax-h3",
      "lab": "MiniMax",
      "value": "1462 ±10"
    },
    {
      "model": "muse-video",
      "lab": "Meta",
      "value": "1456 ±15"
    },
    {
      "model": "happyhorse-1.0",
      "lab": "Alibaba-ATH",
      "value": "1427 ±13"
    },
    {
      "model": "sora-2-pro",
      "lab": "OpenAI",
      "value": "1367 ±7"
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
      "value": "1348 ±11"
    },
    {
      "model": "grok-imagine-video-720p",
      "lab": "SpaceXAI",
      "value": "1343 ±7"
    },
    {
      "model": "sora-2",
      "lab": "OpenAI",
      "value": "1342 ±6"
    },
    {
      "model": "wan2.7-t2v",
      "lab": "Alibaba",
      "value": "1341 ±8"
    },
    {
      "model": "veo-3-audio",
      "lab": "Google",
      "value": "1340 ±13"
    },
    {
      "model": "wan2.6-t2v",
      "lab": "Alibaba",
      "value": "1328 ±8"
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
      "model": "veo-3-fast",
      "lab": "Google",
      "value": "1248 ±12"
    },
    {
      "model": "wan2.5-t2v-preview",
      "lab": "Alibaba",
      "value": "1246 ±9"
    },
    {
      "model": "pixverse-v5.6",
      "lab": "Unknown",
      "value": "1239 ±11"
    },
    {
      "model": "runway-gen-4.5",
      "lab": "Runway",
      "value": "1224 ±9"
    },
    {
      "model": "kling-2.5-turbo-1080p",
      "lab": "KlingAI",
      "value": "1219 ±17"
    },
    {
      "model": "kling-2.6-pro",
      "lab": "KlingAI",
      "value": "1216 ±7"
    },
    {
      "model": "p-video",
      "lab": "Unknown",
      "value": "1207 ±16"
    },
    {
      "model": "ray-3",
      "lab": "Luma AI",
      "value": "1205 ±22"
    },
    {
      "model": "hailuo-2.3",
      "lab": "MiniMax",
      "value": "1205 ±6"
    },
    {
      "model": "kling-o1-pro",
      "lab": "KlingAI",
      "value": "1205 ±27"
    },
    {
      "model": "hailuo-02-pro",
      "lab": "MiniMax",
      "value": "1198 ±13"
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
      "value": "1181 ±12"
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
      "lab": "Unknown",
      "value": "1154 ±8"
    },
    {
      "model": "wan-v2.2-a14b",
      "lab": "Alibaba",
      "value": "1132 ±15"
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
      "value": "1065 ±17"
    },
    {
      "model": "pika-v2.2",
      "lab": "Pika",
      "value": "1009 ±15"
    },
    {
      "model": "mochi-v1",
      "lab": "Genmo AI",
      "value": "1006 ±17"
    }
  ],
  "Intelligence Index v4.3.2": [
    {
      "model": "Claude Opus 5.5 (max with fallback)",
      "lab": "Anthropic",
      "value": "58"
    },
    {
      "model": "Claude Opus 5.5 (xhigh with fallback)",
      "lab": "Anthropic",
      "value": "56"
    },
    {
      "model": "Claude Sonnet 5.5 (max with fallback)",
      "lab": "Anthropic",
      "value": "56"
    },
    {
      "model": "Claude Opus 5.5 (high with fallback)",
      "lab": "Anthropic",
      "value": "54"
    },
    {
      "model": "Claude Fable 5.1 (max with fallback)",
      "lab": "Anthropic",
      "value": "53"
    },
    {
      "model": "Claude Fable 5.1 (xhigh with fallback)",
      "lab": "Anthropic",
      "value": "53"
    },
    {
      "model": "GPT-6 Astra (max)",
      "lab": "OpenAI",
      "value": "53"
    },
    {
      "model": "GPT-6 Astra (xhigh)",
      "lab": "OpenAI",
      "value": "52"
    },
    {
      "model": "GPT-6.1 Sol (max)",
      "lab": "OpenAI",
      "value": "52"
    },
    {
      "model": "Claude Opus 5.5 (medium with fallback)",
      "lab": "Anthropic",
      "value": "51"
    },
    {
      "model": "Claude Fable 5.1 (high with fallback)",
      "lab": "Anthropic",
      "value": "51"
    },
    {
      "model": "GPT-6 Astra (high)",
      "lab": "OpenAI",
      "value": "51"
    },
    {
      "model": "GPT-6.1 Sol (xhigh)",
      "lab": "OpenAI",
      "value": "51"
    },
    {
      "model": "GPT-6 Astra (medium)",
      "lab": "OpenAI",
      "value": "50"
    },
    {
      "model": "GPT-6.1 Sol (high)",
      "lab": "OpenAI",
      "value": "50"
    },
    {
      "model": "Claude Fable 5.1 (medium with fallback)",
      "lab": "Anthropic",
      "value": "49"
    },
    {
      "model": "Muse Spark 1.3 (max)",
      "lab": "Meta",
      "value": "48"
    },
    {
      "model": "GPT-6 Sol (max)",
      "lab": "OpenAI",
      "value": "48"
    },
    {
      "model": "GPT-6.1 Sol (medium)",
      "lab": "OpenAI",
      "value": "48"
    },
    {
      "model": "Claude Fable 5.1 (low with fallback)",
      "lab": "Anthropic",
      "value": "47"
    },
    {
      "model": "Grok 4.7 (xhigh)",
      "lab": "SpaceXAI",
      "value": "46"
    },
    {
      "model": "Grok 4.7 (high)",
      "lab": "SpaceXAI",
      "value": "46"
    },
    {
      "model": "MiMo-V2.6-Pro",
      "lab": "Xiaomi",
      "value": "46"
    },
    {
      "model": "GPT-6 Astra (low)",
      "lab": "OpenAI",
      "value": "46"
    },
    {
      "model": "Qwen3.8 Max (0902)",
      "lab": "Alibaba",
      "value": "45"
    },
    {
      "model": "Muse Spark 1.3 (xhigh)",
      "lab": "Meta",
      "value": "45"
    },
    {
      "model": "GLM-5.3 (max)",
      "lab": "Z AI",
      "value": "45"
    },
    {
      "model": "Grok 4.6 (high)",
      "lab": "SpaceXAI",
      "value": "44"
    },
    {
      "model": "Grok 4.6 (xhigh)",
      "lab": "SpaceXAI",
      "value": "44"
    },
    {
      "model": "GPT-6 Sol (xhigh)",
      "lab": "OpenAI",
      "value": "44"
    },
    {
      "model": "Step 5 Preview",
      "lab": "StepFun",
      "value": "44"
    },
    {
      "model": "Kimi K3 (max)",
      "lab": "Kimi",
      "value": "44"
    },
    {
      "model": "Grok 4.6 (medium)",
      "lab": "SpaceXAI",
      "value": "43"
    },
    {
      "model": "GPT-6 Sol (high)",
      "lab": "OpenAI",
      "value": "43"
    },
    {
      "model": "Claude Opus 5.5 (low with fallback)",
      "lab": "Anthropic",
      "value": "42"
    },
    {
      "model": "GPT-5.6 Terra (max)",
      "lab": "OpenAI",
      "value": "42"
    },
    {
      "model": "GLM-5.3-Flash",
      "lab": "Z AI",
      "value": "42"
    },
    {
      "model": "GPT-6.1 Sol (low)",
      "lab": "OpenAI",
      "value": "42"
    },
    {
      "model": "Gemini 3.8 Flash (high)",
      "lab": "Google",
      "value": "41"
    },
    {
      "model": "Qwen3.8 2.4T A95B",
      "lab": "Alibaba",
      "value": "40"
    },
    {
      "model": "Qwen3.8-Flash-Next",
      "lab": "Alibaba",
      "value": "40"
    },
    {
      "model": "GPT-6 Sol (medium)",
      "lab": "OpenAI",
      "value": "40"
    },
    {
      "model": "Gemini 3.8 Flash (medium)",
      "lab": "Google",
      "value": "40"
    },
    {
      "model": "DeepSeek V4.1 Flash (max)",
      "lab": "DeepSeek",
      "value": "39"
    },
    {
      "model": "Claude Sonnet 5 (max)",
      "lab": "Anthropic",
      "value": "38"
    },
    {
      "model": "GPT-5.6 Terra (xhigh)",
      "lab": "OpenAI",
      "value": "38"
    },
    {
      "model": "GPT-6 Luna (max)",
      "lab": "OpenAI",
      "value": "37"
    },
    {
      "model": "DeepSeek V4 Pro 0813 (max)",
      "lab": "DeepSeek",
      "value": "36"
    },
    {
      "model": "Agnes 3.0 Flash",
      "lab": "Sapiens AI",
      "value": "36"
    },
    {
      "model": "Agnes 2.5 Pro Beta",
      "lab": "Sapiens AI",
      "value": "35"
    }
  ],
  "Coding Agent Index": [
    {
      "model": "Claude Code - Fable 5.1 (max) (with fallback)",
      "lab": "Anthropic",
      "value": "62.2"
    },
    {
      "model": "Devin Fusion CLI - Claude Fable 5.1 (xhigh + SWE-2 medium)",
      "lab": "Anthropic",
      "value": "61.7"
    },
    {
      "model": "Codex - GPT-6 Astra (max)",
      "lab": "OpenAI",
      "value": "61.6"
    },
    {
      "model": "Claude Code - Opus 5 (max)",
      "lab": "Anthropic",
      "value": "59.7"
    },
    {
      "model": "Devin Fusion CLI - GPT-6 Astra (xhigh + SWE-2 medium)",
      "lab": "OpenAI",
      "value": "58.9"
    },
    {
      "model": "Codex - GPT-6 Sol (max)",
      "lab": "OpenAI",
      "value": "56.7"
    },
    {
      "model": "Grok Build - Grok 4.7 (xhigh)",
      "lab": "SpaceXAI",
      "value": "56.3"
    },
    {
      "model": "Codex - GPT-5.6 Sol (max)",
      "lab": "OpenAI",
      "value": "54.6"
    },
    {
      "model": "Muse Code - Muse Spark 1.3 (max)",
      "lab": "Meta",
      "value": "54.3"
    },
    {
      "model": "Opencode - GLM-5.3 (max)",
      "lab": "Z AI",
      "value": "53.6"
    },
    {
      "model": "Kimi Code CLI - Kimi K3",
      "lab": "Moonshot AI",
      "value": "51.9"
    },
    {
      "model": "Muse Code - Muse Spark 1.3 (xhigh)",
      "lab": "Meta",
      "value": "48.3"
    },
    {
      "model": "Grok Build - Grok 4.6 (xhigh)",
      "lab": "SpaceXAI",
      "value": "47.0"
    },
    {
      "model": "Claude Code - Qwen3.8 Max",
      "lab": "Alibaba Cloud",
      "value": "43.3"
    },
    {
      "model": "Codex - GPT-5.6 Luna (max)",
      "lab": "OpenAI",
      "value": "43.2"
    },
    {
      "model": "Codex - DeepSeek V4 Pro 0813 (max)",
      "lab": "DeepSeek",
      "value": "43.1"
    },
    {
      "model": "Antigravity SDK - Gemini 3.8 Flash (high)",
      "lab": "Google",
      "value": "41.9"
    },
    {
      "model": "Codex - GPT-6 Luna (max)",
      "lab": "OpenAI",
      "value": "41.1"
    },
    {
      "model": "Codex - DeepSeek V4 Flash 0731 (max)",
      "lab": "DeepSeek",
      "value": "38.7"
    }
  ],
  "Agentic Index": [
    {
      "model": "Claude Fable 5.1",
      "lab": "Anthropic",
      "value": "58.0"
    },
    {
      "model": "Claude Opus 5",
      "lab": "Anthropic",
      "value": "56.2"
    },
    {
      "model": "Muse Spark 1.3",
      "lab": "Meta",
      "value": "55.7"
    },
    {
      "model": "GLM-5.3",
      "lab": "Z AI",
      "value": "53.4"
    },
    {
      "model": "Grok 4.6",
      "lab": "SpaceXAI",
      "value": "53.4"
    },
    {
      "model": "GPT-6 Astra",
      "lab": "OpenAI",
      "value": "51.5"
    },
    {
      "model": "Claude Fable 5",
      "lab": "Anthropic",
      "value": "51.0"
    },
    {
      "model": "Kimi K3",
      "lab": "Kimi",
      "value": "50.6"
    },
    {
      "model": "GPT-5.6 Sol",
      "lab": "OpenAI",
      "value": "50.5"
    },
    {
      "model": "Qwen3.8 Max Preview",
      "lab": "Alibaba",
      "value": "49.6"
    },
    {
      "model": "DeepSeek V4 Pro 0813",
      "lab": "DeepSeek",
      "value": "49.6"
    },
    {
      "model": "Qwen3.8-27B",
      "lab": "Alibaba",
      "value": "46.5"
    },
    {
      "model": "Claude Sonnet 5",
      "lab": "Anthropic",
      "value": "44.3"
    },
    {
      "model": "Muse Spark 1.2",
      "lab": "Meta",
      "value": "44.0"
    },
    {
      "model": "GPT-5.6 Terra",
      "lab": "OpenAI",
      "value": "43.7"
    },
    {
      "model": "GPT-5.6 Luna",
      "lab": "OpenAI",
      "value": "42.7"
    },
    {
      "model": "Claude Opus 4.8",
      "lab": "Anthropic",
      "value": "42.6"
    },
    {
      "model": "Grok 4.5",
      "lab": "SpaceXAI",
      "value": "42.1"
    },
    {
      "model": "DeepSeek V4 Flash 0731",
      "lab": "DeepSeek",
      "value": "41.7"
    },
    {
      "model": "Gemini 3.8 Flash",
      "lab": "Google",
      "value": "41.1"
    }
  ],
  "AA-Briefcase": [
    {
      "model": "Claude Opus 5.5",
      "lab": "Anthropic",
      "value": "1822"
    },
    {
      "model": "Claude Sonnet 5.5",
      "lab": "Anthropic",
      "value": "1811"
    },
    {
      "model": "Claude Opus 5",
      "lab": "Anthropic",
      "value": "1720"
    },
    {
      "model": "Claude Fable 5.1",
      "lab": "Anthropic",
      "value": "1678"
    },
    {
      "model": "Grok 4.7",
      "lab": "SpaceXAI",
      "value": "1657"
    },
    {
      "model": "Muse Spark 1.3",
      "lab": "Meta",
      "value": "1597"
    },
    {
      "model": "GPT-6 Astra",
      "lab": "OpenAI",
      "value": "1569"
    },
    {
      "model": "Grok 4.6",
      "lab": "SpaceXAI",
      "value": "1546"
    },
    {
      "model": "GLM-5.3",
      "lab": "Z AI",
      "value": "1525"
    },
    {
      "model": "MiMo-V2.6-Pro",
      "lab": "Xiaomi",
      "value": "1522"
    },
    {
      "model": "Kimi K3",
      "lab": "Kimi",
      "value": "1510"
    },
    {
      "model": "GPT-5.6 Sol",
      "lab": "OpenAI",
      "value": "1487"
    },
    {
      "model": "GPT-6 Sol",
      "lab": "OpenAI",
      "value": "1483"
    },
    {
      "model": "GLM-5.3-Flash",
      "lab": "Z AI",
      "value": "1459"
    },
    {
      "model": "Step 5 Preview",
      "lab": "StepFun",
      "value": "1432"
    }
  ]
} satisfies Record<string, LeaderboardRow[]>;

export const LEADERBOARD_ROW_COUNTS = Object.fromEntries(
  Object.entries(CURRENT_LEADERBOARD_ROWS).map(([name, rows]) => [name, rows.length]),
) as Record<keyof typeof CURRENT_LEADERBOARD_ROWS, number>;
