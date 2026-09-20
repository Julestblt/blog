# Building a private-first homelab for apps and AI agents

> **TL;DR** — My homelab is a small Debian server that runs my applications, deployment platform and AI development tooling. Public applications enter through Cloudflare Tunnel, administration stays behind Tailscale, Dokploy manages deployments, and a separate agent layer gives Codex and Hermes controlled access to shared projects.

---

## Why I built it

I originally hosted most of my projects on managed platforms. That is convenient, but I wanted a machine I could fully control: deployments, networking, observability, development agents and the boring operational details that managed platforms normally hide.

The result is a small homelab built around a Lenovo ThinkCentre running Debian 13. It is not intended to reproduce a cloud provider at home. The goal is simpler:

- host my own applications;
- keep administration private;
- expose only what actually needs to be public;
- make deployments reproducible;
- give AI agents a useful development environment without giving them an unstructured view of the whole server;
- centralize operational and AI usage metrics.

The interesting part ended up being less Docker itself and more the boundaries between **public traffic, private administration, deployment automation and autonomous agents**.

---

## Architecture at a glance

The platform can be thought of as four layers.

### Public delivery

Public applications such as my portfolio, Veloce and this Retype blog are deployed by Dokploy and routed internally by Traefik.

I do **not** rely on inbound port forwarding from my router. A Cloudflare Tunnel initiated by the server provides the public path:

```text
Internet
   |
Cloudflare DNS / HTTPS
   |
Cloudflare Tunnel
   |
cloudflared
   |
Traefik
   |
Application containers
```

Cloudflare terminates the public side while `cloudflared` maintains an outbound tunnel from the homelab. Traefik still performs application routing using the requested hostname.

### Private administration

The control plane is deliberately different:

```text
Laptop
   |
Tailscale
   |
   +-- SSH
   |
   +-- Dokploy dashboard
```

Dokploy does not need to be an Internet-facing administration panel. SSH does not either. Both are reachable through my tailnet.

This distinction — **public data plane, private control plane** — is one of the most important decisions in the setup.

### Deployment

GitHub remains the source of truth for application code. Dokploy pulls and deploys projects, while a narrowly exposed webhook endpoint allows GitHub to trigger deployments.

For this blog, Retype is built by GitHub Actions and the generated static site is published to a dedicated branch. Dokploy serves that output with Nginx.

### AI development

The server is also becoming an agentic development environment.

Codex is my interactive development agent, while Hermes is used for more autonomous tasks. OpenCode Go can act as a model provider. Both agents work against a shared project area under:

```text
/srv/projects
```

The idea is that an agent can enter a project, inspect it, edit files, run commands and tests, then commit and push through Git rather than manipulating deployed containers directly.

A custom gateway provides a common surface for Hermes and for observability data such as server metrics and AI usage.

---

## Why `/srv/projects` matters

Giving agents arbitrary access to a server is easy. Giving them a **useful boundary** is more interesting.

I use `/srv/projects` as the workspace containing repositories agents are allowed to operate on:

```text
/srv/projects/
├── project-a/
├── project-b/
└── ...
```

A typical workflow becomes:

```text
Task
  -> Codex or Hermes
  -> /srv/projects/<repository>
  -> edit / test / build
  -> git commit
  -> git push
  -> GitHub
  -> Dokploy deployment
```

This also makes the Git repository the hand-off point between development automation and production deployment.

A minimal setup looks like:

```bash
sudo mkdir -p /srv/projects
sudo chown -R <agent-user>:<agent-group> /srv/projects
sudo chmod 750 /srv/projects

cd /srv/projects
git clone git@github.com:<owner>/<repository>.git
```

The exact permissions should be adapted to the users running the agents. I prefer granting access to this workspace explicitly instead of making the agent user broadly privileged.

---

## The custom gateway

I wanted one API surface instead of several unrelated local endpoints.

The gateway aggregates:

- access to Hermes;
- server health and resource metrics;
- Codex usage/activity;
- OpenCode model/token usage;
- agent status and related telemetry.

Conceptually:

```text
Server metrics ----+
Codex usage -------+
OpenCode usage ----+--> Custom Gateway --> client/dashboard
Hermes ------------+
```

This makes it possible to build a single dashboard without coupling the frontend to the implementation details of every tool.

The gateway itself is treated as infrastructure. Authentication and exposure are separate concerns from the applications it fronts; an endpoint existing locally does not imply it should be reachable from the public Internet.

---

## Rebuilding the core

This is not a complete bootstrap script, but these are the main pieces I would need after a clean Debian installation.

### Docker

```bash
sudo apt update
sudo apt install -y ca-certificates curl git
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
```

Log out and back in before using the Docker group.

### Tailscale

Install Tailscale using its current Debian instructions, authenticate the machine, then verify:

```bash
tailscale status
tailscale ip
```

The important design decision is not the install command: it is that administrative services are addressed through Tailscale rather than opened on the router.

### Cloudflare Tunnel

After installing `cloudflared`, create/login to a tunnel and keep its configuration in a root-controlled location such as:

```text
/etc/cloudflared/config.yml
```

A simplified ingress configuration looks like:

```yaml
ingress:
  - hostname: app.example.com
    service: http://127.0.0.1:80
    originRequest:
      httpHostHeader: app.example.com

  - hostname: blog.example.com
    service: http://127.0.0.1:80
    originRequest:
      httpHostHeader: blog.example.com

  - service: http_status:404
```

Validate before restarting:

```bash
cloudflared tunnel --config /etc/cloudflared/config.yml ingress validate
sudo systemctl restart cloudflared
sudo systemctl status cloudflared --no-pager
```

The final catch-all is intentional: an unknown hostname should not accidentally expose another local service.

### Dokploy and Traefik

Dokploy manages the application lifecycle while Traefik is the reverse proxy used for hostname routing.

Useful checks:

```bash
docker ps
docker service ls
docker network ls
```

To test a Traefik route without depending on external DNS:

```bash
curl -I -H "Host: app.example.com" http://127.0.0.1/
```

That command became one of the most useful debugging tools in the whole setup.

---

## What I learned

The hardest problems were rarely "is the container running?". They were usually about **which layer owned the failure**.

A request can cross DNS, Cloudflare, a tunnel, Traefik, a Docker network and finally an application. Debugging became much easier once I started validating the path one hop at a time.

The other major lesson was exposure. Installing a dashboard is trivial. Deciding whether that dashboard should be publicly routable is an architecture decision.

My current rule is straightforward:

**applications may be public; administration is private by default.**

That rule shaped the rest of the homelab, including how GitHub webhooks and AI agents are integrated.

---

## Next

The next articles go deeper into two parts of this setup:

- how I combined Cloudflare Tunnel, Tailscale, Traefik and Dokploy without exposing the control plane;
- how Codex, Hermes, OpenCode Go and `/srv/projects` turn the same machine into an agentic development environment.
