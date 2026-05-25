#!/bin/bash
set -euo pipefail

acli confluence auth login \
  --site "strikingly.atlassian.net" \
  --email "peng.he@strikingly.com" \
  --token < /Users/mack/.acli/token.txt
