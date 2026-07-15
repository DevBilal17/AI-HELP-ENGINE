
import os
import json
from typing import Dict, Any, List
from app.services.embeddings import embedding_model
from app.services.chroma_service import ChromaService
from app.schemas.response import APIResponse

# Dynamic directory path configuration
BASE_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
RAW_DOCS_DIR = os.path.join(BASE_DATA_DIR, "raw_documents")
JSON_DATA_DIR = os.path.join(BASE_DATA_DIR, "structured_json")

# Ensure folders exist
os.makedirs(RAW_DOCS_DIR, exist_ok=True)
os.makedirs(JSON_DATA_DIR, exist_ok=True)





def process_local_json_file(filename: str) -> Dict[str, Any]:
    """
    Parses a specific pre-defined structured JSON file from 'app/data/structured_json/<filename>'
    Handles custom properties seamlessly.
    """
    target_file = os.path.join(JSON_DATA_DIR, filename)
    if not os.path.exists(target_file):
        raise FileNotFoundError(f"JSON file '{filename}' not found under '{JSON_DATA_DIR}'")
        
    with open(target_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    try:
        
        if isinstance(data, dict) and "chunks" in data:
            data = data["chunks"]
            print(data)
        if not isinstance(data, list):
            data = [data]

        print(data)
            
        chroma_db = ChromaService()

        total_chunks = len(data)
        print(f"\n Generating enriched embeddings for {total_chunks} chunks...")
        embedded_data_list = []
        
        for index, item in enumerate(data):
            try:
                # Safe questions extraction using dictionary key/get
                questions_list = item.get('questions', [])
                questions_str = " ".join(questions_list) if isinstance(questions_list, list) else ""
                
                # Safely get content and fields using dict methods
                content = item.get('content', '')
                chunk_id = item.get('chunk_id')
                category = item.get('category', '')
                tags = item.get('tags', [])
                metadata = item.get('metadata', {})

           
                text_to_embed = f"Questions: {questions_str} | Content: {content}"
                
                # Generate 384-dimensional vector embedding
                vector_embedding = embedding_model.encode(text_to_embed).tolist()
                
                # Raw data metadata maps with embedded items
                embedded_chunk = {
                    "chunk_id": chunk_id,
                    "category": category,
                    "tags": tags,
                    "questions": questions_list, 
                    "metadata": metadata,
                    "content": content,
                    "embedding": vector_embedding 
                }
                embedded_data_list.append(embedded_chunk)
                print(f"[{index + 1}/{total_chunks}] Done")

            except Exception as e:
               
                failed_id = item.get('chunk_id') if isinstance(item, dict) else 'Unknown'
                print(f" Failed to embed chunk {failed_id}: {str(e)} and store into the vectorDB")
                continue
                
        print(f"Successfully embedded {len(embedded_data_list)} chunks!")
        
        # Upsert into database
        chroma_db.upsert_chunks(embedded_data_list)
        
        # Build response representation safely from dict objects
        response_data = {
            "chunks": [
                {
                    "chunk_id": chunk.get('chunk_id'),
                    "category": chunk.get('category'),
                    "tags": chunk.get('tags'),
                    "questions": chunk.get('questions', []),
                    "metadata": chunk.get('metadata', {}),
                    "content": chunk.get('content')
                }
                for chunk in data
            ]
        }
        
  
        return APIResponse(
            success=True,
            message=f"Successfully extracted and embedded {len(data)} clean JSON objects with Questions, generated vectors, and stored in ChromaDB.",
            data=response_data,
            error=None
        )
        
    except Exception as e:
        print(f" Error in /json-file-ingestion: {str(e)}")
        return APIResponse(
            success=False,
            message="Failed to structure and embed document.",
            data=None,
            error=str(e)
        )