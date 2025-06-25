# Google Dorking Guide

## ⚠️ Legal Notice

> **Google Dorking is legal as long as you're only passively viewing public search results.**

However:

- Accessing, exploiting, or modifying resources **without permission is illegal**
- Always use it within a **bug bounty**, **authorized pentest**, or **your own infrastructure**

---

**Google Dorking**, also known as _Google Hacking_, is the practice of using advanced search operators on Google to extract specific or sensitive information from public web resources.

This technique can reveal:

- Exposed confidential files
- Public admin interfaces
- Leaked credentials
- Misconfigured servers

## Why is Google Dorking powerful?

Because **Google indexes everything** it can access: PDFs, logs, databases, admin panels, backups… If it's public, it can be found.

For example:

```
intitle:"index of" "backup.zip"
```

This will look for directory listings containing a file named `backup.zip`.

## Key Google Operators

| Operator    | Description                     | Example                     |
| ----------- | ------------------------------- | --------------------------- |
| `site:`     | Search within a specific domain | `site:example.com login`    |
| `inurl:`    | Search within the URL           | `inurl:admin`               |
| `intitle:`  | Search in the page title        | `intitle:"index of"`        |
| `filetype:` | Search for specific file types  | `filetype:pdf confidential` |
| `intext:`   | Search in the body text         | `intext:"password"`         |
| `ext:`      | Same as `filetype:`             | `ext:sql`                   |
| `-`         | Exclude a term                  | `login -github`             |
| `"`         | Exact match                     | `"DB_PASSWORD"`             |

## Real-world Dork Examples

- **Exposed environment files:**

```
filetype:env "DB_PASSWORD"
```

- **Admin interfaces:**

```
intitle:"login" inurl:admin
```

- **Open directories:**

```
intitle:"index of" "backup"
```

- **Public logs:**

```
ext:log site:example.com
```

---

## Use my tool

To make dorking easier and more accessible, I built a tool: [**dork.julez.cat**](https://dork.julez.cat)

The code is open-source and available on [GitHub](https://github.com/Julestblt/dork-generator)

### Features:

- Pre-built dorks presets
- Instant query preview
- Search by filetype, keywords, and domain
- Easy copy & paste
- No login, no tracking

## Defensive Measures

If you maintain a website, here’s how to reduce your exposure:

- Block indexing via `robots.txt`:

```
User-agent: *
Disallow: /admin/
Disallow: /config/
Disallow: /backup/
```

> ⚠️ **Note:** While `robots.txt` tells search engines not to index certain paths, it is publicly accessible and can unintentionally expose the structure of your site.  
> For example, listing `/backup/` or `/admin/` in `robots.txt` may reveal sensitive directories to attackers.  
> Avoid disclosing private paths unless strictly necessary, and always combine this with proper access controls (e.g., authentication, IP filtering).

- Never store sensitive credentials in publicly accessible files
- Protect internal folders with strong authentication
- Regularly audit your domain using your own dorks

---

## 📌 Conclusion

**Google Dorking is a powerful recon technique** for both red teamers and defenders.

It allows you to:

- Uncover misconfigurations,
- Reveal exposed assets,
- Audit your own infrastructure.

Always **stay ethical and legal**.

---
