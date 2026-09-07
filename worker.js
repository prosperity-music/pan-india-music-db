/**
 * Cloudflare Worker Handler for Pan-India Music DB Auto-Sync
 * 
 * Target Worker: prosperity-worker (or prosperity-auth-worker)
 * Route: POST /api/pan-india/submit
 * 
 * Required Secrets in Cloudflare Worker Dashboard (Settings -> Variables):
 * - GITHUB_TOKEN: GitHub Personal Access Token with 'Contents: Read and Write' permission.
 * 
 * Optional Environment Variables:
 * - GITHUB_REPO_OWNER: 'prosperity-music' (default)
 * - GITHUB_REPO_NAME: 'pan-india-music-db' (default)
 * - GITHUB_BRANCH: 'main' (default)
 */

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    const url = new URL(request.url);

    // Route matching for Pan India DB sync
    if (url.pathname === "/api/pan-india/submit" || url.pathname === "/pan-india/submit") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed. Use POST." }), {
          status: 405,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      try {
        const body = await request.json();
        const movieSlug = body.movie_slug;
        const content = body.content;

        if (!movieSlug || !content) {
          return new Response(JSON.stringify({ error: "Missing 'movie_slug' or 'content' in request body." }), {
            status: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          });
        }

        const owner = env.GITHUB_REPO_OWNER || "prosperity-music";
        const repo = env.GITHUB_REPO_NAME || "pan-india-music-db";
        const branch = env.GITHUB_BRANCH || "main";
        const token = env.GITHUB_TOKEN;

        if (!token) {
          return new Response(JSON.stringify({ 
            error: "GITHUB_TOKEN secret is not configured in Cloudflare Worker." 
          }), {
            status: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          });
        }

        const filePath = `movies/${movieSlug}.json`;
        const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

        // 1. Check if the file already exists on GitHub to get its SHA
        let existingSha = null;
        let existingData = null;

        const getRes = await fetch(`${githubApiUrl}?ref=${branch}`, {
          headers: {
            "User-Agent": "Cloudflare-Worker-Prosperity-Music",
            "Authorization": `Bearer ${token}`,
            "Accept": "application/vnd.github.v3+json",
          },
        });

        if (getRes.status === 200) {
          const fileData = await getRes.json();
          existingSha = fileData.sha;
          try {
            // Decode existing JSON content
            const decoded = atob(fileData.content.replace(/\s/g, ""));
            existingData = JSON.parse(decoded);
          } catch (e) {
            console.error("Failed to decode existing content", e);
          }
        }

        // 2. Merge existing data with incoming data cleanly supporting Arrays
        let mergedContent = content;
        if (existingData && existingData.songs && content.songs) {
          const existingList = Array.isArray(existingData.songs)
            ? existingData.songs
            : Object.values(existingData.songs);
          const incomingList = Array.isArray(content.songs)
            ? content.songs
            : Object.values(content.songs);

          const toCleanKey = (str) => {
            if (!str) return '';
            return str
              .toLowerCase()
              .replace(/[\(\[\{]?(?:from|film|movie)\s+["'‘“]?[^"'’”\)\]\}]+["'’”]?[\)\]\}]?/gi, ' ')
              .replace(/[\(\[\{]\s*(?:telugu|tamil|hindi|kannada|malayalam|punjabi|bengali|marathi|bhojpuri|gujarati|english|odia)\b[^\)\]\}]*[\)\]\}]/gi, ' ')
              .replace(/[^a-z0-9]+/g, '_')
              .replace(/_+/g, '_')
              .replace(/^_+|_+$/g, '');
          };

          const songMap = new Map();
          for (const s of existingList) {
            const key = toCleanKey(s.canonical_title || s.slug || '');
            if (key) songMap.set(key, s);
          }

          for (const s of incomingList) {
            const key = toCleanKey(s.canonical_title || s.slug || '');
            if (!key) continue;
            if (!songMap.has(key)) {
              songMap.set(key, s);
            } else {
              const existingSong = songMap.get(key);
              const mergedVers = { ...(existingSong.versions || {}) };
              for (const [lang, vData] of Object.entries(s.versions || {})) {
                if (!mergedVers[lang]) {
                  mergedVers[lang] = vData;
                } else {
                  const ev = mergedVers[lang];
                  const existingId = (ev.id || '').replace(/^jio_/, '').trim();
                  const incomingId = (vData.id || '').replace(/^jio_/, '').trim();
                  const altIds = new Set((ev.alt_ids || []).map(x => String(x).replace(/^jio_/, '').trim()));
                  if (vData.alt_ids && Array.isArray(vData.alt_ids)) {
                    vData.alt_ids.forEach(x => altIds.add(String(x).replace(/^jio_/, '').trim()));
                  }
                  if (existingId && existingId !== incomingId) {
                    altIds.add(existingId);
                  }
                  if (incomingId) {
                    altIds.delete(incomingId);
                  }
                  const altArray = Array.from(altIds).filter(Boolean);
                  mergedVers[lang] = {
                    ...ev,
                    ...vData,
                  };
                  if (altArray.length > 0) {
                    mergedVers[lang].alt_ids = altArray;
                  } else {
                    delete mergedVers[lang].alt_ids;
                  }
                  if (vData.canvas_url || ev.canvas_url) {
                    mergedVers[lang].canvas_url = vData.canvas_url || ev.canvas_url;
                  }
                }
              }
              songMap.set(key, {
                ...existingSong,
                ...s,
                slug: key,
                canonical_title: existingSong.canonical_title || s.canonical_title || key,
                versions: mergedVers,
              });
            }
          }

          const allSongs = Array.from(songMap.values());
          const allLangs = new Set();
          for (const s of allSongs) {
            for (const l of Object.keys(s.versions || {})) {
              allLangs.add(l.toLowerCase().trim());
            }
          }

          mergedContent = {
            ...existingData,
            ...content,
            songs: allSongs,
            languages: Array.from(allLangs),
            updated_at: new Date().toISOString(),
          };
        }

        const jsonString = JSON.stringify(mergedContent, null, 2);
        // Base64 encode for GitHub API (supporting UTF-8 characters)
        const base64Content = btoa(unescape(encodeURIComponent(jsonString)));

        // 3. Commit the file to GitHub repository
        const commitPayload = {
          message: `chore: update pan-india db for ${movieSlug}`,
          content: base64Content,
          branch: branch,
        };
        if (existingSha) {
          commitPayload.sha = existingSha;
        }

        const putRes = await fetch(githubApiUrl, {
          method: "PUT",
          headers: {
            "User-Agent": "Cloudflare-Worker-Prosperity-Music",
            "Authorization": `Bearer ${token}`,
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(commitPayload),
        });

        if (!putRes.ok) {
          const errText = await putRes.text();
          return new Response(JSON.stringify({ 
            error: "Failed to commit file to GitHub", 
            details: errText 
          }), {
            status: putRes.status,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          });
        }

        // 4. Purge jsDelivr cache for this file and root so it updates globally instantly!
        const purgeUrls = [
          `https://purge.jsdelivr.net/gh/${owner}/${repo}@${branch}/${filePath}`,
          `https://purge.jsdelivr.net/gh/${owner}/${repo}@${branch}/`,
        ];
        for (const pUrl of purgeUrls) {
          try {
            await fetch(pUrl);
          } catch (e) {}
        }

        return new Response(JSON.stringify({
          success: true,
          message: `Successfully synced ${filePath} to GitHub and purged jsDelivr cache!`,
          movie_slug: movieSlug,
          jsdelivr_url: `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${filePath}`,
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
    }

    // Default response for unmatched routes
    return new Response(JSON.stringify({ status: "prosperity-worker online" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};
