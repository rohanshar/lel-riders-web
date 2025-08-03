#!/bin/bash
# Setup git hooks for this repository

echo "Setting up git hooks..."

# Configure git to use our hooks directory
git config core.hooksPath .githooks

echo "Git hooks configured successfully!"
echo "The pre-commit hook will now update build info on each commit."