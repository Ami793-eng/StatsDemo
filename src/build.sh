#!/bin/sh
# Builds public/*.html + manifests (Netlify, full documents) and preview/*.html (artifact bodies) from src/.
set -e
cd "$(dirname "$0")"
# Product name (working name; final name still open). Club name, crest and colours are settings in the app, never here.
APP_NAME='Gaels Beo'
APP_BG='#070c1d'     # dark
APP_THEME='#070c1d'
FONTS='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600&display=swap">'
RESET='html{-webkit-text-size-adjust:100%}body{margin:0}[hidden]{display:none!important}img{max-width:100%}:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
mkdir -p ../public preview
manifest(){ # file id name short_name description start scope
  cat > "../public/$1" <<JSON
{
  "id": "$2",
  "name": "$3",
  "short_name": "$4",
  "description": "$5",
  "start_url": "$6",
  "scope": "$7",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "$APP_BG",
  "theme_color": "$APP_THEME",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" }
  ]
}
JSON
}
# One installable app. It opens on the public live page (no login); "Sign in" leads to coach, scorer, admin or player screens.
manifest app.webmanifest /live.html "$APP_NAME" "$APP_NAME" "Live scores, match scoring and stats for your club" live.html ./
page(){ # name title css-files body-file js-files manifest
  name=$1; title=$2; css=$3; body=$4; js=$5; mf=$6
  {
    echo "<title>$title</title>"
    echo '<meta name="claude:viewport-fit-sides" content="cover">'
    echo "$FONTS"
    echo '<style>'; for f in $css; do cat "$f"; done; echo '</style>'
    cat "$body"
    echo '<script>'; for f in $js; do cat "$f"; done; echo '</script>'
  } > "preview/$name.html"
  {
    echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#132a86"><meta name="robots" content="noindex">'
    echo "<link rel=\"icon\" type=\"image/png\" href=\"favicon.png\"><link rel=\"apple-touch-icon\" href=\"apple-touch-icon.png\"><link rel=\"manifest\" href=\"$mf\"><meta name=\"apple-mobile-web-app-capable\" content=\"yes\"><meta name=\"mobile-web-app-capable\" content=\"yes\"><meta name=\"apple-mobile-web-app-status-bar-style\" content=\"black-translucent\"><meta name=\"apple-mobile-web-app-title\" content=\"$APP_NAME\">"
    sed -n '1,/<\/style>/p' "preview/$name.html" | sed "s#<style>#<style>$RESET#"
    echo '</head><body>'
    sed '1,/<\/style>/d' "preview/$name.html"
    echo '</body></html>'
  } > "../public/$name.html"
}
sed "s/^export //" crests.mjs > crests.gen.js
page index "$APP_NAME" "theme.css app.css" app-body.html "badge.js crests.gen.js demo-data.js app-core.js app-actions.js app-views.js signin.js pwa.js" app.webmanifest
page live "$APP_NAME Live" "theme.css live.css" live-body.html "badge.js crests.gen.js demo-data.js signin.js live.js pwa.js" app.webmanifest
page me "$APP_NAME Player" "theme.css me.css" me-body.html "badge.js crests.gen.js demo-data.js signin.js me.js pwa.js" app.webmanifest
rm -f ../public/manifest.webmanifest ../public/live.webmanifest ../public/me.webmanifest
echo built
