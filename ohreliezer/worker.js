// Mekomos Journey API - Cloudflare Worker with D1
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // GET /api/rsvps - Get all RSVPs
      if (path === '/api/rsvps' && request.method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM rsvps').all();
        return jsonResponse(results);
      }

      // POST /api/rsvps - Create/update RSVP
      if (path === '/api/rsvps' && request.method === 'POST') {
        const { uid, name, initials, status } = await request.json();
        if (!uid || !name || !status) {
          return jsonResponse({ error: 'Missing required fields' }, 400);
        }
        await env.DB.prepare(
          'INSERT OR REPLACE INTO rsvps (uid, name, initials, status, updated_at) VALUES (?, ?, ?, ?, datetime("now"))'
        ).bind(uid, name, initials, status).run();
        return jsonResponse({ success: true });
      }

      // DELETE /api/rsvps/:uid - Delete RSVP
      if (path.startsWith('/api/rsvps/') && request.method === 'DELETE') {
        const uid = path.split('/')[3];
        if (!uid) {
          return jsonResponse({ error: 'Missing uid' }, 400);
        }
        await env.DB.prepare('DELETE FROM rsvps WHERE uid = ?').bind(uid).run();
        return jsonResponse({ success: true });
      }

      // GET /api/users/:uid - Get user profile
      if (path.startsWith('/api/users/') && request.method === 'GET') {
        const uid = path.split('/')[3];
        if (!uid) {
          return jsonResponse({ error: 'Missing uid' }, 400);
        }
        const { results } = await env.DB.prepare('SELECT * FROM users WHERE uid = ?').bind(uid).all();
        return jsonResponse(results[0] || null);
      }

      // POST /api/users - Create/update user
      if (path === '/api/users' && request.method === 'POST') {
        const { uid, name } = await request.json();
        if (!uid || !name) {
          return jsonResponse({ error: 'Missing required fields' }, 400);
        }
        // Preserve is_admin status if user exists
        const existing = await env.DB.prepare('SELECT is_admin FROM users WHERE uid = ?').bind(uid).first();
        const isAdmin = existing ? existing.is_admin : 0;
        await env.DB.prepare(
          'INSERT OR REPLACE INTO users (uid, name, is_admin, created_at) VALUES (?, ?, ?, datetime("now"))'
        ).bind(uid, name, isAdmin).run();
        return jsonResponse({ success: true });
      }

      // POST /api/users/:uid/admin - Set admin status (for setup)
      if (path.match(/^\/api\/users\/[^/]+\/admin$/) && request.method === 'POST') {
        const uid = path.split('/')[3];
        const { is_admin } = await request.json();
        await env.DB.prepare('UPDATE users SET is_admin = ? WHERE uid = ?').bind(is_admin ? 1 : 0, uid).run();
        return jsonResponse({ success: true });
      }

      // GET /api/checklist/:uid - Get user's checked items
      if (path.match(/^\/api\/checklist\/[^/]+$/) && request.method === 'GET') {
        const uid = path.split('/')[3];
        if (!uid) return jsonResponse({ error: 'Missing uid' }, 400);
        // Auto-create table if needed
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS checklist (
            uid TEXT NOT NULL,
            item_id TEXT NOT NULL,
            checked INTEGER DEFAULT 0,
            PRIMARY KEY (uid, item_id)
          )
        `).run();
        const { results } = await env.DB.prepare(
          'SELECT item_id, checked FROM checklist WHERE uid = ?'
        ).bind(uid).all();
        return jsonResponse(results);
      }

      // POST /api/checklist - Save checklist item state
      if (path === '/api/checklist' && request.method === 'POST') {
        const { uid, item_id, checked } = await request.json();
        if (!uid || !item_id) return jsonResponse({ error: 'Missing required fields' }, 400);
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS checklist (
            uid TEXT NOT NULL,
            item_id TEXT NOT NULL,
            checked INTEGER DEFAULT 0,
            PRIMARY KEY (uid, item_id)
          )
        `).run();
        await env.DB.prepare(
          'INSERT OR REPLACE INTO checklist (uid, item_id, checked) VALUES (?, ?, ?)'
        ).bind(uid, item_id, checked ? 1 : 0).run();
        return jsonResponse({ success: true });
      }

      // GET /api/custom-items/:uid - Get user's custom packing items
      if (path.match(/^\/api\/custom-items\/[^/]+$/) && request.method === 'GET') {
        const uid = path.split('/')[3];
        if (!uid) return jsonResponse({ error: 'Missing uid' }, 400);
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS custom_items (
            uid TEXT NOT NULL,
            item_id TEXT NOT NULL,
            label TEXT NOT NULL,
            section_id TEXT NOT NULL,
            PRIMARY KEY (uid, item_id)
          )
        `).run();
        const { results } = await env.DB.prepare(
          'SELECT item_id, label, section_id FROM custom_items WHERE uid = ?'
        ).bind(uid).all();
        return jsonResponse(results);
      }

      // POST /api/custom-items - Add a custom packing item
      if (path === '/api/custom-items' && request.method === 'POST') {
        const { uid, item_id, label, section_id } = await request.json();
        if (!uid || !item_id || !label || !section_id) return jsonResponse({ error: 'Missing required fields' }, 400);
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS custom_items (
            uid TEXT NOT NULL,
            item_id TEXT NOT NULL,
            label TEXT NOT NULL,
            section_id TEXT NOT NULL,
            PRIMARY KEY (uid, item_id)
          )
        `).run();
        await env.DB.prepare(
          'INSERT OR REPLACE INTO custom_items (uid, item_id, label, section_id) VALUES (?, ?, ?, ?)'
        ).bind(uid, item_id, label, section_id).run();
        return jsonResponse({ success: true });
      }

      // DELETE /api/custom-items/:uid/:item_id - Remove a custom packing item
      if (path.match(/^\/api\/custom-items\/[^/]+\/[^/]+$/) && request.method === 'DELETE') {
        const parts = path.split('/');
        const uid = parts[3];
        const item_id = decodeURIComponent(parts[4]);
        if (!uid || !item_id) return jsonResponse({ error: 'Missing required fields' }, 400);
        await env.DB.prepare('DELETE FROM custom_items WHERE uid = ? AND item_id = ?').bind(uid, item_id).run();
        // Also remove checked state for this item
        await env.DB.prepare('DELETE FROM checklist WHERE uid = ? AND item_id = ?').bind(uid, item_id).run();
        return jsonResponse({ success: true });
      }

      // Helper: ensure comments table has all columns
      async function ensureCommentsTable(db) {
        await db.prepare(`CREATE TABLE IF NOT EXISTS comments (id TEXT PRIMARY KEY, uid TEXT NOT NULL, user_name TEXT NOT NULL, comment_text TEXT NOT NULL, created_at TEXT NOT NULL)`).run();
        try { await db.prepare(`ALTER TABLE comments ADD COLUMN reply_to TEXT`).run(); } catch(e) {}
        try { await db.prepare(`ALTER TABLE comments ADD COLUMN edited_at TEXT`).run(); } catch(e) {}
      }

      // GET /api/comments - Get all comments
      if (path === '/api/comments' && request.method === 'GET') {
        await ensureCommentsTable(env.DB);
        const { results } = await env.DB.prepare('SELECT * FROM comments ORDER BY created_at DESC').all();
        return jsonResponse(results);
      }

      // POST /api/comments - Create a new comment
      if (path === '/api/comments' && request.method === 'POST') {
        const { id, uid, user_name, comment_text, reply_to } = await request.json();
        if (!id || !uid || !user_name || !comment_text) {
          return jsonResponse({ error: 'Missing required fields' }, 400);
        }
        await ensureCommentsTable(env.DB);
        await env.DB.prepare(
          'INSERT INTO comments (id, uid, user_name, comment_text, reply_to, created_at) VALUES (?, ?, ?, ?, ?, datetime("now"))'
        ).bind(id, uid, user_name, comment_text, reply_to || null).run();
        return jsonResponse({ success: true });
      }

      // PUT /api/comments/:id - Edit a comment
      if (path.match(/^\/api\/comments\/[^/]+$/) && request.method === 'PUT') {
        const id = decodeURIComponent(path.split('/')[3]);
        const { uid, comment_text } = await request.json();
        if (!id || !uid || !comment_text) return jsonResponse({ error: 'Missing fields' }, 400);
        await ensureCommentsTable(env.DB);
        const existing = await env.DB.prepare('SELECT uid FROM comments WHERE id = ?').bind(id).first();
        if (!existing) return jsonResponse({ error: 'Comment not found' }, 404);
        if (existing.uid !== uid) return jsonResponse({ error: 'Not authorized' }, 403);
        await env.DB.prepare('UPDATE comments SET comment_text = ?, edited_at = datetime("now") WHERE id = ?').bind(comment_text, id).run();
        return jsonResponse({ success: true });
      }

      // DELETE /api/comments/:id - Delete a comment
      if (path.match(/^\/api\/comments\/[^/]+$/) && request.method === 'DELETE') {
        const id = decodeURIComponent(path.split('/')[3]);
        if (!id) return jsonResponse({ error: 'Missing id' }, 400);
        await env.DB.prepare('DELETE FROM comments WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true });
      }

      // Health check endpoint
      if (path === '/' || path === '/api') {
        return jsonResponse({ status: 'ok', message: 'Mekomos Journey API' });
      }

      return jsonResponse({ error: 'Not Found' }, 404);
    } catch (error) {
      console.error('API Error:', error);
      return jsonResponse({ error: error.message }, 500);
    }
  }
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
