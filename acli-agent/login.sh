#!/bin/bash
set -euo pipefail

acli jira auth login \
  --site "strikingly.atlassian.net" \
  --email "peng.he@strikingly.com" \
  --token < /Users/mack/.acli/token.txt
