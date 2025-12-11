from pydantic import BaseModel
from typing import Optional


class AIGenerate(BaseModel):
    ''' 
    prompt: the actual prompy to send to the AI
    system_messageL guidelines for the AI to follow.
    '''
    prompt: str
    system_message: Optional[str] = ""

