import os
import smtplib
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText
from dotenv import load_dotenv
from mongo.dao_setup import db_client, RESET_LINKS
from mongo.auth_dao import auth_dao


class ForgotPassword:
    def __init__(self):
        load_dotenv()

        self.collection = db_client.get_collection(RESET_LINKS)
        self.from_email = os.environ["GMAIL_SENDER"]
        self.password = os.environ["GMAIL_APP_PASSWORD"]
        self.frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")

    def send_email(self, to_email: str) -> str:
        """Send a password reset email with a secure token."""
        token = secrets.token_urlsafe(32)
        reset_link = f"{self.frontend_url}/resetPassword/{token}"

        subject = "Metamorphosis - Password Reset"
        body = (
            f"This is a password reset request for your Metamorphosis account.\n\n"
            f"Click the link below to reset your password. This link expires in 1 hour:\n\n"
            f"{reset_link}\n\n"
            "If you did not make this request, please ignore this email."
        )

        msg = MIMEText(body)
        msg["From"] = self.from_email
        msg["To"] = to_email
        msg["Subject"] = subject

        try:
            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                server.login(self.from_email, self.password)
                server.send_message(msg)
            print(f"Password reset email sent to {to_email}")
            return token
        except Exception as e:
            print("Error sending email:", e)
            raise

    async def store_link(self, user_id: str, email: str, token: str):
        """Store a hashed reset token in MongoDB with a 1-hour expiration."""
        db_token = hashlib.sha256(token.encode()).hexdigest()
        expires = datetime.now() + timedelta(hours=1)

        doc = {
            "_id": user_id,
            "email": email,
            "token": db_token,
            "expires": expires,
        }

        await self.collection.replace_one({"_id": user_id}, doc, upsert=True)
        await self.collection.create_index("expires", expireAfterSeconds=0)

    async def verify_link(self, token: str):
        """Verify if a reset link token is valid and not expired."""
        try:
            db_token = hashlib.sha256(token.encode()).hexdigest()
            data = await self.collection.find_one({"token": db_token})
            
            if not data:
                print("Token not found in DB")
                return None, None

            print("Token found!")
            print("expires:", data["expires"])
            print("now:", datetime.utcnow())

            
            
            if not data:
                return None, None
            if data["expires"] < datetime.now():
                await self.collection.delete_one({"token": db_token})
                return None, None

            email = data["email"]
            uuid = await auth_dao.get_uuid(email)
            await self.collection.delete_one({"token": db_token})
            return uuid, data["expires"]
        except Exception as e:
            print("Error verifying token:", e)
            return None, None
