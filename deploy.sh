#!/bin/bash

# Define branches
SOURCE="pre-development"
TARGETS=("development" "staging")

# 1. Check if we are on the source branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$CURRENT_BRANCH" != "$SOURCE" ]; then
    echo "Error: This script must be run from the '$SOURCE' branch."
    echo "You are currently on '$CURRENT_BRANCH'."
    exit 1
fi

# Fetch latest changes from remote
git fetch origin

for TARGET in "${TARGETS[@]}"; do
    echo "--- Merging $SOURCE into $TARGET ---"
    
    # Switch to target branch and ensure it's up to date
    git checkout $TARGET
    git pull origin $TARGET
    
    # Merge source branch
    if git merge $SOURCE; then
        echo "Successfully merged $SOURCE into $TARGET"

         # Pushing the merged changes to the remote repository
        echo "Pushing $TARGET to origin..."
        git push origin $TARGET
    else
        echo "Error: Conflict detected while merging into $TARGET. Please resolve manually."
        exit 1
    fi
done

echo "--- Returning to $SOURCE ---"
git checkout $SOURCE

echo "--- All merges complete ---"
