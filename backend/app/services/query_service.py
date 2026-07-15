
import json
from typing import Optional, Dict, Any
from app.services.embeddings import embedding_model
from app.services.chroma_service import ChromaService
from app.services.gemini import client  
from app.config import settings         

from app.services.prompts import RAG_SYSTEM_PROMPT, RAG_USER_PROMPT

MODEL_NAME = 'llama-3.3-70b-versatile'

def run_helpdesk_query(
    user_query: str, 
    program_level: Optional[str] = None, 
    category: Optional[str] = None
) -> Dict[str, Any]:
    """
    RAG Pipeline Core Flow utilizing dynamic configurations and separate prompts.
    """
    print(f"\nProcessing student query: '{user_query}'...")
    
    # Embed user query
    query_vector = embedding_model.encode(user_query).tolist()
    
    # ChromaDB Search
    chroma_db = ChromaService()
    matched_chunks = chroma_db.query_semantic_search(
        query_embedding=query_vector,
        program_level=program_level,
        category=category,
        limit=3
    )
    
    if not matched_chunks:
        print(" No matching context found in database!")
        return {
            "answer": "This information is not available in the provided documents.",
            "found_in_context": False,
            "needs_internet": True,
            "sources": []
        }
        
    # Context compilation
    context_text = "\n\n".join([f"Source [{item['chunk_id']}]: {item['content']}" for item in matched_chunks])
    
    # Dynamic Prompt Binding

    formatted_system_prompt = RAG_SYSTEM_PROMPT.format(
        helpdesk_role=settings.HELPDESK_ROLE,
        department=settings.DEPARTMENT_NAME,
        institution=settings.INSTITUTION_NAME
    )
    
    formatted_user_prompt = RAG_USER_PROMPT.format(
        context_text=context_text,
        user_query=user_query
    )

    try:
        #  Execute Groq Completion Call
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": formatted_system_prompt},
                {"role": "user", "content": formatted_user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
        )
        
        # Parse output JSON
        raw_output = response.choices[0].message.content
        output_data = json.loads(raw_output)
        
      
        output_data["sources"] = [
            {"chunk_id": item["chunk_id"], "category": item["metadata"].get("category", "N/A")} 
            for item in matched_chunks
        ] if output_data.get("found_in_context") else []
        
        print(" Response generated successfully from context!")
        return output_data
        
    except Exception as e:
        print(f" Failed to process query through Groq: {str(e)}")
        return {
            "answer": "Sorry, I encountered an error while processing your request.",
            "found_in_context": False,
            "needs_internet": False,
            "error": str(e)
        }