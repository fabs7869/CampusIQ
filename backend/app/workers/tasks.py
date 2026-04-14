from app.workers.worker import celery_app
from loguru import logger
import time


@celery_app.task(name="app.workers.tasks.send_notification")
def send_notification(user_email: str, subject: str, body: str):
    """Send email notification (stub - integrate with SMTP)."""
    logger.info(f"[TASK] Sending notification to {user_email}: {subject}")
    # TODO: integrate with SMTP or push notification service
    return {"status": "sent", "email": user_email}


@celery_app.task(name="app.workers.tasks.send_bug_report_email")
def send_bug_report_email(description: str, device_info: str, app_version: str, user_email: str = None):
    """Send bug report email to the developer."""
    from app.config import settings
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    target_email = settings.BUG_REPORT_EMAIL
    subject = f"CampusIQ Bug Report - {app_version}"
    
    body = f"""
    New Bug Report Submitted via CampusIQ App:
    
    Description:
    {description}
    
    Device Info:
    {device_info}
    
    App Version:
    {app_version}
    
    User Contact:
    {user_email or 'Not provided'}
    """
    
    logger.info(f"[TASK] Sending bug report email to {target_email}")
    
    # Check if SMTP settings are provided
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("[TASK] SMTP credentials not set. Logging email content instead.")
        logger.info(f"[TASK] EMAIL CONTENT:\n{body}")
        return {"status": "logged", "message": "SMTP credentials missing"}

    try:
        msg = MIMEMultipart()
        msg['From'] = settings.SMTP_FROM
        msg['To'] = target_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
            
        logger.info(f"[TASK] Bug report email sent to {target_email} successfully")
        return {"status": "sent", "recipient": target_email}
    except Exception as e:
        logger.error(f"[TASK] Failed to send bug report email: {e}")
        return {"status": "error", "error": str(e)}


@celery_app.task(name="app.workers.tasks.process_image")
def process_image(image_path: str):
    """Resize and optimize uploaded images."""
    try:
        from PIL import Image
        import os

        with Image.open(image_path) as img:
            # Resize to max 1200px width while maintaining aspect ratio
            max_width = 1200
            if img.width > max_width:
                ratio = max_width / img.width
                new_size = (max_width, int(img.height * ratio))
                img = img.resize(new_size, Image.LANCZOS)

            # Save optimized
            img.save(image_path, optimize=True, quality=85)
            logger.info(f"[TASK] Image processed: {image_path}")
            return {"status": "processed", "path": image_path}
    except Exception as e:
        logger.error(f"[TASK] Image processing failed: {e}")
        return {"status": "error", "error": str(e)}


@celery_app.task(name="app.workers.tasks.update_analytics_cache")
def update_analytics_cache():
    """Regenerate analytics cache in Redis."""
    logger.info("[TASK] Updating analytics cache...")
    # TODO: pull from DB, compute stats, store in Redis with TTL
    return {"status": "updated"}


@celery_app.task(name="app.workers.tasks.detect_similar_complaints")
def detect_similar_complaints(complaint_id: str, title: str, description: str):
    """Basic keyword-based similarity detection to flag duplicate complaints."""
    logger.info(f"[TASK] Checking similarity for complaint {complaint_id}")
    # TODO: implement TF-IDF or embedding similarity
    return {"status": "checked", "duplicates_found": 0}
