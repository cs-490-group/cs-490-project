# from dotenv import load_dotenv
# from mongo.dao_setup import db_client, RESET_LINKS
# from mongo.auth_dao import auth_dao
# import os
# import json
# import smtplib
# from email.mime.text import MIMEText
# import secrets
# from datetime import datetime, timedelta
# import hashlib
# import base64
# import pickle
# from google_auth_oauthlib.flow import InstalledAppFlow
# from googleapiclient.discovery import build

# class ForgotPassword:

#     def __init__(self):
#         self.collection = db_client.get_collection(RESET_LINKS)

#         # Load or create credentials
#         creds = None
#         if os.path.exists("token.pkl"):
#             with open("token.pkl", "rb") as f:
#                 creds = pickle.load(f)

#         scopes_env = os.environ.get("SCOPES", "https://www.googleapis.com/auth/gmail.send")
#         SCOPES = scopes_env.split() 

#         if not creds:
#             flow = InstalledAppFlow.from_client_config({
#         "installed": {
#             "client_id": os.environ["GOOGLE_CLIENT_ID_EMAIL"],
#             "client_secret": os.environ["GOOGLE_CLIENT_SECRET_EMAIL"],
#             "auth_uri": "https://accounts.google.com/o/oauth2/auth",
#             "token_uri": "https://oauth2.googleapis.com/token",
#             "redirect_uris": ["http://localhost"]
#         }
#     }, SCOPES)  

#             creds = flow.run_local_server(port=0)
#             with open("token.pkl", "wb") as f:
#                 pickle.dump(creds, f)

# # Build Gmail service
#         self.service = build('gmail', 'v1', credentials=creds)

#         # Cache the authorized Gmail email
#         profile = self.service.users().getProfile(userId='me').execute()
#         self.from_email = profile['emailAddress']

#     def send_email(self, email):
#         import secrets, base64
#         from email.mime.text import MIMEText

#         token = secrets.token_urlsafe(32)
#         subject = "Metamorphosis - Password Reset"
#         body_text = f"""
#         This is a password reset request for your metamorphosis account,

#         Click the link below to reset your password. This link expires in 1 hour:

#         http://localhost:3000/resetPassword/{token}

#         If you did not make this request, consider resetting your password anyway.
#         """

#         msg = MIMEText(body_text)
#         msg["From"] = self.from_email
#         msg["To"] = email
#         msg["Subject"] = subject

#         raw_message = base64.urlsafe_b64encode(msg.as_bytes()).decode()
#         body = {'raw': raw_message}

#         try:
#             sent_message = self.service.users().messages().send(userId='me', body=body).execute()
#             print(f"Email sent to {email}!")
#             return token
#         except Exception as e:
#             print("Error sending email:", e)


#     async def store_link(self,id,email,token):

#         db_token = hashlib.sha256(token.encode()).hexdigest() # send this to db

#         body = {
#             "_id": id,
#             "email": email,
#             "token": db_token,
#             "expires": datetime.now() + timedelta(hours=1)
#         }
#         await self.collection.insert_one(body)

#     async def verify_link(self,token):

#         try:
#             db_token = hashlib.sha256(token.encode()).hexdigest()
#             data = await self.collection.find_one({"token":db_token})
#             if data:
#                 expires = data["expires"]
#                 email = data["email"]
#                 uuid = await auth_dao.get_uuid(email)
#                 return uuid,expires
        
#         except Exception as e:
#             return (None,None)



import os
import smtplib
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText
from dotenv import load_dotenv
from mongo.dao_setup import db_client, RESET_LINKS
from mongo.auth_dao import auth_dao






import json
from bson import json_util



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

        subject = "Metamorphosis - Password Reset Request"
        
        # HTML email body
        html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #004d7a, #008793, #00bf72); padding: 40px 20px; text-align: center;">
                                <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">🔐 Password Reset</h1>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px 30px;">
                                <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                                    You recently requested to reset your password for your <strong style="color: #004d7a;">Metamorphosis</strong> account.
                                </p>
                                <p style="margin: 0 0 30px 0; color: #6c757d; font-size: 16px; line-height: 1.6;">
                                    Click the button below to reset your password. This link will expire in <strong>1 hour</strong>.
                                </p>
                                
                                <!-- CTA Button -->
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center" style="padding: 20px 0;">
                                            <a href="{reset_link}" 
                                            style="display: inline-block; background-color: #00bf72; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 10px rgba(0, 191, 114, 0.3); transition: background-color 0.3s;">
                                                Reset My Password
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Alternative link -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                                    <tr>
                                        <td style="padding: 20px; background-color: #f9f9f9; border-radius: 8px; border-left: 4px solid #00bf72;">
                                            <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 13px;">
                                                If the button above doesn't work, copy and paste this link into your browser:
                                            </p>
                                            <p style="margin: 0; color: #008793; font-size: 13px; word-break: break-all;">
                                                {reset_link}
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Security notice -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                                    <tr>
                                        <td style="padding: 20px; background-color: #fff9e6; border-radius: 8px; border: 1px solid #ffd966;">
                                            <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                                                ⚠️ <strong>Security Notice:</strong> If you did not request a password reset, please ignore this email. Your password will remain unchanged.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                                <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px;">
                                    This is an automated message from <strong style="color: #004d7a;">Metamorphosis</strong>
                                </p>
                                <p style="margin: 0; color: #ccc; font-size: 12px;">
                                    Please do not reply to this email.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
        
        msg = MIMEText(html, "html")
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
        expires = datetime.now(tz=timezone.utc) + timedelta(hours=1)

        doc = {
            "_id": user_id,
            "email": email,
            "token": db_token,
            "expires": expires,
        }

        print("REACHED FUNCTION")
        print (user_id)
        #await self.collection.replace_one({"_id": user_id}, doc, upsert=True)
        try:
            #print("Storing document in MongoDB:")
            #print(json.dumps(doc, indent=4, default=json_util.default))

            await self.collection.replace_one({"_id": user_id}, doc, upsert=True)
            #print("Matched:", result.matched_count, "Modified:", result.modified_count)
            
        except Exception as e:
            print("Error storing token:", e)

        await self.collection.create_index("expires", expireAfterSeconds=0)
        
        
        data = await self.collection.find_one({"token": db_token})
            
        if not data:
            print("Token not found in DB")
            return None, None

        print("STORE TOKEN", db_token)
        
        print("expires:", data["expires"])
        
        
        
        

    async def verify_link(self, token: str):
        try:
            db_token = hashlib.sha256(token.encode()).hexdigest()
            data = await self.collection.find_one({"token": db_token})
            
            print(db_token)
            if not data:
                print("NO DATA")
                return None, None
                
            # Use UTC for comparison
            
            print(data["expires"])
            print(datetime.now(timezone.utc))
            
            
            expires = data["expires"].replace(tzinfo=timezone.utc)
            if expires < datetime.now(timezone.utc):
                await self.collection.delete_one({"token": db_token})
                return None, None

            email = data["email"]
            uuid = await auth_dao.get_uuid(email)
            # await self.collection.delete_one({"token": db_token})
            print("RETURNING SOMETHING")
            return uuid, data["expires"]
        except Exception as e:
            print("Error verifying token:", e)
            return None, None





    async def delete_link(self, token: str):
        try:
            db_token = hashlib.sha256(token.encode()).hexdigest()
            data = await self.collection.find_one({"token": db_token})
            print("IN DELETE")
            print(db_token)
            await self.collection.delete_one({"token": db_token})
        except Exception as e:
            print("Error verifying token:", e)
            return None, None