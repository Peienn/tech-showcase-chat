"""
Redis 客戶端設定
"""

import redis
import os
redis_client = redis.Redis(
    host='my-redis',
    port=6379,
    decode_responses=True,
    socket_connect_timeout=5,
    socket_keepalive=True,
    health_check_interval=30
)

# 測試連線
try:
    redis_client.ping()
    print("[Redis] ✓ Connected successfully", flush=True)
except Exception as e:
    print(f"[Redis] ✗ Connection failed: {e}", flush=True)
    raise