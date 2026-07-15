
import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.parser import extract_text_from_file, split_text_recursively
from app.services.gemini import extract_structured_knowledge_from_chunks
from app.services.embeddings import generate_embeddings_for_chunks
from app.services.query_service import run_helpdesk_query
from app.services.local_ingest_service import  process_local_json_file
from app.services.chroma_service import ChromaService
from app.schemas.response import APIResponse
from app.config import settings
from pydantic import BaseModel, Field
from typing import List, Optional
router = APIRouter()

class DeleteIdsRequest(BaseModel):
    ids: List[str] = Field(..., description="List of unique chunk IDs to delete")


class StudentQueryRequest(BaseModel):
    query: str = Field(..., description="The academic/administrative question asked by the student")
    program_level: Optional[str] = Field(None, description="Optional program level filter (e.g., 'MS', 'BS')")
    category: Optional[str] = Field(None, description="Optional category level filter (e.g., 'Fees', 'Admissions')")


class LocalFolderIngestRequest(BaseModel):
    folder_name: str = Field(..., description="The directory name located inside 'app/data/raw_documents/'")


class LocalJsonIngestRequest(BaseModel):
    filename: str = Field(..., description="The structured JSON filename (e.g. 'admission_rules.json') inside 'app/data/structured_json/'")



@router.post("/process-prospectus", response_model=APIResponse)
async def process_prospectus(file: UploadFile = File(...)):
    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
    
    
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
        
    try:
       
        raw_text = extract_text_from_file(file_path, file.filename)
        if not raw_text:
            raise HTTPException(status_code=400, detail="No readable text found in the file.")
            
       
        text_chunks = split_text_recursively(raw_text, chunk_size=2000, chunk_overlap=200)
        
   
        structured_knowledge_base = extract_structured_knowledge_from_chunks(text_chunks)

        if not structured_knowledge_base.chunks:
            raise HTTPException(status_code=422, detail="Structured extraction returned empty dataset.")

        
        final_embedded_dataset = generate_embeddings_for_chunks(structured_knowledge_base.chunks)

        
        chroma_db = ChromaService()
        chroma_db.upsert_chunks(final_embedded_dataset)
        
        # Cleanup temporary file
        if os.path.exists(file_path):
            os.remove(file_path)
            

        response_data = {
            "chunks": [
                {
                    "chunk_id": chunk.chunk_id,
                    "category": chunk.category,
                    "tags": chunk.tags,
                    "questions": getattr(chunk, 'questions', []),
                    "metadata": chunk.metadata,
                    "content": chunk.content
                }
                for chunk in structured_knowledge_base.chunks
            ]
        }
            
        return APIResponse(
            success=True,
            message=f"Successfully extracted {len(structured_knowledge_base.chunks)} clean JSON objects with Questions from {len(text_chunks)} raw recursive blocks, generated vectors, and stored in ChromaDB.",
            data=response_data,
            error=None
        )
        
    except Exception as e:
        # Clean up local file in case of failure
        if os.path.exists(file_path):
            os.remove(file_path)
            
        print(f"Error in /process-prospectus: {str(e)}")
        return APIResponse(
            success=False,
            message="Failed to structure and embed document.",
            data=None,
            error=str(e)
        )


@router.post("/query", response_model=APIResponse)
async def query_helpdesk(payload: StudentQueryRequest):
    """
    Student Question processing API:
    1. Vector match search execute karta hai.
    2. Applying Dynamic metadata filters (Avoiding BS vs MS issues).
    3. LLM generate structured response.
    """
    if not payload.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
        
    try:
        # Run helpdesk RAG flow
        query_result = run_helpdesk_query(
            user_query=payload.query,
            program_level=payload.program_level,
            category=payload.category
        )
        
        return APIResponse(
            success=True,
            message="Query processed successfully.",
            data=query_result,
            error=None
        )
    except Exception as e:
        print(f" Error in /query endpoint: {str(e)}")
        return APIResponse(
            success=False,
            message="An error occurred while processing your query.",
            data=None,
            error=str(e)
        )




@router.post("/ingest/local-json", response_model=APIResponse)
async def ingest_local_json_file(payload: LocalJsonIngestRequest):

    try:
        result = process_local_json_file(payload.filename)
        return APIResponse(
            success=True,
            message=f"Successfully structured and ingested JSON records from '{payload.filename}'.",
            data=result,
            error=None
        )
    except FileNotFoundError as fnf:
        return APIResponse(
            success=False,
            message=str(fnf),
            data=None,
            error="File Not Found"
        )
    except Exception as e:
        print(f" Error in /ingest/local-json: {str(e)}")
        return APIResponse(
            success=False,
            message="An error occurred while structured JSON processing.",
            data=None,
            error=str(e)
        )
# ----------------------------------------------------
# ChromaDB Management Endpoints
# ----------------------------------------------------

@router.get("/chroma/items", response_model=APIResponse)
async def list_chroma_items():
   
    try:
        chroma_db = ChromaService()
        stored_ids = chroma_db.list_all_stored_ids()
        
        return APIResponse(
            success=True,
            message=f"Successfully fetched {len(stored_ids)} item IDs from ChromaDB store.",
            data={"stored_ids": stored_ids},
            error=None
        )
    except Exception as e:
        print(f"Error in /chroma/items: {str(e)}")
        return APIResponse(
            success=False,
            message="Failed to retrieve items from ChromaDB.",
            data=None,
            error=str(e)
        )


@router.delete("/chroma/items/by-ids", response_model=APIResponse)
async def delete_chroma_items_by_ids(payload: DeleteIdsRequest):
 
    try:
        chroma_db = ChromaService()
        
      
        chroma_db.delete_by_ids(payload.ids)
        
      
        remaining_ids = chroma_db.list_all_stored_ids()
        
        return APIResponse(
            success=True,
            message=f"Successfully deleted {len(payload.ids)} items from ChromaDB store.",
            data={"deleted_ids": payload.ids, "remaining_count": len(remaining_ids)},
            error=None
        )
    except Exception as e:
        print(f" Error in /chroma/items/by-ids: {str(e)}")
        return APIResponse(
            success=False,
            message="Failed to delete specific items.",
            data=None,
            error=str(e)
        )


@router.delete("/chroma/items/by-filter", response_model=APIResponse)
async def delete_chroma_items_by_filter(
    program_level: Optional[str] = None,
    category: Optional[str] = None
):
    
    if not program_level and not category:
        raise HTTPException(
            status_code=400, 
            detail="Safety lock: Please provide at least program_level or category to execute filter deletion."
        )
        
    try:
        chroma_db = ChromaService()
        
       
        chroma_db.delete_by_filter(program_level=program_level, category=category)
        
      
        remaining_ids = chroma_db.list_all_stored_ids()
        
        return APIResponse(
            success=True,
            message=f"Successfully executed bulk delete on ChromaDB for filter: program_level={program_level}, category={category}.",
            data={"remaining_count": len(remaining_ids)},
            error=None
        )
    except Exception as e:
        print(f" Error in /chroma/items/by-filter: {str(e)}")
        return APIResponse(
            success=False,
            message="Failed to complete filter based deletion.",
            data=None,
            error=str(e)
        )