#!/bin/sh
# Builds public/*.html (Netlify, full documents) and preview/*.html (artifact bodies) from src/.
set -e
cd "$(dirname "$0")"
FONTS='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600&display=swap">'
RESET='html{-webkit-text-size-adjust:100%}body{margin:0}[hidden]{display:none!important}img{max-width:100%}:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
mkdir -p ../public preview
page(){ # name title css-files body-file js-files
  name=$1; title=$2; css=$3; body=$4; js=$5
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
    echo '<link rel="icon" type="image/png" href="favicon.png"><link rel="apple-touch-icon" href="apple-touch-icon.png"><link rel="manifest" href="manifest.webmanifest"><meta name="apple-mobile-web-app-capable" content="yes">'
    sed -n '1,/<\/style>/p' "preview/$name.html" | sed "s#<style>#<style>$RESET#"
    echo '</head><body>'
    sed '1,/<\/style>/d' "preview/$name.html"
    echo '</body></html>'
  } > "../public/$name.html"
}
sed "s/^export //" crests.mjs > crests.gen.js
page index "Owenmore Gaels Demo" "theme.css app.css" app-body.html "badge.js crests.gen.js demo-data.js app-core.js app-actions.js app-views.js"
page live "Owenmore Gaels Live" "theme.css live.css" live-body.html "badge.js crests.gen.js demo-data.js live.js"
page me "My Owenmore Stats" "theme.css me.css" me-body.html "badge.js crests.gen.js demo-data.js me.js"
for f in app-core app-sync app-views live me; do [ -f $f.js ] || continue; done
echo built
