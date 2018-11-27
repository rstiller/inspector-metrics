#!/bin/bash

set -e

npm run clean
npm run compile
node build/playground/playground.js
