from pydantic import BaseModel

class LoginCred(BaseModel):
    email: str
    password: str

class RegistInfo(BaseModel):
    username: str
    password: str
    email: str
    full_name: str
