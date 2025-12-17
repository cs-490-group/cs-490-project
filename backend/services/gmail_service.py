"""
Gmail API Integration Service for Job Application Email Tracking
Provides read-only access to Gmail for linking emails to job applications
"""

import os
import pickle
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import base64
import re

# Gmail API scopes - read-only access
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

class GmailService:
    """Gmail API service for reading and searching emails"""
    
    def __init__(self):
        self.service = None
        self.creds = None
        
    def authenticate(self, user_id: str) -> bool:
        """
        Authenticate user with Gmail API
        Returns True if authentication successful
        """
        creds = None
        token_path = f"tokens/gmail_token_{user_id}.pickle"
        
        # Check for existing token
        if os.path.exists(token_path):
            with open(token_path, 'rb') as token:
                creds = pickle.load(token)
        
        # Refresh or get new credentials
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                try:
                    creds.refresh(Request())
                except Exception as e:
                    print(f"Error refreshing token: {e}")
                    return False
            else:
                return False  # Need to go through OAuth flow
        
        self.creds = creds
        self.service = build('gmail', 'v1', credentials=creds)
        return True
    
    def get_oauth_url(self, user_id: str) -> str:
        """
        Generate OAuth URL for user to authorize Gmail access
        """
        credentials_path = os.getenv('GMAIL_CREDENTIALS_PATH', 'credentials.json')
        
        flow = InstalledAppFlow.from_client_secrets_file(
            credentials_path,
            SCOPES,
            redirect_uri=os.getenv('GMAIL_REDIRECT_URI', 'http://localhost:8000/gmail/callback')
        )
        
        auth_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            state=user_id  # Pass user_id in state
        )
        
        return auth_url
    
    def handle_oauth_callback(self, code: str, user_id: str) -> bool:
        """
        Handle OAuth callback and save credentials
        """
        try:
            credentials_path = os.getenv('GMAIL_CREDENTIALS_PATH', 'credentials.json')
            
            flow = InstalledAppFlow.from_client_secrets_file(
                credentials_path,
                SCOPES,
                redirect_uri=os.getenv('GMAIL_REDIRECT_URI', 'http://localhost:8000/gmail/callback')
            )
            
            flow.fetch_token(code=code)
            creds = flow.credentials
            
            # Save credentials
            os.makedirs('tokens', exist_ok=True)
            token_path = f"tokens/gmail_token_{user_id}.pickle"
            
            with open(token_path, 'wb') as token:
                pickle.dump(creds, token)
            
            self.creds = creds
            self.service = build('gmail', 'v1', credentials=creds)
            
            return True
            
        except Exception as e:
            print(f"Error in OAuth callback: {e}")
            return False
    
    def search_emails(self, query: str, max_results: int = 20) -> List[Dict]:
        """
        Search emails by query
        Returns list of email metadata
        """
        if not self.service:
            raise ValueError("Not authenticated with Gmail")
        
        try:
            # Search for messages
            results = self.service.users().messages().list(
                userId='me',
                q=query,
                maxResults=max_results
            ).execute()
            
            messages = results.get('messages', [])
            
            # Get full message details
            email_list = []
            for message in messages:
                msg = self.service.users().messages().get(
                    userId='me',
                    id=message['id'],
                    format='metadata',
                    metadataHeaders=['Subject', 'From', 'Date']
                ).execute()
                
                # Extract headers
                headers = {h['name']: h['value'] for h in msg['payload']['headers']}
                
                # Get snippet
                snippet = msg.get('snippet', '')
                
                email_list.append({
                    'id': message['id'],
                    'thread_id': msg['threadId'],
                    'subject': headers.get('Subject', ''),
                    'from': headers.get('From', ''),
                    'date': headers.get('Date', ''),
                    'snippet': snippet,
                    'labels': msg.get('labelIds', [])
                })
            
            return email_list
            
        except HttpError as error:
            print(f"Gmail API error: {error}")
            return []
    
    def search_by_company(self, company_name: str, days_back: int = 90) -> List[Dict]:
        """
        Search emails by company name within specified days
        """
        # Calculate date range
        date = datetime.now() - timedelta(days=days_back)
        date_str = date.strftime('%Y/%m/%d')
        
        query = f"from:*{company_name.lower()}* OR subject:*{company_name}* after:{date_str}"
        
        return self.search_emails(query)
    
    def search_by_keywords(self, keywords: List[str], days_back: int = 90) -> List[Dict]:
        """
        Search emails by multiple keywords
        """
        date = datetime.now() - timedelta(days=days_back)
        date_str = date.strftime('%Y/%m/%d')
        
        # Build query with OR conditions
        keyword_query = " OR ".join([f"subject:*{kw}*" for kw in keywords])
        query = f"({keyword_query}) after:{date_str}"
        
        return self.search_emails(query)
    
    def get_email_body(self, email_id: str) -> str:
        """
        Get full email body text
        """
        if not self.service:
            raise ValueError("Not authenticated with Gmail")
        
        try:
            message = self.service.users().messages().get(
                userId='me',
                id=email_id,
                format='full'
            ).execute()
            
            # Extract body
            if 'parts' in message['payload']:
                parts = message['payload']['parts']
                body = ''
                for part in parts:
                    if part['mimeType'] == 'text/plain':
                        data = part['body'].get('data', '')
                        body = base64.urlsafe_b64decode(data).decode('utf-8')
                        break
                return body
            else:
                data = message['payload']['body'].get('data', '')
                return base64.urlsafe_b64decode(data).decode('utf-8')
                
        except HttpError as error:
            print(f"Error getting email body: {error}")
            return ""
    
    def detect_status_from_email(self, subject: str, snippet: str) -> Optional[str]:
        """
        Detect job application status from email content
        Returns status if detected, None otherwise
        """
        subject_lower = subject.lower()
        snippet_lower = snippet.lower()
        combined = f"{subject_lower} {snippet_lower}"
        
        # Interview keywords
        interview_keywords = [
            'interview', 'schedule', 'phone screen', 'video call',
            'meet with', 'discussion', 'chat with', 'interview invitation'
        ]
        
        # Offer keywords
        offer_keywords = [
            'offer', 'congratulations', 'welcome to', 'we are pleased',
            'job offer', 'offer letter', 'compensation', 'accept offer'
        ]
        
        # Rejection keywords
        rejection_keywords = [
            'unfortunately', 'not selected', 'not moving forward',
            'other candidates', 'decided to pursue', 'not a match',
            'regret to inform', 'will not be moving'
        ]
        
        # Screening keywords
        screening_keywords = [
            'application received', 'reviewing your application',
            'next steps', 'under review', 'received your application'
        ]
        
        # Check for status indicators
        if any(keyword in combined for keyword in offer_keywords):
            return 'Offer'
        elif any(keyword in combined for keyword in rejection_keywords):
            return 'Rejected'
        elif any(keyword in combined for keyword in interview_keywords):
            return 'Interview'
        elif any(keyword in combined for keyword in screening_keywords):
            return 'Screening'
        
        return None
    
    def revoke_access(self, user_id: str) -> bool:
        """
        Revoke Gmail access and delete stored credentials
        """
        try:
            token_path = f"tokens/gmail_token_{user_id}.pickle"
            
            if os.path.exists(token_path):
                os.remove(token_path)
            
            self.service = None
            self.creds = None
            
            return True
            
        except Exception as e:
            print(f"Error revoking access: {e}")
            return False


gmail_service = GmailService()