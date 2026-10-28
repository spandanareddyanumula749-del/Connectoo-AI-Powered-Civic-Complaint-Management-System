import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timedelta, timezone
import secrets
from typing import Optional, Tuple
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.SMTP_FROM_EMAIL
        self.from_name = settings.SMTP_FROM_NAME
        self.use_tls = settings.SMTP_TLS
        self.frontend_url = settings.FRONTEND_URL.rstrip('/')

    @property
    def is_smtp_configured(self) -> bool:
        return bool(self.smtp_host and self.smtp_port and self.smtp_user and self.smtp_password)

    def generate_token(self) -> str:
        return secrets.token_urlsafe(32)

    def get_token_expiry(self, hours: int = 24) -> datetime:
        return datetime.now(timezone.utc) + timedelta(hours=hours)

    def _send_email(self, to_email: str, subject: str, html_content: str, text_content: str) -> Tuple[bool, str]:
        """
        Sends an email via SMTP if configured.
        If SMTP is not configured, logs to console in local development mode.
        """
        if not self.is_smtp_configured:
            logger.info("=" * 60)
            logger.info("[CONNECTOO EMAIL - LOCAL DEV MODE]")
            logger.info(f"Recipient: {to_email}")
            logger.info(f"Subject: {subject}")
            logger.info(f"Content:\n{text_content}")
            logger.info("=" * 60)
            return True, "Email dispatched to local development logger (SMTP not configured)."

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = to_email

            part1 = MIMEText(text_content, "plain")
            part2 = MIMEText(html_content, "html")
            msg.attach(part1)
            msg.attach(part2)

            with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=10) as server:
                if self.use_tls:
                    server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.sendmail(self.from_email, [to_email], msg.as_string())

            logger.info(f"Email successfully delivered to {to_email} via SMTP.")
            return True, "Email successfully delivered via SMTP."
        except Exception as e:
            logger.error(f"Failed to send email to {to_email} via SMTP: {e}")
            return False, f"SMTP delivery error: {str(e)}"

    def send_verification_email(self, to_email: str, full_name: str, token: str) -> Tuple[bool, str]:
        verification_link = f"{self.frontend_url}/verify-email?token={token}&email={to_email}"
        subject = "Connectoo - Verify Your Email Address"
        
        text_content = f"""Hello {full_name},

Thank you for registering on Connectoo - AI-Powered Civic Management Platform.

Please verify your email address to activate your account by opening this link:
{verification_link}

This link is valid for 24 hours.

If you did not register for an account, please disregard this email.

Best regards,
Connectoo Municipal Administration Team
"""

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF9F6; margin: 0; padding: 24px; color: #29332F; }}
    .container {{ max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #DCE9DF; padding: 32px; box-shadow: 0 4px 12px rgba(49, 92, 75, 0.05); }}
    .header {{ text-align: center; margin-bottom: 24px; }}
    .brand {{ color: #315C4B; font-size: 24px; font-weight: 800; text-decoration: none; }}
    .btn {{ display: inline-block; background-color: #315C4B; color: #ffffff !important; padding: 14px 28px; border-radius: 10px; font-weight: 700; text-decoration: none; margin: 20px 0; }}
    .footer {{ font-size: 12px; color: #718096; margin-top: 32px; border-top: 1px solid #E8F3ED; padding-top: 16px; text-align: center; }}
    .badge {{ background-color: #E8F3ED; color: #315C4B; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">Municipal Service Portal</div>
      <h2 style="color: #315C4B; margin-top: 8px;">Connectoo Account Verification</h2>
    </div>
    <p>Hello <strong>{full_name}</strong>,</p>
    <p>Thank you for signing up for <strong>Connectoo</strong>. Please confirm your email address to complete registration and begin reporting, tracking, and resolving municipal infrastructure issues in your community.</p>
    
    <div style="text-align: center;">
      <a href="{verification_link}" class="btn" target="_blank">Verify My Email Address</a>
    </div>

    <p style="font-size: 13px; color: #4A5568; word-break: break-all;">
      If the button above does not work, copy and paste this link into your browser:<br>
      <a href="{verification_link}" style="color: #315C4B;">{verification_link}</a>
    </p>

    <div class="footer">
      <p>This verification link expires in 24 hours.<br>If you did not request this account, you can safely ignore this message.</p>
      <p>&copy; {datetime.now().year} Connectoo – AI-Powered Civic Management System. Built for Municipal Governance.</p>
    </div>
  </div>
</body>
</html>
"""
        return self._send_email(to_email, subject, html_content, text_content)

    def send_password_reset_email(self, to_email: str, full_name: str, token: str) -> Tuple[bool, str]:
        reset_link = f"{self.frontend_url}/reset-password?token={token}&email={to_email}"
        subject = "Connectoo - Password Reset Request"

        text_content = f"""Hello {full_name},

We received a request to reset the password for your Connectoo account.

Click the link below to set a new password:
{reset_link}

This link is valid for 1 hour. If you did not request a password reset, please ignore this email and your password will remain unchanged.

Best regards,
Connectoo Municipal Security Team
"""

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF9F6; margin: 0; padding: 24px; color: #29332F; }}
    .container {{ max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #DCE9DF; padding: 32px; box-shadow: 0 4px 12px rgba(49, 92, 75, 0.05); }}
    .header {{ text-align: center; margin-bottom: 24px; }}
    .btn {{ display: inline-block; background-color: #315C4B; color: #ffffff !important; padding: 14px 28px; border-radius: 10px; font-weight: 700; text-decoration: none; margin: 20px 0; }}
    .footer {{ font-size: 12px; color: #718096; margin-top: 32px; border-top: 1px solid #E8F3ED; padding-top: 16px; text-align: center; }}
    .badge {{ background-color: #F9E8DE; color: #9C4221; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">Security Notice</div>
      <h2 style="color: #315C4B; margin-top: 8px;">Reset Your Connectoo Password</h2>
    </div>
    <p>Hello <strong>{full_name}</strong>,</p>
    <p>We received a request to reset your password for the <strong>Connectoo</strong> platform. Click the button below to choose a new password.</p>
    
    <div style="text-align: center;">
      <a href="{reset_link}" class="btn" target="_blank">Reset Password</a>
    </div>

    <p style="font-size: 13px; color: #4A5568; word-break: break-all;">
      If the button does not work, visit this URL:<br>
      <a href="{reset_link}" style="color: #315C4B;">{reset_link}</a>
    </p>

    <div class="footer">
      <p>This password reset link expires in 1 hour.<br>If you did not request this change, please ignore this email.</p>
      <p>&copy; {datetime.now().year} Connectoo – AI-Powered Civic Management System. Built for Municipal Governance.</p>
    </div>
  </div>
</body>
</html>
"""
        return self._send_email(to_email, subject, html_content, text_content)

    def send_worker_invitation_email(self, to_email: str, full_name: str, temp_password: str, department_name: str) -> Tuple[bool, str]:
        login_link = f"{self.frontend_url}/login"
        subject = "Connectoo - Field Worker Account Invitation"

        text_content = f"""Hello {full_name},

You have been provisioned as a Field Personnel for the {department_name} department on the Connectoo Municipal Management Platform.

Your temporary login credentials are:
Email: {to_email}
Temporary Password: {temp_password}

Login URL: {login_link}

Please sign in and change your password upon your first session.

Best regards,
Connectoo Municipal Administration
"""

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF9F6; margin: 0; padding: 24px; color: #29332F; }}
    .container {{ max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #DCE9DF; padding: 32px; box-shadow: 0 4px 12px rgba(49, 92, 75, 0.05); }}
    .header {{ text-align: center; margin-bottom: 24px; }}
    .btn {{ display: inline-block; background-color: #315C4B; color: #ffffff !important; padding: 14px 28px; border-radius: 10px; font-weight: 700; text-decoration: none; margin: 20px 0; }}
    .creds-box {{ background-color: #E8F3ED; border: 1px solid #DCE9DF; border-radius: 12px; padding: 16px; margin: 16px 0; }}
    .footer {{ font-size: 12px; color: #718096; margin-top: 32px; border-top: 1px solid #E8F3ED; padding-top: 16px; text-align: center; }}
    .badge {{ background-color: #DCE9DF; color: #315C4B; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">Official Staff Onboarding</div>
      <h2 style="color: #315C4B; margin-top: 8px;">Field Worker Account Invitation</h2>
    </div>
    <p>Hello <strong>{full_name}</strong>,</p>
    <p>An administrator has created your field officer account for the <strong>{department_name}</strong> division on Connectoo.</p>
    
    <div class="creds-box">
      <p style="margin: 4px 0;"><strong>Username / Email:</strong> {to_email}</p>
      <p style="margin: 4px 0;"><strong>Temporary Password:</strong> <code style="background: #ffffff; padding: 2px 6px; border-radius: 4px;">{temp_password}</code></p>
    </div>

    <div style="text-align: center;">
      <a href="{login_link}" class="btn" target="_blank">Sign In to Worker Dashboard</a>
    </div>

    <div class="footer">
      <p>Please change your password immediately after logging in.<br>Connectoo – AI-Powered Civic Management System.</p>
    </div>
  </div>
</body>
</html>
"""
        return self._send_email(to_email, subject, html_content, text_content)

email_service = EmailService()
