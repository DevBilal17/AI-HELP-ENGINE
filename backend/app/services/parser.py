
import os
import pypdf
import docx2txt
from fastapi import HTTPException
from typing import List
from langchain_text_splitters import RecursiveCharacterTextSplitter

def extract_text_from_file(file_path: str, filename: str) -> str:
    text = ""
    file_extension = os.path.splitext(filename)[1].lower()
    
    if file_extension == ".pdf":
        with open(file_path, "rb") as f:
            reader = pypdf.PdfReader(f)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
                    
    elif file_extension in [".docx", ".doc"]:
        text = docx2txt.process(file_path)
        
    elif file_extension == ".txt":
        with open(file_path, "r", encoding="utf-8") as f:
            text = f.read()
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format.")
    
    return text.strip()


def split_text_recursively(text: str, chunk_size: int = 1500, chunk_overlap: int = 150) -> List[str]:

    if not text.strip():
        return []

    
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ".", " ", ""] 
    )
    
    #return list of strings
    chunks = splitter.split_text(text)
    return chunks