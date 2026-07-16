from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import chromadb

# Admin router
router = APIRouter()

class BulkDeleteRequest(BaseModel):
    document_ids: list[str]

# Dependency or helper to get the client
def get_chroma_client():
    return chromadb.PersistentClient(path="./chroma_db_store")

# --- GET ALL COLLECTIONS AND THEIR DOCUMENTS ---
@router.get("/db/collections")
async def get_collections_data():
    """Returns all collections along with their embedded document IDs, contents, and metadatas as JSON."""
    try:
        client = get_chroma_client()
        collections = client.list_collections()
        result = []
        
        for col in collections:
            data = col.get()
            documents_list = []
            
            # Map the lists of ids, documents, and metadatas into a clean list of dicts
            for idx, doc_id in enumerate(data.get('ids', [])):
                documents_list.append({
                    "id": doc_id,
                    "document": data['documents'][idx] if data.get('documents') else "",
                    "metadata": data['metadatas'][idx] if data.get('metadatas') else {}
                })
                
            result.append({
                "name": col.name,
                "documents": documents_list
            })
            
        return {"collections": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- DELETE A SPECIFIC DOCUMENT ---
@router.delete("/db/collections/{collection_name}/documents/{document_id}")
async def delete_document(collection_name: str, document_id: str):
    """Deletes a single document chunk from a collection."""
    try:
        client = get_chroma_client()
        collection = client.get_collection(name=collection_name)
        collection.delete(ids=[document_id])
        return {"message": f"Document {document_id} successfully deleted from {collection_name}."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- DELETE AN ENTIRE COLLECTION ---
@router.delete("/db/collections/{collection_name}")
async def delete_collection(collection_name: str):
    """Deletes a whole collection."""
    try:
        client = get_chroma_client()
        client.delete_collection(name=collection_name)
        return {"message": f"Collection {collection_name} successfully deleted."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    


# --- BULK DELETE DOCUMENTS ---
@router.post("/db/collections/{collection_name}/documents/bulk-delete")
async def bulk_delete_documents(collection_name: str, request: BulkDeleteRequest):
    """Deletes multiple document chunks from a collection at once."""
    try:
        client = get_chroma_client()
        collection = client.get_collection(name=collection_name)
        
        # ChromaDB's collection.delete natively accepts a list of IDs!
        collection.delete(ids=request.document_ids)
        
        return {
            "message": f"Successfully deleted {len(request.document_ids)} documents from {collection_name}."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))