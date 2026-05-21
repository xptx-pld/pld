"""
邮件发送服务
"""

import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings
import logging

logger = logging.getLogger(__name__)


async def send_email(
    recipient_email: str,
    subject: str,
    html_content: str,
    plain_text: str = None
) -> bool:
    """
    异步发送邮件
    
    Args:
        recipient_email: 收件人邮箱
        subject: 邮件主题
        html_content: HTML内容
        plain_text: 纯文本内容（可选）
    
    Returns:
        发送成功返回True，失败返回False
    """
    try:
        # 创建邮件
        message = MIMEMultipart('alternative')
        message['From'] = f"{settings.sender_name} <{settings.sender_email}>"
        message['To'] = recipient_email
        message['Subject'] = subject

        # 添加纯文本版本
        if plain_text:
            message.attach(MIMEText(plain_text, 'plain', 'utf-8'))
        
        # 添加HTML版本
        message.attach(MIMEText(html_content, 'html', 'utf-8'))

        # 发送邮件
        async with aiosmtplib.SMTP(hostname=settings.smtp_server, port=settings.smtp_port) as smtp:
            await smtp.login(settings.smtp_username, settings.smtp_password)
            await smtp.send_message(message)

        logger.info(f"邮件已发送给 {recipient_email}")
        return True

    except Exception as e:
        logger.error(f"发送邮件失败: {str(e)}")
        return False


async def send_otp_email(email: str, otp: str) -> bool:
    """发送OTP邮件"""
    subject = "【寝室自治系统】邮箱验证码"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                <h2 style="color: #2c3e50; text-align: center;">寝室自治系统</h2>
                
                <p>亲爱的用户，您好！</p>
                
                <p>感谢您注册寝室自治系统。请使用以下验证码完成注册过程：</p>
                
                <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0;">
                    <p style="font-size: 24px; font-weight: bold; color: #3498db; text-align: center; margin: 0;">
                        {otp}
                    </p>
                </div>
                
                <p style="color: #7f8c8d; font-size: 14px;">
                    <strong>⏰ 注意：</strong>此验证码有效期为 10 分钟，请勿分享给他人。
                </p>
                
                <p>如果您没有请求此验证码，请忽略此邮件。</p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                
                <p style="text-align: center; color: #95a5a6; font-size: 12px;">
                    © 2024 寝室自治系统。保留所有权利。
                </p>
            </div>
        </body>
    </html>
    """
    
    plain_text = f"""
    寝室自治系统 - 邮箱验证码
    
    您的验证码是: {otp}
    
    此验证码有效期为 10 分钟。
    
    如果您没有请求此验证码，请忽略此邮件。
    """
    
    return await send_email(email, subject, html_content, plain_text)


async def send_welcome_email(username: str, email: str) -> bool:
    """发送欢迎邮件"""
    subject = "【寝室自治系统】欢迎注册！"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                <h2 style="color: #2c3e50; text-align: center;">🎉 欢迎加入寝室自治系统！</h2>
                
                <p>亲爱的 <strong>{username}</strong>，</p>
                
                <p>恭喜您成功注册了寝室自治系统！</p>
                
                <p>现在您可以：</p>
                <ul>
                    <li>📊 查看寝室行为洞察报告</li>
                    <li>🎮 参与博弈论协商</li>
                    <li>🏛️ 参与寝室自治治理</li>
                    <li>📱 跨端管理您的个人账户</li>
                </ul>
                
                <p><strong>快速入门：</strong></p>
                <ol>
                    <li>完善个人信息和偏好设置</li>
                    <li>加入您的寝室</li>
                    <li>开始参与寝室治理</li>
                </ol>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                
                <p style="text-align: center; color: #95a5a6; font-size: 12px;">
                    © 2024 寝室自治系统。保留所有权利。
                </p>
            </div>
        </body>
    </html>
    """
    
    plain_text = f"""
    欢迎加入寝室自治系统！
    
    亲爱的 {username}，
    
    恭喜您成功注册了寝室自治系统！
    
    现在您可以查看寝室行为洞察报告、参与博弈论协商和参与寝室自治治理。
    
    快速入门：
    1. 完善个人信息和偏好设置
    2. 加入您的寝室
    3. 开始参与寝室治理
    """
    
    return await send_email(email, subject, html_content, plain_text)
