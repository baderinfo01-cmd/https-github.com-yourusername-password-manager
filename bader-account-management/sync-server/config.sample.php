<?php
/**
 * Bader Sync server settings.
 * Copy this file to config.php and edit it. Keep config.php private.
 */
return array(
    // Only people who know this key can CREATE a sync account on your server (protects your hosting space).
    // Leave '' to allow anyone to register (not recommended). Enter the same key in the app when creating the account.
    'register_key' => 'CHANGE-ME-TO-A-LONG-RANDOM-TEXT',

    // limits
    'max_body_bytes'      => 8 * 1024 * 1024,   // one request
    'max_item_bytes'      => 1024 * 1024,       // one encrypted item (documents with photos can be large)
    'max_items_per_account' => 20000,
    'max_accounts'        => 50,                // how many sync accounts this server accepts
    'alert_ttl_days'      => 60,                // security alerts older than this are deleted

    // allow browsers (the phone web app) from any site to call the API. The API needs the secret token anyway.
    'cors_origin' => '*',

    'timezone' => 'Africa/Algiers',
);
