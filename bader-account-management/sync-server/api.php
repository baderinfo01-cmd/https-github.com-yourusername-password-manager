<?php
/**
 * Bader Sync — end-to-end encrypted sync relay.
 *
 * The server stores ONLY opaque encrypted blobs. The encryption key never leaves the user's devices,
 * so even the server owner cannot read accounts, passwords, cards or documents.
 *
 * POST JSON, query ?a=<action>:
 *   register  {id, auth, alert_auth, register_key}
 *   push      {id, auth, device, ops:[{k, ts, iv, ct}]}      (auth = data token, or alert token for "A:" items only)
 *   pull      {id, auth, since}                               -> {ops:[{seq, k, device, ts, iv, ct}], cursor}
 *   ping      {}
 * PHP 7.4+ with pdo_sqlite.
 */

$config = array(
    'register_key' => '', 'max_body_bytes' => 8388608, 'max_item_bytes' => 1048576,
    'max_items_per_account' => 20000, 'max_accounts' => 50, 'alert_ttl_days' => 60,
    'cors_origin' => '*', 'timezone' => 'Africa/Algiers',
);
if (file_exists(__DIR__ . '/config.php')) {
    $user = include __DIR__ . '/config.php';
    if (is_array($user)) {
        $config = array_merge($config, $user);
    }
}
date_default_timezone_set($config['timezone']);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: ' . $config['cors_origin']);
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

function out($data, $http = 200)
{
    http_response_code($http);
    echo json_encode($data, JSON_UNESCAPED_SLASHES);
    exit;
}

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    out(array('ok' => true));
}
if (!isset($_SERVER['REQUEST_METHOD']) || $_SERVER['REQUEST_METHOD'] !== 'POST') {
    out(array('ok' => false, 'error' => 'method_not_allowed'), 405);
}

$raw = file_get_contents('php://input', false, null, 0, $config['max_body_bytes'] + 1);
if ($raw === false || strlen($raw) > $config['max_body_bytes']) {
    out(array('ok' => false, 'error' => 'too_large'), 413);
}
$in = json_decode($raw, true);
if (!is_array($in)) {
    out(array('ok' => false, 'error' => 'bad_json'), 400);
}

$action = isset($_GET['a']) ? preg_replace('/[^a-z]/', '', $_GET['a']) : '';
if ($action === 'ping') {
    out(array('ok' => true, 'server' => 'bader-sync', 'v' => 1, 'time' => time()));
}

/* ---------------------------------------------------------------- database */
$dir = __DIR__ . '/data';
if (!is_dir($dir)) {
    @mkdir($dir, 0755, true);
}
if (!is_writable($dir)) {
    out(array('ok' => false, 'error' => 'data_dir_not_writable'), 500);
}
try {
    $db = new PDO('sqlite:' . $dir . '/sync.sqlite');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->exec('PRAGMA journal_mode=WAL');
    $db->exec('CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, auth_hash TEXT NOT NULL, alert_hash TEXT NOT NULL, created_at INTEGER, last_seen INTEGER)');
    $db->exec('CREATE TABLE IF NOT EXISTS ops (seq INTEGER PRIMARY KEY AUTOINCREMENT, account_id TEXT NOT NULL, item_key TEXT NOT NULL, device TEXT, ts INTEGER NOT NULL, iv TEXT NOT NULL, ct TEXT NOT NULL, created_at INTEGER)');
    $db->exec('CREATE UNIQUE INDEX IF NOT EXISTS ops_item ON ops(account_id, item_key)');
    $db->exec('CREATE INDEX IF NOT EXISTS ops_pull ON ops(account_id, seq)');
    $db->exec('CREATE TABLE IF NOT EXISTS rate (k TEXT, t INTEGER)');
} catch (Exception $e) {
    error_log('bader-sync db: ' . $e->getMessage());
    out(array('ok' => false, 'error' => 'db_error'), 500);
}

function rate_limit($db, $key, $max, $window)
{
    $now = time();
    $db->prepare('DELETE FROM rate WHERE t < ?')->execute(array($now - 3600));
    $st = $db->prepare('SELECT COUNT(*) FROM rate WHERE k = ? AND t > ?');
    $st->execute(array($key, $now - $window));
    if ((int) $st->fetchColumn() >= $max) {
        return false;
    }
    $db->prepare('INSERT INTO rate (k, t) VALUES (?, ?)')->execute(array($key, $now));
    return true;
}

function hex($v, $len)
{
    return (is_string($v) && preg_match('/^[a-f0-9]{' . $len . '}$/', $v)) ? $v : null;
}

$ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '0';

/* ---------------------------------------------------------------- register */
if ($action === 'register') {
    if (!rate_limit($db, 'reg:' . $ip, 10, 3600)) {
        out(array('ok' => false, 'error' => 'rate_limited'), 429);
    }
    if ($config['register_key'] !== '' && (!isset($in['register_key']) || !hash_equals((string) $config['register_key'], (string) $in['register_key']))) {
        out(array('ok' => false, 'error' => 'bad_register_key'), 403);
    }
    $id = hex(isset($in['id']) ? $in['id'] : null, 32);
    $auth = hex(isset($in['auth']) ? $in['auth'] : null, 64);
    $alert = hex(isset($in['alert_auth']) ? $in['alert_auth'] : null, 64);
    if (!$id || !$auth || !$alert) {
        out(array('ok' => false, 'error' => 'bad_request'), 400);
    }
    $exists = $db->prepare('SELECT 1 FROM accounts WHERE id = ?');
    $exists->execute(array($id));
    if ($exists->fetchColumn()) {
        out(array('ok' => false, 'error' => 'exists'), 409);
    }
    if ((int) $db->query('SELECT COUNT(*) FROM accounts')->fetchColumn() >= (int) $config['max_accounts']) {
        out(array('ok' => false, 'error' => 'server_full'), 403);
    }
    $db->prepare('INSERT INTO accounts (id, auth_hash, alert_hash, created_at, last_seen) VALUES (?, ?, ?, ?, ?)')
        ->execute(array($id, hash('sha256', $auth), hash('sha256', $alert), time(), time()));
    out(array('ok' => true));
}

/* ---------------------------------------------------------------- auth */
$id = hex(isset($in['id']) ? $in['id'] : null, 32);
$auth = hex(isset($in['auth']) ? $in['auth'] : null, 64);
if (!$id || !$auth) {
    out(array('ok' => false, 'error' => 'bad_request'), 400);
}
if (!rate_limit($db, 'try:' . $ip, 600, 600)) {
    out(array('ok' => false, 'error' => 'rate_limited'), 429);
}
$st = $db->prepare('SELECT * FROM accounts WHERE id = ?');
$st->execute(array($id));
$acc = $st->fetch(PDO::FETCH_ASSOC);
$h = hash('sha256', $auth);
$full = $acc && hash_equals($acc['auth_hash'], $h);
$alertOnly = !$full && $acc && hash_equals($acc['alert_hash'], $h);
if (!$full && !$alertOnly) {
    usleep(300000);
    out(array('ok' => false, 'error' => 'unauthorized'), 401);
}
$db->prepare('UPDATE accounts SET last_seen = ? WHERE id = ?')->execute(array(time(), $id));

// housekeeping: expire old alerts
$db->prepare("DELETE FROM ops WHERE account_id = ? AND item_key LIKE 'A:%' AND created_at < ?")
    ->execute(array($id, time() - 86400 * (int) $config['alert_ttl_days']));

function valid_key($k)
{
    return is_string($k) && preg_match('/^(A:)?[a-f0-9]{64}$/', $k);
}

/* ---------------------------------------------------------------- push */
if ($action === 'push') {
    $ops = isset($in['ops']) && is_array($in['ops']) ? $in['ops'] : array();
    $device = isset($in['device']) ? substr(preg_replace('/[^a-f0-9]/', '', (string) $in['device']), 0, 32) : '';
    if (count($ops) > 2000) {
        out(array('ok' => false, 'error' => 'too_many_ops'), 413);
    }
    $count = $db->prepare('SELECT COUNT(*) FROM ops WHERE account_id = ?');
    $count->execute(array($id));
    $total = (int) $count->fetchColumn();

    $up = $db->prepare('INSERT INTO ops (account_id, item_key, device, ts, iv, ct, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(account_id, item_key) DO UPDATE SET device = excluded.device, ts = excluded.ts, iv = excluded.iv, ct = excluded.ct, created_at = excluded.created_at, seq = (SELECT COALESCE(MAX(seq),0)+1 FROM ops)
                        WHERE excluded.ts >= ops.ts');
    $accepted = 0;
    $db->beginTransaction();
    foreach ($ops as $op) {
        if (!is_array($op) || !valid_key(isset($op['k']) ? $op['k'] : null)) {
            continue;
        }
        $isAlert = strpos($op['k'], 'A:') === 0;
        if ($alertOnly && !$isAlert) {
            $db->rollBack();
            out(array('ok' => false, 'error' => 'forbidden'), 403);
        }
        $iv = isset($op['iv']) ? (string) $op['iv'] : '';
        $ct = isset($op['ct']) ? (string) $op['ct'] : '';
        if (!preg_match('/^[A-Za-z0-9_\-]{8,40}$/', $iv) || !preg_match('/^[A-Za-z0-9_\-]+$/', $ct) || strlen($ct) > $config['max_item_bytes']) {
            continue;
        }
        if ($total + $accepted >= (int) $config['max_items_per_account'] && !$isAlert) {
            $db->rollBack();
            out(array('ok' => false, 'error' => 'account_full'), 413);
        }
        $ts = isset($op['ts']) ? (int) $op['ts'] : 0;
        if ($ts <= 0) {
            continue;
        }
        $up->execute(array($id, $op['k'], $device, $ts, $iv, $ct, time()));
        $accepted++;
    }
    $db->commit();
    $cur = $db->prepare('SELECT COALESCE(MAX(seq),0) FROM ops WHERE account_id = ?');
    $cur->execute(array($id));
    out(array('ok' => true, 'accepted' => $accepted, 'cursor' => (int) $cur->fetchColumn()));
}

/* ---------------------------------------------------------------- pull */
if ($action === 'pull') {
    $since = isset($in['since']) ? max(0, (int) $in['since']) : 0;
    $limit = 500;
    $sql = 'SELECT seq, item_key, device, ts, iv, ct FROM ops WHERE account_id = ? AND seq > ?' . ($alertOnly ? " AND item_key LIKE 'A:%'" : '') . ' ORDER BY seq ASC LIMIT ' . $limit;
    $q = $db->prepare($sql);
    $q->execute(array($id, $since));
    $rows = $q->fetchAll(PDO::FETCH_ASSOC);
    $res = array();
    $cursor = $since;
    foreach ($rows as $r) {
        $res[] = array('seq' => (int) $r['seq'], 'k' => $r['item_key'], 'device' => $r['device'], 'ts' => (int) $r['ts'], 'iv' => $r['iv'], 'ct' => $r['ct']);
        $cursor = (int) $r['seq'];
    }
    out(array('ok' => true, 'ops' => $res, 'cursor' => $cursor, 'more' => count($rows) === $limit));
}

out(array('ok' => false, 'error' => 'bad_action'), 400);
