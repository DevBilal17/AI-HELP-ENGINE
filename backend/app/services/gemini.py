
import json
import os
from groq import Groq
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from app.config import settings
from app.services.prompts import KNOWLEDGE_EXTRACTION_PROMPT


# Make sure settings.GROQ_API_KEY is defined in your config/env
GROQ_KEY = getattr(settings, "GROQ_API_KEY", os.getenv("GROQ_API_KEY"))
if not GROQ_KEY:
    raise ValueError("GROQ_API_KEY is missing in your config or .env file!")

client = Groq(api_key=GROQ_KEY)


class Chunk(BaseModel):
    chunk_id: str
    category: str
    tags: List[str]
    metadata: Dict[str, Any] = Field(default_factory=dict)
    questions: List[str] = Field(default_factory=list, description="3-5 potential user questions this chunk answers")
    content: str

class KnowledgeBase(BaseModel):
    chunks: List[Chunk]



def extract_structured_knowledge_from_chunks(text_chunks: List[str]) -> KnowledgeBase:

    final_chunks_list = []
    
  
    active_chunks = [chunk for chunk in text_chunks if chunk.strip()]
    total_chunks = len(active_chunks)
    

    # Best for structured text generation
    MODEL_NAME = 'llama-3.3-70b-versatile'
    
    print(f"\n Starting Knowledge Extraction on {total_chunks} chunks using Groq...")
    
    processed_count = 0
    for index, chunk_text in enumerate(active_chunks):
        formatted_prompt = KNOWLEDGE_EXTRACTION_PROMPT.format(text_chunk=chunk_text)
        
        try:
            # Groq structured completion request
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {
                        "role": "user",
                        "content": formatted_prompt
                    }
                ],
                # JSON Mode ensure the output in json
                response_format={"type": "json_object"},
                temperature=0.1,  # Low temperature for precise structured formatting
            )
            
            # JSON parsing
            raw_text = response.choices[0].message.content
            chunk_data = json.loads(raw_text)
            
            if "chunks" in chunk_data and chunk_data["chunks"]:
                for item in chunk_data["chunks"]:
                    # Unique suffix so chunk_id dont duplicate
                    item["chunk_id"] = f"{item['chunk_id']}_{index}"
                    final_chunks_list.append(Chunk(**item))
            
            processed_count += 1
          
            print(f"[{processed_count}/{total_chunks}] Done")
                    
        except Exception as e:
            processed_count += 1
            print(f"[{processed_count}/{total_chunks}] Failed! Error: {str(e)}")
            continue
            
    print(f" Finished! Extracted {len(final_chunks_list)} structural elements out of {total_chunks} raw blocks.\n")
    return KnowledgeBase(chunks=final_chunks_list)