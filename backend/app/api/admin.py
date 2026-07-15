
from fastapi import APIRouter, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
import chromadb

# Admin router 
router = APIRouter()

# --- CUSTOM DATABASE VIEWER & DELETER ---
@router.get("/db", response_class=HTMLResponse)
async def db_admin_dashboard(request: Request):
    """Dashboard to see chromaDB data"""
    client = chromadb.PersistentClient(path="./chroma_db_store")
    collections = client.list_collections()
    
    html_content = """
    <html>
        <head>
            <title>ChromaDB Admin Panel</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-100 p-8">
            <div class="max-w-6xl mx-auto">
                <h1 class="text-3xl font-bold text-gray-800 mb-6">🛠️ ChromaDB Local Admin Panel</h1>
                
                <div class="bg-white shadow rounded-lg p-6 mb-8">
                    <h2 class="text-xl font-semibold mb-4 text-indigo-600">Active Collections</h2>
    """
    
    if not collections:
        html_content += "<p class='text-gray-500'>No collections found in chroma_db_store.</p>"
    else:
        for col in collections:
            data = col.get()
            html_content += f"""
            <div class="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-gray-700">📦 Collection: {col.name}</h3>
                    <form action="/admin/db/delete-collection" method="POST" onsubmit="return confirm('Are you sure you want to delete this entire collection?');">
                        <input type="hidden" name="collection_name" value="{col.name}">
                        <button type="submit" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold">
                            Delete Collection
                        </button>
                    </form>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="min-w-full bg-white border border-gray-200">
                        <thead>
                            <tr class="bg-gray-100 border-b border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase">
                                <th class="px-4 py-2">ID</th>
                                <th class="px-4 py-2">Document (Chunk Content)</th>
                                <th class="px-4 py-2">Metadata</th>
                                <th class="px-4 py-2 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody class="text-sm">
            """
            
            for idx, doc_id in enumerate(data['ids']):
                doc = data['documents'][idx] if data['documents'] else ""
                meta = data['metadatas'][idx] if data['metadatas'] else {}
                
                html_content += f"""
                <tr class="border-b border-gray-100 hover:bg-gray-50">
                    <td class="px-4 py-2 font-mono text-xs text-blue-600">{doc_id}</td>
                    <td class="px-4 py-2 text-gray-700 max-w-md truncate" title="{doc}">{doc}</td>
                    <td class="px-4 py-2 text-xs text-gray-500 font-mono">{meta}</td>
                    <td class="px-4 py-2 text-center">
                        <form action="/admin/db/delete-document" method="POST" class="inline">
                            <input type="hidden" name="collection_name" value="{col.name}">
                            <input type="hidden" name="document_id" value="{doc_id}">
                            <button type="submit" class="text-red-600 hover:text-red-800 font-semibold">Delete</button>
                        </form>
                    </td>
                </tr>
                """
            
            html_content += """
                        </tbody>
                    </table>
                </div>
            </div>
            """
            
    html_content += """
                </div>
            </div>
        </body>
    </html>
    """
    return HTMLResponse(content=html_content)


# --- BACKEND ENDPOINTS FOR ACTIONS ---
@router.post("/db/delete-document")
async def delete_document(collection_name: str = Form(...), document_id: str = Form(...)):
    """TO delete specific chunk/document from the collection"""
    client = chromadb.PersistentClient(path="./chroma_db_store")
    collection = client.get_collection(name=collection_name)
    collection.delete(ids=[document_id])
    return RedirectResponse(url="/admin/db", status_code=303)


@router.post("/db/delete-collection")
async def delete_collection(collection_name: str = Form(...)):
    """TO Delete full Collection"""
    client = chromadb.PersistentClient(path="./chroma_db_store")
    client.delete_collection(name=collection_name)
    return RedirectResponse(url="/admin/db", status_code=303)