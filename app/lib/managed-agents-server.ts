export const MANAGED_AGENTS_BASE_URL =
  "https://ark.cn-beijing.volces.com/api/v3";

export class ManagedAgentsValidationError extends Error {}

type ManagedConnection = {
  baseUrl: string;
  apiKey: string;
};

type AgentSkill = {
  type: "skill_hub" | "custom";
  skill_id?: string;
  version?: string;
};

type AgentToolConfig = {
  name: string;
  enabled: boolean;
};

type AgentTool = {
  type: "agent_toolset_20260701" | "evolution" | "mcp_toolset";
  mcp_server_name?: string;
  default_config?: { enabled: boolean };
  configs?: AgentToolConfig[];
};

type AgentMcpServer = {
  type: "url";
  name: string;
  url: string;
};

type AgentMultiagentMember =
  | { type: "self" }
  | { type: "agent"; id: string; version?: number };

type AgentDefinition = {
  name?: string;
  description?: string;
  model?: { id: string; speed?: "standard" | "fast" };
  system?: string;
  skills?: AgentSkill[];
  tools?: AgentTool[];
  multiagent?: {
    type: "coordinator";
    agents: AgentMultiagentMember[];
  };
  mcp_servers?: AgentMcpServer[];
  metadata?: Record<string, string>;
};

export type ManageManagedAgentInput = ManagedConnection & {
  mode: "create" | "update";
  agentId?: string;
  requestBody: AgentDefinition & { version?: number };
};

export type CreateManagedEnvironmentInput = ManagedConnection & {
  requestBody: {
    name: string;
    description?: string;
    config: {
      type: "cloud";
      networking:
        | { type: "unrestricted" }
        | {
            type: "limited";
            allow_mcp_servers?: boolean;
            allow_package_managers?: boolean;
            allowed_hosts?: string[];
          };
      packages?: {
        type?: "packages";
        apt?: string[];
        cargo?: string[];
        gem?: string[];
        go?: string[];
        npm?: string[];
        pip?: string[];
      };
      env?: Record<string, string>;
    };
    metadata?: Record<string, string>;
    scope?: "organization" | "account";
  };
};

type ManagedSessionAgent =
  | string
  | { type: "agent"; id: string; version: number };

type ManagedSessionResource =
  | {
      type: "file";
      file_id: string;
      mount_path?: string;
    }
  | {
      type: "tos";
      tos_bucket: string;
      tos_key: string;
    }
  | {
      type: "memory_store";
      memory_store_id: string;
      instructions?: string;
    };

type ManagedSessionCreateBody = {
  agent: ManagedSessionAgent;
  environment_id: string;
  vault_ids?: string[];
  resources?: ManagedSessionResource[];
};

type ManagedSessionSource =
  | { type: "url"; url: string }
  | { type: "file"; file_id: string }
  | { type: "base64"; media_type: string; data: string }
  | { type: "text"; media_type: "text/plain"; data: string };

type ManagedSessionContent =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: ManagedSessionSource;
    }
  | {
      type: "document";
      source: ManagedSessionSource;
      title?: string;
      context?: string;
    };

type ManagedSessionEvent =
  | { type: "user.message"; content: ManagedSessionContent[] }
  | { type: "system.message"; content: Array<{ type: "text"; text: string }> }
  | { type: "user.interrupt"; session_thread_id?: string }
  | {
      type: "user.tool_confirmation";
      tool_use_id: string;
      result: "allow" | "deny";
      deny_message?: string;
    };

export type ManageManagedSessionInput = ManagedConnection &
  (
    | { action: "create"; requestBody: ManagedSessionCreateBody }
    | { action: "retrieve"; sessionId: string }
    | {
        action: "list";
        query: { agent_id?: string; limit?: number };
      }
    | { action: "delete"; sessionId: string }
  );

export type ManageManagedSessionEventInput = ManagedConnection &
  (
    | { action: "stream"; sessionId: string }
    | {
        action: "send";
        sessionId: string;
        requestBody: { events: ManagedSessionEvent[] };
      }
  );

export type ManageManagedSessionResourceInput = ManagedConnection &
  (
    | {
        action: "add";
        sessionId: string;
        requestBody: Extract<ManagedSessionResource, { type: "file" }>;
      }
    | { action: "list"; sessionId: string }
    | { action: "delete"; sessionId: string; resourceId: string }
  );

export type ManageManagedFileInput =
  | (ManagedConnection & {
      action: "upload";
      file: File;
    })
  | (ManagedConnection & {
      action: "list";
      scopeId: string;
    });

export type ManageManagedMemoryInput = ManagedConnection &
  (
    | {
        action: "create-store";
        requestBody: { name: string; description: string };
      }
    | { action: "list-stores" }
    | { action: "delete-store"; storeId: string }
    | {
        action: "create-memory";
        storeId: string;
        requestBody: { path: string; content: string };
      }
    | {
        action: "list-memories";
        storeId: string;
        query: { path_prefix?: string; order_by?: "path"; depth?: number };
      }
    | { action: "retrieve-memory"; storeId: string; memoryId: string }
    | {
        action: "update-memory";
        storeId: string;
        memoryId: string;
        requestBody: { path?: string; content?: string };
      }
    | { action: "delete-memory"; storeId: string; memoryId: string }
  );

export type SendManagedMessageInput = ManagedConnection & {
  sessionId: string;
  requestBody: { events: ManagedSessionEvent[] };
};

export function parseManageManagedAgentInput(
  value: unknown,
): ManageManagedAgentInput {
  const body = asRecord(value);
  const connection = parseConnection(body);
  const mode = body.mode;
  if (mode !== "create" && mode !== "update") {
    throw new ManagedAgentsValidationError(
      'Agent 管理模式必须为 "create" 或 "update"。',
    );
  }
  const requestBody = exactRecord(body.requestBody, [
    "version",
    "name",
    "description",
    "model",
    "system",
    "skills",
    "tools",
    "multiagent",
    "mcp_servers",
    "metadata",
  ]);
  if (mode === "create" && requestBody.version !== undefined) {
    throw new ManagedAgentsValidationError("创建 Agent 时不能传入 version。");
  }
  if (mode === "update" && !Number.isInteger(requestBody.version)) {
    throw new ManagedAgentsValidationError(
      "更新 Agent 必须传入当前整数 version。",
    );
  }

  return {
    ...connection,
    mode,
    agentId:
      mode === "update" ? resourceId(body.agentId, "Agent ID") : undefined,
    requestBody: parseAgentDefinition(requestBody, mode),
  };
}

export function parseCreateManagedEnvironmentInput(
  value: unknown,
): CreateManagedEnvironmentInput {
  const body = asRecord(value);
  const connection = parseConnection(body);
  const requestBody = exactRecord(body.requestBody, [
    "name",
    "description",
    "config",
    "metadata",
    "scope",
  ]);
  const config = exactRecord(requestBody.config, [
    "type",
    "networking",
    "packages",
    "env",
  ]);
  const networking = exactRecord(config.networking, [
    "type",
    "allow_mcp_servers",
    "allow_package_managers",
    "allowed_hosts",
  ]);

  if (config.type !== "cloud") {
    throw new ManagedAgentsValidationError(
      '配置云环境的 config.type 必须为 "cloud"。',
    );
  }
  if (
    networking.type !== "unrestricted" &&
    networking.type !== "limited"
  ) {
    throw new ManagedAgentsValidationError(
      'networking.type 必须为 "unrestricted" 或 "limited"。',
    );
  }
  if (
    networking.type === "unrestricted" &&
    (networking.allow_mcp_servers !== undefined ||
      networking.allow_package_managers !== undefined ||
      networking.allowed_hosts !== undefined)
  ) {
    throw new ManagedAgentsValidationError(
      "unrestricted 模式下不应传入 limited 专用网络字段。",
    );
  }
  const parsedNetworking =
    networking.type === "unrestricted"
      ? ({ type: "unrestricted" } as const)
      : parseLimitedNetworking(networking);
  const parsedPackages =
    config.packages === undefined
      ? undefined
      : parseEnvironmentPackages(config.packages);
  const parsedEnv =
    config.env === undefined
      ? undefined
      : parseEnvironmentStringMap(config.env, "config.env", {
          forbidReservedPrefix: true,
        });
  const scope = requestBody.scope;
  if (
    scope !== undefined &&
    scope !== "organization" &&
    scope !== "account"
  ) {
    throw new ManagedAgentsValidationError(
      'scope 只能为 "organization" 或 "account"。',
    );
  }

  return {
    ...connection,
    requestBody: {
      name: requiredString(requestBody.name, "环境名称", 120),
      ...(requestBody.description !== undefined
        ? {
            description: optionalString(
              requestBody.description,
              "环境描述",
              1_000,
            ),
          }
        : {}),
      config: {
        type: "cloud",
        networking: parsedNetworking,
        ...(parsedPackages ? { packages: parsedPackages } : {}),
        ...(parsedEnv ? { env: parsedEnv } : {}),
      },
      ...(requestBody.metadata !== undefined
        ? {
            metadata: parseEnvironmentStringMap(
              requestBody.metadata,
              "metadata",
            ),
          }
        : {}),
      ...(scope ? { scope } : {}),
    },
  };
}

export function parseManageManagedSessionInput(
  value: unknown,
): ManageManagedSessionInput {
  const body = asRecord(value);
  const connection = parseConnection(body);
  const action = body.action;

  if (action === "create") {
    const requestBody = exactRecord(body.requestBody, [
      "agent",
      "environment_id",
      "vault_ids",
      "resources",
    ]);
    return {
      ...connection,
      action,
      requestBody: {
        agent: parseSessionAgent(requestBody.agent),
        environment_id: resourceId(
          requestBody.environment_id,
          "Environment ID",
        ),
        ...(requestBody.vault_ids !== undefined
          ? { vault_ids: parseResourceIdArray(requestBody.vault_ids, "vault_ids") }
          : {}),
        ...(requestBody.resources !== undefined
          ? { resources: parseSessionResources(requestBody.resources) }
          : {}),
      },
    };
  }

  if (action === "retrieve" || action === "delete") {
    return {
      ...connection,
      action,
      sessionId: resourceId(body.sessionId, "Session ID"),
    };
  }

  if (action === "list") {
    const query =
      body.query === undefined
        ? {}
        : exactRecord(body.query, ["agent_id", "limit"]);
    if (
      query.limit !== undefined &&
      (!Number.isInteger(query.limit) ||
        (query.limit as number) < 1 ||
        (query.limit as number) > 100)
    ) {
      throw new ManagedAgentsValidationError(
        "limit 必须是 1–100 之间的整数。",
      );
    }
    return {
      ...connection,
      action,
      query: {
        ...(query.agent_id !== undefined
          ? { agent_id: resourceId(query.agent_id, "Agent ID") }
          : {}),
        ...(query.limit !== undefined ? { limit: query.limit as number } : {}),
      },
    };
  }

  throw new ManagedAgentsValidationError(
    'Session 管理 action 必须为 "create"、"retrieve"、"list" 或 "delete"。',
  );
}

export function parseManageManagedSessionEventInput(
  value: unknown,
): ManageManagedSessionEventInput {
  const body = asRecord(value);
  const connection = parseConnection(body);
  const sessionId = resourceId(body.sessionId, "Session ID");
  if (body.action === "stream") {
    return { ...connection, action: "stream", sessionId };
  }
  if (body.action !== "send") {
    throw new ManagedAgentsValidationError(
      'Session 事件 action 必须为 "stream" 或 "send"。',
    );
  }
  const requestBody = exactRecord(body.requestBody, ["events"]);
  return {
    ...connection,
    action: "send",
    sessionId,
    requestBody: {
      events: parseSessionEvents(requestBody.events),
    },
  };
}

export function parseManageManagedSessionResourceInput(
  value: unknown,
): ManageManagedSessionResourceInput {
  const body = asRecord(value);
  const connection = parseConnection(body);
  const sessionId = resourceId(body.sessionId, "Session ID");
  if (body.action === "add") {
    const resource = parseSessionResource(body.requestBody, "requestBody");
    if (resource.type !== "file") {
      throw new ManagedAgentsValidationError(
        "运行中的 Session 仅支持动态添加 file 资源；TOS 和 Memory Store 请在创建时挂载。",
      );
    }
    return {
      ...connection,
      action: "add",
      sessionId,
      requestBody: resource,
    };
  }
  if (body.action === "list") {
    return { ...connection, action: "list", sessionId };
  }
  if (body.action === "delete") {
    return {
      ...connection,
      action: "delete",
      sessionId,
      resourceId: resourceId(body.resourceId, "Resource ID"),
    };
  }
  throw new ManagedAgentsValidationError(
    'Session Resource action 必须为 "add"、"list" 或 "delete"。',
  );
}

export function parseManageManagedFileInput(
  value: unknown,
): Extract<ManageManagedFileInput, { action: "list" }> {
  const body = asRecord(value);
  const connection = parseConnection(body);
  if (body.action !== "list") {
    throw new ManagedAgentsValidationError(
      'Files JSON action 仅支持 "list"；上传必须使用 multipart/form-data。',
    );
  }
  return {
    ...connection,
    action: "list",
    scopeId: resourceId(body.scopeId, "Session ID"),
  };
}

export function parseManageManagedMemoryInput(
  value: unknown,
): ManageManagedMemoryInput {
  const body = asRecord(value);
  const connection = parseConnection(body);
  const action = body.action;

  if (action === "create-store") {
    const requestBody = exactRecord(body.requestBody, ["name", "description"]);
    return {
      ...connection,
      action,
      requestBody: {
        name: requiredString(requestBody.name, "Memory Store name", 120),
        description: requiredString(
          requestBody.description,
          "Memory Store description",
          2_000,
        ),
      },
    };
  }
  if (action === "list-stores") {
    return { ...connection, action };
  }
  if (action === "delete-store") {
    return {
      ...connection,
      action,
      storeId: resourceId(body.storeId, "Memory Store ID"),
    };
  }

  const storeId = resourceId(body.storeId, "Memory Store ID");
  if (action === "create-memory") {
    return {
      ...connection,
      action,
      storeId,
      requestBody: parseMemoryWriteBody(body.requestBody, true),
    };
  }
  if (action === "list-memories") {
    const query =
      body.query === undefined
        ? {}
        : exactRecord(body.query, ["path_prefix", "order_by", "depth"]);
    const orderBy = query.order_by;
    if (orderBy !== undefined && orderBy !== "path") {
      throw new ManagedAgentsValidationError('order_by 当前只支持 "path"。');
    }
    if (
      query.depth !== undefined &&
      (!Number.isInteger(query.depth) ||
        (query.depth as number) < 1 ||
        (query.depth as number) > 20)
    ) {
      throw new ManagedAgentsValidationError("depth 必须是 1–20 的整数。");
    }
    return {
      ...connection,
      action,
      storeId,
      query: {
        ...(query.path_prefix !== undefined
          ? {
              path_prefix: memoryPath(
                query.path_prefix,
                "path_prefix",
                true,
              ),
            }
          : {}),
        ...(orderBy === "path" ? { order_by: "path" as const } : {}),
        ...(query.depth !== undefined ? { depth: query.depth as number } : {}),
      },
    };
  }

  const memoryId = resourceId(body.memoryId, "Memory ID");
  if (action === "retrieve-memory" || action === "delete-memory") {
    return { ...connection, action, storeId, memoryId };
  }
  if (action === "update-memory") {
    return {
      ...connection,
      action,
      storeId,
      memoryId,
      requestBody: parseMemoryWriteBody(body.requestBody, false),
    };
  }
  throw new ManagedAgentsValidationError("Memory action 不受支持。");
}

function parseMemoryWriteBody(
  value: unknown,
  requireAll: boolean,
): { path: string; content: string } | { path?: string; content?: string } {
  const body = exactRecord(value, ["path", "content"]);
  const result: { path?: string; content?: string } = {};
  if (body.path !== undefined) {
    result.path = memoryPath(body.path, "Memory path", false);
  } else if (requireAll) {
    throw new ManagedAgentsValidationError("创建 Memory 必须填写 path。");
  }
  if (body.content !== undefined) {
    result.content = requiredString(
      body.content,
      "Memory content",
      100 * 1024,
    );
  } else if (requireAll) {
    throw new ManagedAgentsValidationError("创建 Memory 必须填写 content。");
  }
  if (!requireAll && result.path === undefined && result.content === undefined) {
    throw new ManagedAgentsValidationError(
      "更新 Memory 至少需要 path 或 content。",
    );
  }
  return result as
    | { path: string; content: string }
    | { path?: string; content?: string };
}

function memoryPath(value: unknown, label: string, allowRoot: boolean): string {
  const path = requiredString(value, label, 1_024);
  if (
    !path.startsWith("/") ||
    path.includes("\\") ||
    path.split("/").some((part) => part === "..") ||
    (!allowRoot && path === "/")
  ) {
    throw new ManagedAgentsValidationError(
      `${label} 必须是以 / 开头且不包含 .. 的路径。`,
    );
  }
  return path;
}

export function parseSendManagedMessageInput(
  value: unknown,
): SendManagedMessageInput {
  const body = asRecord(value);
  const parsed = parseManageManagedSessionEventInput({
    ...body,
    action: "send",
  });
  if (parsed.action !== "send") {
    throw new ManagedAgentsValidationError("必须提交 Session 事件。");
  }
  return parsed;
}

function parseSessionAgent(value: unknown): ManagedSessionAgent {
  if (typeof value === "string") {
    return resourceId(value, "Agent ID");
  }
  const agent = exactRecord(value, ["type", "id", "version"]);
  if (agent.type !== "agent") {
    throw new ManagedAgentsValidationError(
      '固定版本 Agent 的 type 必须为 "agent"。',
    );
  }
  if (
    !Number.isInteger(agent.version) ||
    (agent.version as number) < 1
  ) {
    throw new ManagedAgentsValidationError(
      "固定版本 Agent 的 version 必须是正整数。",
    );
  }
  return {
    type: "agent",
    id: resourceId(agent.id, "Agent ID"),
    version: agent.version as number,
  };
}

function parseResourceIdArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.length > 50) {
    throw new ManagedAgentsValidationError(
      `${label} 必须是最多 50 项的资源 ID 数组。`,
    );
  }
  return value.map((item, index) =>
    resourceId(item, `${label}[${index}]`),
  );
}

function parseSessionResources(value: unknown): ManagedSessionResource[] {
  if (!Array.isArray(value) || value.length > 110) {
    throw new ManagedAgentsValidationError(
      "resources 必须是最多 110 项的资源数组。",
    );
  }
  let fileCount = 0;
  let memoryStoreCount = 0;
  const resources = value.map((item, index) =>
    parseSessionResource(item, `resources[${index}]`),
  );
  for (const resource of resources) {
    if (resource.type === "memory_store") memoryStoreCount += 1;
    else fileCount += 1;
  }
  if (fileCount > 100) {
    throw new ManagedAgentsValidationError(
      "单个 Session 最多挂载 100 个文件资源。",
    );
  }
  if (memoryStoreCount > 10) {
    throw new ManagedAgentsValidationError(
      "单个 Session 最多挂载 10 个 Memory Store。",
    );
  }
  return resources;
}

function parseSessionResource(
  value: unknown,
  label: string,
): ManagedSessionResource {
  const resource = asRecord(value);
  if (resource.type === "file") {
    const exact = exactRecord(resource, ["type", "file_id", "mount_path"]);
    return {
      type: "file",
      file_id: resourceId(exact.file_id, `${label}.file_id`),
      ...(exact.mount_path !== undefined
        ? {
            mount_path: sandboxRelativePath(
              exact.mount_path,
              `${label}.mount_path`,
            ),
          }
        : {}),
    };
  }
  if (resource.type === "tos") {
    const exact = exactRecord(resource, ["type", "tos_bucket", "tos_key"]);
    const tosKey = requiredString(exact.tos_key, `${label}.tos_key`, 1_024);
    if (!tosKey.endsWith("/") || tosKey.startsWith("/")) {
      throw new ManagedAgentsValidationError(
        `${label}.tos_key 必须是以 / 结尾的 TOS 目录键，且不能以 / 开头。`,
      );
    }
    return {
      type: "tos",
      tos_bucket: requiredString(
        exact.tos_bucket,
        `${label}.tos_bucket`,
        128,
      ),
      tos_key: tosKey,
    };
  }
  if (resource.type === "memory_store") {
    const exact = exactRecord(resource, [
      "type",
      "memory_store_id",
      "instructions",
    ]);
    return {
      type: "memory_store",
      memory_store_id: resourceId(
        exact.memory_store_id,
        `${label}.memory_store_id`,
      ),
      ...(exact.instructions !== undefined
        ? {
            instructions: optionalString(
              exact.instructions,
              `${label}.instructions`,
              4_096,
            ),
          }
        : {}),
    };
  }
  throw new ManagedAgentsValidationError(
    `${label}.type 必须为 file、tos 或 memory_store。`,
  );
}

function sandboxRelativePath(value: unknown, label: string): string {
  const path = requiredString(value, label, 1_024);
  if (
    path.startsWith("/") ||
    path.includes("\\") ||
    path.split("/").some((part) => part === "..")
  ) {
    throw new ManagedAgentsValidationError(
      `${label} 必须是安全的沙箱相对路径。`,
    );
  }
  return path;
}

function parseSessionEvents(value: unknown): ManagedSessionEvent[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 2) {
    throw new ManagedAgentsValidationError(
      "events 必须包含 1 个事件；仅 user.message 可追加一个 system.message。",
    );
  }
  const first = parseSessionEvent(value[0], 0);
  if (value.length === 1) return [first];
  const second = parseSessionEvent(value[1], 1);
  if (first.type !== "user.message" || second.type !== "system.message") {
    throw new ManagedAgentsValidationError(
      "双事件请求必须按 user.message、system.message 顺序提交。",
    );
  }
  return [first, second];
}

function parseSessionEvent(value: unknown, index: number): ManagedSessionEvent {
  const event = asRecord(value);
  if (event.type === "user.message") {
    const exact = exactRecord(event, ["type", "content"]);
    return {
      type: "user.message",
      content: parseSessionContent(exact.content),
    };
  }
  if (event.type === "system.message") {
    const exact = exactRecord(event, ["type", "content"]);
    if (!Array.isArray(exact.content) || exact.content.length < 1) {
      throw new ManagedAgentsValidationError(
        `events[${index}].content 必须至少包含一条文本。`,
      );
    }
    return {
      type: "system.message",
      content: exact.content.map((item, contentIndex) => {
        const content = exactRecord(item, ["type", "text"]);
        if (content.type !== "text") {
          throw new ManagedAgentsValidationError(
            `events[${index}].content[${contentIndex}].type 必须为 text。`,
          );
        }
        return {
          type: "text",
          text: requiredString(
            content.text,
            `events[${index}].content[${contentIndex}].text`,
            20_000,
          ),
        };
      }),
    };
  }
  if (event.type === "user.interrupt") {
    const exact = exactRecord(event, ["type", "session_thread_id"]);
    return {
      type: "user.interrupt",
      ...(exact.session_thread_id !== undefined
        ? {
            session_thread_id: resourceId(
              exact.session_thread_id,
              "session_thread_id",
            ),
          }
        : {}),
    };
  }
  if (event.type === "user.tool_confirmation") {
    const exact = exactRecord(event, [
      "type",
      "tool_use_id",
      "result",
      "deny_message",
    ]);
    if (exact.result !== "allow" && exact.result !== "deny") {
      throw new ManagedAgentsValidationError(
        'user.tool_confirmation.result 必须为 "allow" 或 "deny"。',
      );
    }
    if (exact.result === "allow" && exact.deny_message !== undefined) {
      throw new ManagedAgentsValidationError(
        "允许工具调用时不能传入 deny_message。",
      );
    }
    return {
      type: "user.tool_confirmation",
      tool_use_id: resourceId(exact.tool_use_id, "tool_use_id"),
      result: exact.result,
      ...(exact.deny_message !== undefined
        ? {
            deny_message: optionalString(
              exact.deny_message,
              "deny_message",
              2_000,
            ),
          }
        : {}),
    };
  }
  throw new ManagedAgentsValidationError(
    `events[${index}].type 不是当前管理台支持的用户事件。`,
  );
}

function parseSessionContent(value: unknown): ManagedSessionContent[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20) {
    throw new ManagedAgentsValidationError(
      "user.message.content 必须是 1–20 项内容数组。",
    );
  }
  return value.map((item, index) => {
    const content = asRecord(item);
    if (content.type === "text") {
      const exact = exactRecord(content, ["type", "text"]);
      return {
        type: "text",
        text: requiredString(
          exact.text,
          `content[${index}].text`,
          20_000,
        ),
      };
    }
    if (content.type === "image") {
      const exact = exactRecord(content, ["type", "source"]);
      return {
        type: "image",
        source: parseSessionSource(exact.source, `content[${index}].source`, false),
      };
    }
    if (content.type === "document") {
      const exact = exactRecord(content, [
        "type",
        "source",
        "title",
        "context",
      ]);
      return {
        type: "document",
        source: parseSessionSource(
          exact.source,
          `content[${index}].source`,
          true,
        ),
        ...(exact.title !== undefined
          ? {
              title: optionalString(
                exact.title,
                `content[${index}].title`,
                500,
              ),
            }
          : {}),
        ...(exact.context !== undefined
          ? {
              context: optionalString(
                exact.context,
                `content[${index}].context`,
                4_000,
              ),
            }
          : {}),
      };
    }
    throw new ManagedAgentsValidationError(
      `content[${index}].type 必须为 text、image 或 document。`,
    );
  });
}

function parseSessionSource(
  value: unknown,
  label: string,
  allowText: boolean,
): ManagedSessionSource {
  const source = asRecord(value);
  if (source.type === "url") {
    const exact = exactRecord(source, ["type", "url"]);
    const url = requiredString(exact.url, `${label}.url`, 2_048);
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") throw new Error();
    } catch {
      throw new ManagedAgentsValidationError(`${label}.url 必须是 HTTPS 地址。`);
    }
    return { type: "url", url };
  }
  if (source.type === "file") {
    const exact = exactRecord(source, ["type", "file_id"]);
    return {
      type: "file",
      file_id: resourceId(exact.file_id, `${label}.file_id`),
    };
  }
  if (source.type === "base64") {
    const exact = exactRecord(source, ["type", "media_type", "data"]);
    return {
      type: "base64",
      media_type: requiredString(exact.media_type, `${label}.media_type`, 128),
      data: requiredString(exact.data, `${label}.data`, 10_000_000),
    };
  }
  if (source.type === "text" && allowText) {
    const exact = exactRecord(source, ["type", "media_type", "data"]);
    if (exact.media_type !== "text/plain") {
      throw new ManagedAgentsValidationError(
        `${label}.media_type 必须为 text/plain。`,
      );
    }
    return {
      type: "text",
      media_type: "text/plain",
      data: requiredString(exact.data, `${label}.data`, 200_000),
    };
  }
  throw new ManagedAgentsValidationError(
    `${label}.type 必须为 url、file、base64${
      allowText ? " 或 text" : ""
    }。`,
  );
}

export async function manageManagedAgent(input: ManageManagedAgentInput) {
  const path =
    input.mode === "update"
      ? `/agents/${encodeURIComponent(input.agentId ?? "")}`
      : "/agents";
  return postJson(input, path, input.requestBody);
}

export async function createManagedEnvironment(
  input: CreateManagedEnvironmentInput,
) {
  return postJson(input, "/environments", input.requestBody);
}

export async function manageManagedSession(input: ManageManagedSessionInput) {
  if (input.action === "create") {
    const payload = await postJson(input, "/sessions", input.requestBody);
    return { payload, status: 201 };
  }

  if (input.action === "list") {
    const search = new URLSearchParams();
    if (input.query.agent_id) search.set("agent_id", input.query.agent_id);
    if (input.query.limit) search.set("limit", String(input.query.limit));
    const suffix = search.size > 0 ? `?${search.toString()}` : "";
    return requestManagedSessionJson(input, "GET", `/sessions${suffix}`);
  }

  const path = `/sessions/${encodeURIComponent(input.sessionId)}`;
  return requestManagedSessionJson(
    input,
    input.action === "delete" ? "DELETE" : "GET",
    path,
  );
}

export async function manageManagedSessionResource(
  input: ManageManagedSessionResourceInput,
) {
  const basePath = `/sessions/${encodeURIComponent(input.sessionId)}/resources`;
  if (input.action === "add") {
    return requestManagedSessionJson(
      input,
      "POST",
      basePath,
      input.requestBody,
    );
  }
  if (input.action === "list") {
    return requestManagedSessionJson(input, "GET", basePath);
  }
  return requestManagedSessionJson(
    input,
    "DELETE",
    `${basePath}/${encodeURIComponent(input.resourceId)}`,
  );
}

export async function uploadManagedFile(
  input: Extract<ManageManagedFileInput, { action: "upload" }>,
) {
  if (input.file.size < 1) {
    throw new ManagedAgentsValidationError("上传文件不能为空。");
  }
  const formData = new FormData();
  formData.set("purpose", "agent");
  formData.set("file", input.file, input.file.name);
  const response = await fetch(`${input.baseUrl}/files`, {
    method: "POST",
    headers: { authorization: `Bearer ${input.apiKey}` },
    body: formData,
    signal: AbortSignal.timeout(2 * 60_000),
  });
  const payload = await readPayload(response);
  if (!response.ok) {
    throw upstreamFailure(response.status, payload, input.apiKey);
  }
  return { payload, status: response.status };
}

export async function listManagedSessionFiles(
  input: Extract<ManageManagedFileInput, { action: "list" }>,
) {
  const search = new URLSearchParams({ scope_id: input.scopeId });
  return requestManagedSessionJson(input, "GET", `/files?${search}`);
}

export async function manageManagedMemory(input: ManageManagedMemoryInput) {
  if (input.action === "create-store") {
    return requestManagedSessionJson(
      input,
      "POST",
      "/memory_stores",
      input.requestBody,
    );
  }
  if (input.action === "list-stores") {
    return requestManagedSessionJson(input, "GET", "/memory_stores");
  }
  if (input.action === "delete-store") {
    return requestManagedSessionJson(
      input,
      "DELETE",
      `/memory_stores/${encodeURIComponent(input.storeId)}`,
    );
  }

  const memoriesPath = `/memory_stores/${encodeURIComponent(
    input.storeId,
  )}/memories`;
  if (input.action === "create-memory") {
    return requestManagedSessionJson(
      input,
      "POST",
      memoriesPath,
      input.requestBody,
    );
  }
  if (input.action === "list-memories") {
    const search = new URLSearchParams();
    if (input.query.path_prefix) {
      search.set("path_prefix", input.query.path_prefix);
    }
    if (input.query.order_by) search.set("order_by", input.query.order_by);
    if (input.query.depth) search.set("depth", String(input.query.depth));
    const suffix = search.size > 0 ? `?${search}` : "";
    return requestManagedSessionJson(input, "GET", `${memoriesPath}${suffix}`);
  }
  const memoryPath = `${memoriesPath}/${encodeURIComponent(input.memoryId)}`;
  if (input.action === "retrieve-memory") {
    return requestManagedSessionJson(input, "GET", memoryPath);
  }
  if (input.action === "update-memory") {
    return requestManagedSessionJson(
      input,
      "POST",
      memoryPath,
      input.requestBody,
    );
  }
  return requestManagedSessionJson(input, "DELETE", memoryPath);
}

export async function openManagedSessionEventStream(
  input: Extract<ManageManagedSessionEventInput, { action: "stream" }>,
): Promise<Response> {
  const eventsPath = `/sessions/${encodeURIComponent(input.sessionId)}/events`;
  const streamResponse = await fetch(
    `${input.baseUrl}${eventsPath}/stream`,
    {
      method: "GET",
      headers: {
        authorization: `Bearer ${input.apiKey}`,
        accept: "text/event-stream",
      },
      signal: AbortSignal.timeout(10 * 60_000),
    },
  );
  if (!streamResponse.ok || !streamResponse.body) {
    const payload = await readPayload(streamResponse);
    throw upstreamFailure(streamResponse.status, payload, input.apiKey);
  }
  return relayManagedSessionStream(streamResponse);
}

export async function sendManagedSessionEvents(
  input: Extract<ManageManagedSessionEventInput, { action: "send" }>,
) {
  const path = `/sessions/${encodeURIComponent(input.sessionId)}/events`;
  return requestManagedSessionJson(input, "POST", path, input.requestBody);
}

export async function sendManagedMessageAndOpenStream(
  input: SendManagedMessageInput,
): Promise<Response> {
  const eventsPath = `/sessions/${encodeURIComponent(input.sessionId)}/events`;
  const streamResponse = await fetch(
    `${input.baseUrl}${eventsPath}/stream`,
    {
      method: "GET",
      headers: {
        authorization: `Bearer ${input.apiKey}`,
        accept: "text/event-stream",
      },
      signal: AbortSignal.timeout(10 * 60_000),
    },
  );

  if (!streamResponse.ok || !streamResponse.body) {
    const payload = await readPayload(streamResponse);
    throw upstreamFailure(streamResponse.status, payload, input.apiKey);
  }

  const sendResponse = await fetch(`${input.baseUrl}${eventsPath}`, {
    method: "POST",
    headers: upstreamHeaders(input.apiKey),
    body: JSON.stringify(input.requestBody),
    signal: AbortSignal.timeout(30_000),
  });

  if (!sendResponse.ok) {
    await streamResponse.body.cancel();
    const payload = await readPayload(sendResponse);
    throw upstreamFailure(sendResponse.status, payload, input.apiKey);
  }

  return relayManagedSessionStream(streamResponse);
}

function relayManagedSessionStream(streamResponse: Response): Response {
  return new Response(streamResponse.body, {
    status: 200,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-store",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}

async function requestManagedSessionJson(
  input: ManagedConnection,
  method: "POST" | "GET" | "DELETE",
  path: string,
  requestBody?: unknown,
) {
  const response = await fetch(`${input.baseUrl}${path}`, {
    method,
    headers:
      method === "POST"
        ? upstreamHeaders(input.apiKey)
        : { authorization: `Bearer ${input.apiKey}` },
    ...(requestBody === undefined
      ? {}
      : { body: JSON.stringify(requestBody) }),
    signal: AbortSignal.timeout(30_000),
  });
  const payload = await readPayload(response);
  if (!response.ok) {
    throw upstreamFailure(response.status, payload, input.apiKey);
  }
  return { payload, status: response.status };
}

async function postJson(
  input: ManagedConnection,
  path: string,
  requestBody: unknown,
) {
  const response = await fetch(`${input.baseUrl}${path}`, {
    method: "POST",
    headers: upstreamHeaders(input.apiKey),
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(30_000),
  });
  const payload = await readPayload(response);

  if (!response.ok) {
    throw upstreamFailure(response.status, payload, input.apiKey);
  }

  const record = asOptionalRecord(payload);
  if (!record || typeof record.id !== "string" || !record.id.trim()) {
    throw new Error("火山方舟已响应，但未返回资源 ID。");
  }

  return payload;
}

function parseConnection(body: Record<string, unknown>): ManagedConnection {
  const baseUrl = requiredString(body.baseUrl, "Base URL", 240).replace(
    /\/$/,
    "",
  );
  const apiKey = requiredString(body.apiKey, "API Key", 512);

  if (baseUrl !== MANAGED_AGENTS_BASE_URL) {
    throw new ManagedAgentsValidationError(
      `Managed Agents 必须使用 ${MANAGED_AGENTS_BASE_URL}。`,
    );
  }
  if (/\s/.test(apiKey)) {
    throw new ManagedAgentsValidationError("API Key 不能包含空白字符。");
  }

  return { baseUrl, apiKey };
}

export function parseManagedConnection(value: unknown): ManagedConnection {
  return parseConnection(asRecord(value));
}

function resourceId(value: unknown, label: string): string {
  const id = requiredString(value, label, 256);
  if (!/^[A-Za-z0-9._:-]+$/.test(id)) {
    throw new ManagedAgentsValidationError(`${label} 格式不正确。`);
  }
  return id;
}

function exactRecord(value: unknown, keys: string[]): Record<string, unknown> {
  const record = asRecord(value);
  const allowed = new Set(keys);
  const unsupportedKey = Object.keys(record).find((key) => !allowed.has(key));
  if (unsupportedKey) {
    throw new ManagedAgentsValidationError(
      `Request Body 包含未开放转发的字段：${unsupportedKey}。`,
    );
  }
  return record;
}

function parseAgentDefinition(
  requestBody: Record<string, unknown>,
  mode: "create" | "update",
): AgentDefinition & { version?: number } {
  const result: AgentDefinition & { version?: number } = {};

  if (mode === "update") {
    const version = requestBody.version as number;
    if (version < 1) {
      throw new ManagedAgentsValidationError("version 必须大于或等于 1。");
    }
    result.version = version;
  }

  if (requestBody.name !== undefined) {
    const name = requiredString(requestBody.name, "Agent 名称", 64);
    if (!/^[A-Za-z0-9\u3400-\u9FFF]+$/u.test(name)) {
      throw new ManagedAgentsValidationError(
        "Agent 名称仅支持英文字母、汉字和数字。",
      );
    }
    result.name = name;
  } else if (mode === "create") {
    throw new ManagedAgentsValidationError("创建 Agent 必须填写 name。");
  }

  if (requestBody.description !== undefined) {
    result.description = optionalString(
      requestBody.description,
      "Agent 描述",
      300,
    );
  }

  if (requestBody.model !== undefined) {
    const model = exactRecord(requestBody.model, ["id", "speed"]);
    const speed = model.speed;
    if (
      speed !== undefined &&
      speed !== "standard" &&
      speed !== "fast"
    ) {
      throw new ManagedAgentsValidationError(
        'model.speed 只能为 "standard" 或 "fast"。',
      );
    }
    result.model = {
      id: requiredString(model.id, "模型 ID", 160),
      ...(speed ? { speed } : {}),
    };
  } else if (mode === "create") {
    throw new ManagedAgentsValidationError("创建 Agent 必须填写 model。");
  }

  if (requestBody.system !== undefined) {
    result.system = optionalString(requestBody.system, "系统提示词", 12_000);
  }
  if (requestBody.skills !== undefined) {
    result.skills = parseAgentSkills(requestBody.skills);
  }
  if (requestBody.tools !== undefined) {
    result.tools = parseAgentTools(requestBody.tools);
  }
  if (requestBody.mcp_servers !== undefined) {
    result.mcp_servers = parseMcpServers(requestBody.mcp_servers);
  }
  if (requestBody.multiagent !== undefined) {
    result.multiagent = parseMultiagent(requestBody.multiagent);
  }
  if (requestBody.metadata !== undefined) {
    result.metadata = parseMetadata(requestBody.metadata);
  }

  validateMcpPairing(result.tools, result.mcp_servers);
  return result;
}

function parseAgentSkills(value: unknown): AgentSkill[] {
  if (!Array.isArray(value) || value.length > 20) {
    throw new ManagedAgentsValidationError("skills 必须是最多 20 项的数组。");
  }
  return value.map((item, index) => {
    const skill = exactRecord(item, ["type", "skill_id", "version"]);
    if (skill.type !== "skill_hub" && skill.type !== "custom") {
      throw new ManagedAgentsValidationError(
        `skills[${index}].type 必须为 skill_hub 或 custom。`,
      );
    }
    return {
      type: skill.type,
      ...(skill.skill_id !== undefined
        ? {
            skill_id: requiredString(
              skill.skill_id,
              `skills[${index}].skill_id`,
              256,
            ),
          }
        : {}),
      ...(skill.version !== undefined
        ? {
            version: requiredString(
              skill.version,
              `skills[${index}].version`,
              64,
            ),
          }
        : {}),
    };
  });
}

function parseAgentTools(value: unknown): AgentTool[] {
  if (!Array.isArray(value) || value.length > 30) {
    throw new ManagedAgentsValidationError("tools 必须是最多 30 项的数组。");
  }
  return value.map((item, index) => {
    const tool = exactRecord(item, [
      "type",
      "mcp_server_name",
      "default_config",
      "configs",
    ]);
    if (
      tool.type !== "agent_toolset_20260701" &&
      tool.type !== "evolution" &&
      tool.type !== "mcp_toolset"
    ) {
      throw new ManagedAgentsValidationError(
        `tools[${index}].type 不是当前支持的工具类型。`,
      );
    }

    const parsed: AgentTool = { type: tool.type };
    if (tool.type === "mcp_toolset") {
      parsed.mcp_server_name = requiredString(
        tool.mcp_server_name,
        `tools[${index}].mcp_server_name`,
        128,
      );
    } else if (tool.mcp_server_name !== undefined) {
      throw new ManagedAgentsValidationError(
        `tools[${index}] 只有 mcp_toolset 可设置 mcp_server_name。`,
      );
    }
    if (tool.default_config !== undefined) {
      parsed.default_config = parseEnabledConfig(
        tool.default_config,
        `tools[${index}].default_config`,
      );
    }
    if (tool.configs !== undefined) {
      if (!Array.isArray(tool.configs) || tool.configs.length > 100) {
        throw new ManagedAgentsValidationError(
          `tools[${index}].configs 必须是最多 100 项的数组。`,
        );
      }
      parsed.configs = tool.configs.map((config, configIndex) => {
        const record = exactRecord(config, ["name", "enabled"]);
        if (typeof record.enabled !== "boolean") {
          throw new ManagedAgentsValidationError(
            `tools[${index}].configs[${configIndex}].enabled 必须是布尔值。`,
          );
        }
        return {
          name: requiredString(
            record.name,
            `tools[${index}].configs[${configIndex}].name`,
            128,
          ),
          enabled: record.enabled,
        };
      });
    }
    return parsed;
  });
}

function parseEnabledConfig(
  value: unknown,
  label: string,
): { enabled: boolean } {
  const config = exactRecord(value, ["enabled"]);
  if (typeof config.enabled !== "boolean") {
    throw new ManagedAgentsValidationError(`${label}.enabled 必须是布尔值。`);
  }
  return { enabled: config.enabled };
}

function parseMcpServers(value: unknown): AgentMcpServer[] {
  if (!Array.isArray(value) || value.length > 20) {
    throw new ManagedAgentsValidationError(
      "mcp_servers 必须是最多 20 项的数组。",
    );
  }
  const names = new Set<string>();
  return value.map((item, index) => {
    const server = exactRecord(item, ["type", "name", "url"]);
    if (server.type !== "url") {
      throw new ManagedAgentsValidationError(
        `mcp_servers[${index}].type 当前必须为 url。`,
      );
    }
    const name = requiredString(
      server.name,
      `mcp_servers[${index}].name`,
      128,
    );
    if (names.has(name)) {
      throw new ManagedAgentsValidationError("mcp_servers.name 必须唯一。");
    }
    names.add(name);
    const url = requiredString(
      server.url,
      `mcp_servers[${index}].url`,
      2_048,
    );
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") throw new Error();
    } catch {
      throw new ManagedAgentsValidationError(
        `mcp_servers[${index}].url 必须是 HTTPS 地址。`,
      );
    }
    return { type: "url", name, url };
  });
}

function parseMultiagent(value: unknown): AgentDefinition["multiagent"] {
  const multiagent = exactRecord(value, ["type", "agents"]);
  if (multiagent.type !== "coordinator") {
    throw new ManagedAgentsValidationError(
      'multiagent.type 必须为 "coordinator"。',
    );
  }
  if (!Array.isArray(multiagent.agents) || multiagent.agents.length > 20) {
    throw new ManagedAgentsValidationError(
      "multiagent.agents 必须是最多 20 项的数组。",
    );
  }
  return {
    type: "coordinator",
    agents: multiagent.agents.map((item, index) => {
      const member = exactRecord(item, ["type", "id", "version"]);
      if (member.type === "self") {
        if (member.id !== undefined || member.version !== undefined) {
          throw new ManagedAgentsValidationError(
            `multiagent.agents[${index}] 的 self 条目不能包含 id/version。`,
          );
        }
        return { type: "self" };
      }
      if (member.type !== "agent") {
        throw new ManagedAgentsValidationError(
          `multiagent.agents[${index}].type 必须为 agent 或 self。`,
        );
      }
      if (
        member.version !== undefined &&
        (!Number.isInteger(member.version) || (member.version as number) < 1)
      ) {
        throw new ManagedAgentsValidationError(
          `multiagent.agents[${index}].version 必须是正整数。`,
        );
      }
      return {
        type: "agent",
        id: resourceId(member.id, `multiagent.agents[${index}].id`),
        ...(member.version !== undefined
          ? { version: member.version as number }
          : {}),
      };
    }),
  };
}

function parseMetadata(value: unknown): Record<string, string> {
  const metadata = asRecord(value);
  const entries = Object.entries(metadata);
  if (entries.length > 100) {
    throw new ManagedAgentsValidationError("metadata 最多包含 100 个键值对。");
  }
  return Object.fromEntries(
    entries.map(([key, item]) => [
      requiredString(key, "metadata key", 128),
      optionalString(item, `metadata.${key}`, 1_024),
    ]),
  );
}

function validateMcpPairing(
  tools: AgentTool[] | undefined,
  servers: AgentMcpServer[] | undefined,
) {
  if (tools === undefined && servers === undefined) return;
  const serverNames = new Set((servers ?? []).map((server) => server.name));
  const toolNames = new Set(
    (tools ?? [])
      .filter((tool) => tool.type === "mcp_toolset")
      .map((tool) => tool.mcp_server_name ?? ""),
  );
  const missingTool = [...serverNames].find((name) => !toolNames.has(name));
  const missingServer = [...toolNames].find((name) => !serverNames.has(name));
  if (missingTool || missingServer) {
    throw new ManagedAgentsValidationError(
      "mcp_servers 与 mcp_toolset 必须按名称一一对应。",
    );
  }
}

function parseLimitedNetworking(value: Record<string, unknown>): {
  type: "limited";
  allow_mcp_servers?: boolean;
  allow_package_managers?: boolean;
  allowed_hosts?: string[];
} {
  const parsed: {
    type: "limited";
    allow_mcp_servers?: boolean;
    allow_package_managers?: boolean;
    allowed_hosts?: string[];
  } = { type: "limited" };
  for (const field of [
    "allow_mcp_servers",
    "allow_package_managers",
  ] as const) {
    if (value[field] !== undefined) {
      if (typeof value[field] !== "boolean") {
        throw new ManagedAgentsValidationError(
          `networking.${field} 必须是布尔值。`,
        );
      }
      parsed[field] = value[field];
    }
  }
  if (value.allowed_hosts !== undefined) {
    if (!Array.isArray(value.allowed_hosts) || value.allowed_hosts.length > 100) {
      throw new ManagedAgentsValidationError(
        "networking.allowed_hosts 必须是最多 100 项的字符串数组。",
      );
    }
    parsed.allowed_hosts = value.allowed_hosts.map((item, index) => {
      const host = requiredString(
        item,
        `networking.allowed_hosts[${index}]`,
        253,
      );
      if (
        host.includes("://") ||
        host.includes("/") ||
        !/^[A-Za-z0-9.*:\[\]-]+$/.test(host)
      ) {
        throw new ManagedAgentsValidationError(
          `networking.allowed_hosts[${index}] 必须是域名或 IP，不能包含协议和路径。`,
        );
      }
      return host;
    });
  }
  return parsed;
}

function parseEnvironmentPackages(value: unknown): {
  type?: "packages";
  apt?: string[];
  cargo?: string[];
  gem?: string[];
  go?: string[];
  npm?: string[];
  pip?: string[];
} {
  const packages = exactRecord(value, [
    "type",
    "apt",
    "cargo",
    "gem",
    "go",
    "npm",
    "pip",
  ]);
  if (packages.type !== undefined && packages.type !== "packages") {
    throw new ManagedAgentsValidationError(
      'config.packages.type 只能为 "packages"。',
    );
  }
  const parsed: {
    type?: "packages";
    apt?: string[];
    cargo?: string[];
    gem?: string[];
    go?: string[];
    npm?: string[];
    pip?: string[];
  } = packages.type ? { type: "packages" } : {};
  for (const manager of [
    "apt",
    "cargo",
    "gem",
    "go",
    "npm",
    "pip",
  ] as const) {
    const items = packages[manager];
    if (items === undefined) continue;
    if (!Array.isArray(items) || items.length > 100) {
      throw new ManagedAgentsValidationError(
        `config.packages.${manager} 必须是最多 100 项的字符串数组。`,
      );
    }
    parsed[manager] = items.map((item, index) =>
      requiredString(
        item,
        `config.packages.${manager}[${index}]`,
        512,
      ),
    );
  }
  return parsed;
}

function parseEnvironmentStringMap(
  value: unknown,
  label: string,
  options: { forbidReservedPrefix?: boolean } = {},
): Record<string, string> {
  const record = asRecord(value);
  const entries = Object.entries(record);
  if (entries.length > 100) {
    throw new ManagedAgentsValidationError(
      `${label} 最多包含 100 个键值对。`,
    );
  }
  return Object.fromEntries(
    entries.map(([key, item]) => {
      const parsedKey = requiredString(key, `${label} key`, 128);
      if (
        options.forbidReservedPrefix &&
        /^(?:ARK_|VOLC_)/i.test(parsedKey)
      ) {
        throw new ManagedAgentsValidationError(
          `${label} key 禁止使用 ARK_ 或 VOLC_ 保留前缀。`,
        );
      }
      if (
        options.forbidReservedPrefix &&
        !/^[A-Za-z_][A-Za-z0-9_]*$/.test(parsedKey)
      ) {
        throw new ManagedAgentsValidationError(
          `${label} key 必须是合法环境变量名。`,
        );
      }
      return [
        parsedKey,
        optionalString(item, `${label}.${parsedKey}`, 4_096),
      ];
    }),
  );
}

function requiredString(
  value: unknown,
  label: string,
  maxLength: number,
): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new ManagedAgentsValidationError(`${label} 不能为空。`);
  }
  if (value.length > maxLength) {
    throw new ManagedAgentsValidationError(
      `${label} 不能超过 ${maxLength} 个字符。`,
    );
  }
  return value.trim();
}

function optionalString(
  value: unknown,
  label: string,
  maxLength: number,
): string {
  if (typeof value !== "string") {
    throw new ManagedAgentsValidationError(`${label} 必须是字符串。`);
  }
  if (value.length > maxLength) {
    throw new ManagedAgentsValidationError(
      `${label} 不能超过 ${maxLength} 个字符。`,
    );
  }
  return value;
}

function asRecord(value: unknown): Record<string, unknown> {
  const record = asOptionalRecord(value);
  if (!record) {
    throw new ManagedAgentsValidationError("请求体必须是 JSON 对象。");
  }
  return record;
}

function asOptionalRecord(
  value: unknown,
): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function upstreamHeaders(apiKey: string): HeadersInit {
  return {
    authorization: `Bearer ${apiKey}`,
    "content-type": "application/json",
  };
}

async function readPayload(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text.slice(0, 2_000) };
  }
}

function upstreamFailure(
  status: number,
  payload: unknown,
  apiKey: string,
): Error {
  const record = asOptionalRecord(payload);
  const nestedError = asOptionalRecord(record?.error);
  const message =
    stringValue(nestedError?.message) ??
    stringValue(nestedError?.code) ??
    stringValue(record?.message) ??
    stringValue(record?.error) ??
    `火山方舟返回 HTTP ${status}。`;
  return new Error(safeError(message, apiKey));
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function safeError(message: string, apiKey: string): string {
  return message.replaceAll(apiKey, "[REDACTED]").slice(0, 1_000);
}
