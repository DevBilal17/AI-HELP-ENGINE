
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer
from app.services.gemini import Chunk  


print(" Loading SentenceTransformer model ('all-MiniLM-L6-v2')...")
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
print(" Embedding model loaded successfully!")

def generate_embeddings_for_chunks(chunks: List[Chunk]) -> List[Dict[str, Any]]:

    total_chunks = len(chunks)
    print(f"\n Generating enriched embeddings for {total_chunks} chunks...")
    
    embedded_data_list = []
    
    for index, chunk in enumerate(chunks):
        try:

            questions_str = " ".join(chunk.questions) if hasattr(chunk, 'questions') and chunk.questions else ""
            
  
            text_to_embed = f"Questions: {questions_str} | Content: {chunk.content}"
            
          
            vector_embedding = embedding_model.encode(text_to_embed).tolist()
            
           
            embedded_chunk = {
                "chunk_id": chunk.chunk_id,
                "category": chunk.category,
                "tags": chunk.tags,
                "questions": getattr(chunk, 'questions', []), 
                "metadata": chunk.metadata,
                "content": chunk.content,
                "embedding": vector_embedding # Enriched Dense Vector added!
            }
            
            embedded_data_list.append(embedded_chunk)
            print(f"[{index + 1}/{total_chunks}] Done")
            
        except Exception as e:
            print(f"Failed to embed chunk {chunk.chunk_id}: {str(e)}")
            continue
            
    print(f" Successfully embedded {len(embedded_data_list)} chunks!")
    return embedded_data_list