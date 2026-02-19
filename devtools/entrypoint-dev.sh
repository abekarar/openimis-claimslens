#!/bin/bash
cd /app
echo "Prepare dev setup"

# Update package.json with module references first
echo "Updating package.json"
node ./modules-config.js openimis-dev.json

# Install all dependencies (including shelljs needed by entrypoint-dev.js)
echo "Install application dependencies"
yarn install --legacy-peer-deps --include=dev

# Now run entrypoint-dev.js to build modules and set up links
echo "Running entrypoint-dev.js"
node ./dev_tools/entrypoint-dev.js -c /app/openimis-dev.json -p /frontend-packages

# Replace file: dependency copies with symlinks to source dirs (which have dist/)
echo "Symlinking frontend packages into node_modules"
for dir in /frontend-packages/*/; do
  if [ -f "$dir/package.json" ]; then
    pkg_name=$(node -e "console.log(JSON.parse(require('fs').readFileSync('${dir}package.json','utf8')).name)" 2>/dev/null)
    if [ -n "$pkg_name" ] && echo "$pkg_name" | grep -q "@openimis/"; then
      scope=$(echo "$pkg_name" | cut -d/ -f1)
      name=$(echo "$pkg_name" | cut -d/ -f2)
      target="/app/node_modules/$scope/$name"
      if [ -d "$target" ] && [ ! -L "$target" ]; then
        rm -rf "$target"
        ln -s "$dir" "$target"
        echo "  Linked $pkg_name -> $dir"
      elif [ ! -e "$target" ]; then
        mkdir -p "/app/node_modules/$scope"
        ln -s "$dir" "$target"
        echo "  Linked $pkg_name -> $dir"
      fi
    fi
  fi
done

echo "Application has been updated!, will start now"
yarn dev
