#!/bin/bash

OLD_EMAIL="aniruddha.b@examic.in"
CORRECT_NAME="aniruddhabagal"
CORRECT_EMAIL="bagalaniruddha@gmail.com"

git filter-repo --force --commit-callback '
if commit.author_email == b"'$OLD_EMAIL'":
    commit.author_name = b"'$CORRECT_NAME'"
    commit.author_email = b"'$CORRECT_EMAIL'"
    commit.committer_name = b"'$CORRECT_NAME'"
    commit.committer_email = b"'$CORRECT_EMAIL'"
'
