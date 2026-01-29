print("=== Testing Redis ===")

try:
    import redis
    print("✓ redis module imported")
except Exception as e:
    print(f"✗ Failed to import redis: {e}")
    exit(1)

try:
    client = redis.Redis(host='redis', port=6379, decode_responses=True)
    print("✓ redis client created")
except Exception as e:
    print(f"✗ Failed to create client: {e}")
    exit(1)

try:
    result = client.ping()
    print(f"✓ redis ping: {result}")
except Exception as e:
    print(f"✗ Failed to ping: {e}")
    exit(1)

print("=== All tests passed ===")