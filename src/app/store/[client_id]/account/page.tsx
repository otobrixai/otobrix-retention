// src/app/store/[client_id]/account/page.tsx
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import AccountPageClient from './AccountPageClient';
import { redirect } from 'next/navigation';

type Props = {
  params: Promise<{ client_id: string }>;
};

export default async function AccountPage(props: Props) {
  const { client_id } = await props.params;
  const session = await auth();
  
  // Check authentication
  if (!session?.user) {
    redirect('/?error=session_expired');
  }
  
  // Verify user has access to this client
  // Adjust based on your session structure
  const userClientId = session.user.clientId;
  
  if (userClientId !== client_id) {
    redirect('/store');
  }

  try {
    // Get or create preferences for this client
    let preferences = await prisma.clientPreferences.findUnique({
      where: { client_id },
      select: {
        ai_risk_alerts: true,
        weekly_report: true,
        email_notifications: true,
      }
    });

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await prisma.clientPreferences.create({
        data: {
          client_id,
          ai_risk_alerts: true,
          weekly_report: true,
          email_notifications: true,
        },
        select: {
          ai_risk_alerts: true,
          weekly_report: true,
          email_notifications: true,
        }
      });
    }

    return (
      <AccountPageClient 
        clientId={client_id}
        initialPreferences={preferences}
      />
    );
    
  } catch (error) {
    console.error('AccountPage error:', error);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Error</h1>
          <p className="text-slate-400">You don't have access to this account page.</p>
        </div>
      </div>
    );
  }
}
