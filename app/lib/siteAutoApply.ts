import Anthropic from "@anthropic-ai/sdk";
import { Octokit } from "@octokit/rest";
import { appendMessage, type SiteRecord } from "./sites";

type RepoFile = { path: string; content: string };

const MAX_FILES_IN_CONTEXT = 12;
const MAX_FILE_BYTES = 40_000;
const MAX_EDIT_TURNS = 6;

const SYSTEM_PROMPT = (businessName: string) => `You are the autonomous code agent for a Chappie Works customer site. The customer for "${businessName}" has just sent an edit request. Your job: make the minimum code changes that satisfy the request, commit, and let Vercel deploy.

You have three tools:
- list_files: see the repo's file tree
- read_file: read a file's contents
- write_file: write/overwrite a file (this stages it for the commit)

Workflow:
1. Use list_files to scan the repo. Then read_file on whatever's relevant to the request.
2. Make the smallest possible changes. Don't refactor. Don't reformat untouched code. Don't add deps unless absolutely required.
3. When done, stop calling tools and reply with a one-sentence customer-facing summary of what shipped (no code, no jargon — like "Updated the hero headline and changed the button to gold.").

Rules:
- Only edit files inside src/. Never touch package.json, package-lock.json, tsconfig.json, or .gitignore.
- If the request is ambiguous or requires guessing, reply WITHOUT calling write_file and ask one short clarifying question instead.
- If the request is impossible in code (custom domain, paid service signup, etc.), reply explaining what you can't do and what the customer needs to do manually.`;

const LIST_FILES_TOOL: Anthropic.Messages.Tool = {
  name: "list_files",
  description: "List all files in the repository. Returns paths only.",
  input_schema: { type: "object", properties: {} },
};

const READ_FILE_TOOL: Anthropic.Messages.Tool = {
  name: "read_file",
  description: "Read the full contents of a file at the given path.",
  input_schema: {
    type: "object",
    properties: { path: { type: "string" } },
    required: ["path"],
  },
};

const WRITE_FILE_TOOL: Anthropic.Messages.Tool = {
  name: "write_file",
  description:
    "Stage a file write. Path is relative to repo root. Content fully replaces the file. Call multiple times for multiple files. Changes are batched into one commit at the end.",
  input_schema: {
    type: "object",
    properties: {
      path: { type: "string" },
      content: { type: "string" },
    },
    required: ["path", "content"],
  },
};

async function listRepoFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<string[]> {
  const { data: ref } = await octokit.git.getRef({ owner, repo, ref: "heads/main" });
  const { data: tree } = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: ref.object.sha,
    recursive: "true",
  });
  return tree.tree
    .filter((t) => t.type === "blob" && t.path)
    .map((t) => t.path as string);
}

async function readRepoFile(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
): Promise<string> {
  const { data } = await octokit.repos.getContent({ owner, repo, path, ref: "main" });
  if (Array.isArray(data) || data.type !== "file") {
    throw new Error(`Not a file: ${path}`);
  }
  return Buffer.from(data.content, "base64").toString("utf-8");
}

async function commitFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  files: RepoFile[],
  message: string,
): Promise<void> {
  const { data: ref } = await octokit.git.getRef({ owner, repo, ref: "heads/main" });
  const parentSha = ref.object.sha;
  const { data: parentCommit } = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: parentSha,
  });

  const blobs = await Promise.all(
    files.map((f) =>
      octokit.git.createBlob({
        owner,
        repo,
        content: Buffer.from(f.content, "utf-8").toString("base64"),
        encoding: "base64",
      }),
    ),
  );

  const { data: tree } = await octokit.git.createTree({
    owner,
    repo,
    base_tree: parentCommit.tree.sha,
    tree: files.map((f, i) => ({
      path: f.path,
      mode: "100644",
      type: "blob",
      sha: blobs[i].data.sha,
    })),
  });

  const { data: commit } = await octokit.git.createCommit({
    owner,
    repo,
    message,
    tree: tree.sha,
    parents: [parentSha],
  });

  await octokit.git.updateRef({
    owner,
    repo,
    ref: "heads/main",
    sha: commit.sha,
  });
}

export async function autoApplyEdit({
  site,
  request,
}: {
  site: SiteRecord;
  request: string;
}): Promise<{ ok: boolean; summary?: string; reason?: string }> {
  if (!site.githubRepo) {
    return { ok: false, reason: "no githubRepo on site — provisioning incomplete" };
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const ghToken = process.env.GITHUB_TOKEN;
  if (!apiKey || !ghToken) {
    return { ok: false, reason: "missing ANTHROPIC_API_KEY or GITHUB_TOKEN" };
  }

  const [owner, repo] = site.githubRepo.split("/");
  const octokit = new Octokit({ auth: ghToken });
  const anthropic = new Anthropic({ apiKey });

  const staged: RepoFile[] = [];

  let messages: Anthropic.Messages.MessageParam[] = [
    { role: "user", content: `Edit request from customer:\n\n${request}` },
  ];

  let finalReply = "";

  for (let turn = 0; turn < MAX_EDIT_TURNS; turn++) {
    const result = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 4000,
      system: SYSTEM_PROMPT(site.businessName),
      tools: [LIST_FILES_TOOL, READ_FILE_TOOL, WRITE_FILE_TOOL],
      messages,
    });

    const toolUses = result.content.filter(
      (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use",
    );
    const textBlocks = result.content.filter(
      (b): b is Anthropic.Messages.TextBlock => b.type === "text",
    );

    if (toolUses.length === 0) {
      finalReply = textBlocks.map((t) => t.text).join("\n").trim();
      break;
    }

    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      try {
        if (tu.name === "list_files") {
          const files = await listRepoFiles(octokit, owner, repo);
          toolResults.push({
            type: "tool_result",
            tool_use_id: tu.id,
            content: files.slice(0, 500).join("\n"),
          });
        } else if (tu.name === "read_file") {
          const path = (tu.input as { path: string }).path;
          const content = await readRepoFile(octokit, owner, repo, path);
          toolResults.push({
            type: "tool_result",
            tool_use_id: tu.id,
            content: content.slice(0, MAX_FILE_BYTES),
          });
        } else if (tu.name === "write_file") {
          const input = tu.input as { path: string; content: string };
          if (!input.path.startsWith("src/")) {
            toolResults.push({
              type: "tool_result",
              tool_use_id: tu.id,
              content: `Refused: can only edit files inside src/. Path was ${input.path}.`,
              is_error: true,
            });
          } else if (staged.length >= MAX_FILES_IN_CONTEXT) {
            toolResults.push({
              type: "tool_result",
              tool_use_id: tu.id,
              content: `Refused: too many files staged (limit ${MAX_FILES_IN_CONTEXT}). Finish and reply.`,
              is_error: true,
            });
          } else {
            const idx = staged.findIndex((f) => f.path === input.path);
            if (idx >= 0) staged[idx].content = input.content;
            else staged.push({ path: input.path, content: input.content });
            toolResults.push({
              type: "tool_result",
              tool_use_id: tu.id,
              content: `Staged ${input.path} (${staged.length} file(s) pending commit).`,
            });
          }
        }
      } catch (err) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: `Error: ${err instanceof Error ? err.message : "unknown"}`,
          is_error: true,
        });
      }
    }

    messages = [
      ...messages,
      { role: "assistant", content: result.content },
      { role: "user", content: toolResults },
    ];

    if (result.stop_reason === "end_turn") {
      finalReply = textBlocks.map((t) => t.text).join("\n").trim();
      break;
    }
  }

  if (staged.length === 0) {
    return {
      ok: true,
      summary: finalReply || "Took a look but didn't make any changes.",
    };
  }

  try {
    await commitFiles(
      octokit,
      owner,
      repo,
      staged,
      `edit: ${request.slice(0, 60)}${request.length > 60 ? "…" : ""}`,
    );
  } catch (err) {
    console.error("[autoApplyEdit] commit failed", err);
    return { ok: false, reason: "commit failed" };
  }

  const summary =
    finalReply ||
    `Updated ${staged.length} file${staged.length === 1 ? "" : "s"}. Vercel will redeploy in a minute.`;

  await appendMessage(site.slug, {
    from: "studio",
    body: `${summary}\n\nLive site updates in ~60 seconds.`,
    statusChange: "shipped",
  });

  return { ok: true, summary };
}
