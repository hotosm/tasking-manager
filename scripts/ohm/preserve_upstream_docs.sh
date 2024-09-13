#!/bin/bash

if [ ! -d "upstream" ]; then
  mkdir upstream
fi
for i in $(git ls-tree upstream/master --name-only); do
  if [[ $i == *.md ]];then
    echo $i
    git show upstream/master:$i > upstream/$i
  fi
done
git show upstream/master:LICENSE.txt > upstream/LICENSE.txt
git add upstream
if [ -n "$(git status --porcelain)" ]; then
  git commit -m 'Preserving upstream markdown & text files.'
fi
