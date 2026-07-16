
from fastapi import FastAPI
from app.api.endpoints import router as api_router
from app.api.admin import router as admin_router
from app.api.chroma import router as chroma_router
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI(
    title="AI HELP ENGINE", 
    description="Asynchronous Ingestion and Embedded RAG API Backend"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)


# Registrating routes with prefix '/api'
app.include_router(api_router, prefix="/api")

app.include_router(admin_router, prefix="/admin")

app.include_router(chroma_router,prefix="/chroma")

@app.get("/")
def root():
    return {"message": "Go to /docs to view Swagger documentation"}