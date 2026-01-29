
print('2ed')
def BART(batch_msgs): 

    from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
    model_name = "fnlp/bart-large-chinese"
    
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

    '''chat_logs = [
        "Brent:今天專案終於完成了，好開心！",
        "Alice:我覺得昨天討論會有點混亂，不太清楚下一步要做什麼",
        "Brent:沒關係，我已經整理好任務清單了，大家可以依照清單執行",
        "Charlie:我昨天加班把bug都修好了，現在系統可以正常運作",
        "Alice:太好了，這樣我們下週就可以開始測試",
        "Brent:別忘了更新文件，把流程寫清楚，方便其他同事參考",
        "Charlie:好的，我今天會整理文件並上傳到共享資料夾",
        "Alice:謝謝大家的努力，今天可以稍微放鬆一下"
    ]'''

    text = " ".join(batch_msgs)

    inputs = tokenizer(text, return_tensors="pt", max_length=1024, truncation=True)

    summary_ids = model.generate(
        inputs["input_ids"],
        num_beams=4,
        max_length=120,
        early_stopping=True
    )

    summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)

    # 去掉多餘空格
    summary = summary.replace(" ", "")

    # 移除冒號和人名
    import re
    summary = re.sub(r"^[\u4e00-\u9fff]+:", "", summary)  # 開頭的人名
    summary = re.sub(r"[\u4e00-\u9fff]+:", "", summary)    # 其他人名

    print("摘要：", summary)


    return summary