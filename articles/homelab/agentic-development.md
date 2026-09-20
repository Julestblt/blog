# Turning my homelab into an AI development environment

My homelab started as a place to deploy applications. It gradually became something more interesting: a development environment where AI agents can work on real repositories, run tools and ship changes through the same Git workflow I use manually.

The main pieces are **Codex**, **Hermes Agent**, **OpenCode Go**, a shared `/srv/projects` workspace and a custom gateway for agent access and metrics.

---

## Two agents, different jobs

I do not treat every agent as interchangeable.

**Codex CLI** is primarily my interactive development agent. I launch it inside a project when I want an agent to inspect the repository, implement something, run tests and iterate with me.

**Hermes Agent** is aimed at more autonomous server-side workflows. It has access to tools such as terminal/process operations, file operations, code execution, browser automation and web tooling.

Both can use external model infrastructure; OpenCode Go is one of the providers I use for model inference.

Conceptually:

```text
Developer
   |
   +--> Codex --------+
   |                  |
   +--> Hermes -------+--> Model provider
          |
          +--> tools / terminal / files
```

The useful part is not simply having two AI CLIs installed. It is connecting them to a controlled project workspace and a normal delivery workflow.

---

## A shared workspace: `/srv/projects`

Projects intended for agent work live under:

```text
/srv/projects
```

For example:

```text
/srv/projects/
├── veloce/
├── portfolio/
├── blog/
└── ...
```

That gives the agents a predictable place to operate.

A basic setup:

```bash
sudo mkdir -p /srv/projects
sudo chown <agent-user>:<agent-group> /srv/projects
sudo chmod 750 /srv/projects
```

Repositories can then be cloned normally:

```bash
cd /srv/projects
git clone git@github.com:<owner>/<repo>.git
```

I configure Git/SSH for the identity that should be allowed to push. I do **not** put private keys, provider tokens or credentials inside repositories.

The workflow is then intentionally boring:

```text
Agent receives task
       |
       v
/srv/projects/repository
       |
 inspect / edit / test
       |
       v
   git commit
       |
       v
    git push
       |
       v
     GitHub
       |
       v
     Dokploy
       |
       v
   application
```

That is a feature. Production deployment remains downstream of Git rather than allowing an agent to mutate a running application as the primary workflow.

---

## Codex and OpenCode Go

Codex can be configured with a custom model provider. The provider configuration belongs in the local Codex configuration rather than the repository.

A sanitized example:

```toml
[model_providers.opencode]
name = "OpenCode Go"
base_url = "<provider-api-base>"
env_key = "OPENCODE_API_KEY"
requires_openai_auth = false
```

Then keep the credential outside source control:

```bash
export OPENCODE_API_KEY="<token>"
chmod 600 ~/.codex/config.toml
```

Provider compatibility depends on the API exposed by the selected model, so I keep this layer replaceable instead of baking one model into the project.

---

## Hermes as the autonomous side

Hermes runs on the homelab and is configured with the tools it needs for development and operations.

My setup focuses on:

- terminal and process access;
- file operations;
- code execution;
- browser automation;
- web search/scraping;
- vision when useful;
- task planning.

I deliberately started from a minimal configuration and enabled capabilities as they became useful.

The important security boundary is again the environment around the agent: filesystem permissions, Git credentials, network exposure and which commands/services the agent can reach matter more than the prompt saying "be careful".

---

## One gateway for agents and observability

I built a custom gateway to avoid exposing a collection of unrelated internal endpoints.

It acts as a unified API for the pieces I want to consume elsewhere:

```text
                 +-- server metrics
                 |
Client --> Gateway +-- Codex usage/activity
                 |
                 +-- OpenCode model/token usage
                 |
                 +-- Hermes agent endpoint/status
```

This lets a dashboard ask one service for infrastructure and AI usage information.

Metrics I care about include:

- CPU, memory, disk and service health;
- Codex activity/usage;
- OpenCode model and token usage;
- Hermes status and usage.

The gateway is also a useful abstraction boundary. If the implementation of one metric source changes, clients do not need to know.

---

## Running the gateway safely

I prefer binding internal services to localhost or a private interface first:

```text
127.0.0.1:<port>
```

Then I decide explicitly how a consumer reaches them:

- Tailscale for private clients;
- a narrowly scoped Cloudflare Tunnel rule if something genuinely needs public access;
- no exposure at all for purely local integrations.

Useful checks:

```bash
ss -lntp
tailscale status
docker ps
systemctl --type=service --state=running
```

The goal is to avoid accidentally turning "I made an API" into "I published an administration API to the Internet".

---

## Recreating the agent workspace

After a fresh server install, the high-level recovery sequence is:

```bash
# Workspace
sudo mkdir -p /srv/projects
sudo chown <agent-user>:<agent-group> /srv/projects
sudo chmod 750 /srv/projects

# Git
sudo apt update
sudo apt install -y git openssh-client

# Verify repository access
ssh -T git@github.com

# Restore projects
cd /srv/projects
git clone git@github.com:<owner>/<repo>.git

# Verify the network/control plane
tailscale status
docker ps
sudo systemctl status cloudflared --no-pager
```

Codex and Hermes can then be installed/configured independently and pointed at the workspace.

Secrets should be restored from the chosen secret store or environment configuration rather than copied into documentation or Git.

---

## Why this architecture is useful

The homelab now has a feedback loop:

```text
observe
   |
   v
agent reasons
   |
   v
edit project
   |
   v
test
   |
   v
commit / push
   |
   v
deploy
   |
   v
observe
```

That is much more interesting to me than simply running an LLM on a server.

The model is replaceable. The durable part is the surrounding system: repositories, permissions, tools, deployment pipeline, networking and telemetry.

It also keeps a clear boundary between **development autonomy** and **production authority**. Agents can be productive inside projects while GitHub and Dokploy remain the normal route to deployment.
