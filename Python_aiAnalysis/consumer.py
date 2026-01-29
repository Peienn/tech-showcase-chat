"""
AI Analysis Worker - 簡化版
"""
print(123)
import json
import time
import requests
from redis_client import redis_client
from transformer import BART
from Postgresql import save_analysis

# 設定
STREAM = "chat_analysis_stream"
GROUP = "analysis_group"
CONSUMER = "worker-1"
WEBHOOK_URL = "http://backend:3000/api/webhook/analysis-done"

print("[Worker] Starting...", flush=True)


def setup():
    """初始化設定"""
    # 等待 Redis 連線
    for i in range(30):
        try:
            redis_client.ping()
            print("[Worker] ✓ Redis connected", flush=True)
            break
        except:
            print(f"[Worker] Waiting for Redis... ({i+1}/30)", flush=True)
            time.sleep(2)
    
    # 建立 Stream Group
    try:
        redis_client.xgroup_create(STREAM, GROUP, id="0", mkstream=True)
        print("[Worker] ✓ Stream group created", flush=True)
    except:
        print("[Worker] Stream group already exists", flush=True)


def notify_backend(batch_id, analysis):
    """通知 Backend"""
    try:
        requests.post(
            WEBHOOK_URL,
            json={"batch_id": batch_id, "analysis": analysis},
            timeout=10
        )
        print("[Worker] ✓ Webhook sent", flush=True)
    except Exception as e:
        print(f"[Worker] ✗ Webhook failed: {e}", flush=True)


def process_message(msg_id, fields):
    """處理訊息"""
    try:
        # 解析資料
        data = json.loads(fields.get("data"))
        batch_id = data["batch_id"]
        messages = data["messages"]
        
        print(f"[Worker] Processing batch {batch_id}", flush=True)
        
        # 分析
        analysis = BART(messages)
        print(f"[Worker] ✓ Analysis done", flush=True)
        
        # 存 DB
        save_analysis(batch_id, messages, analysis)
        print(f"[Worker] ✓ Saved to DB", flush=True)
        
        # 通知 Backend
        notify_backend(batch_id, analysis)
        
        # ACK
        redis_client.xack(STREAM, GROUP, msg_id)
        return True
        
    except Exception as e:
        print(f"[Worker] ✗ Error: {e}", flush=True)
        return False


def main():
    """主程式"""
    setup()
    print("[Worker] ✓ Ready!", flush=True)
    
    while True:
        try:
            # 讀取訊息
            messages = redis_client.xreadgroup(
                GROUP, CONSUMER, {STREAM: ">"}, count=1, block=5000
            )
            
            if not messages:
                print(".", end="", flush=True)
                continue
            
            # 處理訊息
            for stream, entries in messages:
                for msg_id, fields in entries:
                    print(f"\n[Worker] New message: {msg_id}", flush=True)
                    process_message(msg_id, fields)
                    
        except KeyboardInterrupt:
            print("\n[Worker] Stopped", flush=True)
            break
        except Exception as e:
            print(f"[Worker] Error: {e}", flush=True)
            time.sleep(5)


if __name__ == "__main__":
    main()