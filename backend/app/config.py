import os
from dotenv import load_dotenv

# .env file load
load_dotenv()

class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    UPLOAD_DIR: str = "documents"
    # Dynamic Role settings for Helpdesk
    HELPDESK_ROLE: str = "Virtual Help Desk AI Assistant"
    DEPARTMENT_NAME: str = "IT Department"
    INSTITUTION_NAME: str = "University"

settings = Settings()