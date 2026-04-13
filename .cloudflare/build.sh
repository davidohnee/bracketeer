#!/bin/bash

if [ "$CF_PAGES_BRANCH" == "release" ]; then
  npm run build

else
  npm run build:preview

fi