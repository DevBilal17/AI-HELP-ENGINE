
import os
import chromadb
from chromadb.config import Settings
from typing import List, Dict, Any

# Path where chromadb data store (Persistent Storage)
DB_PATH = os.path.join(os.getcwd(), "chroma_db_store")

# Initialize persistent local client
print(f"📦 Initializing Persistent ChromaDB Client at: {DB_PATH}")
chroma_client = chromadb.PersistentClient(path=DB_PATH)

class ChromaService:
    def __init__(self, collection_name: str = "ai_help_engine"):

        self.collection_name = collection_name

        self.collection = chroma_client.get_or_create_collection(name=self.collection_name)
        print(f" Collection '{self.collection_name}' is ready for operations!")

    def upsert_chunks(self, embedded_chunks: List[Dict[str, Any]]):
      
        if not embedded_chunks:
            print("No chunks provided to save.")
            return

        total_items = len(embedded_chunks)
        print(f"\n Upserting {total_items} chunks into ChromaDB...")

       
        ids = []
        embeddings = []
        documents = []
        metadatas = []

        for index, item in enumerate(embedded_chunks):
            ids.append(item["chunk_id"])
            embeddings.append(item["embedding"])
            
          
            documents.append(item["content"])

           
            metadata_to_save = {
                "category": item["category"],
                "tags_str": ", ".join(item["tags"]),
                "questions_str": " | ".join(item["questions"]) if "questions" in item else ""
            }
            
            
            if item["metadata"]:
                for key, val in item["metadata"].items():
                   
                    if isinstance(val, (str, int, float, bool)):
                        metadata_to_save[key] = val

            metadatas.append(metadata_to_save)

        try:
            self.collection.upsert(
                ids=ids,
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas
            )
            print(f" Successfully stored {total_items} items in ChromaDB!")
        except Exception as e:
            print(f" Failed to upsert data inside ChromaDB: {str(e)}")
            raise e

    def query_semantic_search(self, query_embedding: List[float], program_level: str = None, category: str = None, limit: int = 3) -> List[Dict[str, Any]]:

        print(f"\n Executing Semantic Search...")
        
        # Build Dynamic Filter (Metadata Where Clause)
        where_filter = {}
        filters_list = []

        if program_level:
            filters_list.append({"program_level": program_level})

        if category:
            filters_list.append({"category": category})


        if len(filters_list) > 1:
            where_filter = {"$and": filters_list}
        elif len(filters_list) == 1:
            where_filter = filters_list[0]
        else:
            where_filter = None  # No filter, search all

        print(f" Applied Filters: {where_filter}")

        try:
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=limit,
                where=where_filter 
            )

            formatted_results = []
            if results and results["ids"]:
                for i in range(len(results["ids"][0])):
                    res_item = {
                        "chunk_id": results["ids"][0][i],
                        "content": results["documents"][0][i],
                        "metadata": results["metadatas"][0][i],
                        
                        "score": results["distances"][0][i] if "distances" in results and results["distances"] else None
                    }
                    formatted_results.append(res_item)
                    print(f"  -> Match Found: [{res_item['chunk_id']}] Score: {res_item['score']}")
            
            return formatted_results

        except Exception as e:
            print(f" ChromaDB query execution failed: {str(e)}")
            return []
    

    def list_all_stored_ids(self) -> List[str]:
  
        print(f"\ Fetching all stored records from collection '{self.collection_name}'...")
        try:
            
            results = self.collection.get()
            stored_ids = results.get("ids", [])
            metadatas = results.get("metadatas", [])
            
            print(f"Total stored unique items: {len(stored_ids)}")
            for idx, item_id in enumerate(stored_ids):
                meta = metadatas[idx] if idx < len(metadatas) else {}
                prog = meta.get("program_level", "N/A")
                cat = meta.get("category", "N/A")
                print(f"  [{idx + 1}] ID: {item_id} | Program: {prog} | Category: {cat}")
                
            return stored_ids
        except Exception as e:
            print(f" Failed to fetch stored IDs: {str(e)}")
            return []

    def delete_by_ids(self, ids_to_delete: List[str]):

        if not ids_to_delete:
            print("No IDs provided for deletion.")
            return

        print(f"\n Deleting specific records with IDs: {ids_to_delete}")
        try:
            # ChromaDB built-in delete filter
            self.collection.delete(ids=ids_to_delete)
            print(f" Successfully deleted {len(ids_to_delete)} items from database!")
        except Exception as e:
            print(f" Error deleting items: {str(e)}")
            raise e

    def delete_by_filter(self, program_level: str = None, category: str = None):
    
        # Build metadata filter
        delete_filter = {}
        filters_list = []

        if program_level:
            filters_list.append({"program_level": program_level})
        if category:
            filters_list.append({"category": category})

        if len(filters_list) > 1:
            delete_filter = {"$and": filters_list}
        elif len(filters_list) == 1:
            delete_filter = filters_list[0]
        else:
            print(" Please provide at least program_level or category to perform filter deletion.")
            return

        print(f"\n Executing block deletion with metadata filter: {delete_filter}")
        try:
            self.collection.delete(where=delete_filter)
            print("Filter based deletion completed successfully!")
        except Exception as e:
            print(f" Error performing filter deletion: {str(e)}")
            raise e