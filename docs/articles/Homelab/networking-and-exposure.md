# Public apps, private control plane: networking a Dokploy homelab

Running an application at home is easy until it has to be reachable from the Internet.

My first instinct was to treat the homelab like a small VPS: expose ports, point DNS at it and let the reverse proxy handle the rest. In practice I wanted a different security model, especially because the same server also runs Dokploy, SSH and development agents.

The final design uses **Cloudflare Tunnel for public applications** and **Tailscale for private administration**.

---

## The two network planes

The public path is:

```text
Internet
   |
Cloudflare
   |
Cloudflare Tunnel
   |
127.0.0.1:80
   |
Traefik
   |
Application
```

The private path is:

```text
My devices
   |
Tailscale
   |
Homelab
   +-- SSH
   +-- Dokploy
   +-- private services
```

This avoids making the Dokploy dashboard public just because the applications managed by Dokploy are public.

---

## Why not expose Dokploy?

Dokploy is part of the control plane. It can deploy applications and therefore has considerably more authority than a normal frontend.

There is little value in making its dashboard globally reachable when I only administer it from my own devices.

Tailscale gives those devices a private network path. A custom domain can still resolve to the server's Tailscale address if desired, but it remains unreachable to normal Internet clients.

The same logic applies to SSH.

---

## Public applications with Cloudflare Tunnel

`cloudflared` runs on the homelab and initiates the connection to Cloudflare. No inbound NAT rule is required on my router.

A reduced configuration:

```yaml
tunnel: <tunnel-id>
credentials-file: /root/.cloudflared/<tunnel-id>.json

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

The `httpHostHeader` is important in this architecture because Traefik routes applications by hostname.

Before restarting the daemon I validate the file:

```bash
cloudflared tunnel --config /etc/cloudflared/config.yml ingress validate
```

I can also see which ingress rule would match:

```bash
cloudflared tunnel --config /etc/cloudflared/config.yml \
  ingress rule https://app.example.com/
```

Then:

```bash
sudo systemctl restart cloudflared
sudo systemctl status cloudflared --no-pager
```

---

## The GitHub webhook problem

Private administration created one interesting problem: GitHub cannot call an endpoint that only exists inside my Tailscale network.

Making all of Dokploy public just to receive a webhook would defeat the design.

Instead I created a dedicated public hostname and allow only the deployment endpoint through the Cloudflare Tunnel:

```yaml
- hostname: deploy.example.com
  path: ^/api/deploy/[^/]+/?$
  service: http://127.0.0.1:3000

- service: http_status:404
```

The exact hostname and identifiers are intentionally omitted here.

The result is:

```text
GitHub
  |
  | only deployment webhook path
  v
Cloudflare Tunnel
  |
  v
Dokploy webhook endpoint

Internet --X--> Dokploy dashboard
```

This is much narrower than publishing the entire administration interface.

A useful test is to check that an unrelated path returns 404 while the configured webhook route reaches the application.

---

## Debugging 502s

One issue I hit while deploying a static Retype site was a classic `502 Bad Gateway`.

Traefik was routing to port `3000`:

```yaml
servers:
  - url: http://blog-frontend:3000
```

but the static Nginx container listened on port `80`.

The container itself was healthy:

```bash
docker ps
docker logs --tail 100 <container>
```

From inside Traefik I could reach Nginx:

```bash
docker exec <traefik-container> \
  wget -S -O /dev/null http://<service>:80/ 2>&1
```

The fix was simply to configure the Dokploy domain with container port `80`.

The best local test was:

```bash
curl -I -H "Host: blog.example.com" http://127.0.0.1/
```

If that returns `200`, Traefik and the application route are working before Cloudflare or public DNS are even involved.

---

## Static sites and Dokploy

Retype generates a static site. My existing GitHub Action builds it:

```yaml
- name: Install Retype CLI
  run: npm install -g retypeapp

- name: Build site
  run: retype build
```

The generated output is published to a dedicated branch and Dokploy serves that static artifact through Nginx.

One failure mode was accidentally deploying the source branch instead of the generated branch. The container then contained files such as `retype.yml` and Markdown sources but no generated `index.html`; Nginx consequently served its default welcome page.

When debugging a static deployment, inspect what Nginx is actually serving:

```bash
docker exec <container> ls -lah /usr/share/nginx/html
docker exec <container> head -20 /usr/share/nginx/html/index.html
```

---

## Useful recovery checklist

When a public application stops working, I now check layers in this order:

1. Is the application/container running?
2. Can Traefik reach the service on its actual container port?
3. Does `curl -H "Host: ..."` against localhost return the application?
4. Does the Cloudflare ingress rule match the hostname?
5. Is `cloudflared` running?
6. Does public DNS point to the tunnel?

Commands I use frequently:

```bash
docker ps
docker service ls
docker network ls

sudo systemctl status cloudflared --no-pager
journalctl -u cloudflared -n 100 --no-pager

cloudflared tunnel --config /etc/cloudflared/config.yml ingress validate

curl -I -H "Host: app.example.com" http://127.0.0.1/
curl -I https://app.example.com
```

This hop-by-hop approach is considerably more useful than repeatedly redeploying a healthy container.

---

## The rule I keep

The architecture can be summarized in one sentence:

> **Expose workloads, not the control plane.**

Cloudflare Tunnel handles things that are supposed to be public. Tailscale handles things that are supposed to be mine.

Dokploy and Traefik sit between those worlds, but they do not require the same exposure.
