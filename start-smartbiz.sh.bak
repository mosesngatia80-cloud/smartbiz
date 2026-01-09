#!/data/data/com.termux/files/usr/bin/bash

echo "🛑 Killing all Node processes..."
pkill node || true
sleep 2

echo "📂 Moving to Smart Biz directory..."
cd /data/data/com.termux/files/home/navu-smart-biz || exit 1

echo "🚀 Starting Smart Biz backend..."
node smartbiz.server.js
