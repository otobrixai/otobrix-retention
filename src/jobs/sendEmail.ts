import { Resend } from 'resend';
import { Logger } from '@/lib/logger';

export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export async function sendEmailJob(jobData: EmailJobData): Promise<void> {
  const { to, subject, html, text, from = process.env.EMAIL_FROM } = jobData;
  
  if (!from) {
    throw new Error('EMAIL_FROM environment variable is required');
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });

    if (result.error) {
      throw new Error(`Resend error: ${result.error.message}`);
    }

    Logger.info('Email sent successfully', { 
      to, 
      subject, 
      emailId: result.data?.id 
    }, 'email-job');
    
  } catch (error) {
    Logger.error('Failed to send email', error, 'email-job');
    throw error;
  }
}