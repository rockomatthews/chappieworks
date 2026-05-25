import { Octokit } from "@octokit/rest";
import { writeSite, type SiteRecord } from "./sites";

const ORG = "Chappieworks-sites";

const NEXT_CONFIG = `/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
`;

const PACKAGE_JSON = (name: string) =>
  JSON.stringify(
    {
      name,
      version: "0.1.0",
      private: true,
      scripts: { dev: "next dev", build: "next build", start: "next start" },
      dependencies: { next: "15.3.2", react: "19.0.0", "react-dom": "19.0.0" },
      devDependencies: {
        "@types/node": "^22",
        "@types/react": "^19",
        "@types/react-dom": "^19",
        typescript: "^5",
      },
    },
    null,
    2,
  );

const TSCONFIG = JSON.stringify(
  {
    compilerOptions: {
      target: "ES2017",
      lib: ["dom", "dom.iterable", "esnext"],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: "esnext",
      moduleResolution: "bundler",
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: "preserve",
      incremental: true,
      plugins: [{ name: "next" }],
      paths: { "@/*": ["./src/*"] },
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"],
  },
  null,
  2,
);

const HOME_PAGE = (businessName: string) =>
  `export default function Home() {
  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>${businessName}</h1>
      <p>Site coming soon.</p>
    </main>
  );
}
`;

const LAYOUT = (businessName: string) =>
  `import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "${businessName}",
  description: "Built by Chappie Works.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;

const GITIGNORE = `# deps
/node_modules
/.pnp
.pnp.js

# next.js
/.next/
/out/

# env
.env
.env*.local

# misc
.DS_Store
*.pem
`;

function b64(str: string) {
  return Buffer.from(str, "utf-8").toString("base64");
}

async function createRepoWithScaffold(
  octokit: Octokit,
  repoName: string,
  businessName: string,
): Promise<string> {
  await octokit.repos.createInOrg({
    org: ORG,
    name: repoName,
    description: `Chappie Works site — ${businessName}`,
    private: true,
    auto_init: false,
  });

  const files: { path: string; content: string }[] = [
    { path: ".gitignore", content: GITIGNORE },
    { path: "next.config.mjs", content: NEXT_CONFIG },
    { path: "package.json", content: PACKAGE_JSON(repoName) },
    { path: "tsconfig.json", content: TSCONFIG },
    { path: "src/app/page.tsx", content: HOME_PAGE(businessName) },
    { path: "src/app/layout.tsx", content: LAYOUT(businessName) },
  ];

  // GitHub requires at least one commit — use tree API for atomic initial commit
  const { data: ref } = await octokit.git.createRef({
    owner: ORG,
    repo: repoName,
    ref: "refs/heads/main",
    sha: await (async () => {
      const blobs = await Promise.all(
        files.map((f) =>
          octokit.git.createBlob({
            owner: ORG,
            repo: repoName,
            content: b64(f.content),
            encoding: "base64",
          }),
        ),
      );
      const { data: tree } = await octokit.git.createTree({
        owner: ORG,
        repo: repoName,
        tree: files.map((f, i) => ({
          path: f.path,
          mode: "100644",
          type: "blob",
          sha: blobs[i].data.sha,
        })),
      });
      const { data: commit } = await octokit.git.createCommit({
        owner: ORG,
        repo: repoName,
        message: "chore: scaffold Next.js site",
        tree: tree.sha,
        parents: [],
      });
      return commit.sha;
    })(),
  });

  return ref.object.sha;
}

async function linkVercelProject(
  repoName: string,
  businessName: string,
): Promise<{ projectId: string; url: string } | null> {
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    console.warn("[siteProvision] VERCEL_TOKEN not set — skipping Vercel link");
    return null;
  }

  const res = await fetch("https://api.vercel.com/v10/projects", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: repoName,
      framework: "nextjs",
      gitRepository: {
        type: "github",
        repo: `${ORG}/${repoName}`,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[siteProvision] Vercel create project failed", res.status, text);
    return null;
  }

  const data = (await res.json()) as { id: string; name: string };
  return {
    projectId: data.id,
    url: `${data.name}.vercel.app`,
  };
}

export async function provisionRepo(site: SiteRecord): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("[siteProvision] GITHUB_TOKEN not set — cannot provision repo");
    return;
  }

  const octokit = new Octokit({ auth: token });
  const repoName = `${site.slug}`;

  try {
    console.log("[siteProvision] creating repo", `${ORG}/${repoName}`);
    await createRepoWithScaffold(octokit, repoName, site.businessName);

    const vercel = await linkVercelProject(repoName, site.businessName);

    const updated: SiteRecord = {
      ...site,
      githubRepo: `${ORG}/${repoName}`,
      vercelProjectId: vercel?.projectId,
      vercelUrl: vercel?.url,
    };
    await writeSite(updated);

    console.log(
      "[siteProvision] provisioned",
      updated.githubRepo,
      vercel ? `→ ${vercel.url}` : "(no Vercel)",
    );
  } catch (err) {
    console.error("[siteProvision] failed for", site.slug, err);
  }
}
