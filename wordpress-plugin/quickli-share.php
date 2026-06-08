<?php
/**
 * Plugin Name: Quickli Share
 * Description: Share Obsidian notes via unlisted WordPress URLs with optional passwords and expiry. Includes vault:// redirect for Discord-clickable Obsidian links.
 * Version: 0.4.0
 * Author: Quickli
 */

if (!defined('ABSPATH')) {
    exit;
}

define('QUICKLI_SHARE_VERSION', '0.4.0');
define('QUICKLI_SHARE_VAULT_SLUG', 'vault');
define('QUICKLI_SHARE_CPT', 'quickli_share');
define('QUICKLI_SHARE_QUERY_VAR', 'quickli_share_token');
define('QUICKLI_SHARE_SLUG', 'q');

define('QUICKLI_SHARE_META_TOKEN', 'quickli_token');
define('QUICKLI_SHARE_META_EXPIRES', 'quickli_expires_at');
define('QUICKLI_SHARE_META_RAW', 'quickli_raw_markdown');
define('QUICKLI_SHARE_META_NOTE_PATH', 'quickli_note_path');
define('QUICKLI_SHARE_META_TYPE', 'quickli_share_type');
define('QUICKLI_SHARE_META_FULL_HTML', 'quickli_full_html');

function quickli_share_register_cpt() {
    $labels = array(
        'name' => 'Quickli Shares',
        'singular_name' => 'Quickli Share',
        'add_new' => 'Add New',
        'add_new_item' => 'Add New Share',
        'edit_item' => 'Edit Share',
        'new_item' => 'New Share',
        'view_item' => 'View Share',
        'search_items' => 'Search Shares',
        'not_found' => 'No shares found',
        'not_found_in_trash' => 'No shares found in Trash',
    );

    register_post_type(QUICKLI_SHARE_CPT, array(
        'labels' => $labels,
        'public' => false,
        'show_ui' => true,
        'show_in_menu' => true,
        'exclude_from_search' => true,
        'publicly_queryable' => false,
        'show_in_rest' => false,
        'supports' => array('title', 'editor', 'author'),
        'rewrite' => false,
    ));
}
add_action('init', 'quickli_share_register_cpt');

function quickli_share_add_rewrite() {
    add_rewrite_rule(
        '^' . QUICKLI_SHARE_SLUG . '/([A-Za-z0-9_-]+)/?$',
        'index.php?' . QUICKLI_SHARE_QUERY_VAR . '=$matches[1]',
        'top'
    );
    // Vault redirect: /vault/{base64_encoded_path} → obsidian:// protocol
    add_rewrite_rule(
        '^' . QUICKLI_SHARE_VAULT_SLUG . '/(.+)$',
        'index.php?quickli_vault_path=$matches[1]',
        'top'
    );
}
add_action('init', 'quickli_share_add_rewrite');

function quickli_share_query_vars($vars) {
    $vars[] = QUICKLI_SHARE_QUERY_VAR;
    $vars[] = 'quickli_vault_path';
    return $vars;
}
add_filter('query_vars', 'quickli_share_query_vars');

function quickli_share_activate() {
    quickli_share_register_cpt();
    quickli_share_add_rewrite();
    flush_rewrite_rules();
    if (!wp_next_scheduled('quickli_share_cleanup')) {
        wp_schedule_event(time() + 3600, 'daily', 'quickli_share_cleanup');
    }
}
register_activation_hook(__FILE__, 'quickli_share_activate');

function quickli_share_deactivate() {
    flush_rewrite_rules();
    wp_clear_scheduled_hook('quickli_share_cleanup');
}
register_deactivation_hook(__FILE__, 'quickli_share_deactivate');

function quickli_share_cleanup_expired() {
    $now = time();
    $query = new WP_Query(array(
        'post_type' => QUICKLI_SHARE_CPT,
        'post_status' => 'any',
        'meta_query' => array(
            array(
                'key' => QUICKLI_SHARE_META_EXPIRES,
                'value' => $now,
                'compare' => '<=',
                'type' => 'NUMERIC',
            ),
        ),
        'fields' => 'ids',
        'posts_per_page' => 200,
        'no_found_rows' => true,
    ));

    if (!empty($query->posts)) {
        foreach ($query->posts as $post_id) {
            wp_delete_post($post_id, true);
        }
    }
}
add_action('quickli_share_cleanup', 'quickli_share_cleanup_expired');

function quickli_share_template_redirect() {
    // Handle vault redirect first
    $vault_path = get_query_var('quickli_vault_path');
    if ($vault_path) {
        quickli_vault_redirect($vault_path);
        exit;
    }

    $token = get_query_var(QUICKLI_SHARE_QUERY_VAR);
    if (!$token) {
        return;
    }

    quickli_share_render_by_token($token);
    exit;
}
add_action('template_redirect', 'quickli_share_template_redirect');

/**
 * Vault Redirect: Renders a page that redirects to obsidian:// protocol.
 * URL format: /vault/{vault_name}/{file_path}
 * Example: /vault/!Vault/Daily/2026/2026-02-06
 * 
 * Security: No data is exposed. The page just triggers a local protocol redirect.
 * The vault path is only meaningful if Obsidian is installed locally with that vault.
 */
function quickli_vault_redirect($raw_path) {
    // Parse: first segment = vault name, rest = file path
    $segments = explode('/', $raw_path, 2);
    $vault = urldecode($segments[0]);
    $file = isset($segments[1]) ? urldecode($segments[1]) : '';

    // Remove .md extension if present (Obsidian doesn't need it)
    $file = preg_replace('/\.md$/', '', $file);

    // Build obsidian:// URI
    $obsidian_uri = 'obsidian://open?' . http_build_query(array(
        'vault' => $vault,
        'file' => $file,
    ));

    // Discard any WordPress output buffers to prevent encoding corruption
    while (ob_get_level()) {
        ob_end_clean();
    }

    // Security + encoding headers
    header('Content-Type: text/html; charset=utf-8', true);
    header('X-Quickli-Vault: v3', true);
    header('X-Robots-Tag: noindex, nofollow, noarchive', true);
    nocache_headers();

    $safe_file = htmlspecialchars(basename($file) ?: $vault, ENT_QUOTES, 'UTF-8');
    $safe_uri = htmlspecialchars($obsidian_uri, ENT_QUOTES, 'UTF-8');
    $safe_vault = htmlspecialchars($vault, ENT_QUOTES, 'UTF-8');
    $safe_path = htmlspecialchars($file, ENT_QUOTES, 'UTF-8');
    // For JS context: JSON-encode the raw URI (produces valid JS string, no HTML entities)
    $js_uri = json_encode($obsidian_uri, JSON_UNESCAPED_SLASHES);

    // Output as a single string to avoid WP output buffer interference
    $html = '<!doctype html>'
        . '<html><head>'
        . '<meta charset="utf-8">'
        . '<meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<meta name="robots" content="noindex, nofollow">'
        . '<title>Open in Obsidian - ' . $safe_file . '</title>'
        . '<style>'
        . 'body{font-family:system-ui,-apple-system,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#1a1a2e;color:#e0e0e0;}'
        . '.card{text-align:center;padding:48px;background:#16213e;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.3);max-width:480px;margin:16px;}'
        . 'h1{font-size:20px;margin:0 0 8px;color:#fff;}'
        . '.path{font-size:13px;color:#888;margin-bottom:24px;word-break:break-all;font-family:ui-monospace,monospace;}'
        . '.btn{display:inline-block;padding:12px 32px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;transition:background 0.2s;border:none;cursor:pointer;}'
        . '.btn:hover{background:#6d28d9;}'
        . '.btn-secondary{background:#374151;margin-left:8px;}'
        . '.btn-secondary:hover{background:#4b5563;}'
        . '.btn-row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}'
        . '.hint{font-size:12px;color:#888;margin-top:20px;line-height:1.6;}'
        . '.troubleshoot{background:#1e293b;border-radius:8px;padding:16px;margin-top:24px;text-align:left;font-size:13px;}'
        . '.troubleshoot-title{font-weight:600;color:#f59e0b;margin-bottom:8px;font-size:14px;}'
        . '.troubleshoot ul{margin:0;padding-left:20px;color:#94a3b8;}'
        . '.troubleshoot li{margin-bottom:6px;}'
        . '.uri-box{background:#0f172a;border:1px solid #334155;border-radius:6px;padding:10px 12px;margin-top:16px;font-family:ui-monospace,monospace;font-size:11px;word-break:break-all;color:#64748b;position:relative;}'
        . '.uri-box code{color:#94a3b8;}'
        . '.copy-btn{position:absolute;top:6px;right:6px;background:#475569;border:none;color:#fff;padding:4px 10px;border-radius:4px;font-size:11px;cursor:pointer;}'
        . '.copy-btn:hover{background:#64748b;}'
        . '.copy-btn.copied{background:#22c55e;}'
        . '.status{font-size:13px;color:#22c55e;margin-top:12px;display:none;}'
        . '.status.error{color:#f59e0b;}'
        . '</style>'
        . '</head><body>'
        . '<div class="card">'
        . '<h1>Open in Obsidian</h1>'
        . '<p class="path">' . $safe_vault . ' / ' . $safe_path . '</p>'
        . '<div class="btn-row">'
        . '<a class="btn" href="' . $safe_uri . '" id="open-btn">Open Note</a>'
        . '</div>'
        . '<p class="status" id="status"></p>'
        . '<p class="hint">Requires <strong>Obsidian</strong> with vault &quot;' . $safe_vault . '&quot; on this device.</p>'
        . '<div class="troubleshoot">'
        . '<div class="troubleshoot-title">💡 Not opening?</div>'
        . '<ul>'
        . '<li><strong>Discord/In-App Browser:</strong> Tap ⋮ → "Open in Browser" (Safari/Chrome)</li>'
        . '<li><strong>Mobile:</strong> Make sure Obsidian is installed and the vault is synced</li>'
        . '<li><strong>Desktop:</strong> Obsidian must have opened this vault at least once</li>'
        . '</ul>'
        . '<div class="uri-box">'
        . '<code id="uri-text">' . $safe_uri . '</code>'
        . '<button class="copy-btn" id="copy-btn" onclick="copyUri()">Copy</button>'
        . '</div>'
        . '</div>'
        . '</div>'
        . '<script>'
        . 'var obsUri=' . $js_uri . ';'
        . 'function copyUri(){'
        . 'navigator.clipboard.writeText(obsUri).then(function(){'
        . 'var b=document.getElementById("copy-btn");b.textContent="Copied!";b.classList.add("copied");'
        . 'setTimeout(function(){b.textContent="Copy";b.classList.remove("copied");},2000);'
        . '}).catch(function(){prompt("Copy this URL:",obsUri);});'
        . '}'
        . 'function tryOpen(){'
        . 'var s=document.getElementById("status");'
        . 'try{window.location.href=obsUri;s.textContent="Launching Obsidian...";s.className="status";s.style.display="block";}'
        . 'catch(e){s.textContent="Could not launch automatically. Use the button or copy the link below.";s.className="status error";s.style.display="block";}'
        . '}'
        . 'setTimeout(tryOpen,400);'
        . '</script>'
        . '</body></html>';

    echo $html;
    exit;
}

function quickli_share_render_by_token($token) {
    $post_id = quickli_share_find_post_id_by_token($token);
    if (!$post_id) {
        quickli_share_render_not_found();
        return;
    }

    $share_post = get_post($post_id);
    if (!$share_post) {
        quickli_share_render_not_found();
        return;
    }

    $expires_at = intval(get_post_meta($post_id, QUICKLI_SHARE_META_EXPIRES, true));
    if ($expires_at && time() > $expires_at) {
        quickli_share_render_expired();
        return;
    }

    quickli_share_send_noindex_headers();
    nocache_headers();

    global $post;
    $post = $share_post;
    setup_postdata($post);

    if (post_password_required($post)) {
        $form = wp_get_password_form($post);
        quickli_share_render_page(get_the_title($post), $form, true);
        wp_reset_postdata();
        return;
    }

    $share_type = get_post_meta($post_id, QUICKLI_SHARE_META_TYPE, true);
    if ($share_type === 'html_document') {
        $html = get_post_meta($post_id, QUICKLI_SHARE_META_FULL_HTML, true);
        if (is_string($html) && $html !== '') {
            quickli_share_render_html_document($html);
            wp_reset_postdata();
            return;
        }
    }

    $content = do_shortcode($post->post_content);
    quickli_share_render_page(get_the_title($post), $content, false);
    wp_reset_postdata();
}

function quickli_share_send_noindex_headers() {
    header('X-Robots-Tag: noindex, nofollow, noarchive, nosnippet', true);
}

function quickli_share_render_not_found() {
    status_header(404);
    quickli_share_send_noindex_headers();
    echo '<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex, nofollow"></head><body>Not found.</body></html>';
}

function quickli_share_render_expired() {
    status_header(410);
    quickli_share_send_noindex_headers();
    echo '<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex, nofollow"></head><body>This share link has expired.</body></html>';
}

function quickli_share_render_page($title, $content, $password_required) {
    $safe_title = esc_html($title);
    $site_name = esc_html(get_bloginfo('name'));
    $body_class = $password_required ? 'quickli-password' : 'quickli-content';

    echo '<!doctype html>';
    echo '<html><head>';
    echo '<meta charset="utf-8">';
    echo '<meta name="viewport" content="width=device-width, initial-scale=1">';
    echo '<meta name="robots" content="noindex, nofollow">';
    echo '<title>' . $safe_title . ' · ' . $site_name . '</title>';
    echo '<style>';
    echo 'body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;line-height:1.6;margin:0;background:#f6f6f3;color:#1b1b1b;}';
    echo '.wrap{max-width:820px;margin:40px auto;padding:32px;background:#fff;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.08);}';
    echo 'h1{font-size:28px;margin:0 0 16px;}';
    echo '.meta{font-size:13px;color:#666;margin-bottom:24px;}';
    echo 'pre,code{background:#f2f2f2;border-radius:6px;padding:2px 6px;}';
    echo 'pre{padding:16px;overflow:auto;}';
    echo '.quickli-password form{display:flex;gap:12px;align-items:center;flex-wrap:wrap;}';
    echo '.quickli-password input[type=password]{padding:8px 12px;border-radius:6px;border:1px solid #ccc;}';
    echo '.quickli-password input[type=submit]{padding:8px 14px;border:0;border-radius:6px;background:#111;color:#fff;cursor:pointer;}';
    echo '</style>';
    echo '</head><body>';
    echo '<div class="wrap ' . esc_attr($body_class) . '">';
    echo '<div class="meta">Shared via Quickli</div>';
    echo '<h1>' . $safe_title . '</h1>';
    echo '<div class="content">' . $content . '</div>';
    echo '</div></body></html>';
}

function quickli_share_render_html_document($html) {
    while (ob_get_level()) {
        ob_end_clean();
    }

    header('Content-Type: text/html; charset=utf-8', true);
    quickli_share_send_noindex_headers();
    nocache_headers();

    echo $html;
    exit;
}

function quickli_share_find_post_id_by_token($token) {
    $query = new WP_Query(array(
        'post_type' => QUICKLI_SHARE_CPT,
        'post_status' => 'any',
        'meta_query' => array(
            array(
                'key' => QUICKLI_SHARE_META_TOKEN,
                'value' => $token,
                'compare' => '=',
            ),
        ),
        'fields' => 'ids',
        'posts_per_page' => 1,
        'no_found_rows' => true,
    ));

    if (!empty($query->posts)) {
        return intval($query->posts[0]);
    }

    return 0;
}

function quickli_share_generate_token() {
    $raw = random_bytes(18);
    $token = rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
    return $token;
}

function quickli_share_build_url($token) {
    return home_url('/' . QUICKLI_SHARE_SLUG . '/' . $token . '/');
}

function quickli_share_can_manage() {
    return current_user_can('edit_posts');
}

function quickli_share_register_rest_routes() {
    register_rest_route('quickli-share/v1', '/share', array(
        'methods' => WP_REST_Server::CREATABLE,
        'permission_callback' => 'quickli_share_can_manage',
        'callback' => 'quickli_share_rest_upsert',
    ));

    register_rest_route('quickli-share/v1', '/share/(?P<id>\d+)', array(
        'methods' => WP_REST_Server::READABLE,
        'permission_callback' => 'quickli_share_can_manage',
        'callback' => 'quickli_share_rest_get',
    ));

    register_rest_route('quickli-share/v1', '/share/(?P<id>\d+)', array(
        'methods' => WP_REST_Server::DELETABLE,
        'permission_callback' => 'quickli_share_can_manage',
        'callback' => 'quickli_share_rest_delete',
    ));
}
add_action('rest_api_init', 'quickli_share_register_rest_routes');

function quickli_share_rest_upsert(WP_REST_Request $request) {
    $params = $request->get_json_params();
    if (!is_array($params)) {
        $params = array();
    }

    $share_id = isset($params['share_id']) ? intval($params['share_id']) : 0;
    $has_title = array_key_exists('title', $params);
    $has_content_html = array_key_exists('content_html', $params);
    $has_share_type = array_key_exists('share_type', $params);
    $title = $has_title ? sanitize_text_field($params['title']) : 'Shared note';
    $share_type = $has_share_type && $params['share_type'] === 'html_document' ? 'html_document' : 'note';
    $content_html = '';
    if ($has_content_html && is_string($params['content_html'])) {
        $content_html = $share_type === 'html_document' ? $params['content_html'] : wp_kses_post($params['content_html']);
    }
    $content_md = isset($params['content_md']) ? $params['content_md'] : '';
    $note_path = isset($params['note_path']) ? sanitize_text_field($params['note_path']) : '';

    $expires_at = 0;
    $expires_provided = false;
    if (array_key_exists('expires_at', $params)) {
        $expires_at = intval($params['expires_at']);
        $expires_provided = true;
    } elseif (!empty($params['expires_in']) && is_string($params['expires_in'])) {
        $parsed = strtotime('+' . $params['expires_in']);
        if ($parsed !== false) {
            $expires_at = $parsed;
            $expires_provided = true;
        }
    }

    if ($share_id) {
        $post = get_post($share_id);
        if (!$post || $post->post_type !== QUICKLI_SHARE_CPT) {
            return new WP_REST_Response(array('error' => 'Share not found.'), 404);
        }

        $existing_type = get_post_meta($share_id, QUICKLI_SHARE_META_TYPE, true) ?: 'note';
        if (!$has_share_type) {
            $share_type = $existing_type;
            if ($has_content_html && is_string($params['content_html'])) {
                $content_html = $share_type === 'html_document' ? $params['content_html'] : wp_kses_post($params['content_html']);
            }
        }

        $post_update = array('ID' => $share_id);
        if ($has_title) {
            $post_update['post_title'] = $title;
        }
        if ($has_content_html) {
            $post_update['post_content'] = $share_type === 'html_document' ? '<p>HTML document shared via Quickli.</p>' : $content_html;
        }

        if (count($post_update) > 1) {
            $updated_id = wp_update_post($post_update, true);

            if (is_wp_error($updated_id)) {
                return new WP_REST_Response(array('error' => $updated_id->get_error_message()), 500);
            }
        }

        $post_id = $share_id;
    } else {
        $post_id = wp_insert_post(array(
            'post_title' => $title,
            'post_content' => $share_type === 'html_document' ? '<p>HTML document shared via Quickli.</p>' : $content_html,
            'post_status' => 'publish',
            'post_type' => QUICKLI_SHARE_CPT,
        ), true);

        if (is_wp_error($post_id)) {
            return new WP_REST_Response(array('error' => $post_id->get_error_message()), 500);
        }

        $token = quickli_share_generate_token();
        update_post_meta($post_id, QUICKLI_SHARE_META_TOKEN, $token);
    }

    if (!empty($content_md)) {
        update_post_meta($post_id, QUICKLI_SHARE_META_RAW, $content_md);
    }

    if ($has_share_type || $has_content_html || !$share_id) {
        update_post_meta($post_id, QUICKLI_SHARE_META_TYPE, $share_type);
    }
    if ($has_content_html) {
        if ($share_type === 'html_document') {
            update_post_meta($post_id, QUICKLI_SHARE_META_FULL_HTML, wp_slash($content_html));
        } else {
            delete_post_meta($post_id, QUICKLI_SHARE_META_FULL_HTML);
        }
    }

    if ($note_path !== '') {
        update_post_meta($post_id, QUICKLI_SHARE_META_NOTE_PATH, $note_path);
    }

    if ($expires_provided) {
        if ($expires_at > 0) {
            update_post_meta($post_id, QUICKLI_SHARE_META_EXPIRES, $expires_at);
        } else {
            delete_post_meta($post_id, QUICKLI_SHARE_META_EXPIRES);
        }
    }

    if (array_key_exists('password', $params)) {
        $password = is_string($params['password']) ? $params['password'] : '';
        wp_update_post(array(
            'ID' => $post_id,
            'post_password' => $password,
        ));
    }

    $token = get_post_meta($post_id, QUICKLI_SHARE_META_TOKEN, true);
    $url = quickli_share_build_url($token);
    if (!$expires_provided) {
        $expires_at = intval(get_post_meta($post_id, QUICKLI_SHARE_META_EXPIRES, true));
    }
    $response = array(
        'share_id' => $post_id,
        'url' => $url,
        'expires_at' => $expires_at > 0 ? $expires_at : null,
        'password_protected' => !empty(get_post($post_id)->post_password),
        'share_type' => $share_type,
    );

    return new WP_REST_Response($response, 200);
}

function quickli_share_rest_get(WP_REST_Request $request) {
    $share_id = intval($request['id']);
    $post = get_post($share_id);
    if (!$post || $post->post_type !== QUICKLI_SHARE_CPT) {
        return new WP_REST_Response(array('error' => 'Share not found.'), 404);
    }

    $token = get_post_meta($share_id, QUICKLI_SHARE_META_TOKEN, true);
    $expires_at = intval(get_post_meta($share_id, QUICKLI_SHARE_META_EXPIRES, true));

    return new WP_REST_Response(array(
        'share_id' => $share_id,
        'url' => quickli_share_build_url($token),
        'expires_at' => $expires_at ?: null,
        'password_protected' => !empty($post->post_password),
        'title' => $post->post_title,
        'share_type' => get_post_meta($share_id, QUICKLI_SHARE_META_TYPE, true) ?: 'note',
    ), 200);
}

function quickli_share_rest_delete(WP_REST_Request $request) {
    $share_id = intval($request['id']);
    $post = get_post($share_id);
    if (!$post || $post->post_type !== QUICKLI_SHARE_CPT) {
        return new WP_REST_Response(array('error' => 'Share not found.'), 404);
    }

    wp_delete_post($share_id, true);
    return new WP_REST_Response(array('deleted' => true), 200);
}
