# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "openai",
#     "python-dotenv",
# ]
# ///
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY") or "sk-1234"
base_url = os.getenv("OPENAI_BASE_URL") or "http://localhost:7099/v1/"
model = os.getenv("OPENAI_MODEL") or "llama4"

messages = [
    {
        "role": "system",
        "content": "You are a helpful assistant."
    }
]

client = OpenAI(api_key=api_key, base_url=base_url)


response = client.chat.completions.create(
    model=model,
    messages=messages
)

print(response.choices[0].message.content)